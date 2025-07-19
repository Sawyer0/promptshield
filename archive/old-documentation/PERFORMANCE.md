# Performance Features

PromptShield is designed to handle large-scale scanning workloads efficiently. This document covers performance optimization features and best practices.

## Parallel Processing

PromptShield supports parallel processing for directory scanning to dramatically improve performance when processing multiple files.

### Basic Usage

```bash
# Enable parallel scanning with default CPU cores
promptshield scan /path/to/files --parallel

# Specify number of workers
promptshield scan /path/to/files --parallel 4

# Configure batch size for memory management
promptshield scan /path/to/files --parallel --batch-size 5
```

### Configuration Options

| Option                  | Description                                           | Default   |
| ----------------------- | ----------------------------------------------------- | --------- |
| `--parallel [workers]`  | Enable parallel processing with optional worker count | CPU cores |
| `--batch-size <number>` | Number of files to process in each batch              | 10        |

### How It Works

1. **Worker Pool**: The system creates a pool of workers (defaulting to CPU core count)
2. **Batched Processing**: Files are processed in configurable batches to manage memory usage
3. **Error Isolation**: Failed files don't stop the entire batch from processing
4. **Progress Tracking**: Debug mode shows batch progress and statistics

### Performance Benefits

- **Directory Scanning**: 2-4x faster for directories with many files
- **Memory Efficiency**: Batched processing prevents memory overload
- **CPU Utilization**: Optimal use of available CPU cores
- **Fault Tolerance**: Individual file failures don't halt the entire process

### Example Performance Comparison

```bash
# Sequential processing (default)
promptshield scan /large/directory --debug
# Time: 45.2s, Memory: 2.1GB peak

# Parallel processing
promptshield scan /large/directory --parallel --debug
# Time: 12.8s, Memory: 1.4GB peak
```

## Memory Management

### Streaming Support

PromptShield automatically switches to streaming mode for large files:

```bash
# Configure streaming threshold
promptshield scan large-file.json --streaming-threshold 1000
```

### Memory Monitoring

```bash
# Set memory warning threshold (80% of available memory)
promptshield scan data.json --memory-warning-threshold 0.8
```

### Best Practices

1. **Use parallel processing** for directories with multiple files
2. **Configure batch sizes** based on available memory (lower for memory-constrained environments)
3. **Monitor memory usage** with `--memory-warning-threshold` for large datasets
4. **Use streaming** for very large JSON files with `--streaming-threshold`

## File Format Optimization

### NDJSON for Large Datasets

For very large datasets, consider using NDJSON format:

```bash
# Process NDJSON files efficiently
promptshield scan data.ndjson --parallel --batch-size 20
```

### Compression Support

PromptShield supports compressed input files:

```bash
# Scan compressed files directly
promptshield scan data.json.gz --parallel
```

## Advanced Configuration

### Fine-tuning for Your Environment

```bash
# High-memory environment (large batches)
promptshield scan /data --parallel 8 --batch-size 50

# Memory-constrained environment (small batches)
promptshield scan /data --parallel 2 --batch-size 3

# Mixed workload (balanced)
promptshield scan /data --parallel 4 --batch-size 10
```

### Debug Mode Performance Monitoring

```bash
# Enable detailed performance logging
promptshield scan /data --parallel --debug --batch-size 5
```

Debug output includes:

- Batch processing progress
- Per-file timing information
- Memory usage warnings
- Worker utilization statistics

## Troubleshooting

### Common Issues

1. **Out of Memory**: Reduce `--batch-size` or `--parallel` worker count
2. **Slow Performance**: Increase `--parallel` workers or `--batch-size`
3. **File Handle Limits**: Reduce batch size for systems with low file descriptor limits

### Performance Tuning

1. **Start with defaults**: `--parallel` (auto-detects CPU cores)
2. **Monitor with debug**: Add `--debug` to see performance metrics
3. **Adjust batch size**: Start with 10, increase for more memory, decrease for less
4. **Scale workers**: More workers help with I/O-bound workloads

## Benchmarks

### Test Environment

- Hardware: 8-core CPU, 16GB RAM
- Dataset: 1000 JSON files, 10MB each
- RulePack: Standard PII detection

### Results

| Configuration                | Time | Memory Peak | CPU Usage |
| ---------------------------- | ---- | ----------- | --------- |
| Sequential                   | 120s | 2.1GB       | 25%       |
| `--parallel`                 | 35s  | 1.8GB       | 85%       |
| `--parallel 4`               | 42s  | 1.4GB       | 65%       |
| `--parallel --batch-size 20` | 28s  | 2.5GB       | 90%       |

### Recommendations

- **Default**: Use `--parallel` for most workloads
- **High Memory**: Use `--parallel --batch-size 20+`
- **Low Memory**: Use `--parallel 2 --batch-size 3`
- **Single Files**: Parallel processing provides no benefit
