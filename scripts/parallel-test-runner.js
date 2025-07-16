#!/usr/bin/env node

/**
 * Parallel Test Runner
 * Wrapper for Jest with enhanced reporting and error handling
 * Uses Jest's built-in parallelism instead of spawning multiple processes
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class ParallelTestRunner {
  constructor(options = {}) {
    this.options = {
      maxWorkers: options.maxWorkers || Math.max(1, os.cpus().length - 1),
      testTimeout: options.testTimeout || 30000,
      bail: options.bail || false,
      verbose: options.verbose || false,
      coverage: options.coverage || false,
      ...options,
    };

    // Ensure maxWorkers is always a valid positive integer
    if (!this.options.maxWorkers || this.options.maxWorkers < 1) {
      this.options.maxWorkers = Math.max(1, os.cpus().length - 1);
    }

    this.results = [];
    this.failures = [];
    this.startTime = Date.now();
  }

  /**
   * Get all test files
   */
  getTestFiles() {
    const testDirs = ['tests/unit', 'tests/integration', 'tests/utils'];

    const testFiles = [];

    for (const dir of testDirs) {
      if (fs.existsSync(dir)) {
        const files = fs
          .readdirSync(dir, { recursive: true })
          .filter(
            (file) =>
              typeof file === 'string' &&
              (file.endsWith('.test.ts') || file.endsWith('.spec.ts'))
          )
          .map((file) => path.join(dir, file));
        testFiles.push(...files);
      }
    }

    return testFiles;
  }

  /**
   * Group test files by category for better parallel execution
   */
  groupTestFiles(testFiles) {
    const groups = {
      unit: [],
      integration: [],
      utils: [],
      performance: [],
    };

    for (const file of testFiles) {
      if (file.includes('performance')) {
        groups.performance.push(file);
      } else if (file.includes('integration')) {
        groups.integration.push(file);
      } else if (file.includes('utils')) {
        groups.utils.push(file);
      } else {
        groups.unit.push(file);
      }
    }

    return groups;
  }

  /**
   * Run Jest with optimized parallel configuration
   */
  async runJestWithParallelism() {
    return new Promise((resolve, reject) => {
      const args = [
        'test',
        `--maxWorkers=${this.options.maxWorkers || '75%'}`,
        '--verbose=false', // Reduce noise in parallel execution
      ];

      if (this.options.coverage) {
        args.push('--coverage');
      }

      if (this.options.bail) {
        args.push('--bail');
      }

      const child = spawn('npm', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      if (this.options.verbose) {
        console.log(`Running: npm ${args.join(' ')}`);
      }

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
        const result = {
          name: 'jest-parallel-execution',
          success: exitCode === 0,
          exitCode,
          stdout,
          stderr,
          duration: Date.now() - this.startTime,
        };

        if (exitCode !== 0) {
          this.failures.push(result);
        }

        this.results.push(result);
        resolve(result);
      });

      child.on('error', (error) => {
        const result = {
          name: 'jest-parallel-execution',
          success: false,
          error: error.message,
          duration: Date.now() - this.startTime,
        };
        this.failures.push(result);
        this.results.push(result);
        reject(error);
      });

      // Set timeout
      setTimeout(() => {
        child.kill('SIGTERM');
        const result = {
          name: 'jest-parallel-execution',
          success: false,
          error: 'Test timeout',
          duration: this.options.testTimeout,
        };
        this.failures.push(result);
        this.results.push(result);
        resolve(result);
      }, this.options.testTimeout);
    });
  }

  /**
   * Run Jest with parallel configuration
   */
  async runTestsWithJest() {
    if (this.options.verbose) {
      console.log(
        `Running Jest with ${this.options.maxWorkers || '75%'} workers`
      );
    }

    return this.runJestWithParallelism();
  }

  /**
   * Split array into chunks
   */
  chunkArray(array, size) {
    // Ensure size is always a valid positive integer
    const validSize = size && size > 0 ? size : 4;
    const chunks = [];
    for (let i = 0; i < array.length; i += validSize) {
      chunks.push(array.slice(i, i + validSize));
    }
    return chunks;
  }

  /**
   * Generate test report
   */
  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter((r) => r.success).length;
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
        file: f.file,
        error: f.error || f.stderr,
        duration: f.duration,
      })),
      results: this.results.map((r) => ({
        file: r.file,
        success: r.success,
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
    console.log('PARALLEL TEST RUNNER REPORT');
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
        console.log(`  ${index + 1}. ${failure.file}`);
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
  saveReport(report, filename = 'test-report.json') {
    const reportPath = path.join(process.cwd(), filename);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${reportPath}`);
  }

  /**
   * Main run method
   */
  async run() {
    console.log('🔍 Discovering test files...');
    const testFiles = this.getTestFiles();

    if (testFiles.length === 0) {
      console.log('❌ No test files found');
      process.exit(1);
    }

    console.log(`📁 Found ${testFiles.length} test files`);

    if (this.options.verbose) {
      console.log('Test files found:', testFiles);
    }

    const groups = this.groupTestFiles(testFiles);
    console.log(`📊 Test groups:`, {
      unit: groups.unit.length,
      integration: groups.integration.length,
      utils: groups.utils.length,
      performance: groups.performance.length,
    });

    console.log(
      `\n🚀 Running Jest with ${this.options.maxWorkers || '75%'} workers...`
    );

    try {
      console.log(`Starting Jest parallel execution...`);
      await this.runTestsWithJest();
      console.log(`Completed Jest execution.`);

      const report = this.generateReport();
      this.printReport(report);

      if (this.options.saveReport) {
        this.saveReport(report);
      }

      // Exit with appropriate code
      if (report.summary.failed > 0) {
        console.log(`\n❌ ${report.summary.failed} tests failed`);
        process.exit(1);
      } else {
        console.log(`\n✅ All tests passed!`);
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
    bail: args.includes('--bail'),
    verbose: args.includes('--verbose'),
    coverage: args.includes('--coverage'),
    saveReport: args.includes('--save-report'),
  };

  // Ensure maxWorkers is a valid number if provided
  if (
    options.maxWorkers &&
    (isNaN(options.maxWorkers) || options.maxWorkers < 1)
  ) {
    console.warn(`Invalid worker count: ${options.maxWorkers}, using default`);
    options.maxWorkers = undefined;
  }

  const runner = new ParallelTestRunner(options);
  runner.run().catch((error) => {
    console.error('Failed to run tests:', error);
    process.exit(1);
  });
}

module.exports = ParallelTestRunner;
