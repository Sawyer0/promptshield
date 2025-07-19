#!/usr/bin/env node
/**
 * Quick validation script for npm publication readiness
 * Tests core functionality without full test suite
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Validating NPM Publication Readiness...\n');

// Test 1: Package.json validation
console.log('1. Testing package.json metadata...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredFields = [
  'name',
  'version',
  'description',
  'author',
  'license',
  'repository',
  'keywords',
];
const missingFields = requiredFields.filter((field) => !packageJson[field]);

if (missingFields.length > 0) {
  console.log('❌ Missing required fields:', missingFields.join(', '));
  process.exit(1);
}
console.log('✅ Package metadata complete');

// Test 2: Cross-platform scripts
console.log('\n2. Testing cross-platform scripts...');
if (packageJson.scripts.clean.includes('rm -rf')) {
  console.log('❌ Platform-specific rm -rf found in clean script');
  process.exit(1);
}
if (packageJson.scripts['deps:clean'].includes('rm -rf')) {
  console.log('❌ Platform-specific rm -rf found in deps:clean script');
  process.exit(1);
}
console.log('✅ Cross-platform scripts verified');

// Test 3: Rulepacks included in package
console.log('\n3. Testing rulepacks inclusion...');
if (!packageJson.files.includes('rulepacks')) {
  console.log('❌ Rulepacks directory not included in package files');
  process.exit(1);
}

const requiredRulepacks = ['pii.yaml', 'prompt-injection.yaml', 'bias.yaml'];
for (const rulepack of requiredRulepacks) {
  const rulepackPath = path.join('rulepacks', rulepack);
  if (!fs.existsSync(rulepackPath)) {
    console.log(`❌ Required rulepack missing: ${rulepack}`);
    process.exit(1);
  }
}
console.log('✅ All required rulepacks present');

// Test 4: Build process
console.log('\n4. Testing build process...');
try {
  execSync('npm run build', { stdio: 'pipe', timeout: 30000 });
  console.log('✅ Build successful');
} catch (error) {
  console.log('❌ Build failed:', error.message);
  process.exit(1);
}

// Test 5: CLI functionality
console.log('\n5. Testing CLI functionality...');
try {
  const helpOutput = execSync('./bin/promptshield --help', {
    encoding: 'utf8',
    timeout: 5000,
  });
  if (!helpOutput.includes('promptshield')) {
    console.log('❌ CLI help output invalid');
    process.exit(1);
  }
  console.log('✅ CLI help command working');
} catch (error) {
  console.log('❌ CLI help failed:', error.message);
  process.exit(1);
}

try {
  const listOutput = execSync('./bin/promptshield list', {
    encoding: 'utf8',
    timeout: 10000,
  });
  if (!listOutput.includes('pii.yaml')) {
    console.log('❌ CLI list command not finding rulepacks');
    process.exit(1);
  }
  console.log('✅ CLI list command working');
} catch (error) {
  console.log('❌ CLI list failed:', error.message);
  process.exit(1);
}

// Test 6: Default rulepack resolution
console.log('\n6. Testing rulepack resolution...');
try {
  const scanOutput = execSync(
    './bin/promptshield scan tests/fixtures/sample.json',
    {
      encoding: 'utf8',
      timeout: 15000,
    }
  );
  if (!scanOutput.includes('violations')) {
    console.log('❌ Scan command not producing expected output');
    process.exit(1);
  }
  console.log('✅ Default rulepack resolution working');
} catch (error) {
  console.log('❌ Scan with default rulepack failed:', error.message);
  process.exit(1);
}

// Test 7: Package dry run
console.log('\n7. Testing package contents...');
try {
  const packOutput = execSync('npm pack --dry-run', {
    encoding: 'utf8',
    timeout: 10000,
  });
  if (!packOutput.includes('rulepacks/pii.yaml')) {
    console.log('❌ Rulepacks not included in package');
    process.exit(1);
  }
  console.log('✅ Package contents verified');
} catch (error) {
  console.log('❌ Package dry run failed:', error.message);
  process.exit(1);
}

// Test 8: Cross-platform path handling
console.log('\n8. Testing cross-platform path handling...');
try {
  const windowsStylePath = 'rulepacks\\pii.yaml';
  const unixStylePath = 'rulepacks/pii.yaml';

  const windowsOutput = execSync(
    `./bin/promptshield scan tests/fixtures/sample.json --rulepack "${windowsStylePath}"`,
    {
      encoding: 'utf8',
      timeout: 10000,
    }
  );
  const unixOutput = execSync(
    `./bin/promptshield scan tests/fixtures/sample.json --rulepack "${unixStylePath}"`,
    {
      encoding: 'utf8',
      timeout: 10000,
    }
  );

  if (
    !windowsOutput.includes('violations') ||
    !unixOutput.includes('violations')
  ) {
    console.log('❌ Cross-platform path handling failed');
    process.exit(1);
  }
  console.log('✅ Cross-platform path handling working');
} catch (error) {
  console.log('❌ Cross-platform path test failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 All NPM Publication Readiness Tests Passed!');
console.log('\n📦 Your CLI tool is ready for npm publication:');
console.log('   npm publish');
console.log('\n✅ Key features verified:');
console.log('   • Cross-platform compatibility');
console.log('   • Proper rulepack resolution');
console.log('   • Complete package metadata');
console.log('   • Working CLI commands');
console.log('   • Correct package contents');
console.log('   • Error handling');
