# PromptShield Integration Guide

_Complete guide for integrating PromptShield into your development workflow_

## 🚀 CI/CD Integration

### GitHub Actions

#### Basic Security Scan

```yaml
name: AI Security Scan
on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'

      - name: Install PromptShield
        run: npm install -g promptshield

      - name: Run Security Scan
        run: |
          promptshield scan . \
            --rulepack rulepacks/prompt-injection.yaml \
            --fail-on high \
            --output-file scan-report.json

      - name: Upload Security Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: security-report
          path: scan-report.json
```

#### Multi-Stage Security Pipeline

```yaml
name: Comprehensive Security Pipeline
on: [push, pull_request]

jobs:
  prompt-injection-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install PromptShield
        run: npm install -g promptshield
      - name: Scan for Prompt Injection
        run: |
          promptshield scan src/ \
            --rulepack rulepacks/prompt-injection.yaml \
            --fail-on critical \
            --output json \
            --output-file injection-report.json

  pii-compliance-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install PromptShield
        run: npm install -g promptshield
      - name: Scan for PII Violations
        run: |
          promptshield scan data/ \
            --rulepack rulepacks/pii.yaml \
            --fail-on high \
            --output html \
            --output-file pii-report.html

  generate-dashboard:
    needs: [prompt-injection-scan, pii-compliance-scan]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Download Reports
        uses: actions/download-artifact@v3
      - name: Generate Combined Dashboard
        run: |
          # Custom script to combine reports
          node scripts/combine-reports.js
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - security

security-scan:
  stage: security
  image: node:16-alpine
  before_script:
    - npm install -g promptshield
  script:
    - |
      promptshield scan . \
        --rulepack rulepacks/security.yaml \
        --fail-on critical \
        --output json \
        --output-file security-report.json
  artifacts:
    reports:
      junit: security-report.json
    paths:
      - security-report.json
    expire_in: 1 week
  only:
    - merge_requests
    - main
```

### Azure DevOps

```yaml
# azure-pipelines.yml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '16.x'
    displayName: 'Install Node.js'

  - script: |
      npm install -g promptshield
    displayName: 'Install PromptShield'

  - script: |
      promptshield scan . \
        --rulepack rulepacks/prompt-injection.yaml \
        --fail-on high \
        --output json \
        --output-file $(Agent.TempDirectory)/security-report.json
    displayName: 'Run Security Scan'

  - task: PublishTestResults@2
    inputs:
      testResultsFormat: 'JUnit'
      testResultsFiles: '$(Agent.TempDirectory)/security-report.json'
    condition: always()
```

### Jenkins

```groovy
pipeline {
    agent any

    tools {
        nodejs "16"
    }

    stages {
        stage('Install PromptShield') {
            steps {
                sh 'npm install -g promptshield'
            }
        }

        stage('Security Scan') {
            steps {
                sh '''
                    promptshield scan . \
                        --rulepack rulepacks/security.yaml \
                        --fail-on critical \
                        --output json \
                        --output-file security-report.json
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'security-report.json'
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: '.',
                        reportFiles: 'security-report.json',
                        reportName: 'Security Report'
                    ])
                }
            }
        }
    }
}
```

## 💻 Programming Language Integration

### Node.js / JavaScript

#### Basic Integration

```javascript
const { execSync } = require('child_process');
const fs = require('fs');

class PromptShieldScanner {
  constructor(rulepack = 'rulepacks/pii.yaml') {
    this.rulepack = rulepack;
  }

  async scanText(text) {
    try {
      const result = execSync(
        `echo '${JSON.stringify({ prompt: text })}' | promptshield scan - --rulepack ${this.rulepack} --output json`,
        { encoding: 'utf8' }
      );
      return JSON.parse(result);
    } catch (error) {
      throw new Error(`Scan failed: ${error.message}`);
    }
  }

  async scanFile(filePath) {
    try {
      const result = execSync(
        `promptshield scan "${filePath}" --rulepack ${this.rulepack} --output json`,
        { encoding: 'utf8' }
      );
      return JSON.parse(result);
    } catch (error) {
      throw new Error(`File scan failed: ${error.message}`);
    }
  }

  hasViolations(report, minSeverity = 'high') {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const threshold = severityLevels[minSeverity];

    return report.violations.some(
      (v) => severityLevels[v.severity] >= threshold
    );
  }
}

// Usage
const scanner = new PromptShieldScanner();

// Scan user input
const userPrompt = 'My email is test@example.com';
const report = await scanner.scanText(userPrompt);

if (scanner.hasViolations(report, 'medium')) {
  console.log('⚠️ Security violations detected!');
  report.violations.forEach((v) => {
    console.log(`${v.severity}: ${v.match}`);
  });
}
```

