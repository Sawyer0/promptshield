#!/usr/bin/env node

/**
 * Standalone Output Validation Script
 * Tests actual CLI output against expected formats
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Validation functions (standalone, no TypeScript dependencies)
function validateJsonOutput(jsonOutput) {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    // Check if output is an array
    if (!Array.isArray(jsonOutput)) {
      result.isValid = false;
      result.errors.push('Output must be an array');
      return result;
    }

    // Validate each scan result
    jsonOutput.forEach((scanResult, index) => {
      const scanResultErrors = validateScanResult(scanResult, index);
      result.errors.push(...scanResultErrors);
    });

    if (result.errors.length > 0) {
      result.isValid = false;
    }
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Failed to parse JSON output: ${error}`);
  }

  return result;
}

function validateScanResult(scanResult, index) {
  const errors = [];

  // Required fields
  const requiredFields = ['file', 'violations', 'durationMs'];
  requiredFields.forEach((field) => {
    if (!(field in scanResult)) {
      errors.push(`Scan result ${index}: Missing required field '${field}'`);
    }
  });

  if (errors.length > 0) return errors;

  // Validate field types
  if (typeof scanResult.file !== 'string') {
    errors.push(`Scan result ${index}: 'file' must be a string`);
  }

  if (!Array.isArray(scanResult.violations)) {
    errors.push(`Scan result ${index}: 'violations' must be an array`);
  }

  if (typeof scanResult.durationMs !== 'number') {
    errors.push(`Scan result ${index}: 'durationMs' must be a number`);
  }

  // Validate violations if array exists
  if (Array.isArray(scanResult.violations)) {
    scanResult.violations.forEach((violation, vIndex) => {
      const violationErrors = validateViolation(violation, index, vIndex);
      errors.push(...violationErrors);
    });
  }

  return errors;
}

function validateViolation(violation, scanIndex, violationIndex) {
  const errors = [];

  // Required fields
  const requiredFields = [
    'ruleId',
    'message',
    'match',
    'severity',
    'category',
    'filePath',
  ];
  requiredFields.forEach((field) => {
    if (!(field in violation)) {
      errors.push(
        `Violation ${scanIndex}.${violationIndex}: Missing required field '${field}'`
      );
    }
  });

  if (errors.length > 0) return errors;

  // Validate field types
  if (typeof violation.ruleId !== 'string') {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'ruleId' must be a string`
    );
  }

  if (typeof violation.message !== 'string') {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'message' must be a string`
    );
  }

  if (typeof violation.match !== 'string') {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'match' must be a string`
    );
  }

  if (typeof violation.severity !== 'string') {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'severity' must be a string`
    );
  }

  if (typeof violation.category !== 'string') {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'category' must be a string`
    );
  }

  if (typeof violation.filePath !== 'string') {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'filePath' must be a string`
    );
  }

  // Validate enum values
  const validSeverities = ['low', 'medium', 'high', 'critical'];
  const validCategories = [
    'pii',
    'bias',
    'hallucination',
    'security',
    'compliance',
    'parse',
    'internal',
    'custom',
  ];

  if (
    typeof violation.severity === 'string' &&
    !validSeverities.includes(violation.severity)
  ) {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: Invalid severity value '${violation.severity}'`
    );
  }

  if (
    typeof violation.category === 'string' &&
    !validCategories.includes(violation.category)
  ) {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: Invalid category value '${violation.category}'`
    );
  }

  // Optional fields
  if ('objectIndex' in violation && typeof violation.objectIndex !== 'number') {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'objectIndex' must be a number`
    );
  }

  if ('field' in violation && typeof violation.field !== 'string') {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'field' must be a string`
    );
  }

  if ('lineNumber' in violation && typeof violation.lineNumber !== 'number') {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'lineNumber' must be a number`
    );
  }

  return errors;
}

function validateMarkdownOutput(markdownOutput) {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check for required sections
  const requiredSections = [
    '# PromptShield Scan Results',
    '### Scan Summary',
    '### Violations',
  ];

  requiredSections.forEach((section) => {
    if (!markdownOutput.includes(section)) {
      result.warnings.push(`Missing section: ${section}`);
    }
  });

  // Check for severity badges
  const severityBadges = ['[high]', '[medium]', '[low]', '[critical]'];
  const foundBadges = severityBadges.filter((badge) =>
    markdownOutput.includes(badge)
  );

  if (foundBadges.length === 0) {
    result.warnings.push('No severity badges found in output');
  }

  // Check for category references
  const categoryPatterns = ['(pii)', '(bias)', '(security)', '(compliance)'];
  const foundCategories = categoryPatterns.filter((cat) =>
    markdownOutput.includes(cat)
  );

  if (foundCategories.length === 0) {
    result.warnings.push('No category references found in output');
  }

  // Check for both violation and clean scenarios
  const hasViolations =
    markdownOutput.includes('Violations Found:') &&
    /\d+/.test(markdownOutput.match(/Violations Found: (\d+)/)?.[1] || '0');

  const hasCleanScenario =
    markdownOutput.includes('No violations detected') ||
    markdownOutput.includes('Violations Found: 0');

  if (!hasViolations && !hasCleanScenario) {
    result.warnings.push(
      'Output should show either violations or clean scenarios'
    );
  }

  return result;
}

const TEST_FILE = 'tests/fixtures/violations.json';
const RULEPACK = 'rulepacks/pii.yaml';

console.log('🔍 PromptShield Output Validation Test\n');

// Test 1: JSON Output Validation
console.log('1. Testing JSON Output Format...');
try {
  const jsonOutput = execSync(
    `node bin/promptshield scan "${TEST_FILE}" --rulepack "${RULEPACK}" --output json`,
    { encoding: 'utf-8' }
  );

  const jsonData = JSON.parse(jsonOutput);
  const jsonValidation = validateJsonOutput(jsonData);

  if (jsonValidation.isValid) {
    console.log('✅ JSON output structure is valid');
  } else {
    console.log('❌ JSON output validation failed:');
    jsonValidation.errors.forEach((error) => console.log(`   - ${error}`));
  }

  if (jsonValidation.warnings.length > 0) {
    console.log('⚠️  JSON output warnings:');
    jsonValidation.warnings.forEach((warning) =>
      console.log(`   - ${warning}`)
    );
  }
} catch (error) {
  console.log('❌ Failed to test JSON output:', error.message);
}

console.log();

// Test 2: Markdown Output Validation
console.log('2. Testing Markdown Output Format...');
try {
  const markdownOutput = execSync(
    `node bin/promptshield scan "${TEST_FILE}" --rulepack "${RULEPACK}"`,
    { encoding: 'utf-8' }
  );

  const markdownValidation = validateMarkdownOutput(markdownOutput);

  if (markdownValidation.isValid) {
    console.log('✅ Markdown output structure is valid');
  } else {
    console.log('❌ Markdown output validation failed:');
    markdownValidation.errors.forEach((error) => console.log(`   - ${error}`));
  }

  if (markdownValidation.warnings.length > 0) {
    console.log('⚠️  Markdown output warnings:');
    markdownValidation.warnings.forEach((warning) =>
      console.log(`   - ${warning}`)
    );
  }
} catch (error) {
  console.log('❌ Failed to test Markdown output:', error.message);
}

console.log();

// Test 3: Test with Clean Data
console.log('3. Testing with Clean Data...');
try {
  const cleanFile = 'tests/fixtures/valid.json';
  if (fs.existsSync(cleanFile)) {
    const cleanJsonOutput = execSync(
      `node bin/promptshield scan "${cleanFile}" --rulepack "${RULEPACK}" --output json`,
      { encoding: 'utf-8' }
    );

    const cleanData = JSON.parse(cleanJsonOutput);
    const cleanValidation = validateJsonOutput(cleanData);

    if (cleanValidation.isValid) {
      console.log('✅ Clean data JSON output is valid');

      // Check if it has no violations
      const hasNoViolations = cleanData.every(
        (result) => result.violations.length === 0
      );
      if (hasNoViolations) {
        console.log('✅ Clean data correctly shows no violations');
      } else {
        console.log('⚠️  Clean data has violations (unexpected)');
      }
    } else {
      console.log('❌ Clean data JSON validation failed:');
      cleanValidation.errors.forEach((error) => console.log(`   - ${error}`));
    }
  } else {
    console.log('⚠️  Clean data file not found, skipping test');
  }
} catch (error) {
  console.log('❌ Failed to test clean data:', error.message);
}

console.log();

// Test 4: Test with Bias RulePack
console.log('4. Testing with Bias RulePack...');
try {
  const biasFile = 'tests/fixtures/violations.json';
  const biasJsonOutput = execSync(
    `node bin/promptshield scan "${biasFile}" --rulepack rulepacks/bias.yaml --output json`,
    { encoding: 'utf-8' }
  );

  const biasData = JSON.parse(biasJsonOutput);
  const biasValidation = validateJsonOutput(biasData);

  if (biasValidation.isValid) {
    console.log('✅ Bias RulePack JSON output is valid');

    // Check if it has bias violations
    const hasBiasViolations = biasData.some((result) =>
      result.violations.some((v) => v.category === 'bias')
    );

    if (hasBiasViolations) {
      console.log('✅ Bias RulePack correctly detects bias violations');
    } else {
      console.log('⚠️  Bias RulePack found no bias violations');
    }
  } else {
    console.log('❌ Bias RulePack JSON validation failed:');
    biasValidation.errors.forEach((error) => console.log(`   - ${error}`));
  }
} catch (error) {
  console.log('❌ Failed to test bias RulePack:', error.message);
}

console.log('\n🎉 Output validation test completed!');
console.log('\nSummary:');
console.log('- JSON output structure validation');
console.log('- Markdown output format validation');
console.log('- Clean data testing');
console.log('- Different RulePack testing');
