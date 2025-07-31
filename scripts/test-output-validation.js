#!/usr/bin/env node

/**
 * Live CLI Output Validation Script
 * Tests actual CLI output against expected formats
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Import our validation utilities
const {
  validateJsonOutput,
  validateMarkdownOutput,
  compareWithSample,
} = require('../dist/utils/outputValidator');

const TEST_FILE = 'tests/fixtures/violations.json';
const RULEPACK = 'rulepacks/pii.yaml';
const SAMPLE_JSON_PATH = 'examples/sample-json-output.json';

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

// Test 3: Compare with Sample JSON
console.log('3. Comparing JSON Output with Sample...');
try {
  const jsonOutput = execSync(
    `node bin/promptshield scan "${TEST_FILE}" --rulepack "${RULEPACK}" --output json`,
    { encoding: 'utf-8' }
  );

  const jsonData = JSON.parse(jsonOutput);
  const sampleComparison = compareWithSample(jsonData, SAMPLE_JSON_PATH);

  if (sampleComparison.isValid) {
    console.log('✅ JSON output matches sample structure');
  } else {
    console.log('❌ JSON output differs from sample:');
    sampleComparison.errors.forEach((error) => console.log(`   - ${error}`));
  }

  if (sampleComparison.warnings.length > 0) {
    console.log('⚠️  Sample comparison warnings:');
    sampleComparison.warnings.forEach((warning) =>
      console.log(`   - ${warning}`)
    );
  }
} catch (error) {
  console.log('❌ Failed to compare with sample:', error.message);
}

console.log();

// Test 4: Test with Clean Data
console.log('4. Testing with Clean Data...');
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

// Test 5: Test with Bias RulePack
console.log('5. Testing with Bias RulePack...');
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
console.log('- Sample comparison testing');
console.log('- Clean data testing');
console.log('- Different RulePack testing');
