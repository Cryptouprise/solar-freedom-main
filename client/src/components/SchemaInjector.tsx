// Adds page-specific JSON-LD while failing closed on placeholders and avoiding
// semantic duplicates of schemas already delivered by the prerendered HTML.
import { useEffect } from 'react';

type JsonObject = Record<string, unknown>;

interface SchemaInjectorProps {
  schemas: object[];
}

const INVALID = Symbol('invalid-schema-value');
const PLACEHOLDER_PATTERNS = [
  /\[VERIFY(?:[:\]])/i,
  /\b(?:TODO|TBD|CHANGEME|REPLACE_ME)\b/i,
  /https?:\/\/(?:www\.)?example\.(?:com|org|net)(?:[/:]|$)/i,
  /\{\{[^{}]+\}\}/,
  /<%[=-]?[\s\S]*?%>/,
];

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cleanValue(value: unknown): unknown | typeof INVALID | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed)) ? INVALID : trimmed;
  }

  if (Array.isArray(value)) {
    const cleaned: unknown[] = [];
    for (const item of value) {
      const next = cleanValue(item);
      if (next === INVALID) return INVALID;
      if (next !== undefined) cleaned.push(next);
    }
    return cleaned.length > 0 ? cleaned : undefined;
  }

  if (isJsonObject(value)) {
    const cleaned: JsonObject = {};
    for (const [key, item] of Object.entries(value)) {
      const next = cleanValue(item);
      if (next === INVALID) return INVALID;
      if (next !== undefined) cleaned[key] = next;
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }

  if (typeof value === 'number' && !Number.isFinite(value)) return undefined;
  return value ?? undefined;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (isJsonObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

function schemaTypes(schema: JsonObject): string[] {
  const raw = schema['@type'];
  return (Array.isArray(raw) ? raw : [raw])
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim())
    .sort();
}

function referenceUrl(schema: JsonObject): string {
  const direct = schema.url;
  if (typeof direct === 'string') return direct.replace(/#(?:webpage|article)$/i, '');
  const id = schema['@id'];
  if (typeof id === 'string') return id.replace(/#(?:webpage|article)$/i, '');
  const mainEntity = schema.mainEntityOfPage;
  if (typeof mainEntity === 'string') return mainEntity;
  if (isJsonObject(mainEntity) && typeof mainEntity['@id'] === 'string') return mainEntity['@id'];
  if (typeof schema.contentUrl === 'string') return schema.contentUrl;
  if (typeof schema.embedUrl === 'string') return schema.embedUrl;
  return '';
}

function identityKeys(schema: JsonObject): string[] {
  const types = schemaTypes(schema);
  const typeKey = types.join('|');
  const url = referenceUrl(schema);
  const name = [schema.name, schema.headline].find((value) => typeof value === 'string') as string | undefined;
  const keys = [`json:${stableStringify(schema)}`];

  if (typeof schema['@id'] === 'string') keys.push(`id:${schema['@id'].replace(/#(?:webpage|article)$/i, '')}`);
  if (typeKey && url) keys.push(`type-url:${typeKey}:${url}`);
  if (typeKey && name) keys.push(`type-name:${typeKey}:${name.trim().toLowerCase()}`);
  if (types.some((type) => ['BreadcrumbList', 'FAQPage'].includes(type))) keys.push(`singleton:${typeKey}`);

  return keys;
}

function isSchemaRoot(value: unknown): value is JsonObject {
  if (!isJsonObject(value)) return false;
  const context = value['@context'];
  return (context === 'https://schema.org' || context === 'http://schema.org') && schemaTypes(value).length > 0;
}

export function extractSchemaNodes(value: unknown): JsonObject[] {
  if (Array.isArray(value)) return value.flatMap(extractSchemaNodes);
  if (!isJsonObject(value)) return [];
  const graph = value['@graph'];
  if (Array.isArray(graph)) {
    const context = value['@context'];
    return graph.flatMap((node) => {
      if (isJsonObject(node) && node['@context'] === undefined && context !== undefined) {
        return extractSchemaNodes({ ...node, '@context': context });
      }
      return extractSchemaNodes(node);
    });
  }
  return isSchemaRoot(value) ? [value] : [];
}

export function prepareSchemas(schemas: unknown[], existingSchemas: unknown[] = []): JsonObject[] {
  const seen = new Set(existingSchemas.flatMap(extractSchemaNodes).flatMap(identityKeys));
  const prepared: JsonObject[] = [];

  for (const candidate of schemas) {
    const cleaned = cleanValue(candidate);
    if (cleaned === INVALID || !isSchemaRoot(cleaned)) continue;
    const keys = identityKeys(cleaned);
    if (keys.some((key) => seen.has(key))) continue;
    keys.forEach((key) => seen.add(key));
    prepared.push(cleaned);
  }

  return prepared;
}

function shortHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function SchemaInjector({ schemas }: SchemaInjectorProps) {
  const serializedSchemas = JSON.stringify(schemas);

  useEffect(() => {
    const existing: unknown[] = [];
    document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]').forEach((script) => {
      try {
        existing.push(JSON.parse(script.textContent || ''));
      } catch {
        // Invalid pre-existing blocks are reported by the build audit; they do
        // not justify injecting another potentially conflicting block here.
      }
    });

    const injected: HTMLScriptElement[] = [];
    for (const schema of prepareSchemas(schemas, existing)) {
      const serialized = stableStringify(schema).replace(/</g, '\\u003c');
      const id = `dynamic-schema-${shortHash(serialized)}`;
      if (document.getElementById(id)) continue;

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      script.dataset.schemaInjector = 'true';
      script.textContent = serialized;
      document.head.appendChild(script);
      injected.push(script);
    }

    return () => injected.forEach((script) => script.remove());
  }, [serializedSchemas]);

  return null;
}
