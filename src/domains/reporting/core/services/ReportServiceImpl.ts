import { ReportService, Renderer } from '../ports/Renderer';
import { Report } from '../entities/Report';
import { Result, ok, err } from '../../../../shared/types/Result';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Default implementation of ReportService
 */
export class ReportServiceImpl implements ReportService {
  private renderers: Map<string, Renderer>;

  constructor(renderers: Map<string, Renderer>) {
    this.renderers = renderers;
  }

  async generateReport(report: Report): Promise<Result<string, Error>> {
    const renderer = this.renderers.get(report.format);
    if (!renderer) {
      return err(new Error(`No renderer found for format: ${report.format}`));
    }

    try {
      const result = await renderer.render(report);
      return result;
    } catch (error) {
      return err(new Error(`Failed to generate report: ${error}`));
    }
  }

  async writeReport(
    report: Report,
    outputPath: string
  ): Promise<Result<void, Error>> {
    try {
      const contentResult = await this.generateReport(report);
      if (contentResult.isErr()) {
        return err(contentResult.error);
      }

      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }

      // Write to file
      await fs.promises.writeFile(outputPath, contentResult.value, 'utf-8');

      return ok(undefined);
    } catch (error) {
      return err(
        new Error(`Failed to write report to ${outputPath}: ${error}`)
      );
    }
  }

  getAvailableFormats(): string[] {
    return Array.from(this.renderers.keys());
  }
}
