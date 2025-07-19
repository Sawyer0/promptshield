import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';
// import { detectCompression, readCompressedFile } from '../services/compression';

export async function isDirectory(p: string): Promise<boolean> {
  const stat = await fs.stat(p);
  return stat.isDirectory();
}

export async function readFileUtf8(filePath: string): Promise<string> {
  // Check if file is compressed
  // const compressionType = detectCompression(filePath);
  // if (compressionType) {
  //   return await readCompressedFile(filePath, compressionType);
  // }

  return fs.readFile(filePath, 'utf8');
}

export function findDataFiles(dir: string): string[] {
  const pattern: string = path.join(
    dir,
    '**/*.{json,ndjson,txt,json.gz,json.gzip,json.deflate,ndjson.gz,ndjson.gzip,ndjson.deflate}'
  );
  return glob.sync(pattern, { nodir: true });
}