#### Express.js Middleware

```javascript
const express = require('express');
const { execSync } = require('child_process');

function promptShieldMiddleware(options = {}) {
  const rulepack = options.rulepack || 'rulepacks/prompt-injection.yaml';
  const failOnSeverity = options.failOnSeverity || 'critical';

  return async (req, res, next) => {
    try {
      // Scan request body for violations
      const scanData = JSON.stringify(req.body);
      const result = execSync(
        `echo '${scanData}' | promptshield scan - --rulepack ${rulepack} --output json`,
        { encoding: 'utf8' }
      );

      const report = JSON.parse(result);

      // Check for violations above threshold
      const hasHighSeverityViolations = report.violations.some(
        (v) =>
          ['critical', 'high'].includes(v.severity) &&
          (failOnSeverity === 'high' || v.severity === 'critical')
      );

      if (hasHighSeverityViolations) {
        return res.status(400).json({
          error: 'Content violates security policies',
          violations: report.violations,
        });
      }

      // Add scan results to request for logging
      req.securityScan = report;
      next();
    } catch (error) {
      console.error('Security scan failed:', error);
      next(); // Continue on scan failure (adjust based on your needs)
    }
  };
}

// Usage
const app = express();
app.use(express.json());
app.use('/api/ai', promptShieldMiddleware({ failOnSeverity: 'high' }));

app.post('/api/ai/chat', (req, res) => {
  // Process the request - it has already been scanned
  console.log('Security scan:', req.securityScan);
  res.json({ message: 'Processing...' });
});
```

### Python

#### Basic Integration

```python
import subprocess
import json
import tempfile
from typing import Dict, List, Optional

class PromptShieldScanner:
    def __init__(self, rulepack: str = "rulepacks/pii.yaml"):
        self.rulepack = rulepack

    def scan_text(self, text: str) -> Dict:
        """Scan a text string for violations."""
        try:
            # Create temporary file with the text
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump({"prompt": text}, f)
                temp_file = f.name

            # Run scan
            result = subprocess.run([
                'promptshield', 'scan', temp_file,
                '--rulepack', self.rulepack,
                '--output', 'json'
            ], capture_output=True, text=True, check=True)

            return json.loads(result.stdout)

        except subprocess.CalledProcessError as e:
            raise Exception(f"Scan failed: {e.stderr}")
        finally:
            # Clean up temp file
            import os
            os.unlink(temp_file)

    def scan_file(self, file_path: str) -> Dict:
        """Scan a file for violations."""
        try:
            result = subprocess.run([
                'promptshield', 'scan', file_path,
                '--rulepack', self.rulepack,
                '--output', 'json'
            ], capture_output=True, text=True, check=True)

            return json.loads(result.stdout)

        except subprocess.CalledProcessError as e:
            raise Exception(f"File scan failed: {e.stderr}")

    def has_violations(self, report: Dict, min_severity: str = "high") -> bool:
        """Check if report has violations above minimum severity."""
        severity_levels = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        threshold = severity_levels[min_severity]

        return any(
            severity_levels.get(v["severity"], 0) >= threshold
            for v in report.get("violations", [])
        )

# Usage example
scanner = PromptShieldScanner()

def process_user_input(user_text: str) -> Dict:
    """Process user input with security scanning."""
    # Scan for security violations
    report = scanner.scan_text(user_text)

    if scanner.has_violations(report, "medium"):
        return {
            "status": "rejected",
            "reason": "Content violates security policies",
            "violations": report["violations"]
        }

    # Process the input...
    return {
        "status": "accepted",
        "scan_summary": f"Scanned: {report['totalViolations']} violations found"
    }
```

#### Django Integration

