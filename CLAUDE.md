# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run build` - Clean and compile TypeScript to dist/
- `npm run clean` - Remove dist/ directory
- `npm run dev` - Run CLI directly with ts-node
- `npm run type-check` - TypeScript type checking without emitting files

### Testing
- `npm test` - Run all tests using unified test runner
- `npm run test:unit` - Run only unit tests
- `npm run test:integration` - Run only integration tests
- `npm run test:performance` - Run only performance tests
- `npm run test:cli` - Run only CLI functionality tests
- `npm run test:coverage` - Run tests with coverage reporting
- `npm run test:verbose` - Run tests with detailed output
- `npm run test:fast` - Run tests with early bailout on failures

### Code Quality
- `npm run lint` - Lint TypeScript files in src/
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run validate` - Full validation (type-check, lint, format, security audit)

### Single Test Execution
Run individual test files using Jest directly:
```bash
npx jest tests/unit/domains/scanning/services/ScanOrchestrator.test.ts
npx jest tests/integration/commands/scan/ScanCommand.test.ts --verbose
```

## Architecture Overview

PromptShield follows Clean Architecture principles with clear domain separation:

### Domain-Driven Structure
- **`src/domains/`** - Core business domains (scanning, rules, reporting, validation)
- **`src/application/`** - Command handlers and application services
- **`src/infrastructure/`** - External concerns (config, logging, DI container)
- **`src/cli/`** - CLI entry points and bootstrapping
- **`src/shared/`** - Shared types and utilities

### Key Domains

#### Scanning Domain (`src/domains/scanning/`)
- **Entities**: ScanContext, ScanRequest, ScanResult
- **Services**: ScanOrchestrator (main scanning workflow)
- **Adapters**: LocalFileReader, JsonProcessor, TextProcessor
- **Ports**: ContentProcessor, FileReader, ScanEngine

#### Rules Domain (`src/domains/rules/`)
- **Entities**: Rule, RulePack
- **Services**: RuleEngineImpl (rule matching logic)
- **Adapters**: YamlRuleRepository (YAML rule loading)
- **Ports**: RuleEngine

#### Reporting Domain (`src/domains/reporting/`)
- **Entities**: Report
- **Services**: ReportServiceImpl
- **Adapters**: Multiple renderers (Json, Csv, Html, Markdown, Table, Ndjson)
- **Ports**: Renderer

#### Validation Domain (`src/domains/validation/`)
- **Services**: ValidationEngineImpl
- **Adapters**: InputFileValidatorImpl, RulePackValidatorImpl
- **Ports**: ValidationEngine, Validator

### Dependency Injection
Uses a custom lightweight DI container (`src/infrastructure/container/Container.ts`) with service locator pattern. Services are registered in bootstrap phase and resolved throughout the application.

### Command Pattern
CLI commands follow CQRS-style command/handler pattern:
- Commands define the contract (`src/application/commands/*/Command.ts`)
- Handlers implement the logic (`src/application/commands/*/CommandHandler.ts`)
- Supported commands: scan, list, init, validate

### File Processing
- Supports JSON arrays, single JSON objects, NDJSON, and plain text
- Streaming support for large files
- Parallel processing capabilities
- Memory-efficient processing with configurable thresholds

### Testing Structure
- **Unit tests**: `tests/unit/` - Test individual components in isolation
- **Integration tests**: `tests/integration/` - Test component interactions
- **E2E tests**: `tests/e2e/` - Test complete workflows
- **Performance tests**: Test memory usage and large file handling
- Uses Jest with custom path mapping for clean imports

### Configuration
- TypeScript with CommonJS modules
- ESLint + Prettier for code quality
- Jest for testing with coverage thresholds
- Module path aliases for clean imports (`@domains/`, `@infrastructure/`, etc.)

## CLI Architecture Notes

The CLI is currently transitioning architectures:
- `src/cli/index.ts` contains the old CLI (commented out)
- `src/cli/index-new-temp.ts` implements the new clean architecture
- The binary (`bin/promptshield`) points to the main CLI entry

When working with CLI commands, use the new command/handler pattern in `src/application/commands/` rather than the legacy approach.