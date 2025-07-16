#!/usr/bin/env node

/**
 * CLI Test Runner
 * Runs CLI tests in parallel with better error handling and reporting
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class CliTestRunner {
  constructor(options = {}) {
    this.options = {
      maxWorkers: options.maxWorkers || Math.max(1, os.cpus().length - 1),
      testTimeout: options.testTimeout || 30000,
      verbose: options.verbose || false,
      bail: options.bail || false,
      ...options,
    };

    this.results = [];
    this.failures = [];
    this.startTime = Date.now();
  }

  /**
   * Get CLI test scenarios
   */
  getCliTestScenarios() {
    return [
      {
        name: 'help-command',
        command: 'node dist/cli/index.js --help',
        expectedSuccess: true,
        expectedOutput: ['promptshield', 'Scan prompts and responses'],
      },
      {
        name: 'version-command',
        command: 'node dist/cli/index.js --version',
        expectedSuccess: true,
        expectedOutput: ['1.0.0'],
      },
      {
        name: 'invalid-command',
        command: 'node dist/cli/index.js invalid',
        expectedSuccess: false,
        expectedError: 'unknown command',
      },
      {
        name: 'missing-file',
        command:
          'node dist/cli/index.js scan missing.json --rulepack rulepacks/pii.yaml',
        expectedSuccess: false,
        expectedError: 'ENOENT',
      },
      {
        name: 'missing-rulepack',
        command:
          'node dist/cli/index.js scan tests/fixtures/valid.json --rulepack missing.yaml',
        expectedSuccess: false,
        expectedError: 'RulePack file not found',
      },
      {
        name: 'basic-scan',
        command:
          'node dist/cli/index.js scan tests/fixtures/valid.json --rulepack rulepacks/pii.yaml',
        expectedSuccess: true,
        expectedOutput: ['Scan Results', 'violations'],
      },
      {
        name: 'schema-validation',
        command:
          'node dist/cli/index.js scan tests/fixtures/schema-basic.json --schema basic --rulepack rulepacks/pii.yaml',
        expectedSuccess: true,
        expectedOutput: ['schema-basic.json'],
      },
      {
        name: 'invalid-schema',
        command:
          'node dist/cli/index.js scan tests/fixtures/schema-invalid.json --schema basic --rulepack rulepacks/pii.yaml',
        expectedSuccess: false,
        expectedError: 'Schema validation failed',
      },
      {
        name: 'unsupported-format',
        command:
          'node dist/cli/index.js scan tests/fixtures/sample.txt --output xml',
        expectedSuccess: false,
        expectedError: 'Unsupported file format',
      },
      {
        name: 'missing-argument',
        command: 'node dist/cli/index.js scan',
        expectedSuccess: false,
        expectedError: 'missing required argument',
      },
    ];
  }

  /**
   * Run a single CLI test
   */
  async runCliTest(scenario) {
    return new Promise((resolve) => {
      const child = spawn(scenario.command, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      let stdout = '';
      let stderr = '';
      let exitCode = 0;

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        exitCode = code;
        const success = exitCode === 0;
        const result = {
          name: scenario.name,
          command: scenario.command,
          success,
          exitCode,
          stdout,
          stderr,
          duration: Date.now() - this.startTime,
          expectedSuccess: scenario.expectedSuccess,
          passed: success === scenario.expectedSuccess,
        };

        // Check expected output/error
        if (scenario.expectedOutput) {
          const hasExpectedOutput = scenario.expectedOutput.every(
            (expected) => stdout.includes(expected) || stderr.includes(expected)
          );
          result.passed = result.passed && hasExpectedOutput;
        }

        if (scenario.expectedError) {
          const hasExpectedError =
            stderr.includes(scenario.expectedError) ||
            stdout.includes(scenario.expectedError);
          result.passed = result.passed && hasExpectedError;
        }

        if (!result.passed) {
          this.failures.push(result);
        }

        this.results.push(result);
        resolve(result);
      });

      child.on('error', (error) => {
        const result = {
          name: scenario.name,
          command: scenario.command,
          success: false,
          error: error.message,
          duration: Date.now() - this.startTime,
          expectedSuccess: scenario.expectedSuccess,
          passed: false,
        };
        this.failures.push(result);
        this.results.push(result);
        resolve(result);
      });

      // Set timeout
      setTimeout(() => {
        child.kill('SIGTERM');
        const result = {
          name: scenario.name,
          command: scenario.command,
          success: false,
          error: 'Test timeout',
          duration: this.options.testTimeout,
          expectedSuccess: scenario.expectedSuccess,
          passed: false,
        };
        this.failures.push(result);
        this.results.push(result);
        resolve(result);
      }, this.options.testTimeout);
    });
  }

  /**
   * Run CLI tests in parallel
   */
  async runCliTestsInParallel(scenarios) {
    const chunks = this.chunkArray(scenarios, this.options.maxWorkers);
    const promises = [];

    for (const chunk of chunks) {
      const chunkPromise = Promise.all(
        chunk.map((scenario) => this.runCliTest(scenario))
      );
      promises.push(chunkPromise);
    }

    return Promise.all(promises);
  }

  /**
   * Split array into chunks
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Generate test report
   */
  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter((r) => r.passed).length;
    const failedTests = this.failures.length;
    const duration = Date.now() - this.startTime;

    const report = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        duration: `${duration}ms`,
        successRate: `${((passedTests / totalTests) * 100).toFixed(2)}%`,
      },
      failures: this.failures.map((f) => ({
        name: f.name,
        command: f.command,
        error: f.error || f.stderr,
        duration: f.duration,
        expectedSuccess: f.expectedSuccess,
        actualSuccess: f.success,
      })),
      results: this.results.map((r) => ({
        name: r.name,
        command: r.command,
        success: r.success,
        passed: r.passed,
        duration: r.duration,
      })),
    };

    return report;
  }

  /**
   * Print report to console
   */
  printReport(report) {
    console.log('\n' + '='.repeat(60));
    console.log('CLI TEST RUNNER REPORT');
    console.log('='.repeat(60));

    console.log(`\nSummary:`);
    console.log(`  Total Tests: ${report.summary.total}`);
    console.log(`  Passed: ${report.summary.passed}`);
    console.log(`  Failed: ${report.summary.failed}`);
    console.log(`  Duration: ${report.summary.duration}`);
    console.log(`  Success Rate: ${report.summary.successRate}`);

    if (report.failures.length > 0) {
      console.log(`\nFailures:`);
      report.failures.forEach((failure, index) => {
        console.log(`  ${index + 1}. ${failure.name}`);
        console.log(`     Command: ${failure.command}`);
        console.log(`     Expected Success: ${failure.expectedSuccess}`);
        console.log(`     Actual Success: ${failure.actualSuccess}`);
        console.log(`     Error: ${failure.error}`);
        console.log(`     Duration: ${failure.duration}ms`);
        console.log('');
      });
    }

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Save report to file
   */
  saveReport(report, filename = 'cli-test-report.json') {
    const reportPath = path.join(process.cwd(), filename);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${reportPath}`);
  }

  /**
   * Main run method
   */
  async run() {
    console.log('🔍 Discovering CLI test scenarios...');
    const scenarios = this.getCliTestScenarios();

    if (scenarios.length === 0) {
      console.log('❌ No CLI test scenarios found');
      process.exit(1);
    }

    console.log(`📁 Found ${scenarios.length} CLI test scenarios`);
    console.log(
      `🚀 Running CLI tests with ${this.options.maxWorkers} workers...`
    );

    try {
      await this.runCliTestsInParallel(scenarios);

      const report = this.generateReport();
      this.printReport(report);

      if (this.options.saveReport) {
        this.saveReport(report);
      }

      // Exit with appropriate code
      if (report.summary.failed > 0) {
        console.log(`\n❌ ${report.summary.failed} CLI tests failed`);
        process.exit(1);
      } else {
        console.log(`\n✅ All CLI tests passed!`);
        process.exit(0);
      }
    } catch (error) {
      console.error('❌ CLI test runner error:', error);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    maxWorkers:
      parseInt(
        args.find((arg) => arg.startsWith('--workers='))?.split('=')[1]
      ) || undefined,
    testTimeout:
      parseInt(
        args.find((arg) => arg.startsWith('--timeout='))?.split('=')[1]
      ) || undefined,
    verbose: args.includes('--verbose'),
    bail: args.includes('--bail'),
    saveReport: args.includes('--save-report'),
  };

  const runner = new CliTestRunner(options);
  runner.run().catch((error) => {
    console.error('Failed to run CLI tests:', error);
    process.exit(1);
  });
}

module.exports = CliTestRunner;