```python
# middleware.py
import json
import subprocess
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

class PromptShieldMiddleware(MiddlewareMixin):
    def __init__(self, get_response=None):
        super().__init__(get_response)
        self.rulepack = "rulepacks/prompt-injection.yaml"

    def process_request(self, request):
        # Only scan AI-related endpoints
        if not request.path.startswith('/api/ai/'):
            return None

        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                # Parse request body
                body = json.loads(request.body.decode('utf-8'))

                # Create scan data
                scan_data = json.dumps(body)

                # Run security scan
                result = subprocess.run([
                    'promptshield', 'test', scan_data,
                    '--rulepack', self.rulepack,
                    '--output', 'json'
                ], capture_output=True, text=True)

                if result.returncode == 0:
                    report = json.loads(result.stdout)

                    # Check for critical violations
                    critical_violations = [
                        v for v in report.get('violations', [])
                        if v['severity'] in ['critical', 'high']
                    ]

                    if critical_violations:
                        return JsonResponse({
                            'error': 'Content violates security policies',
                            'violations': critical_violations
                        }, status=400)

            except Exception as e:
                # Log error but don't block request
                print(f"Security scan error: {e}")

        return None
```

#### FastAPI Integration

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.base import BaseHTTPMiddleware
import subprocess
import json

class PromptShieldMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, rulepack: str = "rulepacks/security.yaml"):
        super().__init__(app)
        self.rulepack = rulepack

    async def dispatch(self, request: Request, call_next):
        # Scan AI endpoints
        if request.url.path.startswith("/ai/"):
            if request.method in ["POST", "PUT", "PATCH"]:
                body = await request.body()

                try:
                    # Scan request content
                    result = subprocess.run([
                        'promptshield', 'test', body.decode(),
                        '--rulepack', self.rulepack,
                        '--output', 'json',
                        '--fail-on', 'high'
                    ], capture_output=True, text=True)

                    if result.returncode != 0:
                        report = json.loads(result.stdout) if result.stdout else {}
                        raise HTTPException(
                            status_code=400,
                            detail={
                                "message": "Content violates security policies",
                                "violations": report.get("violations", [])
                            }
                        )

                except subprocess.CalledProcessError:
                    pass  # Continue on scan errors

        response = await call_next(request)
        return response

# Usage
app = FastAPI()
app.add_middleware(PromptShieldMiddleware, rulepack="rulepacks/prompt-injection.yaml")
```

### Go

```go
package main

import (
    "encoding/json"
    "fmt"
    "os/exec"
    "strings"
)

type PromptShieldScanner struct {
    Rulepack string
}

type ScanReport struct {
    TotalViolations int         `json:"totalViolations"`
    Violations      []Violation `json:"violations"`
}

type Violation struct {
    RuleID    string `json:"ruleId"`
    Severity  string `json:"severity"`
    Category  string `json:"category"`
    Match     string `json:"match"`
}

func NewScanner(rulepack string) *PromptShieldScanner {
    return &PromptShieldScanner{Rulepack: rulepack}
}

func (ps *PromptShieldScanner) ScanText(text string) (*ScanReport, error) {
    cmd := exec.Command("promptshield", "test", text,
        "--rulepack", ps.Rulepack,
        "--output", "json")

    output, err := cmd.Output()
    if err != nil {
        return nil, fmt.Errorf("scan failed: %v", err)
    }

    var report ScanReport
    err = json.Unmarshal(output, &report)
    if err != nil {
        return nil, fmt.Errorf("failed to parse scan result: %v", err)
    }

    return &report, nil
}

func (ps *PromptShieldScanner) HasHighSeverityViolations(report *ScanReport) bool {
    for _, violation := range report.Violations {
        if violation.Severity == "critical" || violation.Severity == "high" {
            return true
        }
    }
    return false
}

// HTTP middleware example
func PromptShieldMiddleware(rulepack string) func(http.Handler) http.Handler {
    scanner := NewScanner(rulepack)

    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            if strings.HasPrefix(r.URL.Path, "/api/ai/") && r.Method == "POST" {
                // Read and scan request body
                body, _ := ioutil.ReadAll(r.Body)
                r.Body = ioutil.NopCloser(strings.NewReader(string(body)))

                report, err := scanner.ScanText(string(body))
                if err == nil && scanner.HasHighSeverityViolations(report) {
                    http.Error(w, "Content violates security policies", http.StatusBadRequest)
                    return
                }
            }

            next.ServeHTTP(w, r)
        })
    }
}
```

## 🐳 Docker Integration

### Dockerfile Examples

#### Security Scanner Image

```dockerfile
FROM node:16-alpine

# Install PromptShield
RUN npm install -g promptshield

# Copy rulepacks
COPY rulepacks/ /app/rulepacks/

# Set working directory
WORKDIR /app

# Add scan script
COPY scripts/scan.sh /app/scan.sh
RUN chmod +x /app/scan.sh

