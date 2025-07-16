import { ScanResult } from '../../types/core/rule';
import { OutputRenderer } from './index';
import { OutputContext } from '../../types/core/outputFormat';
import { Writable } from 'stream';

export class NdjsonRenderer implements OutputRenderer {
  render(results: ScanResult[]): string {
    // Flatten all violations and output as NDJSON
    const lines: string[] = [];
    for (const result of results) {
      for (const violation of result.violations) {
        lines.push(
          JSON.stringify({
            file: result.file,
            ...violation,
          })
        );
      }
    }
    return lines.join('\n');
  }

  async stream(
    results: ScanResult[],
    context: OutputContext,
    writable: Writable
  ): Promise<void> {
    for (const result of results) {
      for (const violation of result.violations) {
        const line =
          JSON.stringify({
            file: result.file,
            ...violation,
          }) + '\n';
        if (!writable.write(line)) {
          await new Promise((resolve) => writable.once('drain', resolve));
        }
      }
    }
    // End the stream and wait for it to finish
    writable.end();
    await new Promise((resolve, reject) => {
      writable.on('finish', resolve);
      writable.on('error', reject);
    });
  }

  getExtension(): string {
    return '.ndjson';
  }

  getMimeType(): string {
    return 'application/x-ndjson';
  }

  supportsStreaming(): boolean {
    return true;
  }
}
