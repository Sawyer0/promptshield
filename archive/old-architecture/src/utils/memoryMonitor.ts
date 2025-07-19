/**
 * Memory monitoring utility for PromptShield
 * Provides memory usage tracking and warnings for large file processing
 */

import { logger } from './logger';

export interface MemoryThresholds {
  warningThreshold: number; // 0.0-1.0, default 0.8 (80%)
  criticalThreshold: number; // 0.0-1.0, default 0.95 (95%)
  checkInterval: number; // milliseconds, default 1000
}

export interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  heapFree: number;
  usagePercentage: number;
  isHigh: boolean;
  isCritical: boolean;
}

/**
 * Memory monitor for tracking and warning about memory usage
 */
export class MemoryMonitor {
  private thresholds: MemoryThresholds;
  private lastCheck: number = 0;
  private logger: typeof logger;

  constructor(
    thresholds: Partial<MemoryThresholds> = {},
    customLogger?: typeof logger
  ) {
    this.thresholds = {
      warningThreshold: 0.8,
      criticalThreshold: 0.95,
      checkInterval: 1000,
      ...thresholds,
    };
    this.logger = customLogger ?? logger;
  }

  /**
   * Gets current memory usage statistics
   */
  getMemoryUsage(): MemoryUsage {
    const usage = process.memoryUsage();
    const usagePercentage = usage.heapUsed / usage.heapTotal;

    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      heapFree: usage.heapTotal - usage.heapUsed,
      usagePercentage,
      isHigh: usagePercentage > this.thresholds.warningThreshold,
      isCritical: usagePercentage > this.thresholds.criticalThreshold,
    };
  }

  /**
   * Checks memory usage and logs warnings if thresholds are exceeded
   */
  checkMemoryUsage(context?: string): MemoryUsage {
    const now = Date.now();
    const memory = this.getMemoryUsage();

    // Only check at specified intervals to avoid spam
    if (now - this.lastCheck < this.thresholds.checkInterval) {
      return memory;
    }

    this.lastCheck = now;

    if (memory.isCritical) {
      this.logger.warn(
        `Critical memory usage detected: ${(memory.usagePercentage * 100).toFixed(1)}%${context ? ` (${context})` : ''}`
      );
    } else if (memory.isHigh) {
      this.logger.warn(
        `High memory usage detected: ${(memory.usagePercentage * 100).toFixed(1)}%${context ? ` (${context})` : ''}`
      );
    }

    return memory;
  }

  /**
   * Formats memory usage for display
   */
  formatMemoryUsage(memory: MemoryUsage): string {
    const usedMB = Math.round(memory.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memory.heapTotal / 1024 / 1024);
    const percentage = (memory.usagePercentage * 100).toFixed(1);

    return `${usedMB}MB / ${totalMB}MB (${percentage}%)`;
  }

  /**
   * Creates a memory monitor with debug logging
   */
  static createDebugMonitor(): MemoryMonitor {
    return new MemoryMonitor(
      { warningThreshold: 0.7, criticalThreshold: 0.9 },
      logger
    );
  }

  /**
   * Creates a memory monitor with custom thresholds
   */
  static createCustomMonitor(thresholds: MemoryThresholds): MemoryMonitor {
    return new MemoryMonitor(thresholds);
  }
}

// Global memory monitor instance
export const memoryMonitor = new MemoryMonitor();