# Run security scan
ENTRYPOINT ["/app/scan.sh"]
```

#### Multi-stage Build with Security Check

```dockerfile
# Build stage
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install

# Security scan stage
FROM node:16-alpine AS security-scanner
RUN npm install -g promptshield
COPY --from=builder /app /app
COPY rulepacks/ /app/rulepacks/
WORKDIR /app

# Run security scans
RUN promptshield scan . \
    --rulepack rulepacks/prompt-injection.yaml \
    --fail-on critical

RUN promptshield scan data/ \
    --rulepack rulepacks/pii.yaml \
    --fail-on high \
    --output-file /tmp/pii-report.json

# Production stage
FROM node:16-alpine AS production
WORKDIR /app
COPY --from=builder /app .
COPY --from=security-scanner /tmp/pii-report.json ./reports/
EXPOSE 3000
CMD ["npm", "start"]
```

#### Security Gateway Container

```dockerfile
FROM node:16-alpine

RUN npm install -g promptshield

COPY rulepacks/ /rulepacks/
COPY gateway.js /app/

WORKDIR /app

EXPOSE 8080

CMD ["node", "gateway.js"]
```

### Docker Compose with Security Scanning

```yaml
version: '3.8'

services:
  security-scanner:
    build:
      context: .
      dockerfile: Dockerfile.scanner
    volumes:
      - ./data:/data:ro
      - ./reports:/reports
    environment:
      - RULEPACK=rulepacks/security.yaml
      - OUTPUT_DIR=/reports
    command: |
      sh -c "
        promptshield scan /data \
          --rulepack $$RULEPACK \
          --output html \
          --output-file $$OUTPUT_DIR/security-report.html
      "

  app:
    build: .
    depends_on:
      - security-scanner
    ports:
      - '3000:3000'
    environment:
      - SECURITY_REPORT_PATH=/reports/security-report.html
    volumes:
      - ./reports:/reports:ro
```

## ☁️ Cloud Integration

### AWS Lambda

```javascript
// lambda-security-scanner.js
const { execSync } = require('child_process');
const AWS = require('aws-sdk');

exports.handler = async (event) => {
  try {
    // Extract content to scan
    const content = event.body || event.content;

    // Create temporary file
    const fs = require('fs');
    const tempFile = `/tmp/scan-${Date.now()}.json`;
    fs.writeFileSync(tempFile, JSON.stringify({ prompt: content }));

    // Run scan
    const result = execSync(
      `promptshield scan ${tempFile} --rulepack /opt/rulepacks/security.yaml --output json`,
      { encoding: 'utf8' }
    );

    const report = JSON.parse(result);

    // Check for violations
    const hasViolations = report.violations.some((v) =>
      ['critical', 'high'].includes(v.severity)
    );

    return {
      statusCode: hasViolations ? 400 : 200,
      body: JSON.stringify({
        secure: !hasViolations,
        report: report,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Security scan failed',
        message: error.message,
      }),
    };
  }
};
```

### Google Cloud Functions

```python
import functions_framework
import subprocess
import json
import tempfile

@functions_framework.http
def scan_content(request):
    """Cloud Function to scan content for security violations."""

    if request.method != 'POST':
        return {'error': 'Only POST method allowed'}, 405

    try:
        # Get content from request
        content = request.get_json().get('content', '')

        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump({'prompt': content}, f)
            temp_file = f.name

        # Run security scan
        result = subprocess.run([
            'promptshield', 'scan', temp_file,
            '--rulepack', 'rulepacks/prompt-injection.yaml',
            '--output', 'json'
        ], capture_output=True, text=True, check=True)

        report = json.loads(result.stdout)

        # Determine if content is safe
        has_critical = any(v['severity'] in ['critical', 'high']
                          for v in report.get('violations', []))

        return {
            'secure': not has_critical,
            'violations': report.get('violations', []),
            'totalViolations': report.get('totalViolations', 0)
        }

    except Exception as e:
        return {'error': str(e)}, 500
```

### Azure Functions

```csharp
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Diagnostics;
using System.Text.Json;

