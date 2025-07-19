# Command Testing Guide

This guide explains how to test all PromptShield CLI commands using the examples and rulepacks files.

## Overview

The test suite covers all CLI commands with various scenarios using real example files and rulepacks. This ensures comprehensive testing of functionality, error handling, and edge cases.

## Test Structure

### 1. Jest Integration Tests (`tests/integration/command-test-suite.test.ts`)

Comprehensive TypeScript test suite that covers:

- All CLI commands (scan, list, init, validate)
- All output formats (JSON, Markdown, CSV)
- All filtering options (severity, category, pagination)
- All processing options (fields, NDJSON, parallel)
- Error handling scenarios
- Performance testing

### 2. Shell Script Test Runner (`scripts/test-all-commands.sh`)

Bash script for Unix/Linux/macOS that:

- Tests all commands systematically
- Provides colored output and progress tracking
- Generates detailed logs
- Handles cleanup automatically

### 3. Windows Batch Test Runner (`scripts/test-all-commands.bat`)

Windows batch file that:

- Provides cross-platform compatibility
- Tests all commands on Windows
- Generates similar output to shell script

## Test Categories

### 🔍 1. Basic Scanning Tests

Tests core scanning functionality with different input files and rulepacks:

```bash
# Test PII detection
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --output json

# Test prompt injection detection
npx promptshield scan "examples/prompt-injection-attacks.json" --rulepack "rulepacks/prompt-injection.yaml" --output json

# Test custom rulepacks
npx promptshield scan "examples/hamed-test.json" --rulepack "examples/hamed.yaml" --output json
```

**Files Used:**

- `examples/sample-data.json` - Contains PII (emails, SSNs, phone numbers)
- `examples/ai_output.txt` - Simple text with PII
- `examples/prompt-injection-attacks.json` - Various prompt injection attempts
- `examples/hamed-test.json` - Self-checkout security scenarios
- `examples/real-world-injections.json` - Real-world injection examples

### 📄 2. Output Format Tests

Tests all supported output formats:

```bash
# JSON output
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --output json

# Markdown output
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --output markdown

# CSV output
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --output csv

# File output
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --output json --output-file "output.json"
```

### 🔍 3. Filtering Tests

Tests all filtering and pagination options:

```bash
# Filter by severity
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --severity high --output json

# Filter by category
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --category pii --output json

# Limit violations
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --max-violations 2 --output json

# Pagination
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --offset 0 --limit 5 --output json
```

### ⚙️ 4. Processing Options Tests

Tests advanced processing features:

```bash
# Scan specific fields
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --fields prompt,response --output json

# Scan entire object
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --scan-entire-object --output json

# NDJSON mode
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --ndjson --output json

# Max depth
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --max-depth 3 --output json
```

### 📋 5. List Command Tests

Tests the list command functionality:

```bash
# List all rulepacks
npx promptshield list

# List rules from specific rulepack
npx promptshield list --rulepack "rulepacks/pii.yaml"

# Filter by category
npx promptshield list --rulepack "rulepacks/pii.yaml" --category pii

# Filter by severity
npx promptshield list --rulepack "rulepacks/pii.yaml" --severity high

# Show only enabled rules
npx promptshield list --rulepack "rulepacks/pii.yaml" --enabled-only
```

### 🆕 6. Init Command Tests

Tests rulepack creation functionality:

```bash
# Create basic rulepack
npx promptshield init "test-basic.yaml" --template basic

# Create PII rulepack
npx promptshield init "test-pii.yaml" --template pii

# Create with description
npx promptshield init "test-desc.yaml" --template basic --description "Test rulepack"

# Create with category
npx promptshield init "test-cat.yaml" --template basic --category "test"

# Force overwrite
npx promptshield init "test-force.yaml" --template basic --force

# Verbose output
npx promptshield init "test-verbose.yaml" --template basic --verbose

# Quiet output
npx promptshield init "test-quiet.yaml" --template basic --quiet
```

### ✅ 7. Validate Command Tests

Tests file validation functionality:

```bash
# Validate JSON file
npx promptshield validate "examples/sample-data.json" --output json

# Validate with schema
npx promptshield validate "examples/sample-data.json" --schema basic --output json

# Validate against rulepack
npx promptshield validate "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --output json
```

### 🚨 8. Error Handling Tests

Tests error scenarios:

```bash
# Non-existent input file
npx promptshield scan "non-existent-file.json" --rulepack "rulepacks/pii.yaml" --output json

# Non-existent rulepack
npx promptshield scan "examples/sample-data.json" --rulepack "non-existent-rulepack.yaml" --output json

# Invalid severity
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --severity invalid --output json

# Invalid category
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --category invalid --output json
```

### ⚡ 9. Performance Tests

Tests performance features:

