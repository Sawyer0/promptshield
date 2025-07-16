# Test Fixtures Documentation

This directory contains comprehensive test fixtures for testing PromptShield's scanning capabilities across various scenarios.

## Fixture Categories

### 1. No Matches Testing

- **`no-matches.json`** - Clean content with no violations
- **`no-matches.ndjson`** - NDJSON version for streaming testing

**Use Cases:**

- Testing that clean content doesn't trigger false positives
- Verifying that the scanner correctly identifies when no violations are found
- Testing streaming processing with clean data

### 2. Multiple Severities Testing

- **`multiple-severities.json`** - Content with violations of different severity levels
- **`multiple-severities.ndjson`** - NDJSON version for streaming testing

**Use Cases:**

- Testing severity-based filtering (high, medium, low)
- Verifying that severity levels are correctly assigned
- Testing reporting with different severity thresholds

**Severity Levels Included:**

- High: SSN, credit card numbers, email addresses
- Medium: Phone numbers, addresses
- Low: Birth years, usernames, company names

### 3. Multiple Categories Testing

- **`multiple-categories.json`** - Content with violations across different categories
- **`multiple-categories.ndjson`** - NDJSON version for streaming testing

**Use Cases:**

- Testing category-based filtering
- Verifying detection across different violation types
- Testing mixed violation scenarios

**Categories Included:**

- PII (Personally Identifiable Information)
- Bias (Gender, racial, workplace bias)
- Hallucination (Fictional facts and claims)
- Toxicity (Harmful content, hate speech)
- Mixed (Multiple violation types in single content)

### 4. Large Result Sets Testing

- **`large-result-set.json`** - 40 objects with various violations
- **`large-result-set.ndjson`** - NDJSON version for streaming testing

**Use Cases:**

- Performance testing with large datasets
- Testing truncation and pagination features
- Memory usage optimization testing
- Streaming performance validation

**Characteristics:**

- 40 objects with predictable violation patterns
- Mix of different violation types
- Sequential IDs for easy tracking
- Timestamped metadata for temporal testing

## Usage Examples

### Basic Testing

```typescript
import { Scanner } from '../../src/core/scanner';
import { readFileSync } from 'fs';

const scanner = new Scanner();

// Test no matches
const cleanContent = readFileSync('tests/fixtures/no-matches.json', 'utf8');
const violations = await scanner.scan(cleanContent, {
  rulepack: 'rulepacks/pii.yaml',
});
expect(violations).toHaveLength(0);
```

### Severity Filtering

```typescript
// Test high severity only
const content = readFileSync('tests/fixtures/multiple-severities.json', 'utf8');
const highViolations = await scanner.scan(content, {
  rulepack: 'rulepacks/pii.yaml',
  severity: 'high',
});
expect(highViolations.every((v) => v.severity === 'high')).toBe(true);
```

### Category Filtering

```typescript
// Test PII category only
const content = readFileSync('tests/fixtures/multiple-categories.json', 'utf8');
const piiViolations = await scanner.scan(content, {
  rulepack: 'rulepacks/pii.yaml',
  category: 'pii',
});
expect(piiViolations.length).toBeGreaterThan(0);
```

### Performance Testing

```typescript
// Test large dataset performance
const content = readFileSync('tests/fixtures/large-result-set.json', 'utf8');
const startTime = Date.now();
const violations = await scanner.scan(content, {
  rulepack: 'rulepacks/pii.yaml',
});
const endTime = Date.now();

expect(violations.length).toBeGreaterThan(0);
expect(endTime - startTime).toBeLessThan(5000); // 5 second limit
```

### Streaming Testing

```typescript
// Test NDJSON streaming
const content = readFileSync('tests/fixtures/large-result-set.ndjson', 'utf8');
const violations = await scanner.scan(content, {
  rulepack: 'rulepacks/pii.yaml',
  ndjson: true,
});
expect(violations.length).toBeGreaterThan(0);
```

### Truncation Testing

```typescript
// Test result truncation
const content = readFileSync('tests/fixtures/large-result-set.json', 'utf8');
const violations = await scanner.scan(content, {
  rulepack: 'rulepacks/pii.yaml',
  maxViolations: 10,
});
expect(violations.length).toBeLessThanOrEqual(10);
```

### Pagination Testing

```typescript
// Test pagination
const content = readFileSync('tests/fixtures/large-result-set.json', 'utf8');

// First page
const page1 = await scanner.scan(content, {
  rulepack: 'rulepacks/pii.yaml',
  offset: 0,
  limit: 10,
});

// Second page
const page2 = await scanner.scan(content, {
  rulepack: 'rulepacks/pii.yaml',
  offset: 10,
  limit: 10,
});

expect(page1.length).toBeLessThanOrEqual(10);
expect(page2.length).toBeLessThanOrEqual(10);
expect(page1).not.toEqual(page2);
```

## Test Scenarios Covered

### 1. No Matches

- ✅ Clean content doesn't trigger violations
- ✅ NDJSON streaming with clean data
- ✅ Empty file handling
- ✅ Malformed JSON handling

### 2. Multiple Severities

- ✅ Detection of high, medium, and low severity violations
- ✅ Severity-based filtering
- ✅ Severity reporting accuracy
- ✅ NDJSON streaming with multiple severities

### 3. Multiple Categories

- ✅ Detection across different violation categories
- ✅ Category-based filtering
- ✅ Mixed violation scenarios
- ✅ NDJSON streaming with multiple categories

### 4. Large Result Sets

- ✅ Performance with 40+ violations
- ✅ Memory usage optimization
- ✅ Truncation functionality
- ✅ Pagination support
- ✅ Streaming performance
- ✅ Progress reporting
- ✅ Concurrent scanning

### 5. Error Handling

- ✅ Malformed JSON graceful handling
- ✅ Malformed NDJSON graceful handling
- ✅ Empty file handling
- ✅ Invalid rulepack handling

## Performance Benchmarks

### Expected Performance Metrics

- **Large JSON (40 objects)**: < 5 seconds
- **Large NDJSON (40 objects)**: < 3 seconds
- **Memory usage**: < 50MB increase
- **Concurrent scanning**: 5 parallel scans without degradation

### Validation Criteria

- All violations should be correctly identified
- Severity levels should be accurately assigned
- Categories should be properly filtered
- Streaming should be more efficient than batch processing
- Memory usage should remain reasonable
- Error conditions should be handled gracefully

## Maintenance

### Adding New Fixtures

1. Create both JSON and NDJSON versions
2. Include realistic test data
3. Add comprehensive metadata
4. Document the specific test scenarios covered
5. Update this README with usage examples

### Updating Existing Fixtures

1. Maintain backward compatibility
2. Update both JSON and NDJSON versions
3. Verify that existing tests still pass
4. Update documentation if behavior changes

### Validation

Run the comprehensive test suite to ensure all fixtures work correctly:

```bash
npm test -- tests/integration/comprehensive-fixtures.test.ts
```