public class SecurityScanner
{
    [Function("ScanContent")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequestData req)
    {
        try
        {
            // Read request content
            var content = await req.ReadAsStringAsync();
            var requestData = JsonSerializer.Deserialize<dynamic>(content);

            // Create temp file
            var tempFile = Path.GetTempFileName();
            await File.WriteAllTextAsync(tempFile, JsonSerializer.Serialize(requestData));

            // Run security scan
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "promptshield",
                    Arguments = $"scan {tempFile} --rulepack rulepacks/security.yaml --output json",
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            process.Start();
            var result = await process.StandardOutput.ReadToEndAsync();
            await process.WaitForExitAsync();

            // Parse and return results
            var report = JsonSerializer.Deserialize<dynamic>(result);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(report);

            return response;
        }
        catch (Exception ex)
        {
            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteStringAsync($"Error: {ex.Message}");
            return errorResponse;
        }
    }
}
```

## 🔗 API Gateway Integration

### AWS API Gateway with Lambda

```yaml
# serverless.yml
service: promptshield-api

provider:
  name: aws
  runtime: nodejs16.x

functions:
  securityScan:
    handler: handler.scan
    events:
      - http:
          path: scan
          method: post
          cors: true
    layers:
      - arn:aws:lambda:us-east-1:123456789:layer:promptshield:1

plugins:
  - serverless-offline

custom:
  serverless-offline:
    httpPort: 3001
```

### Kong Plugin

```lua
-- kong-promptshield-plugin.lua
local PromptShieldPlugin = {
  PRIORITY = 1000,
  VERSION = "1.0.0",
}

function PromptShieldPlugin:access(conf)
  local body = kong.request.get_raw_body()

  if body then
    -- Write to temp file
    local temp_file = "/tmp/kong-scan-" .. ngx.now()
    local file = io.open(temp_file, "w")
    file:write(body)
    file:close()

    -- Run scan
    local handle = io.popen("promptshield scan " .. temp_file .. " --output json --rulepack " .. conf.rulepack)
    local result = handle:read("*a")
    handle:close()

    -- Parse result
    local cjson = require "cjson"
    local report = cjson.decode(result)

    -- Check for violations
    for _, violation in ipairs(report.violations or {}) do
      if violation.severity == "critical" or violation.severity == "high" then
        kong.response.exit(400, {
          error = "Content violates security policies",
          violations = report.violations
        })
      end
    end

    -- Clean up
    os.remove(temp_file)
  end
end

return PromptShieldPlugin
```

## 📊 Monitoring & Observability

### Prometheus Metrics

```javascript
// prometheus-metrics.js
const promClient = require('prom-client');
const { execSync } = require('child_process');

// Define metrics
const scanCounter = new promClient.Counter({
  name: 'promptshield_scans_total',
  help: 'Total number of security scans performed',
  labelNames: ['rulepack', 'status'],
});

const violationCounter = new promClient.Counter({
  name: 'promptshield_violations_total',
  help: 'Total number of violations found',
  labelNames: ['severity', 'category', 'rule_id'],
});

const scanDuration = new promClient.Histogram({
  name: 'promptshield_scan_duration_seconds',
  help: 'Duration of security scans',
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

function recordScanMetrics(rulepack, content) {
  const startTime = Date.now();

  try {
    // Run scan
    const result = execSync(
      `echo '${JSON.stringify({ prompt: content })}' | promptshield scan - --rulepack ${rulepack} --output json`,
      { encoding: 'utf8' }
    );

    const report = JSON.parse(result);
    const duration = (Date.now() - startTime) / 1000;

    // Record metrics
    scanCounter.inc({ rulepack, status: 'success' });
    scanDuration.observe(duration);

    report.violations.forEach((violation) => {
      violationCounter.inc({
        severity: violation.severity,
        category: violation.category,
        rule_id: violation.ruleId,
      });
    });

    return report;
  } catch (error) {
    scanCounter.inc({ rulepack, status: 'error' });
    throw error;
  }
}

// Export metrics endpoint
function metricsHandler(req, res) {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
}

module.exports = { recordScanMetrics, metricsHandler };
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "PromptShield Security Dashboard",
    "panels": [
      {
        "title": "Scan Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(promptshield_scans_total[5m])",
            "legendFormat": "Scans per second"
          }
        ]
      },
      {
        "title": "Violation Distribution",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum by (severity) (promptshield_violations_total)",
            "legendFormat": "{{severity}}"
          }
        ]
      },
      {
        "title": "Top Violated Rules",
        "type": "table",
        "targets": [
          {
            "expr": "topk(10, sum by (rule_id) (promptshield_violations_total))",
            "format": "table"
          }
        ]
      }
    ]
  }
}
```

---

**For more integration examples and troubleshooting, see the [main documentation](../README.md).**
