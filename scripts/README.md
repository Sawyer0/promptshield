# Scripts Directory

This directory contains utility scripts for testing, validation, and development workflows.

## Test Runners

### 1. Parallel Test Runner (`parallel-test-runner.js`)

Runs Jest tests in parallel with better error handling and reporting.

**Usage:**

```bash
# Run all tests in parallel
npm run test:parallel

# Run with specific number of workers
npm run test:parallel:workers=4

# Run with coverage
npm run test:parallel:coverage

# Run with verbose output
npm run test:parallel:verbose
```

**Features:**

- Parallel test execution using multiple workers
- Comprehensive error reporting
- Test categorization (unit, integration, performance)
- Memory and performance monitoring
- Detailed test reports with success rates
- Timeout handling for hanging tests

### 2. CLI Test Runner (`cli-test-runner.js`)

Runs CLI functionality tests in parallel with comprehensive validation.

**Usage:**

```bash
# Run CLI tests
npm run test:cli

# Run with specific workers
npm run test:cli:parallel

# Run with verbose output
npm run test:cli:verbose
```

**Test Scenarios:**

- Help command validation
- Version command validation
- Invalid command handling
- Missing file error handling
- Missing rulepack error handling
- Basic scan functionality
- Schema validation
- Output format validation
- Error message validation

### 3. Comprehensive Test Runner (`test-runner.js`)

Runs all test categories in parallel with comprehensive reporting.

**Usage:**

```bash
# Run all test categories
npm run test:comprehensive

# Run with verbose output
npm run test:comprehensive:verbose

# Run with specific workers
npm run test:comprehensive:workers=4

# Run with coverage
npm run test:comprehensive:coverage
```

**Test Categories:**

- Unit tests
- Integration tests
- Performance tests
- CLI tests
- Rule loading tests
- Scanner tests
- Renderer tests
- Filtering tests

## Output Validation

### Output Format Validation (`validate-output.js`)

Validates CLI output formats and generates test reports.

**Usage:**

```bash
npm run validate:output
```

**Features:**

- JSON output validation
- Markdown output validation
- CSV output validation
- HTML output validation
- Table output validation
- NDJSON output validation
- Error message validation
- Performance benchmarking

## Command Testing

### All Commands Runner (`run-all-commands.sh`)

Tests all CLI commands with various options and scenarios.

**Usage:**

```bash
./scripts/run-all-commands.sh
```

**Test Categories:**

- Basic scan commands
- Output format commands
- Filtering commands
- Pagination commands
- Performance commands
- Schema validation commands
- Debug and verbose commands

## Performance Testing

### Performance Test Runner (`test_smart_checking.sh`)

Runs performance benchmarks and memory usage tests.

**Usage:**

```bash
./scripts/test_smart_checking.sh
```

**Features:**

- Large file processing
- Memory usage monitoring
- Processing time measurement
- Concurrent scanning tests
- Streaming performance tests

## GitHub Integration

### Issue Creation (`create_github_issues.sh`)

Creates GitHub issues for test failures and improvements.

**Usage:**

```bash
./scripts/create_github_issues.sh
```

### Vibecode Conversion (`convert_vibecode_to_github.py`)

Converts Vibecode project data to GitHub format.

**Usage:**

```bash
python scripts/convert_vibecode_to_github.py
```

## Test Data

### Fixtures (`tests/fixtures/`)

Comprehensive test data for all scenarios:

- **Basic Data**: `sample.json`, `valid.json`
- **Large Datasets**: `large-result-set.json`, `large-result-set.ndjson`
- **Error Scenarios**: `malformed.json`, `empty.json`
- **Multiple Severities**: `multiple-severities.json`
- **Multiple Categories**: `multiple-categories.json`
- **Schema Validation**: `schema-basic.json`, `schema-extended.json`
- **Performance**: Various sized datasets for benchmarking

## Configuration

### Jest Configuration (`jest.config.js`)

Enhanced Jest configuration with:

- Parallel execution settings
- Coverage thresholds
- Test timeouts
- Module name mapping
- Performance optimizations

### Package Scripts (`package.json`)

Comprehensive npm scripts:

- `test:parallel` - Parallel test execution
- `test:cli` - CLI functionality tests
- `test:comprehensive` - All test categories
- `test:fast` - Quick test run with bail
- `test:coverage` - Tests with coverage reporting

## Troubleshooting

### Common Issues

1. **Permission Denied:**

   ```bash
   chmod +x scripts/*.sh
   ```

2. **Build Fails:**

   ```bash
   npm run clean && npm run build
   ```

3. **Test Timeouts:**

   - Increase timeout in Jest config
   - Check for hanging processes
   - Monitor system resources

