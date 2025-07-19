# 🔧 Troubleshooting Guide

Complete guide to solving common PromptShield issues and errors.

## 📋 Table of Contents

- [Installation Issues](#installation-issues)
- [Command Not Found](#command-not-found)
- [File and Path Issues](#file-and-path-issues)
- [RulePack Issues](#rulepack-issues)
- [Performance Issues](#performance-issues)
- [Memory Issues](#memory-issues)
- [Output Issues](#output-issues)
- [Validation Errors](#validation-errors)
- [Common Error Messages](#common-error-messages)
- [Debug Mode](#debug-mode)
- [Getting Help](#getting-help)

## 🚀 Installation Issues

### npm Install Fails

**Error:**

```bash
npm ERR! code ENOENT
npm ERR! syscall open
npm ERR! path /usr/local/lib/node_modules/promptshield/package.json
npm ERR! errno -2
npm ERR! enoent ENOENT: no such file or directory
```

**Solutions:**

```bash
# Clear npm cache
npm cache clean --force

# Remove global installation
npm uninstall -g promptshield

# Reinstall
npm install -g promptshield

# Verify installation
promptshield --version
```

### Node.js Version Issues

**Error:**

```bash
Error: Node.js version 14.x.x is not supported. Please upgrade to Node.js 16.0.0 or higher.
```

**Solutions:**

```bash
# Check current Node.js version
node --version

# Update Node.js (using nvm)
nvm install 18
nvm use 18

# Or download from nodejs.org
# https://nodejs.org/en/download/
```

### Permission Issues

**Error:**

```bash
npm ERR! code EACCES
npm ERR! syscall access
npm ERR! path /usr/local/lib/node_modules
npm ERR! errno -13
npm ERR! enoent EACCES: permission denied
```

**Solutions:**

```bash
# Use npx instead of global install
npx promptshield --version

# Or fix permissions
sudo chown -R $USER /usr/local/lib/node_modules
npm install -g promptshield

# Or use a different directory
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npm install -g promptshield
```

## 🔍 Command Not Found

### Global Installation Issues

**Error:**

```bash
bash: promptshield: command not found
```

**Solutions:**

```bash
# Check if installed globally
npm list -g promptshield

# Reinstall globally
npm uninstall -g promptshield
npm install -g promptshield

# Use npx instead
npx promptshield --version

# Check PATH
echo $PATH
which node
which npm
```

### Project Installation Issues

**Error:**

```bash
npx: command not found
```

**Solutions:**

```bash
# Install npx
npm install -g npx

# Or use npm run
npm install promptshield --save-dev
npx promptshield --version
```

## 📁 File and Path Issues

### File Not Found

**Error:**

```bash
Error: ENOENT: no such file or directory, open 'data.json'
```

**Solutions:**

```bash
# Check if file exists
ls -la data.json

# Use absolute path
promptshield scan /full/path/to/data.json

# Check file permissions
chmod 644 data.json

# Verify file format
file data.json
```

### Directory Access Issues

**Error:**

```bash
Error: EACCES: permission denied, scandir '/path/to/data'
```

**Solutions:**

```bash
# Check directory permissions
ls -la /path/to/data

# Fix permissions
chmod 755 /path/to/data

# Use different directory
promptshield scan ./data/
```

### Wildcard Issues

**Error:**

```bash
Error: No files found matching pattern '*.json'
```

**Solutions:**

```bash
# Check if files exist
ls *.json

# Use specific file names
promptshield scan file1.json file2.json

# Use find command
find . -name "*.json" -exec promptshield scan {} \;
```

## 📦 RulePack Issues

### RulePack Not Found

**Error:**

```bash
Error: RulePack not found: rulepacks/my-rules.yaml
```

**Solutions:**

```bash
# Check if file exists
ls -la rulepacks/my-rules.yaml

# Use absolute path
promptshield scan data.json --rulepack /full/path/to/my-rules.yaml

# List available RulePacks
promptshield list

# Create new RulePack
promptshield init my-rules.yaml --template basic
```

### Invalid YAML Syntax

**Error:**

```bash
Error: Invalid YAML syntax in RulePack
```

**Solutions:**

```bash
# Validate RulePack
promptshield validate my-rules.yaml

# Check YAML syntax
cat my-rules.yaml | python -c "import yaml; yaml.safe_load(input())"

# Common YAML issues:
# - Incorrect indentation
# - Missing quotes around strings
# - Invalid characters
# - Missing required fields
```

### Regex Pattern Errors

**Error:**

```bash
Error: Invalid regular expression
```

**Solutions:**

```bash
# Test regex pattern separately
echo "test string" | grep -E "your-pattern"

# Check for proper escaping in YAML
# Use double backslashes: \\b instead of \b

# Example of correct regex in YAML:
# match_regex: ['\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b']
```

### Missing Required Fields

**Error:**

```bash
Error: Missing required field 'version' in RulePack
```

**Solutions:**

```bash
# Check RulePack structure
cat my-rules.yaml

# Required fields:
# - version
# - name
# - description
# - last_updated
# - rules

# Example valid RulePack:
version: '1.0.0'
name: 'My Rules'
description: 'Custom detection rules'
last_updated: '2025-01-15'
rules:
  - id: 'my_rule'
    description: 'My detection rule'
    match_regex: ['\\bpattern\\b']
    severity: 'medium'
    category: 'security'
    enabled: true
```

## ⚡ Performance Issues

### Slow Scanning

**Symptoms:**

- Scanning takes much longer than expected
- High CPU usage
- Slow response times

**Solutions:**

```bash
# Enable parallel processing
promptshield scan /data/ --parallel 4

# Use streaming for large files
promptshield scan large-file.json --streaming-threshold 50

# Filter by specific fields
promptshield scan data.json --fields prompt,response

# Limit objects scanned
promptshield scan data.json --max-objects 1000

# Monitor performance
time promptshield scan data.json
```

### Large File Issues

**Error:**

```bash
Error: JavaScript heap out of memory
```

**Solutions:**

```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 $(which promptshield) scan large-file.json

# Use streaming mode
promptshield scan large-file.json --streaming-threshold 100

# Process in smaller batches
promptshield scan large-file.json --max-objects 1000

# Use NDJSON format for streaming
promptshield scan large-file.ndjson --streaming-threshold 50
```

### Directory Scanning Issues

**Symptoms:**

- Scanning directories is very slow
- Memory usage increases rapidly

**Solutions:**

```bash
# Use parallel processing
promptshield scan /data/ --parallel 8

# Limit batch size
promptshield scan /data/ --parallel 4 --batch-size 10

# Filter files by extension
find /data/ -name "*.json" | xargs promptshield scan

# Use specific directories
promptshield scan /data/important/ /data/critical/
```

## 💾 Memory Issues

### Out of Memory

**Error:**

```bash
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed
```

**Solutions:**

```bash
# Increase memory limit
node --max-old-space-size=8192 $(which promptshield) scan data.json

# Use streaming mode
promptshield scan data.json --streaming-threshold 50

# Monitor memory usage
promptshield scan data.json --memory-warning-threshold 0.7

# Process smaller files
split -l 1000 large-file.json split-file-
promptshield scan split-file-*
```

### Memory Warning Threshold

**Warning:**

```bash
Warning: Memory usage is high (85%). Consider using streaming mode.
```

**Solutions:**

```bash
# Enable streaming
promptshield scan data.json --streaming-threshold 100

# Reduce batch size
promptshield scan /data/ --parallel 4 --batch-size 5

# Process fewer files at once
find /data/ -name "*.json" | head -10 | xargs promptshield scan
```

## 📊 Output Issues

### No Output Generated

**Symptoms:**

- Command runs but produces no output
- No violations found

**Solutions:**

```bash
# Check if violations exist
promptshield test "test@example.com" --rulepack rulepacks/pii.yaml

# Use verbose mode
promptshield scan data.json --verbose

# Check file content
cat data.json

# Test with known violations
echo '{"prompt": "test@example.com"}' > test.json
promptshield scan test.json --rulepack rulepacks/pii.yaml
```

### Output Format Issues

**Error:**

```bash
Error: Invalid output format 'invalid-format'
```

**Solutions:**

```bash
# Use valid output formats:
# - json
# - markdown
# - csv
# - table
# - html
# - ndjson

promptshield scan data.json --output json
promptshield scan data.json --output html --output-file report.html
```

### File Permission Issues

**Error:**

```bash
Error: EACCES: permission denied, open 'report.json'
```

**Solutions:**

```bash
# Check directory permissions
ls -la .

# Use different output directory
promptshield scan data.json --output-file /tmp/report.json

# Fix permissions
chmod 755 .
```

## ✅ Validation Errors

### RulePack Validation

**Error:**

```bash
Error: RulePack validation failed
```

**Solutions:**

```bash
# Validate RulePack
promptshield validate my-rules.yaml

# Check specific issues
promptshield validate my-rules.yaml --verbose

# Common validation issues:
# - Missing required fields
# - Invalid severity levels (use: critical, high, medium, low)
# - Invalid regex patterns
# - Incorrect YAML syntax
```

### Data File Validation

**Error:**

```bash
Error: Invalid JSON format
```

**Solutions:**

```bash
# Validate JSON syntax
cat data.json | python -c "import json; json.load(input())"

# Check for common JSON issues:
# - Missing commas
# - Unclosed brackets
# - Invalid characters
# - Trailing commas

# Use JSON validator online
# https://jsonlint.com/
```

## 🚨 Common Error Messages

### "No violations found"

**Cause:** No patterns in your RulePack matched the content.

**Solutions:**

```bash
# Test with known violations
promptshield test "test@example.com" --rulepack rulepacks/pii.yaml

# Check RulePack content
promptshield list --rulepack rulepacks/pii.yaml

# Verify file content
cat data.json

# Use verbose mode
promptshield scan data.json --verbose
```

### "RulePack not found"

**Cause:** The specified RulePack file doesn't exist or path is incorrect.

**Solutions:**

```bash
# List available RulePacks
promptshield list

# Use absolute path
promptshield scan data.json --rulepack /full/path/to/rules.yaml

# Check file exists
ls -la rulepacks/
```

### "Invalid regex pattern"

**Cause:** Regular expression syntax is incorrect.

**Solutions:**

```bash
# Test regex separately
echo "test" | grep -E "your-pattern"

# Check YAML escaping
# Use double backslashes: \\b instead of \b

# Validate RulePack
promptshield validate my-rules.yaml
```

### "Memory limit exceeded"

**Cause:** File is too large for available memory.

**Solutions:**

```bash
# Use streaming mode
promptshield scan large-file.json --streaming-threshold 50

# Increase memory limit
node --max-old-space-size=8192 $(which promptshield) scan data.json

# Process in smaller chunks
split -l 1000 large-file.json split-
promptshield scan split-*
```

### "Permission denied"

**Cause:** Insufficient permissions to read/write files.

**Solutions:**

```bash
# Check permissions
ls -la data.json

# Fix permissions
chmod 644 data.json
chmod 755 directory/

# Use different location
promptshield scan data.json --output-file /tmp/report.json
```

## 🐛 Debug Mode

### Enable Debug Logging

```bash
# Enable debug mode
promptshield scan data.json --debug

# Verbose output
promptshield scan data.json --verbose

# Debug specific command
promptshield test "test content" --debug --verbose
```

### Debug Information

Debug mode provides:

- **File loading details**: Which files are being processed
- **Rule matching**: Which rules are being applied
- **Performance metrics**: Processing time and memory usage
- **Error details**: Detailed error information

### Common Debug Output

```bash
[DEBUG] Loading RulePack: rulepacks/pii.yaml
[DEBUG] Processing file: data.json
[DEBUG] Applying rule: email
[DEBUG] Match found: test@example.com
[DEBUG] Processing time: 150ms
[DEBUG] Memory usage: 45MB
```

## 🆘 Getting Help

### Self-Diagnosis

1. **Check version**: `promptshield --version`
2. **Test basic functionality**: `promptshield test "test" --rulepack rulepacks/pii.yaml`
3. **Validate files**: `promptshield validate my-rules.yaml`
4. **Check help**: `promptshield --help`

### Common Solutions

#### Quick Fixes

```bash
# Reinstall PromptShield
npm uninstall -g promptshield
npm install -g promptshield

# Clear cache
npm cache clean --force

# Use npx instead
npx promptshield --version
```

#### Performance Fixes

```bash
# Enable parallel processing
promptshield scan /data/ --parallel 4

# Use streaming for large files
promptshield scan large-file.json --streaming-threshold 100

# Filter results
promptshield scan data.json --severity critical,high
```

#### RulePack Fixes

```bash
# Validate RulePack
promptshield validate my-rules.yaml

# Test rules
promptshield test "test content" --rulepack my-rules.yaml

# Create new RulePack
promptshield init new-rules.yaml --template basic
```

### Getting More Help

- **Command help**: `promptshield --help`
- **Command-specific help**: `promptshield scan --help`
- **GitHub Issues**: Report bugs or request features
- **Documentation**: Check [User Guide](USER_GUIDE.md) and [CLI Reference](CLI_REFERENCE.md)

### Reporting Issues

When reporting issues, include:

1. **Command used**: Exact command that failed
2. **Error message**: Complete error output
3. **Environment**: OS, Node.js version, PromptShield version
4. **Sample data**: Minimal example that reproduces the issue
5. **Expected behavior**: What you expected to happen

---

**🔧 Still having issues?** Check the [User Guide](USER_GUIDE.md) for detailed usage instructions or report a bug on GitHub.
