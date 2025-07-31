/**
 * CSV output renderer for PromptShield
 * Provides CSV output for data analysis and spreadsheet compatibility
 */

import { ScanResult } from '../../types/core/rule';
import { OutputContext } from '../../types/core/outputFormat';
import { OutputRenderer } from './index';
import { Writable } from 'stream';
import { createCsvHeaders, createCsvRow } from '../../utils/csv/csvUtils';

export class CsvRenderer implements OutputRenderer {
  render(results: ScanResult[], context: OutputContext): string {
    const headers = [
      'File',
      'Rule ID',
      'Severity',
      'Category',
      'Message',
      'Match',
      'Object Index',
      'Field',
      'Line Number',
      'Scan Date',
    ];

    const rows = [createCsvHeaders(headers)];

    for (const result of results) {
      for (const violation of result.violations) {
        const row = [
          result.file,
          violation.ruleId,
          violation.severity,
          violation.category,
          violation.message,
          violation.match,
          violation.objectIndex?.toString() || '',
          violation.field || '',
          violation.lineNumber?.toString() || '',
          context.metadata.scanDate,
        ];
        rows.push(createCsvRow(row));
      }
    }

    // Add summary rows if there are violations
    if (context.metadata.totalViolations > 0) {
      rows.push(''); // Empty row for separation
      rows.push(
        createCsvRow([
          'Summary',
          'Total Violations',
          context.metadata.totalViolations.toString(),
        ])
      );

      // Severity breakdown
      for (const [severity, count] of Object.entries(
        context.metadata.severityBreakdown
      )) {
        rows.push(createCsvRow(['Severity', severity, count.toString()]));
      }

      // Category breakdown
      for (const [category, count] of Object.entries(
        context.metadata.categoryBreakdown
      )) {
        rows.push(createCsvRow(['Category', category, count.toString()]));
      }
    }

    return rows.join('\n');
  }

  async stream(
    results: ScanResult[],
    context: OutputContext,
    writable: Writable
  ): Promise<void> {
    try {
      const headers = [
        'File',
        'Rule ID',
        'Severity',
        'Category',
        'Message',
        'Match',
        'Object Index',
        'Field',
        'Line Number',
        'Scan Date',
      ];

      if (!writable.write(createCsvHeaders(headers) + '\n')) {
        await new Promise((resolve) => writable.once('drain', resolve));
      }

      for (const result of results) {
        for (const violation of result.violations) {
          const row = [
            result.file,
            violation.ruleId,
            violation.severity,
            violation.category,
            violation.message,
            violation.match,
            violation.objectIndex?.toString() || '',
            violation.field || '',
            violation.lineNumber?.toString() || '',
            context.metadata.scanDate,
          ];

          if (!writable.write(createCsvRow(row) + '\n')) {
            await new Promise((resolve) => writable.once('drain', resolve));
          }
        }
      }

      // Add summary rows if there are violations
      if (context.metadata.totalViolations > 0) {
        if (!writable.write('\n')) {
          await new Promise((resolve) => writable.once('drain', resolve));
        }

        if (
          !writable.write(
            createCsvRow([
              'Summary',
              'Total Violations',
              context.metadata.totalViolations.toString(),
            ]) + '\n'
          )
        ) {
          await new Promise((resolve) => writable.once('drain', resolve));
        }

        // Severity breakdown
        for (const [severity, count] of Object.entries(
          context.metadata.severityBreakdown
        )) {
          if (
            !writable.write(
              createCsvRow(['Severity', severity, count.toString()]) + '\n'
            )
          ) {
            await new Promise((resolve) => writable.once('drain', resolve));
          }
        }

        // Category breakdown
        for (const [category, count] of Object.entries(
          context.metadata.categoryBreakdown
        )) {
          if (
            !writable.write(
              createCsvRow(['Category', category, count.toString()]) + '\n'
            )
          ) {
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
    } catch (error) {
      // Handle streaming errors
      writable.destroy(error as Error);
      throw error;
    }
  }

  getExtension(): string {
    return '.csv';
  }

  getMimeType(): string {
    return 'text/csv';
  }

  supportsStreaming(): boolean {
    return true; // CSV can be streamed
  }
}
