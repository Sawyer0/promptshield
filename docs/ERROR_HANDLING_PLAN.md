# Error Handling Plan for PromptShield

This document outlines the comprehensive error handling strategy for PromptShield, inspired by ESLint's robust error handling approach.

## Error Categories

### 🚨 Critical Errors (Exit Code: 1)

Errors that prevent the tool from functioning and require immediate attention.

| Error Type                | Trigger                  | User Message                                                                | Recovery Strategy |
| ------------------------- | ------------------------ | --------------------------------------------------------------------------- | ----------------- |
| **File not found**        | Input file doesn't exist | `Error: File not found: ./missing.json`                                     | Exit immediately  |
| **Invalid JSON**          | Malformed JSON syntax    | `Error: Invalid JSON at line 15: Unexpected token`                          | Exit immediately  |
| **Invalid RulePack**      | YAML syntax errors       | `Error: Invalid RulePack ./rules.yaml at line 8`                            | Exit immediately  |
| **Permission denied**     | File access issues       | `Error: Permission denied reading ./data.json`                              | Exit immediately  |
| **Output write failed**   | Cannot write output file | `Error: Failed to write output file: ./report.json`                         | Exit immediately  |
| **Invalid output format** | Unsupported format       | `Error: Invalid output format: xml. Valid formats: json,markdown,csv,table` | Exit immediately  |

### ⚠️ Warning Errors (Exit Code: 0, but show warnings)

Errors that don't prevent execution but indicate potential issues.

| Error Type            | Trigger                 | User Message                                                         | Recovery Strategy           |
| --------------------- | ----------------------- | -------------------------------------------------------------------- | --------------------------- |
| **Empty file**        | No content in input     | `Warning: File is empty: ./data.json`                                | Continue, show empty report |
| **No rules enabled**  | All rules disabled      | `Warning: No enabled rules found in ./rules.yaml`                    | Continue, show empty report |
| **Invalid severity**  | Unknown severity level  | `Warning: Invalid severity 'invalid', using 'medium'`                | Use default, continue       |
| **Memory usage high** | High memory consumption | `Warning: High memory usage detected, processing in smaller batches` | Adjust batch size           |
| **Timeout warning**   | Processing taking long  | `Warning: Processing taking longer than expected`                    | Continue with progress      |

### ℹ️ Info Messages (Exit Code: 0)

Informational messages about the process.

| Message Type            | Trigger             | User Message                            | When Shown           |
| ----------------------- | ------------------- | --------------------------------------- | -------------------- |
| **No issues found**     | Clean scan          | `✅ No violations found in 150 prompts` | Successful scan      |
| **Issues found**        | Violations detected | `⚠️ Found 3 violations in 150 prompts`  | When issues detected |
| **Processing progress** | Large files         | `Processing 150 prompts...`             | Files >50 prompts    |

## Error Handling Implementation

### Error Types and Codes

```typescript
export enum ErrorType {
  // File System Errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  OUTPUT_WRITE_FAILED = 'OUTPUT_WRITE_FAILED',
  OUTPUT_DIRECTORY_NOT_FOUND = 'OUTPUT_DIRECTORY_NOT_FOUND',
  OUTPUT_PERMISSION_DENIED = 'OUTPUT_PERMISSION_DENIED',
  OUTPUT_DISK_FULL = 'OUTPUT_DISK_FULL',

  // Data Validation Errors
  INVALID_JSON = 'INVALID_JSON',
  INVALID_JSON_STRUCTURE = 'INVALID_JSON_STRUCTURE',
  EMPTY_FILE = 'EMPTY_FILE',
  INVALID_RULEPACK = 'INVALID_RULEPACK',
  INVALID_OUTPUT_FORMAT = 'INVALID_OUTPUT_FORMAT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Processing Errors
  COMPRESSION_FAILED = 'COMPRESSION_FAILED',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',

  // System Errors
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

### Error Message Format

#### Standard Error Format

```
Error: [Error Type]: [Specific Details]
  File: [file path]
  Line: [line number if applicable]
  Suggestion: [helpful suggestion]
  Details: [additional context if verbose]
```

#### Example Error Messages

```bash
# File not found
Error: File not found: ./prompts.json
  Suggestion: Check the file path and try again

# Invalid JSON
Error: Invalid JSON at line 15: Unexpected token '}' in JSON
  File: ./prompts.json
  Line: 15
  Suggestion: Validate your JSON syntax

# Invalid RulePack
Error: Invalid RulePack in ./rules.yaml at line 8: mapping values are not allowed here
  File: ./rules.yaml
  Line: 8
  Suggestion: Check YAML indentation and syntax

# Output write failed
Error: Failed to write output file: ./report.json
  File: ./report.json
  Suggestion: Check disk space and file permissions
  Details: originalError: EACCES: permission denied

# Invalid output format
Error: Invalid output format: xml
  Suggestion: Valid formats: json, markdown, csv, table
  Details: validFormats: ["json", "markdown", "csv", "table"]
```

## Output Error Handling

### File Write Failures

#### Common Scenarios

1. **Permission denied**: User doesn't have write permissions
2. **Disk full**: No space available
3. **Directory doesn't exist**: Parent directory missing
4. **Invalid path**: Reserved characters or names
5. **Network issues**: Remote file system problems

#### Error Recovery Strategies

```typescript
// 1. Validate output path before writing
validateOutputPath(outputPath);

// 2. Ensure directory exists
await ensureOutputDirectory(outputPath);

