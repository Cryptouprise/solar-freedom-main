// SchemaInjector — Dynamically injects JSON-LD schema into <head>
// Used by BlogPost, CityPage, CompanyPage, SolarFraudReport for schema stacking
import { useEffect } from 'react';

interface SchemaInjectorProps {
  schemas: object[];
}

export function SchemaInjector({ schemas }: SchemaInjectorProps) {
  useEffect(() => {
    const injected: HTMLScriptElement[] = [];
    schemas.forEach((schema, i) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = `dynamic-schema-${i}`;
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
      injected.push(script);
    });
    return () => {
      injected.forEach(s => s.parentNode?.removeChild(s));
    };
  }, [JSON.stringify(schemas)]);
  return null;
}
