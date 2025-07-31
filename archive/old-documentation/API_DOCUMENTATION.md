# PromptShield API Documentation

## Overview

The PromptShield API provides REST endpoints for AI security scanning. It wraps the PromptShield CLI tool to enable programmatic access to security scanning capabilities.

**Base URL:** `http://localhost:3000`
**Content-Type:** `application/json`

---

## Authentication

Currently, the API does not require authentication. Future versions will support API key authentication.

---

## Endpoints

### Health Check

**GET** `/health`

Check if the API is running and healthy.

**Response:**

```json
{
  status": "healthy,
 version": "1.00,
  timestamp: 20250115T10:300Z"
}
```

**Status Codes:**

- `200` - API is healthy
- `503` - API is unhealthy

---

### Scan Content

**POST** `/scan`

Scan JSON content for security violations using specified rules.

**Request Body:**

```json[object Object]content: [
   [object Object]
   prompt": "User input text,
   response":AI response text",
context":Optional context"
    }
  ],
  rulepack": "rulepacks/pii.yaml,  options:[object Object]severity": ["critical", "high"],
category: ["security", "pii"],
    fields": ["prompt", response"],
    output_format": json"
  }
}
```

**Parameters:**

- `content` (array, required) - Array of objects to scan
- `rulepack` (string, required) - Path to rulepack file
- `options` (object, optional) - Scanning options

**Response:**

```json
[object Object] scan_date: 2025015T1000,
  files_scanned": 1,
 total_violations: 3,severity_breakdown: [object Object]
    critical: 1  high": 2
    medium:0   low": 0
  },
violations: [
    [object Object]     rule_id": "email",
   message": "Detects email addresses",
   match":john@example.com,
     severity: ,
    category": "pii",
     object_index:0,
      field: "prompt"
    }
  ]
}
```

**Status Codes:**

- `200` - Scan completed successfully
- `400` - Invalid request (missing content or rulepack)
- `500` - Internal server error

---

### Test Text

**POST** `/test`

Test a single text string against rules.

**Request Body:**

```json
{
 text": My email is john@example.com, rulepack": "rulepacks/pii.yaml,  options:[object Object]    severity": ["high", "medium"],
   category": [pii"]
  }
}
```

**Parameters:**

- `text` (string, required) - Text to test
- `rulepack` (string, required) - Path to rulepack file
- `options` (object, optional) - Testing options

**Response:**

````json
{
 text": My email is john@example.com, rulepack": "rulepacks/pii.yaml,violations: [
    [object Object]     rule_id": "email",
   message": "Detects email addresses",
   match":john@example.com,
     severity: ,
      category": pii"
    }
  ],
 total_violations":1``

**Status Codes:**
- `200` - Test completed successfully
- `400` - Invalid request (missing text or rulepack)
- `500` - Internal server error

---

### List Available Rules

**GET** `/rules`

List available rules in a rulepack.

**Query Parameters:**
- `rulepack` (string, required) - Path to rulepack file
- `enabled_only` (boolean, optional) - Show only enabled rules
- `category` (string, optional) - Filter by category
- `severity` (string, optional) - Filter by severity

**Response:**
```json[object Object] rulepack": "rulepacks/pii.yaml",
 rules:
 [object Object]   id": "email",
    description": "Detects email addresses,
     severity: ,
    category": "pii",
    enabled": true
    }
  ],
  total_rules: 5,
  enabled_rules":4``

**Status Codes:**
- `20isted successfully
- `40- Invalid rulepack path
- `500` - Internal server error

---

## Error Responses

All endpoints return errors in the following format:

```json
{error": "Error message description",
  "code:ERROR_CODE",
  timestamp: 20250115T10:300Z"
}
````

**Common Error Codes:**

- `INVALID_REQUEST` - Missing required parameters
- `INVALID_RULEPACK` - Rulepack file not found or invalid
- `SCAN_FAILED` - Scanning process failed
- `INTERNAL_ERROR` - Unexpected server error

---

## Rate Limiting

Currently, the API does not implement rate limiting. Future versions will include:

- 100 requests per minute per IP
  -1000 requests per hour per IP

---

## Usage Examples

### JavaScript/Node.js

```javascript
const PromptShieldAPI = [object Object] baseURL: http://localhost:3000,async scan(content, rulepack, options = {}) {
    const response = await fetch(`${this.baseURL}/scan`,[object Object]     method: 'POST',
      headers:[object Object]Content-Type': application/json' },
      body: JSON.stringify({ content, rulepack, options })
    });
    return response.json();
  },

  async test(text, rulepack, options = {}) {
    const response = await fetch(`${this.baseURL}/test`,[object Object]     method: 'POST',
      headers:[object Object]Content-Type': application/json' },
      body: JSON.stringify({ text, rulepack, options })
    });
    return response.json();
  }
};

// Usage
const violations = await PromptShieldAPI.scan(
  [{ prompt:test, response: test}],
  "rulepacks/pii.yaml"
);
```

### Python

```python
import requests
import json

class PromptShieldAPI:
    def __init__(self, base_url=http://localhost:300
        self.base_url = base_url

    def scan(self, content, rulepack, options=None):
        response = requests.post(
            f"{self.base_url}/scan",
            json={content": content, "rulepack": rulepack, options: options or {}}
        )
        return response.json()

    def test(self, text, rulepack, options=None):
        response = requests.post(
            f"{self.base_url}/test",
            json={"text: text, "rulepack": rulepack, options: options or {}}
        )
        return response.json()

# Usage
api = PromptShieldAPI()
violations = api.scan(
   {"prompt":test",response: test"}],
rulepacks/pii.yaml"
)
```

### cURL

```bash
# Scan content
curl -X POST http://localhost:3000an \
  -H "Content-Type: application/json" \
  -d[object Object]    content":{"prompt":test",response: test}],
    rulepack": "rulepacks/pii.yaml"
  }'

# Test text
curl -X POST http://localhost:3000st \
  -H "Content-Type: application/json" \
  -d {text": My email is john@example.com,
    rulepack": "rulepacks/pii.yaml"
  }'
```

---

## Docker Deployment

```bash
# Build and run
docker build -t promptshield-api .
docker run -p 3000:3000promptshield-api

# With Docker Compose
docker-compose up -d
```

---

## Versioning

API versioning will be implemented in future releases. Current version is `1.0.0`.

---

## Support

For API support and questions, contact the PromptShield team.