// 3. Handle specific file system errors
switch (error.code) {
  case 'ENOENT':
    throw createOutputDirectoryNotFoundError(outputPath);
  case 'EACCES':
    throw createOutputPermissionDeniedError(outputPath);
  case 'ENOSPC':
    throw createOutputDiskFullError(outputPath);
  default:
    throw createOutputWriteFailedError(outputPath, error);
}
```

### Invalid Output Format

#### Validation Process

```typescript
// 1. Validate format before processing
if (!validFormats.includes(format)) {
  throw createInvalidOutputFormatError(format, validFormats);
}

// 2. Validate format-specific requirements
if (format === 'csv' && hasUnicodeCharacters) {
  throw createValidationError(
    'output format',
    format,
    'CSV does not support Unicode characters'
  );
}
```

### Compression Failures

#### Error Handling

```typescript
try {
  await pipeline(contentStream, compressionStream, writeStream);
} catch (error) {
  if (error instanceof PromptShieldError) {
    throw error;
  }

  throw createCompressionFailedError(
    outputPath,
    compressionType,
    error as Error
  );
}
```

## CLI Option Validation

### Validation Strategy

#### 1. Early Validation

```typescript
// Validate all options before processing
const validation = validateScanOptions(options);
if (!validation.isValid) {
  console.error(red('Validation errors:'));
  validation.errors.forEach((error) => {
    console.error(red(`  - ${error}`));
  });
  process.exit(1);
}
```

#### 2. Specific Validations

```typescript
// Severity filter validation
if (options.severity && !validateSeverityFilter(options.severity)) {
  throw createValidationError(
    'severity filter',
    options.severity,
    'low,medium,high,critical'
  );
}

// Category filter validation
if (options.category && !validateCategoryFilter(options.category)) {
  throw createValidationError(
    'category filter',
    options.category,
    'pii,bias,hallucination,security,compliance'
  );
}
```

#### 3. Numeric Validation

```typescript
// Pagination validation
if (!validatePagination(options.offset, options.limit)) {
  throw createValidationError(
    'pagination',
    `${options.offset},${options.limit}`,
    'offset >= 0, limit >= 1'
  );
}
```

## Error Recovery Strategies

### 🎯 Graceful Degradation

- **Invalid rule**: Skip the rule, continue with others
- **Regex timeout**: Skip the pattern, log warning
- **Memory pressure**: Process in smaller batches
- **File encoding issues**: Try UTF-8, fallback to system encoding

### 🔄 Retry Logic

- **File read errors**: Retry once with different encoding
- **YAML parse errors**: Try with different YAML parser options
- **Memory errors**: Reduce batch size and retry

### 📊 Error Reporting

- **Exit codes**: 0 = success, 1 = error, 2 = usage error
- **Error logs**: Detailed logs in `--verbose` mode
- **Error summary**: Count of errors by type in final report

## Performance Considerations

### Memory Management

```typescript
// Monitor memory usage
const initialMemory = process.memoryUsage().heapUsed;
// ... processing ...
const finalMemory = process.memoryUsage().heapUsed;
const memoryIncrease = finalMemory - initialMemory;

if (memoryIncrease > 50 * 1024 * 1024) {
  // 50MB
  throw createMemoryError('scanning', memoryIncrease);
}
```

### Timeout Handling

```typescript
// Set timeout for large files
const timeout = options.timeout ? parseInt(options.timeout, 10) : 300;
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(
    () => reject(createTimeoutError('scanning', timeout)),
    timeout * 1000
  );
});

try {
  await Promise.race([scanPromise, timeoutPromise]);
} catch (error) {
  if (error instanceof PromptShieldError && error.type === 'TIMEOUT_ERROR') {
    throw error;
  }
  // Handle other errors
}
```

## Testing Error Scenarios

### Test Cases

1. **File not found**: `promptshield scan missing.json`
2. **Invalid JSON**: `promptshield scan malformed.json`
3. **Permission denied**: `promptshield scan /root/protected.json`
4. **Invalid output format**: `promptshield scan data.json --output xml`
5. **Disk full**: Simulate full disk scenario
6. **Memory error**: Process extremely large file
7. **Timeout error**: Process file with complex regex patterns

### Error Validation

```typescript
// Test error message format
expect(error.message).toMatch(/^Error: .+/);
expect(error.suggestion).toBeDefined();
expect(error.exitCode).toBe(1);

// Test error recovery
expect(outputResult.success).toBe(false);
expect(outputResult.error?.type).toBe('OUTPUT_WRITE_FAILED');
```

## Integration with ESLint Patterns

### Similarities to ESLint

1. **Structured error types**: Categorized error types with specific codes
2. **Detailed error messages**: Include file, line, and suggestion
3. **Graceful degradation**: Continue processing when possible
4. **Comprehensive validation**: Validate all options before processing
5. **User-friendly suggestions**: Provide actionable advice

### PromptShield Enhancements

1. **Output-specific errors**: Handle file write, compression, format issues
2. **Pagination support**: Handle large result sets gracefully
3. **Memory monitoring**: Prevent OOM errors
4. **Timeout handling**: Prevent infinite processing
5. **Compression support**: Handle compression failures

## Future Enhancements

### Planned Features

1. **Error reporting service**: Collect error statistics
2. **Auto-recovery**: Automatic retry with different settings
3. **Error patterns**: Detect common user mistakes
4. **Interactive fixes**: Suggest and apply fixes automatically
5. **Error documentation**: Link errors to documentation

### Monitoring and Analytics

1. **Error frequency tracking**: Monitor common error types
2. **Performance metrics**: Track processing times and memory usage
3. **User behavior analysis**: Understand common usage patterns
4. **Error correlation**: Identify related error patterns

This error handling plan ensures PromptShield provides a robust, user-friendly experience with comprehensive error recovery and clear guidance for users.
