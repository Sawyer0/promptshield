import { Container } from '../infrastructure/container/Container';
import { ConfigManager } from '../infrastructure/config/ConfigManager';
import { LoggerFactory } from '../infrastructure/logging/Logger';

// Domain implementations
import { LocalFileReader } from '../domains/scanning/adapters/LocalFileReader';
import { JsonProcessor } from '../domains/scanning/adapters/processors/JsonProcessor';
import { TextProcessor } from '../domains/scanning/adapters/processors/TextProcessor';
import { DefaultScanOrchestrator } from '../domains/scanning/core/services/ScanOrchestrator';
import { YamlRuleRepository } from '../domains/rules/adapters/YamlRuleRepository';
import {
  DefaultRuleEngine,
  DefaultRuleMatcher,
} from '../domains/rules/core/services/RuleEngineImpl';
import { JsonRenderer } from '../domains/reporting/adapters/renderers/JsonRenderer';
import { MarkdownRenderer } from '../domains/reporting/adapters/renderers/MarkdownRenderer';
import { CsvRenderer } from '../domains/reporting/adapters/renderers/CsvRenderer';
import { HtmlRenderer } from '../domains/reporting/adapters/renderers/HtmlRenderer';
import { TableRenderer } from '../domains/reporting/adapters/renderers/TableRenderer';
import { NdjsonRenderer } from '../domains/reporting/adapters/renderers/NdjsonRenderer';
import { ReportServiceImpl } from '../domains/reporting/core/services/ReportServiceImpl';

// Validation domain
import { DefaultValidationEngine } from '../domains/validation/core/services/ValidationEngineImpl';
import { RulePackValidatorImpl } from '../domains/validation/adapters/validators/RulePackValidatorImpl';
import { InputFileValidatorImpl } from '../domains/validation/adapters/validators/InputFileValidatorImpl';

// Application handlers
import { ScanCommandHandler } from '../application/commands/scan/ScanCommandHandler';
import { ValidateCommandHandler } from '../application/commands/validate/ValidateCommandHandler';
import { RulePack } from '../domains/rules/core/entities/RulePack';
import {
  Rule,
  RuleSeverity,
  RuleCategory,
} from '../domains/rules/core/entities/Rule';

/**
 * Sets up the dependency injection container
 */
