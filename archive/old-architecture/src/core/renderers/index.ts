/**
 * Output renderer system for PromptShield
 * Provides a clean strategy pattern for different output formats
 */

import { ScanResult } from '../../types/core/rule';
import { OutputFormat, OutputContext } from '../../types/core/outputFormat';
import { JsonRenderer } from './jsonRenderer';
import { MarkdownRenderer } from './markdownRenderer';
import { CsvRenderer } from './csvRenderer';
import { TableRenderer } from './tableRenderer';
import { HtmlRenderer } from './htmlRenderer';
import { NdjsonRenderer } from './ndjsonRenderer';
import { ConsoleRenderer } from './consoleRenderer';

/**
 * Base interface for all output renderers
 */
export interface OutputRenderer {
  /**
   * Renders scan results in the specific format
   */
  render(results: ScanResult[], context: OutputContext): string;
  /**
   * Optionally streams scan results in the specific format (for streaming renderers)
   */
  stream?: (
    results: ScanResult[],
    context: OutputContext,
    writable: import('stream').Writable
  ) => Promise<void>;
  /**
   * Returns the file extension for this format
   */
  getExtension(): string;
  /**
   * Returns the MIME type for this format
   */
  getMimeType(): string;
  /**
   * Returns whether this format supports streaming output
   */
  supportsStreaming(): boolean;
}

/**
 * Renderer registry that manages all available output formats
 */
export class RendererRegistry {
  private renderers: Map<OutputFormat, OutputRenderer>;

  constructor() {
    this.renderers = new Map([
      ['json', new JsonRenderer()],
      ['markdown', new MarkdownRenderer()],
      ['csv', new CsvRenderer()],
      ['table', new TableRenderer()],
      ['html', new HtmlRenderer()],
      ['ndjson', new NdjsonRenderer()],
      ['console', new ConsoleRenderer()],
    ]);
  }

  /**
   * Gets a renderer for the specified format
   */
  getRenderer(format: OutputFormat): OutputRenderer {
    const renderer = this.renderers.get(format);
    if (!renderer) {
      const availableFormats = Array.from(this.renderers.keys());
      throw new Error(
        `Unsupported output format: ${format}. Available formats: ${availableFormats.join(', ')}`
      );
    }
    return renderer;
  }

  /**
   * Gets all available output formats
   */
  getAvailableFormats(): OutputFormat[] {
    return Array.from(this.renderers.keys());
  }

  /**
   * Registers a new renderer
   */
  registerRenderer(format: OutputFormat, renderer: OutputRenderer): void {
    this.renderers.set(format, renderer);
  }

  /**
   * Checks if a format is supported
   */
  isSupported(format: string): format is OutputFormat {
    return this.renderers.has(format as OutputFormat);
  }
}

/**
 * Global renderer registry instance
 */
export const rendererRegistry = new RendererRegistry();

export { NdjsonRenderer };
