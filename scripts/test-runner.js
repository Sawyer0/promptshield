#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Orchestrates Jest and CLI tests with enhanced reporting
 * Uses Jest's built-in parallelism for efficiency
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class ComprehensiveTestRunner {
  constructor(options = {}) {
    this.options = {
      maxWorkers: options.maxWorkers || Math.max(1, os.cpus().length - 1),
      testTimeout: options.testTimeout || 120000,
      verbose: options.verbose || false,
      bail: options.bail || false,
      coverage: options.coverage || false,
      saveReport: options.saveReport || false,
      ...options,
    };

    this.results = [];
    this.failures = [];
    this.startTime = Date.now();
  }

  /**
   * Get test categories (simplified to avoid redundant Jest processes)
   */
  getTestCategories() {
    return [
      {
        name: 'jest-tests',
        command: this.options.coverage
          ? `npm test -- --maxWorkers=${this.options.maxWorkers || '75%'} --coverage`
          : `npm test -- --maxWorkers=${this.options.maxWorkers || '75%'}`,
        description:
          'All Jest tests (unit, integration, performance) in parallel',
        expectedSuccess: true,
      },
      {
        name: 'cli-tests',
        command: 'node scripts/cli-test-runner.js',
        description: 'CLI functionality tests',
        expectedSuccess: true,
      },
    ];
  }

  /**
   * Run a single test category
   */
  async runTestCategory(category) {
    return new Promise((resolve) => {
      const child = spawn(category.command, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        cwd: process.cwd(),
      });

      let stdout = '';
      let stderr = '';
      let exitCode = 0;

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        if (this.options.verbose) {
          process.stdout.write(data);
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        if (this.options.verbose) {
          process.stderr.write(data);
        }
      });

      child.on('close', (code) => {
        exitCode = code;
        const success = exitCode === 0;
        const result = {
          name: category.name,
          description: category.description,
          command: category.command,
          success,
          exitCode,
          stdout,
          stderr,
          duration: Date.now() - this.startTime,
          expectedSuccess: category.expectedSuccess,
          passed: success === category.expectedSuccess,
        };

        if (!result.passed) {
          this.failures.push(result);
        }

        this.results.push(result);
        resolve(result);
      });

      child.on('error', (error) => {
        const result = {
          name: category.name,
          description: category.description,
          command: category.command,
          success: false,
          error: error.message,
          duration: Date.now() - this.startTime,
          expectedSuccess: category.expectedSuccess,
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
          name: category.name,
          description: category.description,
          command: category.command,
          success: false,
          error: 'Test timeout',
          duration: this.options.testTimeout,
          expectedSuccess: category.expectedSuccess,
          passed: false,
        };
        this.failures.push(result);
        this.results.push(result);
        resolve(result);
      }, this.options.testTimeout);
    });
  }

  /**
   * Run tests in parallel
   */
  async runTestsInParallel(categories) {
    const chunks = this.chunkArray(categories, this.options.maxWorkers);
    const promises = [];

    for (const chunk of chunks) {
      const chunkPromise = Promise.all(
        chunk.map((category) => this.runTestCategory(category))
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
        description: f.description,
        command: f.command,
        error: f.error || f.stderr,
        duration: f.duration,
        expectedSuccess: f.expectedSuccess,
        actualSuccess: f.success,
      })),
      results: this.results.map((r) => ({
        name: r.name,
        description: r.description,
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
    console.log('\n' + '='.repeat(80));
    console.log('COMPREHENSIVE TEST RUNNER REPORT');
    console.log('='.repeat(80));

    console.log(`\nSummary:`);
    console.log(`  Total Test Categories: ${report.summary.total}`);
    console.log(`  Passed: ${report.summary.passed}`);
    console.log(`  Failed: ${report.summary.failed}`);
    console.log(`  Duration: ${report.summary.duration}`);
    console.log(`  Success Rate: ${report.summary.successRate}`);

    if (report.failures.length > 0) {
      console.log(`\nFailures:`);
      report.failures.forEach((failure, index) => {
        console.log(`  ${index + 1}. ${failure.name}`);
        console.log(`     Description: ${failure.description}`);
        console.log(`     Command: ${failure.command}`);
        console.log(`     Expected Success: ${failure.expectedSuccess}`);
        console.log(`     Actual Success: ${failure.actualSuccess}`);
        console.log(`     Error: ${failure.error}`);
        console.log(`     Duration: ${failure.duration}ms`);
        console.log('');
      });
    }

    console.log('\nDetailed Results:');
    report.results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(
        `  ${index + 1}. ${result.name} - ${status} (${result.duration}ms)`
      );
    });

    console.log('\n' + '='.repeat(80));
  }

  /**
   * Save report to file
   */
  saveReport(report, filename = 'comprehensive-test-report.json') {
    const reportPath = path.join(process.cwd(), filename);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${reportPath}`);
  }

  /**
   * Run build first
   */
  async runBuild() {
    return new Promise((resolve, reject) => {
      console.log('🔨 Building project...');
      const child = spawn('npm', ['run', 'build'], {
        stdio: 'pipe',
        shell: true,
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Build successful');
          resolve();
        } else {
          console.log('❌ Build failed');
          reject(new Error('Build failed'));
        }
      });

      child.on('error', (error) => {
        console.log('❌ Build error:', error.message);
        reject(error);
      });
    });
  }

  /**
   * Main run method
   */
  async run() {
    try {
      // Run build first
      await this.runBuild();

      console.log('🔍 Discovering test categories...');
      const categories = this.getTestCategories();

      if (categories.length === 0) {
        console.log('❌ No test categories found');
        process.exit(1);
      }

      console.log(`📁 Found ${categories.length} test categories`);
      console.log(`🚀 Running comprehensive tests with Jest parallelism...`);

      await this.runTestsInParallel(categories);

      const report = this.generateReport();
      this.printReport(report);

      if (this.options.saveReport) {
        this.saveReport(report);
      }

      // Exit with appropriate code
      if (report.summary.failed > 0) {
        console.log(`\n❌ ${report.summary.failed} test categories failed`);
        process.exit(1);
      } else {
        console.log(`\n✅ All test categories passed!`);
        process.exit(0);
      }
    } catch (error) {
      console.error('❌ Test runner error:', error);
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
    coverage: args.includes('--coverage'),
    saveReport: args.includes('--save-report'),
  };

  const runner = new ComprehensiveTestRunner(options);
  runner.run().catch((error) => {
    console.error('Failed to run tests:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveTestRunner;