export function setupContainer(container: Container): void {
  // Infrastructure
  container.register('configManager', ConfigManager.getInstance());
  container.register(
    'logger',
    LoggerFactory.create({
      level: process.env.LOG_LEVEL || 'INFO',
      options: {
        includeTimestamp: true,
        includeStackTrace: process.env.NODE_ENV === 'development',
      },
    })
  );

  // Load configuration from environment
  const configManager = container.resolve<ConfigManager>('configManager');
  configManager.loadFromEnvironment();

  // File system
  container.register('fileReader', new LocalFileReader());

  // Content processors
  const processors = new Map();
  processors.set('json', new JsonProcessor());
  processors.set('text', new TextProcessor());
  container.register('contentProcessors', processors);

  // Rule engine
  container.registerFactory(
    'ruleRepository',
    () => new YamlRuleRepository('rulepacks'),
    true
  );

  container.registerFactory(
    'ruleMatcher',
    () => new DefaultRuleMatcher(),
    true
  );

  container.registerFactory(
    'ruleEngine',
    () =>
      new DefaultRuleEngine(
        container.resolve('ruleRepository'),
        container.resolve('ruleMatcher')
      ),
    true
  );

  // Scan engine
  container.registerFactory(
    'scanStrategy',
    () => ({
      shouldUseStreaming: (size: number, threshold: number) =>
        size > threshold * 1024 * 1024,
      shouldUseParallelProcessing: (
        count: number,
        context: { config: { parallel?: boolean }; getBatchSize: () => number }
      ) => context.config.parallel && count > context.getBatchSize(),
      getOptimalBatchSize: (
        count: number,
        context: { getBatchSize: () => number }
      ) => Math.min(context.getBatchSize(), Math.ceil(count / 4)),
    }),
    true
  );

  container.registerFactory('metricsCollector', () => {
    let startTime: number;
    let objectCount = 0;
    let memoryUsage = 0;
    let streamingUsed = false;

    return {
      start: () => {
        startTime = Date.now();
        objectCount = 0;
        memoryUsage = process.memoryUsage().heapUsed;
        streamingUsed = false;
      },
      recordProcessing: (items: number, memory: number) => {
        objectCount = items;
        memoryUsage = Math.max(memoryUsage, memory);
      },
      setStreamingUsed: (used: boolean) => {
        streamingUsed = used;
      },
      end: () => ({
        objectsScanned: objectCount,
        processingTime: Date.now() - startTime,
        memoryUsage: memoryUsage,
        rulesApplied: 0,
        streamingUsed: streamingUsed,
      }),
    };
  });

  container.registerFactory(
    'scanEngine',
    () =>
      new DefaultScanOrchestrator(
        container.resolve('fileReader'),
        container.resolve('contentProcessors'),
        container.resolve('ruleEngine'),
        container.resolve('scanStrategy'),
        container.resolve('metricsCollector')
      ),
    true
  );

  // Report renderers
  const renderers = new Map();
  renderers.set('json', new JsonRenderer());
  renderers.set('markdown', new MarkdownRenderer());
  renderers.set('csv', new CsvRenderer());
  renderers.set('html', new HtmlRenderer());
  renderers.set('table', new TableRenderer());
  renderers.set('ndjson', new NdjsonRenderer());
  container.register('renderers', renderers);

  // Report service
  container.registerFactory(
    'reportService',
    () => new ReportServiceImpl(renderers),
    true
  );

  // Validation engine
  container.registerFactory(
    'validationEngine',
    () => {
      const validationEngine = new DefaultValidationEngine();

      // Register validators
      validationEngine.registerValidator(
        'rulepack',
        new RulePackValidatorImpl()
      );
      validationEngine.registerValidator(
        'input-file',
        new InputFileValidatorImpl()
      );

      return validationEngine;
    },
    true
  );

  // Command handlers
  container.registerFactory(
    'scanCommandHandler',
    () =>
      new ScanCommandHandler(
        container.resolve('scanEngine'),
        container.resolve('reportService'),
        container.resolve('logger')
      ),
    true
  );

  container.registerFactory(
    'validateCommandHandler',
    () =>
      new ValidateCommandHandler(
        container.resolve('validationEngine'),
        container.resolve('logger')
      ),
    true
  );

  // List command handler
  container.registerFactory(
    'listCommandHandler',
    () => ({
      execute: async (command: {
        options: {
          rulepack?: string;
          category?: string;
          severity?: string;
          enabledOnly?: boolean;
        };
      }) => {
        const ruleEngine = container.resolve<DefaultRuleEngine>('ruleEngine');
        const repository =
          container.resolve<YamlRuleRepository>('ruleRepository');

        try {
          let rulepacks;
          if (command.options.rulepack) {
            const result = await ruleEngine.loadRulePack(
              command.options.rulepack
            );
            if (result.isErr()) return result;
            rulepacks = [result.value];
          } else {
            const availableResult = await repository.listAvailable();
            if (availableResult.isErr()) return availableResult;

            const loadResults = await Promise.all(
              availableResult.value.map((path: string) =>
                ruleEngine.loadRulePack(path)
              )
            );

            rulepacks = loadResults.filter((r) => r.isOk()).map((r) => r.value);
          }

          // Display rulepacks and rules
          for (const rulepack of rulepacks) {
            console.log(`\nRulePack: ${rulepack.name}`);
            console.log(`Description: ${rulepack.description}`);
            console.log(`Version: ${rulepack.version}`);
            console.log(`Rules: ${rulepack.rules.length}\n`);

            let rules = rulepack.rules;

            // Apply filters
            if (command.options.category) {
              rules = rules.filter(
                (r: { category: string }) =>
                  r.category === command.options.category
              );
            }
            if (command.options.severity) {
              rules = rules.filter(
                (r: { severity: string }) =>
                  r.severity === command.options.severity
              );
            }
            if (command.options.enabledOnly) {
              rules = rules.filter((r: { enabled: boolean }) => r.enabled);
            }

            for (const rule of rules) {
              console.log(`  - ${rule.id}: ${rule.description}`);
              console.log(
                `    Severity: ${rule.severity}, Category: ${rule.category}, Enabled: ${rule.enabled}`
              );
            }
          }

          return { isOk: (): boolean => true, isErr: (): boolean => false };
        } catch (error) {
          return { isErr: (): boolean => true, error };
        }
      },
    }),
    true
  );

  // Init command handler
  container.registerFactory(
    'initCommandHandler',
    () => ({
      execute: async (command: {
        filename: string;
        options: {
          template?: string;
          name?: string;
          description?: string;
          quiet?: boolean;
          verbose?: boolean;
        };
      }) => {
        const repository =
          container.resolve<YamlRuleRepository>('ruleRepository');
        const templates =
          container.resolve<Map<string, RuleTemplate>>('ruleTemplates');

        try {
          const template = templates.get(command.options.template || 'basic');
          if (!template) {
            return {
              isErr: () => true,
              error: new Error(`Unknown template: ${command.options.template}`),
            };
          }

          // Create Rule instances from template
          const rules = template.rules.map(
            (ruleData) =>
              new Rule(
                ruleData.id,
                ruleData.description,
                ruleData.match_regex || [],
                ruleData.match_keywords || [],
                ruleData.severity as RuleSeverity,
                ruleData.category as RuleCategory,
                ruleData.enabled,
                false // case_sensitive default
              )
          );

          // Create RulePack instance
          const rulePack = new RulePack(
            command.options.name || template.name,
            command.options.description || template.description,
            rules,
            template.version,
            new Date()
          );

          const result = await repository.saveToYaml(
            command.filename,
            rulePack
          );

          if (result.isOk() && !command.options.quiet) {
            console.log(`Created RulePack: ${command.filename}`);
            if (command.options.verbose) {
              console.log(`Template: ${command.options.template || 'basic'}`);
              console.log(`Rules: ${rulePack.rules.length}`);
            }
          }

          return result;
        } catch (error) {
          return { isErr: (): boolean => true, error };
        }
      },
    }),
    true
  );

  // Rule templates
  container.register('ruleTemplates', createRuleTemplates());
}

