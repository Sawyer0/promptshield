# ⚡ Performance Guide

Complete guide to optimizing PromptShield for maximum performance and efficiency.

## 📋 Table of Contents

- [Overview](#overview)
- [Performance Benchmarks](#performance-benchmarks)
- [Optimization Strategies](#optimization-strategies)
- [Memory Management](#memory-management)
- [Parallel Processing](#parallel-processing)
- [Streaming Mode](#streaming-mode)
- [Best Practices](#best-practices)

## 🎯 Overview

PromptShield is designed for high-performance scanning of large datasets. This guide covers:

- **Performance benchmarks** for different scenarios
- **Optimization strategies** for various use cases
- **Memory management** techniques
- **Parallel processing** configurations
- **Streaming mode** for large files

## 📊 Performance Benchmarks

### Baseline Performance

| Scenario         | File Size | Objects | Time   | Memory    | CPU       |
| ---------------- | --------- | ------- | ------ | --------- | --------- |
| **Small files**  | <1MB      | <1K     | <100ms | 50MB      | 1 core    |
| **Medium files** | 1-100MB   | 1K-100K | 1-10s  | 100-200MB | 1-4 cores |
| **Large files**  | 100MB-1GB | 100K-1M | 10-60s | 200-500MB | 4-8 cores |
| **Huge files**   | >1GB      | >1M     | 1-5min | 500MB-1GB | 8+ cores  |

### Performance by File Type

| File Type  | Processing Speed | Memory Usage | Optimization |
| ---------- | ---------------- | ------------ | ------------ |
| **JSON**   | Fast             | Low          | Default      |
| **NDJSON** | Very Fast        | Very Low     | Streaming    |
| **Text**   | Fast             | Low          | Line-by-line |

### Performance by Rule Type

| Rule Type    | Speed     | Memory   | Use Case         |
| ------------ | --------- | -------- | ---------------- |
| **Regex**    | Medium    | Low      | Complex patterns |
| **Keywords** | Very Fast | Very Low | Simple matching  |

## 🚀 Optimization Strategies

### 1. File Size Optimization

#### Small Files (<1MB)

```bash
# Default settings work well
promptshield scan small-file.json

# No optimization needed
```

#### Medium Files (1-100MB)

```bash
# Enable parallel processing
promptshield scan medium-file.json --parallel 4

# Filter by fields to reduce processing
promptshield scan medium-file.json --fields prompt,response

# Use streaming for NDJSON
promptshield scan medium-file.ndjson --streaming-threshold 50
```

#### Large Files (100MB-1GB)

```bash
# Use streaming mode
promptshield scan large-file.json --streaming-threshold 100

# Enable parallel processing
promptshield scan large-file.json --parallel 8

# Limit memory usage
promptshield scan large-file.json --memory-warning-threshold 0.7

# Process in batches
promptshield scan large-file.json --batch-size 20
```

#### Huge Files (>1GB)

```bash
# Force streaming mode
promptshield scan huge-file.json --streaming-threshold 50

# Use NDJSON format if possible
promptshield scan huge-file.ndjson --streaming-threshold 25

# Increase memory limit
node --max-old-space-size=8192 $(which promptshield) scan huge-file.json

# Process in chunks
split -l 10000 huge-file.json chunk-
for chunk in chunk-*; do
  promptshield scan "$chunk" --output json --output-file "result-${chunk}.json"
done
```

### 2. Rule Optimization

#### Optimize Regex Patterns

```yaml
# ✅ Good: Specific and efficient
rules:
  - id: 'email'
    description: 'Detects email addresses'
    match_regex: ['\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b']
    severity: 'medium'
    category: 'pii'
    enabled: true

# ❌ Bad: Too broad and slow
rules:
  - id: 'email'
    description: 'Detects email addresses'
    match_regex: ['[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}']
    severity: 'medium'
    category: 'pii'
    enabled: true
```

#### Use Keywords for Simple Patterns

```yaml
# ✅ Good: Fast keyword matching
rules:
  - id: 'internal_urls'
    description: 'Detects internal URLs'
    match_keywords:
      - 'internal.company.com'
      - 'staging.company.com'
    case_sensitive: false
    severity: 'medium'
    category: 'security'
    enabled: true

# ❌ Bad: Slow regex for simple patterns
rules:
  - id: 'internal_urls'
    description: 'Detects internal URLs'
    match_regex: ['\\b(?:internal|staging)\\.company\\.com\\b']
    severity: 'medium'
    category: 'security'
    enabled: true
```

#### Combine Rules Efficiently

```yaml
# ✅ Good: Single rule with multiple patterns
rules:
  - id: 'api_keys'
    description: 'Detects various API key formats'
    match_regex:
      - '\\b(?:api|access)[_-]?key[\\s]*[:=]\\s*["\']?[a-zA-Z0-9]{32,}["\']?'
      - '\\b(?:api|access)[_-]?secret[\\s]*[:=]\\s*["\']?[a-zA-Z0-9]{32,}["\']?'
    severity: 'critical'
    category: 'security'
    enabled: true

# ❌ Bad: Multiple separate rules
rules:
  - id: 'api_key'
    match_regex: ['\\bapi[_-]?key[\\s]*[:=]\\s*["\']?[a-zA-Z0-9]{32,}["\']?']
    severity: 'critical'
    category: 'security'
    enabled: true
  - id: 'api_secret'
    match_regex: ['\\bapi[_-]?secret[\\s]*[:=]\\s*["\']?[a-zA-Z0-9]{32,}["\']?']
    severity: 'critical'
    category: 'security'
    enabled: true
```

### 3. Output Optimization

#### Choose Efficient Output Formats

```bash
# ✅ Fast: JSON for automation
promptshield scan data.json --output json

# ✅ Fast: CSV for analysis
promptshield scan data.json --output csv

# ⚠️ Medium: HTML for reports
promptshield scan data.json --output html

# ❌ Slow: Markdown for large datasets
promptshield scan large-file.json --output markdown
```

#### Limit Output Size

```bash
# Limit violations reported
promptshield scan data.json --max-violations 1000

# Filter by severity
promptshield scan data.json --severity critical,high

# Filter by category
promptshield scan data.json --category security,pii
```

## 💾 Memory Management

### Memory Usage Patterns

| Operation               | Memory Usage | Peak         | Optimization      |
| ----------------------- | ------------ | ------------ | ----------------- |
| **File loading**        | File size    | 2x file size | Streaming         |
| **Rule matching**       | Low          | 100MB        | Rule optimization |
| **Output generation**   | Medium       | 500MB        | Output filtering  |
| **Parallel processing** | High         | 1GB+         | Worker limits     |

### Memory Optimization Techniques

#### 1. Enable Streaming

```bash
# For files > 100MB
promptshield scan large-file.json --streaming-threshold 100

# For very large files
promptshield scan huge-file.json --streaming-threshold 50

# For NDJSON files
promptshield scan data.ndjson --streaming-threshold 25
```

#### 2. Monitor Memory Usage

```bash
# Set memory warning threshold
promptshield scan data.json --memory-warning-threshold 0.7

# Monitor with verbose output
promptshield scan data.json --verbose

# Check memory usage
node --max-old-space-size=4096 $(which promptshield) scan data.json
```

#### 3. Process in Chunks

```bash
# Split large files
split -l 10000 large-file.json chunk-

# Process chunks
for chunk in chunk-*; do
  promptshield scan "$chunk" --output json --output-file "result-${chunk}.json"
done

# Combine results
cat result-chunk-*.json > combined-results.json
```

#### 4. Use NDJSON for Large Datasets

```bash
# Convert JSON to NDJSON
jq -c '.[]' large-array.json > large-array.ndjson

# Scan NDJSON with streaming
promptshield scan large-array.ndjson --streaming-threshold 25
```

## 🔄 Parallel Processing

### Worker Configuration

#### Optimal Worker Count

```bash
# For CPU-bound operations
promptshield scan /data/ --parallel $(nproc)

# For I/O-bound operations
promptshield scan /data/ --parallel $(($(nproc) * 2))

# For memory-constrained environments
promptshield scan /data/ --parallel 2
```

#### Batch Size Optimization

```bash
# Small batches for memory efficiency
promptshield scan /data/ --parallel 4 --batch-size 10

# Large batches for CPU efficiency
promptshield scan /data/ --parallel 8 --batch-size 50
```

### Parallel Processing Examples

#### Directory Scanning

```bash
# Scan multiple directories in parallel
promptshield scan /data/ /logs/ /backups/ --parallel 8

# Scan with different RulePacks
for rulepack in rulepacks/*.yaml; do
  promptshield scan /data/ --rulepack "$rulepack" --parallel 4 &
done
wait
```

#### Batch Processing

```bash
# Process files in batches
find /data/ -name "*.json" | xargs -n 10 promptshield scan --parallel 4

# Process with different configurations
for file in /data/*.json; do
  promptshield scan "$file" --rulepack rulepacks/pii.yaml --parallel 2 &
  promptshield scan "$file" --rulepack rulepacks/security.yaml --parallel 2 &
done
wait
```

## 🌊 Streaming Mode

### When to Use Streaming

| File Size | Objects  | Recommended | Threshold |
| --------- | -------- | ----------- | --------- |
| <10MB     | <10K     | No          | -         |
| 10-100MB  | 10K-100K | Optional    | 100       |
| 100MB-1GB | 100K-1M  | Recommended | 50        |
| >1GB      | >1M      | Required    | 25        |

### Streaming Configuration

```bash
# Enable streaming for large files
promptshield scan large-file.json --streaming-threshold 100

# Force streaming mode
promptshield scan huge-file.json --streaming-threshold 1

# Stream with parallel processing
promptshield scan large-file.json --streaming-threshold 50 --parallel 4

# Stream NDJSON files
promptshield scan data.ndjson --streaming-threshold 25
```

### Streaming Performance

| Mode          | Memory Usage | Speed  | Use Case    |
| ------------- | ------------ | ------ | ----------- |
| **Buffered**  | High         | Fast   | Small files |
| **Streaming** | Low          | Medium | Large files |
| **Chunked**   | Very Low     | Slow   | Huge files  |

## 📈 Profiling

### Performance Profiling

#### Basic Profiling

```bash
# Time the operation
time promptshield scan data.json

# Profile memory usage
/usr/bin/time -v promptshield scan data.json

# Monitor system resources
top -p $(pgrep -f promptshield)
```

#### Detailed Profiling

```bash
# Node.js profiling
node --prof $(which promptshield) scan data.json

# Memory profiling
node --inspect $(which promptshield) scan data.json

# CPU profiling
node --prof-process isolate-*.log > profile.txt
```

#### Performance Monitoring

```bash
# Monitor with verbose output
promptshield scan data.json --verbose

# Check processing time
promptshield scan data.json --output json | jq '.metadata.processingTime'

# Monitor memory usage
promptshield scan data.json --memory-warning-threshold 0.5 --verbose
```

### Performance Metrics

#### Key Metrics to Monitor

- **Processing time** per file/object
- **Memory usage** peak and average
- **CPU utilization** during scanning
- **I/O operations** for file reading
- **Rule matching** efficiency

#### Benchmarking Script

```bash
#!/bin/bash

echo "PromptShield Performance Benchmark"
echo "=================================="

# Test different file sizes
for size in 1MB 10MB 100MB 1GB; do
  echo "Testing $size file..."

  # Create test file
  head -c $size /dev/zero > test-$size.bin

  # Measure performance
  start_time=$(date +%s.%N)
  promptshield scan test-$size.bin --output json > /dev/null
  end_time=$(date +%s.%N)

  processing_time=$(echo "$end_time - $start_time" | bc)
  echo "  Processing time: ${processing_time}s"

  # Clean up
  rm test-$size.bin
done
```

## 🎯 Best Practices

### 1. File Preparation

#### Optimize File Format

```bash
# Use NDJSON for large datasets
jq -c '.[]' large-array.json > large-array.ndjson

# Compress files for storage
gzip large-file.json

# Split large files
split -l 10000 large-file.json chunk-
```

#### Pre-filter Data

```bash
# Extract only relevant fields
jq '{prompt: .prompt, response: .response}' data.json > filtered.json

# Remove unnecessary data
jq 'del(.metadata, .debug, .temp)' data.json > clean.json
```

### 2. Rule Optimization

#### Efficient Rule Design

```yaml
# ✅ Good: Specific patterns
match_regex: ['\\bapi[_-]?key\\b']

# ❌ Bad: Broad patterns
match_regex: ['api.*key']

# ✅ Good: Optimized keywords
match_keywords: ['api_key', 'api-key', 'apikey']

# ❌ Bad: Inefficient regex
match_regex: ['api[_-]?key|apikey']
```

#### Rule Organization

```yaml
# Group related rules
rules:
  # API Security
  - id: 'api_key_detection'
    description: 'Detects API keys'
    match_regex: ['\\b(?:api|access)[_-]?key[\\s]*[:=]\\s*["\']?[a-zA-Z0-9]{32,}["\']?']
    severity: 'critical'
    category: 'security'
    enabled: true

  # PII Detection
  - id: 'email_detection'
    description: 'Detects email addresses'
    match_regex: ['\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b']
    severity: 'medium'
    category: 'pii'
    enabled: true
```

### 3. System Optimization

#### Environment Setup

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Set optimal garbage collection
export NODE_OPTIONS="$NODE_OPTIONS --max-old-space-size=4096 --gc-interval=100"

# Use optimal CPU governor
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

#### Resource Monitoring

```bash
# Monitor system resources
htop

# Monitor disk I/O
iotop

# Monitor memory usage
free -h

# Monitor network (if applicable)
iftop
```

### 4. Production Deployment

#### CI/CD Optimization

```yaml
# GitHub Actions optimization
name: Security Scan
on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install PromptShield
        run: npm install -g promptshield

      - name: Run Optimized Scan
        run: |
          promptshield scan . \
            --rulepack rulepacks/security.yaml \
            --parallel 4 \
            --streaming-threshold 100 \
            --memory-warning-threshold 0.7 \
            --output json \
            --output-file security-report.json \
            --fail-on critical
```

#### Docker Optimization

```dockerfile
# Optimized Dockerfile
FROM node:18-alpine

# Install PromptShield
RUN npm install -g promptshield

# Set memory limits
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Copy application
COPY . /app
WORKDIR /app

# Run optimized scan
RUN promptshield scan /app/data \
  --rulepack /app/rulepacks/security.yaml \
  --parallel 4 \
  --streaming-threshold 100 \
  --output json \
  --output-file /app/security-report.json
```

---

**⚡ Ready to optimize PromptShield for maximum performance!**

For more information, see:

- [User Guide](USER_GUIDE.md) - Complete usage guide
- [CLI Reference](CLI_REFERENCE.md) - Command documentation
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Solve performance issues
