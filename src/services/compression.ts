/**
 * JSON compression and decompression utilities for PromptShield
 */

import { promises as fs } from 'fs';
import { gzip, gunzip, deflate, inflate } from 'zlib';
import { promisify } from 'util';
import { CompressionType } from '../types/core/scanConfig';

// Promisify zlib functions
const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);
const deflateAsync = promisify(deflate);
const inflateAsync = promisify(inflate);

export interface CompressionOptions {
  type: CompressionType;
  level?: number; // 0-9 for gzip, 0-9 for deflate
}

export interface CompressionResult {
  compressed: Buffer;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compresses JSON data
 * @param data - JSON string to compress
 * @param options - Compression options
 * @returns Compression result with compressed data and metadata
 */
export async function compressJson(
  data: string,
  options: CompressionOptions = { type: 'gzip', level: 6 }
): Promise<CompressionResult> {
  const buffer = Buffer.from(data, 'utf8');
  const originalSize = buffer.length;

  let compressed: Buffer;

  if (options.type === 'gzip') {
    compressed = await gzipAsync(buffer, { level: options.level });
  } else if (options.type === 'deflate') {
    compressed = await deflateAsync(buffer, { level: options.level });
  } else {
    throw new Error(`Unsupported compression type: ${options.type}`);
  }

  const compressedSize = compressed.length;
  const compressionRatio =
    ((originalSize - compressedSize) / originalSize) * 100;

  return {
    compressed,
    originalSize,
    compressedSize,
    compressionRatio,
  };
}

/**
 * Decompresses JSON data
 * @param compressedData - Compressed data buffer
 * @param type - Compression type used
 * @returns Decompressed JSON string
 */
export async function decompressJson(
  compressedData: Buffer,
  type: CompressionType = 'gzip'
): Promise<string> {
  let decompressed: Buffer;

  if (type === 'gzip') {
    decompressed = await gunzipAsync(compressedData);
  } else if (type === 'deflate') {
    decompressed = await inflateAsync(compressedData);
  } else {
    throw new Error(`Unsupported compression type: ${type}`);
  }

  return decompressed.toString('utf8');
}

/**
 * Detects if a file is compressed based on its extension
 * @param filePath - Path to the file
 * @returns Compression type if detected, null otherwise
 */
export function detectCompression(filePath: string): CompressionType | null {
  const lowerPath = filePath.toLowerCase();

  if (lowerPath.endsWith('.gz') || lowerPath.endsWith('.gzip')) {
    return 'gzip';
  }

  if (lowerPath.endsWith('.deflate') || lowerPath.endsWith('.zlib')) {
    return 'deflate';
  }

  return null;
}

/**
 * Reads and decompresses a compressed file
 * @param filePath - Path to the compressed file
 * @param compressionType - Type of compression (auto-detected if not provided)
 * @returns Decompressed file content
 */
export async function readCompressedFile(
  filePath: string,
  compressionType?: CompressionType
): Promise<string> {
  const detectedType = compressionType || detectCompression(filePath);

  if (!detectedType) {
    throw new Error(`No compression detected for file: ${filePath}`);
  }

  const compressedData = await fs.readFile(filePath);
  return await decompressJson(compressedData, detectedType);
}

/**
 * Compresses and writes JSON data to a file
 * @param filePath - Path to write the compressed file
 * @param data - JSON string to compress
 * @param options - Compression options
 * @returns Compression result with metadata
 */
export async function writeCompressedFile(
  filePath: string,
  data: string,
  options: CompressionOptions = { type: 'gzip', level: 6 }
): Promise<CompressionResult> {
  const result = await compressJson(data, options);

  // Add appropriate extension if not present
  let outputPath = filePath;
  if (!filePath.toLowerCase().endsWith(`.${options.type}`)) {
    outputPath = `${filePath}.${options.type === 'gzip' ? 'gz' : 'deflate'}`;
  }

  await fs.writeFile(outputPath, result.compressed);
  return result;
}

/**
 * Gets compression statistics for a file
 * @param filePath - Path to the file
 * @returns Compression statistics
 */
export async function getCompressionStats(filePath: string): Promise<{
  isCompressed: boolean;
  compressionType?: CompressionType;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
}> {
  const compressionType = detectCompression(filePath);

  if (!compressionType) {
    return { isCompressed: false };
  }

  const compressedData = await fs.readFile(filePath);
  const decompressedData = await decompressJson(
    compressedData,
    compressionType
  );

  return {
    isCompressed: true,
    compressionType,
    originalSize: Buffer.from(decompressedData, 'utf8').length,
    compressedSize: compressedData.length,
    compressionRatio:
      ((Buffer.from(decompressedData, 'utf8').length - compressedData.length) /
        Buffer.from(decompressedData, 'utf8').length) *
      100,
  };
}

/**
 * Validates that a compressed file contains valid JSON
 * @param filePath - Path to the compressed file
 * @returns True if the file contains valid JSON after decompression
 */
export async function validateCompressedJson(
  filePath: string
): Promise<boolean> {
  try {
    const decompressed = await readCompressedFile(filePath);
    JSON.parse(decompressed);
    return true;
  } catch {
    return false;
  }
}