interface RuleTemplate {
  version: string;
  name: string;
  description: string;
  rules: Array<{
    id: string;
    description: string;
    match_keywords?: string[];
    match_regex?: string[];
    severity: string;
    category: string;
    enabled: boolean;
  }>;
}

/**
 * Creates rule templates
 */
function createRuleTemplates(): Map<string, RuleTemplate> {
  const templates = new Map();

  // Basic template
  templates.set('basic', {
    version: '1.0.0',
    name: 'Basic RulePack',
    description: 'Basic example rules for getting started',
    rules: [
      {
        id: 'example_keyword',
        description: 'Example keyword detection',
        match_keywords: ['example', 'test'],
        severity: 'low',
        category: 'custom',
        enabled: true,
      },
      {
        id: 'example_regex',
        description: 'Example regex pattern',
        match_regex: ['\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'],
        severity: 'medium',
        category: 'custom',
        enabled: true,
      },
    ],
  });

  // PII template
  templates.set('pii', {
    version: '1.0.0',
    name: 'PII Detection',
    description: 'Detects personally identifiable information',
    rules: [
      {
        id: 'email_addresses',
        description: 'Detects email addresses',
        match_regex: ['\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'],
        severity: 'medium',
        category: 'pii',
        enabled: true,
      },
      {
        id: 'phone_numbers',
        description: 'Detects phone numbers',
        match_regex: [
          '\\b\\d{3}-\\d{3}-\\d{4}\\b',
          '\\(\\d{3}\\)\\s?\\d{3}-\\d{4}',
          '\\b\\d{10}\\b',
        ],
        severity: 'medium',
        category: 'pii',
        enabled: true,
      },
      {
        id: 'ssn',
        description: 'Detects Social Security Numbers',
        match_regex: ['\\b\\d{3}-\\d{2}-\\d{4}\\b'],
        severity: 'high',
        category: 'pii',
        enabled: true,
      },
    ],
  });

  // Add other templates (security, bias, compliance)...

  return templates;
}