4. **Memory Issues:**
   - Reduce number of workers
   - Increase Node.js memory limit
   - Monitor system memory usage

### Performance Optimization

1. **Worker Count:**

   - Default: CPU cores - 1
   - Optimal: 4-8 workers for most systems
   - Monitor CPU usage during tests

2. **Memory Management:**

   - Large files: Use streaming mode
   - Concurrent tests: Limit parallel execution
   - Node.js heap: Increase if needed

3. **Test Organization:**
   - Group related tests
   - Use test categories
   - Separate fast and slow tests

## Best Practices

### Test Organization

- Keep tests focused and isolated
- Use descriptive test names
- Group related functionality
- Separate unit and integration tests

### Error Handling

- Test both success and failure scenarios
- Validate error messages
- Test edge cases and boundaries
- Handle async operations properly

### Performance

- Monitor test execution time
- Use appropriate timeouts
- Optimize for CI/CD environments
- Balance speed and thoroughness

### Reporting

- Generate detailed test reports
- Track success rates over time
- Monitor test coverage
- Document test scenarios

## Integration

### CI/CD Pipeline

All test runners integrate with GitHub Actions:

- Automated testing on PRs
- Parallel job execution
- Coverage reporting
- Performance monitoring

### Development Workflow

- Pre-commit hooks for quick tests
- Full test suite before merging
- Performance regression testing
- Automated issue creation

## Future Enhancements

### Planned Features

- **Test Categorization**: Automatic test categorization
- **Performance Regression**: Historical performance tracking
- **Smart Retries**: Automatic retry for flaky tests
- **Test Prioritization**: Run critical tests first
- **Distributed Testing**: Multi-machine test execution

### Monitoring

- **Real-time Metrics**: Live test execution monitoring
- **Resource Usage**: CPU, memory, and I/O tracking
- **Test Analytics**: Success rate trends and patterns
- **Alerting**: Notifications for test failures

## Code Organization

### Codebase Organization (`organize-codebase.sh`)

Analyzes and categorizes all files in the codebase, separating new architecture from old code.

**Usage:**

```bash
./scripts/organize-codebase.sh
```

**Features:**

- Identifies new architecture files (domains, shared, infrastructure, application)
- Finds old/commented code files marked with "OLD CODE - COMMENTED OUT"
- Provides statistics on code coverage and migration progress
- Generates commands for safe cleanup of old code
- Color-coded output for easy identification

**Output Categories:**

- **New Architecture**: Active files in the new modular structure
- **Old Code**: Commented out/deprecated files
- **Mixed Files**: Files that may contain both old and new code
- **Statistics**: Coverage percentages and file counts

### Dependency Analysis (`analyze-dependencies.sh`)

Analyzes which files are actually used by the new architecture and identifies unused code.

**Usage:**

```bash
./scripts/analyze-dependencies.sh
```

**Features:**

- Analyzes import dependencies in the new architecture
- Identifies files that are never imported
- Checks compiled output for verification
- Finds dead code patterns and commented files
- Provides optimization recommendations

**Analysis Categories:**

- **Import Analysis**: Shows which files import from old vs new architecture
- **Unused Files**: Files that are never imported by other modules
- **Compiled Output**: Verification against the built dist directory
- **Dead Code**: Files marked as old or containing only comments

### Safe Cleanup (`safe-cleanup.sh`)

Safely removes confirmed old code files with rollback capability.

**Usage:**

```bash
./scripts/safe-cleanup.sh
```

**Safety Features:**

- User confirmation before any changes
- Moves files to archive directory instead of deleting
- Tests build after cleanup
- Automatic rollback if build fails
- Verifies CLI functionality after cleanup
- Provides restoration instructions

**Cleanup Process:**

1. Creates archive/old-code directory
2. Moves definitively old files to archive
3. Removes empty directories
4. Updates tsconfig.json exclude section
5. Tests build and CLI functionality
6. Provides rollback if anything fails

### Aggressive Cleanup (`clean-old-code.sh`)

More aggressive cleanup option for removing old code files.

**Usage:**

```bash
./scripts/clean-old-code.sh
```

**Features:**

- Archives old code files with descriptive names
- Removes empty directories
- Updates TypeScript configuration
- Tests build after cleanup
- Provides restoration and deletion instructions

**File Categories Removed:**

- Old CLI commands (scan, test)
- Old core files (scanner, processor)
- Old services (compression)
- Old utilities (validators, parsers)
- Old processing modules

## Contributing

When adding new tests:

1. Follow existing patterns
2. Add appropriate test data
3. Update documentation
4. Ensure parallel compatibility
5. Add to relevant test categories
