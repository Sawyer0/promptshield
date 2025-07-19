This is the Advanced Modular Architecture for PromptShield. A CLI Devtool designed to scan files and enforce rules.

## Core Principles

1. **Domain-Driven Design** - Organize by business domains
2. **Hexagonal Architecture** - Core domain logic independent of infrastructure
3. **Plugin Architecture** - Extensible components
4. **Interface-Based Design** - Depend on abstractions, not implementations
5. **Event-Driven Communication** - Loose coupling between modules

## Proposed Architecture

```
src/
├── domains/                 # Business domain modules
│   ├── scanning/
│   │   ├── core/           # Domain logic (no external deps)
│   │   │   ├── entities/
│   │   │   │   ├── ScanRequest.ts
│   │   │   │   ├── ScanResult.ts
│   │   │   │   └── ScanContext.ts
│   │   │   ├── services/
│   │   │   │   ├── ScanOrchestrator.ts
│   │   │   │   └── ScanStrategy.ts
│   │   │   └── ports/      # Interfaces for external deps
│   │   │       ├── FileReader.ts
│   │   │       ├── ContentProcessor.ts
│   │   │       └── ResultRepository.ts
│   │   ├── adapters/       # Implementations
│   │   │   ├── processors/
│   │   │   │   ├── JsonProcessor.ts
│   │   │   │   ├── TextProcessor.ts
│   │   │   │   └── NdjsonProcessor.ts
│   │   │   └── filesystem/
│   │   │       └── LocalFileReader.ts
│   │   └── index.ts
│   │
│   ├── rules/
│   │   ├── core/
│   │   │   ├── entities/
│   │   │   │   ├── Rule.ts
│   │   │   │   ├── RulePack.ts
│   │   │   │   └── Match.ts
│   │   │   ├── services/
│   │   │   │   ├── RuleEngine.ts
│   │   │   │   ├── PatternMatcher.ts
│   │   │   │   └── RuleValidator.ts
│   │   │   └── ports/
│   │   │       ├── RuleRepository.ts
│   │   │       └── MatchingEngine.ts
│   │   ├── adapters/
│   │   │   ├── engines/
│   │   │   │   ├── RegexEngine.ts
│   │   │   │   └── KeywordEngine.ts
│   │   │   └── repositories/
│   │   │       └── YamlRuleRepository.ts
│   │   └── index.ts
│   │
│   ├── reporting/
│   │   ├── core/
│   │   │   ├── entities/
│   │   │   │   ├── Report.ts
│   │   │   │   └── Format.ts
│   │   │   ├── services/
│   │   │   │   └── ReportGenerator.ts
│   │   │   └── ports/
│   │   │       └── Renderer.ts
│   │   ├── adapters/
│   │   │   └── renderers/
│   │   │       ├── JsonRenderer.ts
│   │   │       ├── HtmlRenderer.ts
│   │   │       ├── MarkdownRenderer.ts
│   │   │       └── CsvRenderer.ts
│   │   └── index.ts
│   │
│   └── validation/
│       ├── core/
│       │   ├── entities/
│       │   │   └── ValidationResult.ts
│       │   ├── services/
│       │   │   └── Validator.ts
│       │   └── ports/
│       │       └── ValidationRule.ts
│       ├── adapters/
│       │   └── rules/
│       │       ├── FileValidation.ts
│       │       ├── RuleValidation.ts
│       │       └── ConfigValidation.ts
│       └── index.ts
│
├── infrastructure/          # Technical concerns
│   ├── config/
│   │   ├── ConfigLoader.ts
│   │   ├── ConfigValidator.ts
│   │   └── defaults/
│   │       ├── scan.config.ts
│   │       └── rule.config.ts
│   ├── logging/
│   │   ├── Logger.ts
│   │   └── adapters/
│   │       ├── ConsoleLogger.ts
│   │       └── FileLogger.ts
│   ├── storage/
│   │   ├── FileSystem.ts
│   │   └── Cache.ts
│   ├── monitoring/
│   │   ├── PerformanceMonitor.ts
│   │   └── MemoryMonitor.ts
│   └── errors/
│       ├── ErrorHandler.ts
│       └── ErrorTypes.ts
│
├── application/            # Application services
│   ├── commands/          # CLI command handlers
│   │   ├── scan/
│   │   │   ├── ScanCommand.ts
│   │   │   ├── ScanCommandHandler.ts
│   │   │   └── ScanCommandValidator.ts
│   │   ├── validate/
│   │   │   ├── ValidateCommand.ts
│   │   │   └── ValidateCommandHandler.ts
│   │   └── shared/
│   │       ├── CommandBus.ts
│   │       └── CommandHandler.ts
│   ├── queries/           # Query handlers
│   │   ├── ListRulesQuery.ts
│   │   └── GetStatsQuery.ts
│   └── events/            # Event system
│       ├── EventBus.ts
│       ├── EventHandler.ts
│       └── events/
│           ├── ScanStarted.ts
│           ├── ScanCompleted.ts
│           └── RuleMatched.ts
│
├── shared/                # Shared kernel
│   ├── types/
│   │   ├── Result.ts     # Result<T, E> type
│   │   ├── Either.ts     # Either monad
│   │   └── Option.ts     # Option type
│   ├── utils/
│   │   ├── functional/   # FP utilities
│   │   │   ├── pipe.ts
│   │   │   ├── compose.ts
│   │   │   └── curry.ts
│   │   └── async/        # Async utilities
│   │       ├── retry.ts
│   │       └── timeout.ts
│   └── constants/
│       └── index.ts
│
├── plugins/               # Plugin system
│   ├── core/
│   │   ├── PluginManager.ts
│   │   ├── PluginRegistry.ts
│   │   └── PluginInterface.ts
│   └── builtin/
│       ├── processors/    # Content processors
│       ├── matchers/      # Custom matchers
│       └── renderers/     # Output renderers
│
└── cli/                   # CLI entry point
    ├── index.ts
    ├── bootstrap.ts       # DI container setup
    └── container.ts       # Dependency injection

```

