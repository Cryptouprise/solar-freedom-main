import { chmodSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";

function isInside(parent: string, candidate: string): boolean {
  const rel = relative(parent, candidate);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

export function getBrowserRuntimeDir(scope: string): string {
  const root = resolve(
    process.env.PLAYWRIGHT_RUNTIME_DIR || join(tmpdir(), "solar-freedom-browser-state")
  );
  const repository = resolve(process.cwd());
  if (isInside(repository, root)) {
    throw new Error("PLAYWRIGHT_RUNTIME_DIR must be outside the application repository");
  }
  const safeScope = scope.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "");
  const directory = join(root, safeScope || "isolated");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  try { chmodSync(directory, 0o700); } catch { /* Windows ACLs are managed by the host. */ }
  return directory;
}

export function secureBrowserStateFile(path: string): void {
  try { chmodSync(path, 0o600); } catch { /* Windows ACLs are managed by the host. */ }
}
