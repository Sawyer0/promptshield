import { ScanConfig, defaultScanConfig } from '../../shared/types/ScanConfig';
import { Result, ok, err } from '../../shared/types/Result';

/**
 * Manages application configuration
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: ScanConfig;

  private constructor() {
    this.config = { ...defaultScanConfig };
  }

  /**
   * Gets the singleton instance
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Loads configuration from environment variables
   */
  loadFromEnvironment(): Result<void, Error> {
    try {
      const envConfig: Partial<ScanConfig> = {};

      // Load environment variables
      if (process.env.PS_OUTPUT_FORMAT) {
        const format = process.env.PS_OUTPUT_FORMAT.toLowerCase();
        if (
          ['json', 'markdown', 'csv', 'table', 'html', 'ndjson'].includes(
            format
          )
        ) {
          envConfig.outputFormat = format as
            | 'json'
            | 'markdown'
            | 'csv'
            | 'table'
            | 'html'
            | 'ndjson';
        }
      }

      if (process.env.PS_RULEPACK) {
        envConfig.rulepack = process.env.PS_RULEPACK;
      }

      if (process.env.PS_MEMORY_THRESHOLD) {
        const threshold = parseFloat(process.env.PS_MEMORY_THRESHOLD);
        if (!isNaN(threshold) && threshold >= 0 && threshold <= 1) {
          envConfig.memoryWarningThreshold = threshold;
        }
      }

      if (process.env.PS_TIMEOUT) {
        const timeout = parseInt(process.env.PS_TIMEOUT, 10);
        if (!isNaN(timeout) && timeout > 0) {
          envConfig.timeout = timeout;
        }
      }

      if (process.env.PS_BATCH_SIZE) {
        const batchSize = parseInt(process.env.PS_BATCH_SIZE, 10);
        if (!isNaN(batchSize) && batchSize > 0) {
          envConfig.batchSize = batchSize;
        }
      }

      if (process.env.PS_STREAMING_THRESHOLD) {
        const threshold = parseInt(process.env.PS_STREAMING_THRESHOLD, 10);
        if (!isNaN(threshold) && threshold > 0) {
          envConfig.streamingThreshold = threshold;
        }
      }

      if (process.env.PS_DEBUG === 'true') {
        envConfig.debug = true;
      }

      if (process.env.PS_QUIET === 'true') {
        envConfig.quiet = true;
      }

      if (process.env.PS_VERBOSE === 'true') {
        envConfig.verbose = true;
      }

      if (process.env.PS_STRICT === 'true') {
        envConfig.strict = true;
      }

      // Merge with default config
      this.config = { ...this.config, ...envConfig };

      return ok(undefined);
    } catch (error) {
      return err(
        new Error(`Failed to load environment configuration: ${error}`)
      );
    }
  }

  /**
   * Gets the current configuration
   */
  getConfig(): ScanConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   */
  updateConfig(updates: Partial<ScanConfig>): Result<void, Error> {
    try {
      this.config = { ...this.config, ...updates };
      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to update configuration: ${error}`));
    }
  }

  /**
   * Validates configuration
   */
  validateConfig(config: ScanConfig): Result<void, Error> {
    const errors: string[] = [];

    // Validate output format
    if (
      !['json', 'markdown', 'csv', 'table', 'html', 'ndjson'].includes(
        config.outputFormat
      )
    ) {
      errors.push(`Invalid output format: ${config.outputFormat}`);
    }

    // Validate severity levels
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    config.severity.forEach((severity) => {
      if (!validSeverities.includes(severity)) {
        errors.push(`Invalid severity: ${severity}`);
      }
    });

    // Validate numeric values
    if (config.maxDepth && config.maxDepth < 1) {
      errors.push('Max depth must be at least 1');
    }

    if (config.timeout && config.timeout < 1) {
      errors.push('Timeout must be at least 1 second');
    }

    if (config.batchSize && config.batchSize < 1) {
      errors.push('Batch size must be at least 1');
    }

    if (config.streamingThreshold && config.streamingThreshold < 1) {
      errors.push('Streaming threshold must be at least 1');
    }

    if (
      config.memoryWarningThreshold &&
      (config.memoryWarningThreshold < 0 || config.memoryWarningThreshold > 1)
    ) {
      errors.push('Memory warning threshold must be between 0 and 1');
    }

    if (
      config.compressionLevel &&
      (config.compressionLevel < 0 || config.compressionLevel > 9)
    ) {
      errors.push('Compression level must be between 0 and 9');
    }

    // Validate fields
    if (config.fields.length === 0) {
      errors.push('At least one field must be specified');
    }

    if (errors.length > 0) {
      return err(
        new Error(`Configuration validation failed: ${errors.join(', ')}`)
      );
    }

    return ok(undefined);
  }

  /**
   * Resets configuration to defaults
   */
  resetToDefaults(): void {
    this.config = { ...defaultScanConfig };
  }
}