## Key Improvements

### 1. Domain-Driven Design

- Each domain (scanning, rules, reporting) is self-contained
- Core domain logic has no external dependencies
- Clear boundaries between domains

### 2. Hexagonal Architecture (Ports & Adapters)

```typescript
// Core domain defines the port (interface)
// domains/scanning/core/ports/ContentProcessor.ts
export interface ContentProcessor {
  canProcess(file: File): boolean;
  process(file: File, context: ScanContext): Promise<ProcessResult>;
}

// Adapter implements the port
// domains/scanning/adapters/processors/JsonProcessor.ts
export class JsonProcessor implements ContentProcessor {
  canProcess(file: File): boolean {
    return file.extension === '.json';
  }

  async process(file: File, context: ScanContext): Promise<ProcessResult> {
    // Implementation
  }
}
```

### 3. Plugin Architecture

```typescript
// plugins/core/PluginInterface.ts
export interface Plugin {
  name: string;
  version: string;
  register(container: Container): void;
}

// Custom processor plugin
export class CustomProcessorPlugin implements Plugin {
  register(container: Container): void {
    container.register('xmlProcessor', new XmlProcessor());
  }
}
```

### 4. Event-Driven Communication

```typescript
// Domains communicate via events, not direct calls
eventBus.publish(new ScanStarted(scanId, files));

// Other domains can listen
eventBus.subscribe(ScanStarted, async (event) => {
  await metricsService.recordScanStart(event);
});
```

### 5. Functional Programming Patterns

```typescript
// Use Result type for error handling
const scanResult = await pipe(
  validateInput,
  map(loadRules),
  flatMap(scanFiles),
  map(generateReport)
)(input);

// Pattern matching on results
match(scanResult, {
  Ok: (value) => console.log('Success:', value),
  Err: (error) => console.error('Failed:', error),
});
```

### 6. Dependency Injection

```typescript
// cli/container.ts
const container = new Container();

// Register implementations
container.register('fileReader', new LocalFileReader());
container.register('ruleEngine', new RuleEngine());
container.register('logger', new ConsoleLogger());

// Inject dependencies
const scanService = container.resolve(ScanService);
```

### 7. Interface Segregation

```typescript
// Instead of one large Scanner interface
interface Scanner {
  scan(): void;
  validate(): void;
  report(): void;
}

// Split into focused interfaces
interface Scannable {
  scan(target: ScanTarget): Promise<ScanResult>;
}

interface Validatable {
  validate(input: unknown): ValidationResult;
}

interface Reportable {
  generateReport(data: ReportData): Report;
}
```

## Benefits

1. **True Modularity**: Each domain can be developed, tested, and deployed independently
2. **Extensibility**: Easy to add new processors, renderers, or rules via plugins
3. **Testability**: Core logic has no external dependencies
4. **Flexibility**: Can swap implementations without changing core logic
5. **Scalability**: Can extract domains into microservices if needed
6. **Type Safety**: Strong typing with functional patterns
7. **Error Handling**: Explicit error handling with Result types

## Migration Strategy

1. **Phase 1**: Create domain structure without breaking existing code
2. **Phase 2**: Extract core entities and value objects
3. **Phase 3**: Define ports (interfaces) for each domain
4. **Phase 4**: Migrate existing code to adapters
5. **Phase 5**: Implement event bus and command bus
6. **Phase 6**: Add plugin system
7. **Phase 7**: Refactor CLI to use dependency injection

This architecture provides much better separation of concerns and true modularity while maintaining pragmatism for a CLI tool.
