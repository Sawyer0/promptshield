import { Renderer } from '../../core/ports/Renderer';
import { Report } from '../../core/entities/Report';
import { Result, ok, err } from '../../../../shared/types/Result';

/**
 * NDJSON (Newline Delimited JSON) format renderer
 */
export class NdjsonRenderer implements Renderer {
  async render(report: Report): Promise<Result<string, Error>> {
    try {
      const violations = report.getFilteredViolations();

      let output = '';

      // Each violation as a separate JSON line
      for (const violation of violations) {
        const jsonLine = {
          rule_id: violation.ruleId,
          rule_description: violation.ruleDescription,
          severity: violation.severity,
          category: violation.category,
          message: violation.message,
          field: violation.field,
          object_index: violation.objectIndex,
          match: violation.context?.match,
          context: violation.context,
          position: violation.position,
          metadata: violation.metadata,
          timestamp: new Date().toISOString(),
        };

        output += JSON.stringify(jsonLine) + '\n';
      }

      return ok(output);
    } catch (error) {
      return err(new Error(`Failed to render NDJSON report: ${error}`));
    }
  }

  getFormat(): string {
    return 'ndjson';
  }

  supportsStreaming(): boolean {
    return true;
  }
}
