import { Renderer } from '../../core/ports/Renderer';
import { Report } from '../../core/entities/Report';
import { Result, ok, err } from '../../../../shared/types/Result';

/**
 * CSV format renderer
 */
export class CsvRenderer implements Renderer {
  async render(report: Report): Promise<Result<string, Error>> {
    try {
      const violations = report.getFilteredViolations();

      let output = '';

      // CSV Header
      output +=
        'rule_id,rule_description,severity,category,message,field,object_index,match,context,position_start,position_end\n';

      // CSV Rows
      for (const violation of violations) {
        const row = [
          this.escapeCsvValue(violation.ruleId),
          this.escapeCsvValue(violation.ruleDescription),
          this.escapeCsvValue(violation.severity),
          this.escapeCsvValue(violation.category),
          this.escapeCsvValue(violation.message),
          this.escapeCsvValue(violation.field || ''),
          violation.objectIndex?.toString() || '',
          this.escapeCsvValue(violation.context?.match || ''),
          this.escapeCsvValue(
            violation.context ? JSON.stringify(violation.context) : ''
          ),
          violation.position?.start?.toString() || '',
          violation.position?.end?.toString() || '',
        ];

        output += row.join(',') + '\n';
      }

      return ok(output);
    } catch (error) {
      return err(new Error(`Failed to render CSV report: ${error}`));
    }
  }

  getFormat(): string {
    return 'csv';
  }

  supportsStreaming(): boolean {
    return true;
  }

  private escapeCsvValue(value: string): string {
    if (!value) return '';

    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (
      value.includes(',') ||
      value.includes('"') ||
      value.includes('\n') ||
      value.includes('\r')
    ) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }
}
