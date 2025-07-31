#!/usr/bin/env node

/**
 * Unified Test Runner for PromptShield
 * Consolidates all testing functionality into a single, efficient runner
 * Replaces: parallel-test-runner.js, cli-test-runner.js, test-runner.js
 */

const { spawn } = require('child_process');
// const path = require('path');
const fs = require('fs');
const os = require('os');

class UnifiedTestRunner {
  constructor(options = {}) {
    this.options = {
      maxWorkers: options.maxWorkers || Math.max(1, os.cpus().length - 1),
      testTimeout: options.testTimeout || 120000,
      verbose: options.verbose || false,
      bail: options.bail || false,
      coverage: options.coverage || false,
      saveReport: options.saveReport || false,
      testType: options.testType || 'all', // 'all', 'unit', 'integration', 'cli', 'performance'
      ...options,
    };

    this.results = [];
    this.failures = [];
    this.startTime = Date.now();
  }

  /**
   * Get test categories based on type
   */
  getTestCategories() {
    const baseCategories = [
      {
        name: 'jest-tests',
        command: this.buildJestCommand(),
        description: 'Jest tests (unit, integration, performance)',
        expectedSuccess: true,
      },
    ];

    // Add CLI tests if requested
    if (this.options.testType === 'all' || this.options.testType === 'cli') {
      baseCategories.push({
        name: 'cli-tests',
        command: 'node scripts/cli-test-runner.js',
        description: 'CLI functionality tests',
        expectedSuccess: true,
      });
    }

    return baseCategories;
  }

  /**
   * Build Jest command with appropriate options
   */
  buildJestCommand() {
    const args = ['test', `--maxWorkers=${this.options.maxWorkers || '75%'}`];

    // Add test type filtering
    if (this.options.testType === 'unit') {
      args.push('--testPathPattern=unit');
    } else if (this.options.testType === 'integration') {
      args.push('--testPathPattern=integration');
    } else if (this.options.testType === 'performance') {
      args.push('--testPathPattern=performance');
    }

    // Add coverage if requested
    if (this.options.coverage) {
      args.push('--coverage');
    }

    // Add bail if requested
    if (this.options.bail) {
      args.push('--bail');
    }

    return `npm ${args.join(' ')}`;
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
    });
  }

  /**
   * Run build step
   */
  async runBuild() {
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'build'], {
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        shell: true,
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Build failed with exit code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  /**
   * Generate test report
   */
  generateReport() {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const duration = Date.now() - this.startTime;

    return {
      summary: {
        total,
        passed,
        failed,
        duration,
        successRate: total > 0 ? (passed / total) * 100 : 0,
      },
      results: this.results,
      failures: this.failures,
    };
  }

  /**
   * Print test report
   */
  printReport(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 UNIFIED TEST RUNNER REPORT');
    console.log('='.repeat(60));

    console.log(`\n📈 Summary:`);
    console.log(`   Total Categories: ${report.summary.total}`);
    console.log(`   ✅ Passed: ${report.summary.passed}`);
    console.log(`   ❌ Failed: ${report.summary.failed}`);
    console.log(
      `   ⏱️  Duration: ${(report.summary.duration / 1000).toFixed(2)}s`
    );
    console.log(
      `   📊 Success Rate: ${report.summary.successRate.toFixed(1)}%`
    );

    if (report.failures.length > 0) {
      console.log(`\n❌ Failures:`);
      report.failures.forEach((failure, index) => {
        console.log(`   ${index + 1}. ${failure.name}: ${failure.description}`);
        if (failure.error) {
          console.log(`      Error: ${failure.error}`);
        }
      });
    }

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Save report to file
   */
  saveReport(report) {
    const reportPath = `test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);
  }

  /**
   * Main run method
   */
  async run() {
    try {
      console.log('🔨 Building project...');
      await this.runBuild();

      console.log('🔍 Discovering test categories...');
      const categories = this.getTestCategories();

      if (categories.length === 0) {
        console.log('❌ No test categories found');
        process.exit(1);
      }

      console.log(`📁 Found ${categories.length} test categories`);
      console.log(
        `🚀 Running unified tests with ${this.options.maxWorkers} workers...`
      );

      // Run tests sequentially for now (can be parallelized later)
      for (const category of categories) {
        await this.runTestCategory(category);
      }

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
    testType:
      args.find((arg) => arg.startsWith('--type='))?.split('=')[1] || 'all',
  };

  const runner = new UnifiedTestRunner(options);
  runner.run().catch((error) => {
    console.error('Failed to run tests:', error);
    process.exit(1);
  });
}

module.exports = UnifiedTestRunner;
