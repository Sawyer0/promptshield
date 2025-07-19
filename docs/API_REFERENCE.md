# 🔌 API Reference

Complete API reference for integrating PromptShield into your applications programmatically.

## 📋 Table of Contents

- [Overview](#overview)
- [Node.js Integration](#nodejs-integration)
- [Python Integration](#python-integration)
- [Shell Integration](#shell-integration)
- [HTTP API](#http-api)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Examples](#examples)

## 🎯 Overview

PromptShield can be integrated into your applications in several ways:

- **CLI Integration**: Execute commands and parse output
- **Library Integration**: Use PromptShield as a Node.js library
- **HTTP API**: RESTful API for remote scanning
- **Streaming**: Process data in real-time

## 📦 Node.js Integration

### Basic Integration

```javascript
const { execSync } = require('child_process');

function scanFile(filePath, rulepack = 'rulepacks/pii.yaml') {
  try {
    const result = execSync(
      `promptshield scan "${filePath}" --rulepack "${rulepack}" --output json`,
      { encoding: 'utf8' }
    );

    const report = JSON.parse(result);
    return {
      success: true,
      violations: report.violations,
      total: report.totalViolations,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      violations: [],
    };
  }
}

// Usage
const result = scanFile('data.json');
if (result.success) {
  console.log(`Found ${result.total} violations`);
} else {
  console.error('Scan failed:', result.error);
}
```

### Async Integration

```javascript
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function scanFileAsync(filePath, options = {}) {
  const {
    rulepack = 'rulepacks/pii.yaml',
    severity = null,
    category = null,
    output = 'json',
  } = options;

  try {
    let command = `promptshield scan "${filePath}" --rulepack "${rulepack}" --output ${output}`;

    if (severity) {
      command += ` --severity ${severity}`;
    }

    if (category) {
      command += ` --category ${category}`;
    }

    const { stdout, stderr } = await execAsync(command);

    if (output === 'json') {
      const report = JSON.parse(stdout);
      return {
        success: true,
        violations: report.violations,
        total: report.totalViolations,
        metadata: report.metadata,
      };
    } else {
      return {
        success: true,
        output: stdout,
        raw: stdout,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stderr: error.stderr,
    };
  }
}

// Usage
async function main() {
  const result = await scanFileAsync('data.json', {
    severity: 'critical,high',
    category: 'security',
  });

  if (result.success) {
    console.log(`Found ${result.total} violations`);
    result.violations.forEach((v) => {
      console.log(`${v.severity}: ${v.ruleId} - ${v.match}`);
    });
  } else {
    console.error('Scan failed:', result.error);
  }
}
```

### Advanced Integration

```javascript
const { spawn } = require('child_process');

class PromptShieldScanner {
  constructor(options = {}) {
    this.options = {
      rulepack: 'rulepacks/pii.yaml',
      parallel: false,
      streaming: false,
      ...options,
    };
  }

  async scanFile(filePath) {
    return new Promise((resolve, reject) => {
      const args = [
        'scan',
        filePath,
        '--rulepack',
        this.options.rulepack,
        '--output',
        'json',
      ];

      if (this.options.parallel) {
        args.push('--parallel', '4');
      }

      if (this.options.streaming) {
        args.push('--streaming-threshold', '100');
      }

      const process = spawn('promptshield', args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            const report = JSON.parse(stdout);
            resolve({
              success: true,
              violations: report.violations,
              total: report.totalViolations,
              metadata: report.metadata,
            });
          } catch (error) {
            reject(new Error(`Failed to parse output: ${error.message}`));
          }
        } else {
          reject(new Error(`Process exited with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to start process: ${error.message}`));
      });
    });
  }

  async scanDirectory(dirPath) {
    return this.scanFile(dirPath);
  }

  async testString(text, rulepack = null) {
    const args = ['test', text, '--output', 'json'];

    if (rulepack) {
      args.push('--rulepack', rulepack);
    }

    return new Promise((resolve, reject) => {
      const process = spawn('promptshield', args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve({
              success: true,
              violations: result.violations || [],
              total: result.totalViolations || 0,
            });
          } catch (error) {
            reject(new Error(`Failed to parse output: ${error.message}`));
          }
        } else {
          reject(new Error(`Process exited with code ${code}: ${stderr}`));
        }
      });
    });
  }
}

// Usage
async function main() {
  const scanner = new PromptShieldScanner({
    rulepack: 'rulepacks/security.yaml',
    parallel: true,
  });

  try {
    // Scan file
    const fileResult = await scanner.scanFile('data.json');
    console.log(`File scan: ${fileResult.total} violations`);

    // Test string
    const testResult = await scanner.testString('test@example.com');
    console.log(`String test: ${testResult.total} violations`);

    // Scan directory
    const dirResult = await scanner.scanDirectory('./data/');
    console.log(`Directory scan: ${dirResult.total} violations`);
  } catch (error) {
    console.error('Scan failed:', error.message);
  }
}
```

## 🐍 Python Integration

### Basic Integration

```python
import subprocess
import json
import sys

def scan_file(file_path, rulepack='rulepacks/pii.yaml'):
    """Scan a file for violations using PromptShield."""
    try:
        result = subprocess.run(
            ['promptshield', 'scan', file_path, '--rulepack', rulepack, '--output', 'json'],
            capture_output=True,
            text=True,
            check=True
        )

        report = json.loads(result.stdout)
        return {
            'success': True,
            'violations': report['violations'],
            'total': report['totalViolations']
        }
    except subprocess.CalledProcessError as e:
        return {
            'success': False,
            'error': e.stderr,
            'violations': []
        }
    except json.JSONDecodeError as e:
        return {
            'success': False,
            'error': f'Failed to parse output: {e}',
            'violations': []
        }

# Usage
result = scan_file('data.json')
if result['success']:
    print(f"Found {result['total']} violations")
else:
    print(f"Scan failed: {result['error']}")
```

### Advanced Integration

```python
import subprocess
import json
import asyncio
from typing import Dict, List, Optional

class PromptShieldScanner:
    def __init__(self, rulepack='rulepacks/pii.yaml', parallel=False):
        self.rulepack = rulepack
        self.parallel = parallel

    def scan_file(self, file_path: str, severity: Optional[str] = None,
                  category: Optional[str] = None) -> Dict:
        """Scan a file for violations."""
        try:
            cmd = ['promptshield', 'scan', file_path, '--rulepack', self.rulepack, '--output', 'json']

            if severity:
                cmd.extend(['--severity', severity])

            if category:
                cmd.extend(['--category', category])

            if self.parallel:
                cmd.extend(['--parallel', '4'])

            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            report = json.loads(result.stdout)

            return {
                'success': True,
                'violations': report['violations'],
                'total': report['totalViolations'],
                'metadata': report.get('metadata', {})
            }
        except subprocess.CalledProcessError as e:
            return {
                'success': False,
                'error': e.stderr,
                'violations': []
            }
        except json.JSONDecodeError as e:
            return {
                'success': False,
                'error': f'Failed to parse output: {e}',
                'violations': []
            }

    def test_string(self, text: str) -> Dict:
        """Test a string for violations."""
        try:
            result = subprocess.run(
                ['promptshield', 'test', text, '--rulepack', self.rulepack, '--output', 'json'],
                capture_output=True,
                text=True,
                check=True
            )

            report = json.loads(result.stdout)
            return {
                'success': True,
                'violations': report.get('violations', []),
                'total': report.get('totalViolations', 0)
            }
        except subprocess.CalledProcessError as e:
            return {
                'success': False,
                'error': e.stderr,
                'violations': []
            }

    def validate_rulepack(self, rulepack_path: str) -> Dict:
        """Validate a RulePack file."""
        try:
            result = subprocess.run(
                ['promptshield', 'validate', rulepack_path, '--output', 'json'],
                capture_output=True,
                text=True,
                check=True
            )

            return {
                'success': True,
                'valid': True
            }
        except subprocess.CalledProcessError as e:
            return {
                'success': False,
                'error': e.stderr,
                'valid': False
            }

# Usage
def main():
    scanner = PromptShieldScanner(rulepack='rulepacks/security.yaml')

    # Scan file
    result = scanner.scan_file('data.json', severity='critical,high')
    if result['success']:
        print(f"Found {result['total']} violations")
        for violation in result['violations']:
            print(f"{violation['severity']}: {violation['ruleId']}")
    else:
        print(f"Scan failed: {result['error']}")

    # Test string
    test_result = scanner.test_string('test@example.com')
    if test_result['success']:
        print(f"String test: {test_result['total']} violations")

    # Validate RulePack
    validation = scanner.validate_rulepack('my-rules.yaml')
    if validation['success']:
        print("RulePack is valid")
    else:
        print(f"RulePack validation failed: {validation['error']}")

if __name__ == '__main__':
    main()
```

### Async Integration

```python
import asyncio
import subprocess
import json
from typing import Dict, List

class AsyncPromptShieldScanner:
    def __init__(self, rulepack='rulepacks/pii.yaml'):
        self.rulepack = rulepack

    async def scan_file(self, file_path: str) -> Dict:
        """Asynchronously scan a file for violations."""
        try:
            process = await asyncio.create_subprocess_exec(
                'promptshield', 'scan', file_path, '--rulepack', self.rulepack, '--output', 'json',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            if process.returncode == 0:
                report = json.loads(stdout.decode())
                return {
                    'success': True,
                    'violations': report['violations'],
                    'total': report['totalViolations']
                }
            else:
                return {
                    'success': False,
                    'error': stderr.decode(),
                    'violations': []
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'violations': []
            }

    async def scan_multiple_files(self, file_paths: List[str]) -> List[Dict]:
        """Scan multiple files concurrently."""
        tasks = [self.scan_file(path) for path in file_paths]
        return await asyncio.gather(*tasks)

# Usage
async def main():
    scanner = AsyncPromptShieldScanner(rulepack='rulepacks/security.yaml')

    # Scan single file
    result = await scanner.scan_file('data.json')
    if result['success']:
        print(f"Found {result['total']} violations")

    # Scan multiple files
    files = ['data1.json', 'data2.json', 'data3.json']
    results = await scanner.scan_multiple_files(files)

    total_violations = sum(r['total'] for r in results if r['success'])
    print(f"Total violations across all files: {total_violations}")

if __name__ == '__main__':
    asyncio.run(main())
```

## 🐚 Shell Integration

### Basic Shell Script

```bash
#!/bin/bash

# Function to scan file and handle results
scan_file() {
    local file_path="$1"
    local rulepack="${2:-rulepacks/pii.yaml}"
    local output_file="${3:-scan-results.json}"

    echo "Scanning $file_path with $rulepack..."

    if promptshield scan "$file_path" --rulepack "$rulepack" --output json --output-file "$output_file"; then
        echo "✅ Scan completed successfully"

        # Parse results
        if command -v jq >/dev/null 2>&1; then
            violations=$(jq '.totalViolations' "$output_file")
            echo "Found $violations violations"

            # Show critical violations
            jq -r '.violations[] | select(.severity == "critical") | "🔴 \(.ruleId): \(.match)"' "$output_file"
        else
            echo "Results saved to $output_file"
        fi
    else
        echo "❌ Scan failed"
        return 1
    fi
}

# Function to test strings
test_string() {
    local text="$1"
    local rulepack="${2:-rulepacks/pii.yaml}"

    echo "Testing: $text"

    if result=$(promptshield test "$text" --rulepack "$rulepack" --output json 2>/dev/null); then
        if command -v jq >/dev/null 2>&1; then
            violations=$(echo "$result" | jq '.totalViolations // 0')
            echo "Found $violations violations"
        else
            echo "Test completed"
        fi
    else
        echo "❌ Test failed"
        return 1
    fi
}

# Usage
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "${1:-}" in
        "scan")
            scan_file "${2:-}" "${3:-}" "${4:-}"
            ;;
        "test")
            test_string "${2:-}" "${3:-}"
            ;;
        *)
            echo "Usage: $0 {scan|test} [file|string] [rulepack] [output-file]"
            exit 1
            ;;
    esac
fi
```

### Advanced Shell Integration

```bash
#!/bin/bash

# Configuration
PROMPTSHIELD_RULEPACK="${PROMPTSHIELD_RULEPACK:-rulepacks/pii.yaml}"
PROMPTSHIELD_OUTPUT="${PROMPTSHIELD_OUTPUT:-json}"
PROMPTSHIELD_PARALLEL="${PROMPTSHIELD_PARALLEL:-false}"
PROMPTSHIELD_WORKERS="${PROMPTSHIELD_WORKERS:-4}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to build command
build_command() {
    local cmd="promptshield"
    local subcommand="$1"
    local input="$2"
    shift 2

    cmd="$cmd $subcommand \"$input\""

    # Add options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --rulepack)
                cmd="$cmd --rulepack \"$2\""
                shift 2
                ;;
            --severity)
                cmd="$cmd --severity \"$2\""
                shift 2
                ;;
            --category)
                cmd="$cmd --category \"$2\""
                shift 2
                ;;
            --output)
                cmd="$cmd --output \"$2\""
                shift 2
                ;;
            --output-file)
                cmd="$cmd --output-file \"$2\""
                shift 2
                ;;
            --parallel)
                cmd="$cmd --parallel"
                shift
                ;;
            --quiet)
                cmd="$cmd --quiet"
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    echo "$cmd"
}

# Function to scan with error handling
scan_with_retry() {
    local file_path="$1"
    local rulepack="${2:-$PROMPTSHIELD_RULEPACK}"
    local max_retries="${3:-3}"
    local retry_count=0

    while [[ $retry_count -lt $max_retries ]]; do
        log_info "Scanning $file_path (attempt $((retry_count + 1))/$max_retries)"

        local cmd
        cmd=$(build_command "scan" "$file_path" \
            --rulepack "$rulepack" \
            --output "$PROMPTSHIELD_OUTPUT" \
            --output-file "scan-results-$(date +%s).json")

        if eval "$cmd"; then
            log_info "Scan completed successfully"
            return 0
        else
            retry_count=$((retry_count + 1))
            log_warn "Scan failed, retrying... ($retry_count/$max_retries)"
            sleep 2
        fi
    done

    log_error "Scan failed after $max_retries attempts"
    return 1
}

# Function to batch scan
batch_scan() {
    local directory="$1"
    local pattern="${2:-*.json}"
    local rulepack="${3:-$PROMPTSHIELD_RULEPACK}"

    log_info "Starting batch scan of $directory"

    local files=()
    while IFS= read -r -d '' file; do
        files+=("$file")
    done < <(find "$directory" -name "$pattern" -print0)

    if [[ ${#files[@]} -eq 0 ]]; then
        log_warn "No files found matching pattern: $pattern"
        return 0
    fi

    log_info "Found ${#files[@]} files to scan"

    local failed_files=()
    local successful_scans=0

    for file in "${files[@]}"; do
        if scan_with_retry "$file" "$rulepack"; then
            successful_scans=$((successful_scans + 1))
        else
            failed_files+=("$file")
        fi
    done

    log_info "Batch scan completed: $successful_scans successful, ${#failed_files[@]} failed"

    if [[ ${#failed_files[@]} -gt 0 ]]; then
        log_warn "Failed files:"
        printf '%s\n' "${failed_files[@]}"
    fi

    return ${#failed_files[@]}
}

# Function to monitor and alert
monitor_and_alert() {
    local file_path="$1"
    local rulepack="${2:-$PROMPTSHIELD_RULEPACK}"
    local severity="${3:-critical}"

    log_info "Monitoring $file_path for $severity violations"

    local cmd
    cmd=$(build_command "scan" "$file_path" \
        --rulepack "$rulepack" \
        --severity "$severity" \
        --output json \
        --quiet)

    if result=$(eval "$cmd" 2>/dev/null); then
        if command -v jq >/dev/null 2>&1; then
            local violations
            violations=$(echo "$result" | jq '.totalViolations // 0')

            if [[ $violations -gt 0 ]]; then
                log_error "ALERT: Found $violations $severity violations in $file_path"

                # Send alert (customize for your needs)
                echo "ALERT: $violations $severity violations found in $file_path" | \
                    mail -s "PromptShield Alert" admin@company.com

                return 1
            else
                log_info "No $severity violations found"
                return 0
            fi
        else
            log_warn "jq not available, cannot parse results"
            return 0
        fi
    else
        log_error "Monitoring scan failed"
        return 1
    fi
}

# Main function
main() {
    case "${1:-}" in
        "scan")
            scan_with_retry "${2:-}" "${3:-}" "${4:-}"
            ;;
        "batch")
            batch_scan "${2:-}" "${3:-}" "${4:-}"
            ;;
        "monitor")
            monitor_and_alert "${2:-}" "${3:-}" "${4:-}"
            ;;
        "test")
            local text="${2:-}"
            local rulepack="${3:-$PROMPTSHIELD_RULEPACK}"

            log_info "Testing: $text"

            if result=$(promptshield test "$text" --rulepack "$rulepack" --output json 2>/dev/null); then
                if command -v jq >/dev/null 2>&1; then
                    local violations
                    violations=$(echo "$result" | jq '.totalViolations // 0')
                    log_info "Found $violations violations"
                else
                    log_info "Test completed"
                fi
            else
                log_error "Test failed"
                return 1
            fi
            ;;
        *)
            echo "Usage: $0 {scan|batch|monitor|test} [file|directory|string] [rulepack] [options]"
            echo ""
            echo "Commands:"
            echo "  scan <file> [rulepack] [retries]  - Scan a single file"
            echo "  batch <dir> [pattern] [rulepack]  - Batch scan directory"
            echo "  monitor <file> [rulepack] [severity] - Monitor file for violations"
            echo "  test <string> [rulepack]          - Test a string"
            echo ""
            echo "Environment variables:"
            echo "  PROMPTSHIELD_RULEPACK - Default rulepack"
            echo "  PROMPTSHIELD_OUTPUT   - Default output format"
            echo "  PROMPTSHIELD_PARALLEL - Enable parallel processing"
            echo "  PROMPTSHIELD_WORKERS  - Number of workers"
            exit 1
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

## 🌐 HTTP API

### Starting the API Server

```bash
# Start API server (if available)
promptshield serve --port 3000 --host 0.0.0.0

# Or with custom configuration
promptshield serve \
  --port 3000 \
  --host 0.0.0.0 \
  --rulepack rulepacks/pii.yaml \
  --cors \
  --rate-limit 100
```

### API Endpoints

#### POST /api/v1/scan

Scan a file or content for violations.

**Request:**

```json
{
  "content": "My email is test@example.com",
  "rulepack": "rulepacks/pii.yaml",
  "severity": "critical,high",
  "category": "pii"
}
```

**Response:**

```json
{
  "success": true,
  "violations": [
    {
      "ruleId": "email",
      "severity": "high",
      "category": "pii",
      "match": "test@example.com",
      "position": 15
    }
  ],
  "totalViolations": 1,
  "metadata": {
    "scanDate": "2025-01-15T10:30:00Z",
    "processingTime": 150
  }
}
```

#### POST /api/v1/test

Test a string for violations.

**Request:**

```json
{
  "text": "Contact me at admin@company.com",
  "rulepack": "rulepacks/pii.yaml"
}
```

#### GET /api/v1/rulepacks

List available RulePacks.

**Response:**

```json
{
  "rulepacks": [
    {
      "name": "PII Detection",
      "description": "Detects personally identifiable information",
      "rules": 10,
      "category": "pii"
    }
  ]
}
```

#### POST /api/v1/validate

Validate a RulePack.

**Request:**

```json
{
  "rulepack": {
    "version": "1.0.0",
    "name": "My Rules",
    "rules": [...]
  }
}
```

### API Client Examples

#### Node.js Client

```javascript
const axios = require('axios');

class PromptShieldAPI {
  constructor(baseURL = 'http://localhost:3000') {
    this.client = axios.create({
      baseURL: `${baseURL}/api/v1`,
      timeout: 30000,
    });
  }

  async scanContent(content, options = {}) {
    try {
      const response = await this.client.post('/scan', {
        content,
        ...options,
      });
      return response.data;
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  async testString(text, rulepack = null) {
    try {
      const response = await this.client.post('/test', {
        text,
        rulepack,
      });
      return response.data;
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  async listRulePacks() {
    try {
      const response = await this.client.get('/rulepacks');
      return response.data;
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }
}

// Usage
async function main() {
  const api = new PromptShieldAPI();

  try {
    // Scan content
    const result = await api.scanContent('My email is test@example.com', {
      rulepack: 'rulepacks/pii.yaml',
      severity: 'critical,high',
    });

    console.log(`Found ${result.totalViolations} violations`);

    // List RulePacks
    const rulepacks = await api.listRulePacks();
    console.log('Available RulePacks:', rulepacks.rulepacks);
  } catch (error) {
    console.error('API error:', error.message);
  }
}
```

#### Python Client

```python
import requests
import json
from typing import Dict, Optional

class PromptShieldAPI:
    def __init__(self, base_url: str = 'http://localhost:3000'):
        self.base_url = f"{base_url}/api/v1"
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json'
        })

    def scan_content(self, content: str, rulepack: Optional[str] = None,
                    severity: Optional[str] = None, category: Optional[str] = None) -> Dict:
        """Scan content for violations."""
        try:
            payload = {'content': content}

            if rulepack:
                payload['rulepack'] = rulepack
            if severity:
                payload['severity'] = severity
            if category:
                payload['category'] = category

            response = self.session.post(f"{self.base_url}/scan", json=payload)
            response.raise_for_status()

            return response.json()
        except requests.RequestException as e:
            raise Exception(f"API request failed: {e}")

    def test_string(self, text: str, rulepack: Optional[str] = None) -> Dict:
        """Test a string for violations."""
        try:
            payload = {'text': text}
            if rulepack:
                payload['rulepack'] = rulepack

            response = self.session.post(f"{self.base_url}/test", json=payload)
            response.raise_for_status()

            return response.json()
        except requests.RequestException as e:
            raise Exception(f"API request failed: {e}")

    def list_rulepacks(self) -> Dict:
        """List available RulePacks."""
        try:
            response = self.session.get(f"{self.base_url}/rulepacks")
            response.raise_for_status()

            return response.json()
        except requests.RequestException as e:
            raise Exception(f"API request failed: {e}")

# Usage
def main():
    api = PromptShieldAPI()

    try:
        # Scan content
        result = api.scan_content(
            "My email is test@example.com",
            rulepack="rulepacks/pii.yaml",
            severity="critical,high"
        )

        print(f"Found {result['totalViolations']} violations")

        # List RulePacks
        rulepacks = api.list_rulepacks()
        print("Available RulePacks:", rulepacks['rulepacks'])

    except Exception as e:
        print(f"API error: {e}")

if __name__ == '__main__':
    main()
```

## ⚙️ Configuration

### Environment Variables

```bash
# Default RulePack
export PROMPTSHIELD_RULEPACK="rulepacks/security.yaml"

# Output format
export PROMPTSHIELD_OUTPUT="json"

# Performance settings
export PROMPTSHIELD_PARALLEL="true"
export PROMPTSHIELD_WORKERS="4"

# Memory settings
export PROMPTSHIELD_MEMORY_THRESHOLD="0.8"
export PROMPTSHIELD_STREAMING_THRESHOLD="100"

# API settings
export PROMPTSHIELD_API_HOST="0.0.0.0"
export PROMPTSHIELD_API_PORT="3000"
```

### Configuration Files

```yaml
# ~/.promptshield/config.yaml
defaults:
  rulepack: 'rulepacks/pii.yaml'
  output: 'json'
  parallel: true
  workers: 4

performance:
  memory_threshold: 0.8
  streaming_threshold: 100
  batch_size: 10

api:
  host: '0.0.0.0'
  port: 3000
  cors: true
  rate_limit: 100

logging:
  level: 'info'
  format: 'json'
```

## 🚨 Error Handling

### Common Error Types

```javascript
// Node.js error handling
class PromptShieldError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'PromptShieldError';
    this.code = code;
    this.details = details;
  }
}

function handleError(error) {
  switch (error.code) {
    case 'ENOENT':
      throw new PromptShieldError('File not found', 'FILE_NOT_FOUND', {
        path: error.path,
      });
    case 'EACCES':
      throw new PromptShieldError('Permission denied', 'PERMISSION_DENIED', {
        path: error.path,
      });
    case 'ENOMEM':
      throw new PromptShieldError('Out of memory', 'MEMORY_ERROR');
    default:
      throw new PromptShieldError('Unknown error', 'UNKNOWN_ERROR', {
        original: error,
      });
  }
}
```

```python
# Python error handling
class PromptShieldError(Exception):
    def __init__(self, message, code, details=None):
        super().__init__(message)
        self.code = code
        self.details = details or {}

def handle_error(error):
    if isinstance(error, FileNotFoundError):
        raise PromptShieldError("File not found", "FILE_NOT_FOUND", {"path": error.filename})
    elif isinstance(error, PermissionError):
        raise PromptShieldError("Permission denied", "PERMISSION_DENIED", {"path": error.filename})
    elif isinstance(error, MemoryError):
        raise PromptShieldError("Out of memory", "MEMORY_ERROR")
    else:
        raise PromptShieldError("Unknown error", "UNKNOWN_ERROR", {"original": str(error)})
```

## 📚 Examples

### CI/CD Integration

```yaml
# GitHub Actions
name: Security Scan
on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install PromptShield
        run: npm install -g promptshield

      - name: Run Security Scan
        run: |
          promptshield scan . \
            --rulepack rulepacks/security.yaml \
            --fail-on critical \
            --output json \
            --output-file security-report.json

      - name: Upload Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: security-report
          path: security-report.json
```

```yaml
# GitLab CI
security_scan:
  stage: test
  image: node:18
  before_script:
    - npm install -g promptshield
  script:
    - promptshield scan src/ --rulepack rulepacks/security.yaml --fail-on critical
  artifacts:
    reports:
      security: security-report.json
    paths:
      - security-report.json
    expire_in: 1 week
```

### Docker Integration

```dockerfile
# Dockerfile
FROM node:18-alpine

# Install PromptShield
RUN npm install -g promptshield

# Copy application
COPY . /app
WORKDIR /app

# Run security scan
RUN promptshield scan /app/data \
  --rulepack /app/rulepacks/security.yaml \
  --fail-on critical \
  --output json \
  --output-file /app/security-report.json

# Continue with application build
RUN npm install
RUN npm run build
```

### Kubernetes Integration

```yaml
# k8s-security-scan.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: security-scan
spec:
  template:
    spec:
      containers:
        - name: scanner
          image: promptshield:latest
          command: ['promptshield']
          args:
            [
              'scan',
              '/data',
              '--rulepack',
              '/rules/security.yaml',
              '--output',
              'json',
            ]
          volumeMounts:
            - name: data-volume
              mountPath: /data
            - name: rules-volume
              mountPath: /rules
      volumes:
        - name: data-volume
          persistentVolumeClaim:
            claimName: data-pvc
        - name: rules-volume
          configMap:
            name: security-rules
      restartPolicy: Never
```

---

**🔌 Ready to integrate PromptShield into your applications!**

For more information, see:

- [User Guide](USER_GUIDE.md) - Complete usage guide
- [CLI Reference](CLI_REFERENCE.md) - Command documentation
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Solve common issues
