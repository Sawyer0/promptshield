# PromptShield NPM Publishing Plan

## Complete Feature Analysis

### CLI Commands (Simplified to 3 core commands)

1. **`scan`** - Main LLM output scanning with 25+ options (compression, streaming, parallel processing, memory monitoring)
2. **`list`** - List available RulePacks and rules with filtering
3. **`init`** - Create YAML files with proper schema + 5 templates (basic, pii, security, bias, compliance)

### Disabled Commands (clean up for v1.0)

4. ~~**`create`**~~ - Disable (redundant with init)
5. ~~**`validate`**~~ - Remove (users get errors on bad schemas anyway)
6. ~~**`test`**~~ - Remove (users test by scanning actual files)
7. ~~**`update`**~~ - Already disabled

### Key Features to Preserve

- **5 RulePack Templates**: basic, pii, security, bias, compliance
- **Multiple Output Formats**: json, markdown, csv, table, html, ndjson
- **Performance Features**: streaming, parallel processing, compression, memory monitoring
- **File Processing**: JSON, NDJSON, .txt support with deep object scanning
- **Professional CLI**: 25+ options for enterprise use

## Current State Issues

### 1. **Package.json Issues**

- ❌ `"private": true` - needs to be removed for npm publishing
- ❌ `"license": "UNLICENSED"` - needs proper open source license
- ❌ Homepage/bugs URLs point to X/Twitter - should be GitHub
- ⚠️ Duplicate test scripts in package.json

### 2. **Architecture Issues**

- **Scattered Logic**: Business logic mixed with CLI commands
- **Large Files**: Several files exceed 300 lines (scanner.ts: 332, fileScanner.ts: 390, outputHandler.ts: 413)
- **Mixed Responsibilities**: Commands doing validation, processing, and output
- **No Clear Service Layer**: Direct coupling between CLI and core logic
- **Inconsistent Error Handling**: Different error patterns across modules

### 3. **Code Quality Issues**

- **Old directories still present**: src/core/scanners/, src/processing/, src/cli/validators/
- **Duplicate functionality**: File operations scattered across multiple files
- **No dependency injection**: Hard-coded dependencies make testing difficult
- **Complex CLI option parsing**: Too many options in single command

## NPM Publishing Requirements

### 1. **Package.json Updates**

```json
{
  "private": false,
  "license": "MIT",
  "homepage": "https://github.com/promptshield/promptshield",
  "bugs": {
    "url": "https://github.com/promptshield/promptshield/issues"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/promptshield/promptshield.git"
  }
}
```

### 2. **Required Files**

- ✅ README.md (exists)
- ❌ LICENSE file (missing)
- ❌ CHANGELOG.md (missing)
- ❌ CONTRIBUTING.md (missing)
- ⚠️ API documentation (partial)

### 3. **Binary Setup**

- ✅ bin/promptshield configured
- ⚠️ Need to ensure cross-platform compatibility
- ⚠️ Shebang line needs verification

## Refactoring Strategy for NPM

### Phase 1: Modular Architecture Implementation

#### 1.1 Create Domain Structure

```
src/
├── domains/
│   ├── scanning/         # Core scanning logic
│   ├── rules/           # Rule engine
│   ├── reporting/       # Output generation
│   └── validation/      # Input validation
├── infrastructure/      # Technical utilities
├── application/         # CLI command handlers
└── shared/             # Shared types and utils
```

#### 1.2 Extract Core Domains

**Scanning Domain**

- Move scanner logic from src/core/scanner.ts
- Extract file processing from scattered locations
- Create clean interfaces for processors

**Rules Domain**

- Consolidate rule loading and validation
- Extract pattern matching logic
- Create pluggable rule engines

**Reporting Domain**

- Move all renderers to unified structure
- Create consistent output interfaces
- Support streaming for all formats

**Validation Domain**

- Consolidate all validation logic
- Create reusable validation rules
- Provide clear error messages

### Phase 2: Clean CLI Layer

#### 2.1 Simplify Commands

Clean, focused command set for v1.0:

- `promptshield scan` - Main scanning command (keep all 25+ options)
- `promptshield list` - List available RulePacks and rules
- `promptshield init` - Create YAML files with proper schema + templates
- ~~`promptshield create`~~ - Disable (redundant with init)
- ~~`promptshield validate`~~ - Remove (users get errors on bad schemas anyway)
- ~~`promptshield test`~~ - Remove (users test by scanning actual files)
- ~~`promptshield update`~~ - Already disabled for v1.0.0

