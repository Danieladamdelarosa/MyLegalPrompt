import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Pluggable file storage. The local filesystem driver is used by default and
 * is fine for development / single-node deploys. The interface is intentionally
 * narrow (put/get/delete by key) so an S3/R2 driver can be dropped in for
 * production without touching call sites.
 */
export interface StorageDriver {
  put(buffer: Buffer, ext: string): Promise<string>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

const ROOT = process.env.STORAGE_DIR || path.join(process.cwd(), "storage");

function safeResolve(key: string): string {
  // Prevent path traversal — keys are opaque random names we generate.
  const resolved = path.resolve(ROOT, key);
  if (!resolved.startsWith(path.resolve(ROOT) + path.sep)) {
    throw new Error("Invalid storage key.");
  }
  return resolved;
}

class LocalStorageDriver implements StorageDriver {
  async put(buffer: Buffer, ext: string): Promise<string> {
    await fs.mkdir(ROOT, { recursive: true });
    const key = `${crypto.randomUUID()}.${ext.replace(/[^a-z0-9]/gi, "")}`;
    await fs.writeFile(safeResolve(key), buffer);
    return key;
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(safeResolve(key));
  }

  async delete(key: string): Promise<void> {
    await fs.rm(safeResolve(key), { force: true });
  }
}

export const storage: StorageDriver = new LocalStorageDriver();
