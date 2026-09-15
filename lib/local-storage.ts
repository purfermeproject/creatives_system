import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.env.LOCAL_STORAGE_DIR
  ? path.resolve(process.env.LOCAL_STORAGE_DIR)
  : path.join(process.cwd(), "storage");

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function storageRoot() {
  return ROOT;
}

export function resolveStoragePath(relativePath: string) {
  const clean = relativePath.replace(/^[/\\]+/, "");
  const resolved = path.resolve(process.cwd(), clean);
  const rootResolved = path.resolve(ROOT);
  if (!resolved.startsWith(rootResolved + path.sep) && resolved !== rootResolved) {
    throw new Error("Invalid storage path.");
  }
  return resolved;
}

export async function writeStorageFile(args: {
  workspaceId: string;
  brandId: string;
  productId: string;
  category: string;
  fileName: string;
  bytes: Buffer | Uint8Array;
}) {
  const folder = path.join(
    ROOT,
    safeSegment(args.workspaceId),
    safeSegment(args.brandId),
    safeSegment(args.productId),
    safeSegment(args.category)
  );
  await fs.mkdir(folder, { recursive: true });
  const finalName = `${crypto.randomUUID()}-${safeSegment(args.fileName)}`;
  const absolute = path.join(folder, finalName);
  await fs.writeFile(absolute, args.bytes);
  return path.relative(process.cwd(), absolute).replaceAll("\\", "/");
}

export async function writeRenderFile(args: {
  workspaceId: string;
  brandId: string;
  productId: string;
  jobId: string;
  fileName: string;
  bytes: Buffer;
}) {
  const folder = path.join(
    ROOT,
    safeSegment(args.workspaceId),
    safeSegment(args.brandId),
    safeSegment(args.productId),
    "renders",
    safeSegment(args.jobId)
  );
  await fs.mkdir(folder, { recursive: true });
  const absolute = path.join(folder, safeSegment(args.fileName));
  await fs.writeFile(absolute, args.bytes);
  return path.relative(process.cwd(), absolute).replaceAll("\\", "/");
}

export async function readStorageFile(relativePath: string) {
  return fs.readFile(resolveStoragePath(relativePath));
}

export async function deleteStorageFile(relativePath: string) {
  try {
    await fs.unlink(resolveStoragePath(relativePath));
  } catch (error:any) {
    if (error?.code !== "ENOENT") throw error;
  }
}