#### 2.2 Command/Handler Pattern

```typescript
// application/commands/scan/ScanCommand.ts
export class ScanCommand {
  constructor(
    private scanner: ScanningService,
    private validator: ValidationService,
    private reporter: ReportingService
  ) {}

  async execute(options: ScanOptions): Promise<void> {
    const validated = await this.validator.validate(options);
    const results = await this.scanner.scan(validated);
    await this.reporter.report(results, options.output);
  }
}
```

### Phase 3: Infrastructure Layer

#### 3.1 Dependency Injection

```typescript
// infrastructure/container.ts
export class Container {
  private services = new Map();

  register<T>(name: string, factory: () => T): void {
    this.services.set(name, factory);
  }

  resolve<T>(name: string): T {
    const factory = this.services.get(name);
    if (!factory) throw new Error(`Service ${name} not found`);
    return factory();
  }
}
```

#### 3.2 Configuration Management

```typescript
// infrastructure/config/ConfigManager.ts
export class ConfigManager {
  private config: Config;

  load(): void {
    this.config = {
      ...defaultConfig,
      ...this.loadFromEnv(),
      ...this.loadFromFile(),
    };
  }
}
```

### Phase 4: Quality Improvements

#### 4.1 Error Handling

```typescript
// shared/errors/DomainError.ts
export abstract class DomainError extends Error {
  abstract code: string;
  abstract statusCode: number;
}

// Example domain-specific error
export class RuleValidationError extends DomainError {
  code = 'RULE_VALIDATION_ERROR';
  statusCode = 400;
}
```

#### 4.2 Logging Strategy

```typescript
// infrastructure/logging/Logger.ts
export interface Logger {
  debug(message: string, context?: any): void;
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, error?: Error): void;
}
```

### Phase 5: NPM Package Optimization

#### 5.1 Bundle Size Optimization

- Tree-shake unused code
- Lazy load heavy dependencies
- Split optional features into plugins

#### 5.2 Performance Optimizations

- Use worker threads for parallel processing
- Implement streaming for all file operations
- Add caching for rule compilation

#### 5.3 API Design

```typescript
// Programmatic API for npm users
import { PromptShield } from 'promptshield';

const shield = new PromptShield({
  rulePack: './custom-rules.yaml',
});

const results = await shield.scan({
  input: './llm-outputs.json',
  output: 'json',
});
```

## Migration Timeline

### Week 1: Foundation

- [ ] Day 1-2: Create domain structure and interfaces
- [ ] Day 3-4: Extract scanning domain
- [ ] Day 5: Extract rules domain

### Week 2: Core Refactoring

- [ ] Day 1-2: Extract reporting domain
- [ ] Day 3: Consolidate validation domain
- [ ] Day 4-5: Implement dependency injection

### Week 3: CLI Cleanup

- [ ] Day 1-2: Refactor CLI commands
- [ ] Day 3: Implement command/handler pattern
- [ ] Day 4-5: Add comprehensive tests

### Week 4: NPM Preparation

- [ ] Day 1: Update package.json and add missing files
- [ ] Day 2: Create programmatic API
- [ ] Day 3: Documentation and examples
- [ ] Day 4: Performance optimization
- [ ] Day 5: Final testing and npm publish

## Success Criteria

### Code Quality

- [ ] No files exceed 300 lines
- [ ] All domains have >90% test coverage
- [ ] Zero circular dependencies
- [ ] Consistent error handling

### NPM Package

- [ ] Clean public API
- [ ] Comprehensive documentation
- [ ] < 5MB package size
- [ ] Works on Node 16+
- [ ] Cross-platform compatibility

### Performance

- [ ] < 50ms startup time
- [ ] < 100ms per MB scanned
- [ ] < 50MB memory for typical use

### Developer Experience

- [ ] Clear examples in README
- [ ] TypeScript definitions included
- [ ] Helpful error messages
- [ ] Easy to extend with plugins

## Post-Publishing

### Maintenance Plan

1. Semantic versioning
2. Automated releases via GitHub Actions
3. Security updates monthly
4. Performance regression tests

### Community Building

1. Create GitHub discussions
2. Add contribution guidelines
3. Set up issue templates
4. Create plugin ecosystem docs

This plan transforms PromptShield from a working but messy codebase into a professional, maintainable npm package ready for enterprise adoption.