```bash
# Large file processing
npx promptshield scan "examples/hamed-test.json" --rulepack "examples/hamed.yaml" --output json

# Parallel processing
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --parallel --output json

# Streaming threshold
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --streaming-threshold 1 --output json

# Memory warning threshold
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --memory-warning-threshold 0.5 --output json
```

### 🔗 10. Integration Tests

Tests complex scenarios:

```bash
# Multiple rulepacks
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --output json && npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/bias.yaml" --output json

# Compression
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --output json --output-file "compressed.json.gz" --compress gzip

# Stdin input
echo "Hello! My email is john.doe@company.com and SSN is 123-45-6789" | npx promptshield scan - --rulepack "rulepacks/pii.yaml" --output json

# Output modes
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --quiet --output json
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --verbose --output json
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --debug --output json
```

## Running Tests

### Option 1: Jest Integration Tests

```bash
# Run all command tests
npm test -- tests/integration/command-test-suite.test.ts

# Run with coverage
npm test -- --coverage tests/integration/command-test-suite.test.ts
```

### Option 2: Shell Script (Unix/Linux/macOS)

```bash
# Make executable
chmod +x scripts/test-all-commands.sh

# Run all tests
./scripts/test-all-commands.sh
```

### Option 3: Windows Batch File

```cmd
# Run all tests
scripts\test-all-commands.bat
```

### Option 4: Individual Command Testing

```bash
# Test specific command
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --output json

# Test with different options
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --severity high --category pii --output json
```

## Example Files Used

### Input Files (`examples/`)

- `sample-data.json` - Contains PII data (emails, SSNs, phone numbers)
- `ai_output.txt` - Simple text with PII
- `prompt-injection-attacks.json` - Various prompt injection attempts
- `hamed-test.json` - Self-checkout security scenarios
- `real-world-injections.json` - Real-world injection examples
- `demo-attack.json` - Simple prompt injection demo
- `quick-test.json` - Quick test data
- `temp-injection.json` - Temporary injection test data

### RulePacks Used (`rulepacks/`)

- `pii.yaml` - Personal Identifiable Information detection
- `prompt-injection.yaml` - Prompt injection attack detection
- `bias.yaml` - Bias detection rules
- `hallucination.yaml` - Hallucination detection
- `critical-test.yaml` - Critical security tests

### Custom RulePacks (`examples/`)

- `hamed.yaml` - Self-checkout security rules
- `FINRA2210.yaml` - FINRA compliance rules
- `OAI-TnS-PolicyPack-v1.yaml` - OpenAI Terms of Service policy

## Expected Results

### Successful Scans

- PII detection should find emails, SSNs, phone numbers
- Prompt injection detection should identify attack patterns
- Security rules should detect various attack vectors
- Bias detection should identify biased language

### Error Handling

- Invalid files should return appropriate errors
- Invalid rulepacks should be handled gracefully
- Invalid options should show helpful error messages
- Non-existent files should fail with clear messages

### Performance

- Large files should process within reasonable time
- Memory usage should stay within limits
- Parallel processing should improve performance
- Streaming should handle large datasets efficiently

## Troubleshooting

### Common Issues

1. **Command not found**

   ```bash
   # Ensure package is installed
   npm install
   # Or use npx
   npx promptshield --help
   ```

2. **File not found errors**

   ```bash
   # Check file paths
   ls examples/
   ls rulepacks/
   ```

3. **Permission errors**

   ```bash
   # Make script executable
   chmod +x scripts/test-all-commands.sh
   ```

4. **Output format issues**
   ```bash
   # Test JSON output first
   npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --output json
   ```

### Debug Mode

```bash
# Enable debug output
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --debug --output json
```

### Verbose Mode

```bash
# Enable verbose output
npx promptshield scan "examples/sample-data.json" --rulepack "rulepacks/pii.yaml" --verbose --output json
```

## Adding New Tests

### 1. Add to Jest Test Suite

```typescript
it('should test new functionality', async () => {
  const result = await runCliCommand(
    `scan "examples/new-file.json" --rulepack "rulepacks/new-rules.yaml" --output json`
  );
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('expected-content');
});
```

### 2. Add to Shell Script

```bash
run_test "New test description" \
    "npx promptshield scan \"examples/new-file.json\" --rulepack \"rulepacks/new-rules.yaml\" --output json"
```

### 3. Add to Batch File

```batch
call :run_test "New test description" "npx promptshield scan \"%EXAMPLES_DIR%\new-file.json\" --rulepack \"%RULEPACKS_DIR%\new-rules.yaml\" --output json"
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Command Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- tests/integration/command-test-suite.test.ts
      - run: ./scripts/test-all-commands.sh
```

This comprehensive testing approach ensures all CLI commands work correctly with real data and provides confidence in the tool's reliability.
