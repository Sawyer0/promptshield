# Output Renderers

PromptShield provides a flexible output renderer system that supports multiple formats for scan results. Each renderer implements a consistent interface and can be easily extended or customized.

## Supported Formats

### JSON (`json`)

- **Extension**: `.json`
- **MIME Type**: `application/json`
- **Streaming**: ❌ (requires complete data)
- **Use Case**: API integration, data processing, programmatic access

**Features:**

- Structured data with metadata
- Complete violation details
- Summary statistics
- Machine-readable format

**Example:**

```json
{
  "metadata": {
    "scanDate": "2024-01-15T10:30:00.000Z",
    "fileCount": 1,
    "totalViolations": 2,
    "severityBreakdown": { "high": 1, "medium": 1 },
    "categoryBreakdown": { "pii": 1, "bias": 1 }
  },
  "results": [...],
  "summary": {...}
}
```

### Markdown (`markdown`)

- **Extension**: `.md`
- **MIME Type**: `text/markdown`
- **Streaming**: ✅
- **Use Case**: Documentation, GitHub issues, human-readable reports

**Features:**

- Rich formatting with headers and sections
- Severity icons and color coding
- Summary breakdowns
- Context information (line numbers, object indices)

**Example:**

```markdown
# PromptShield Scan Report

**Scan Date:** 2024-01-15T10:30:00.000Z
**Files Scanned:** 1
**Total Violations:** 2

## Summary

### Severity Breakdown

- 🔴 **high:** 1 violations
- 🟡 **medium:** 1 violations

## Results

### File: test.json

- 🔴 **[HIGH]** `pii-email` (pii): Potential PII detected
  - **Match:** `john.doe@example.com` [Object 0, field: email]
```

### CSV (`csv`)

- **Extension**: `.csv`
- **MIME Type**: `text/csv`
- **Streaming**: ✅
- **Use Case**: Spreadsheet analysis, data export, bulk processing

**Features:**

- Tabular format for easy analysis
- All violation details in columns
- Summary statistics included
- Compatible with Excel, Google Sheets, etc.

**Example:**

```csv
File,Rule ID,Severity,Category,Message,Match,Object Index,Field,Line Number,Scan Date
test.json,pii-email,high,pii,Potential PII detected,john.doe@example.com,0,email,,2024-01-15T10:30:00.000Z
```

### Table (`table`)

- **Extension**: `.txt`
- **MIME Type**: `text/plain`
- **Streaming**: ✅
- **Use Case**: Terminal display, simple text reports

**Features:**

- Clean table formatting
- Truncated messages for readability
- Context information inline
- Terminal-friendly output

**Example:**

```
PromptShield Scan Report
==================================================

Scan Date: 2024-01-15T10:30:00.000Z
Files Scanned: 1
Total Violations: 2

Summary:
--------------------
Severity Breakdown:
  🔴 high: 1
  🟡 medium: 1

Results:
--------------------

File: test.json
  Rule ID        | Severity   | Category   | Message
  ---------------|------------|------------|----------------------------------------
  pii-email      | high       | pii        | Potential PII detected [Obj:0, Field:email]
```

### HTML (`html`)

- **Extension**: `.html`
- **MIME Type**: `text/html`
- **Streaming**: ❌ (requires complete structure)
- **Use Case**: Web dashboards, email reports, browser viewing

**Features:**

- Responsive web design
- Color-coded severity badges
- Interactive styling
- Professional appearance
- Mobile-friendly layout

**Example:**

```html
<!doctype html>
<html lang="en">
  <head>
    <title>PromptShield Scan Report</title>
    <style>
      ...
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>PromptShield Scan Report</h1>
      </div>
      <div class="metadata">...</div>
      <div class="summary">...</div>
      <div class="results">...</div>
    </div>
  </body>
</html>
```

## Usage

### Command Line

```bash
# Generate JSON report
promptshield scan data.json --output json --output-file report.json

# Generate HTML report for web viewing
promptshield scan data.json --output html --output-file report.html

# Generate CSV for spreadsheet analysis
promptshield scan data.json --output csv --output-file violations.csv

# Display table format in terminal
promptshield scan data.json --output table

# Default markdown output
promptshield scan data.json --output markdown --output-file report.md
```

### Programmatic Usage

```typescript
import { rendererRegistry, MetadataBuilder } from './src/core/renderers';

// Get a renderer
const renderer = rendererRegistry.getRenderer('html');

// Build context with metadata
const context = MetadataBuilder.buildContext(results, {
  rulepack: 'my-rules.yaml',
  filters: { severity: ['high', 'medium'] },
  options: { maxViolations: 100 },
});

// Render output
const html = renderer.render(results, context);
```

## Extending the System

### Adding a New Renderer

1. Create a new renderer class implementing `OutputRenderer`:

```typescript
import { OutputRenderer } from './src/core/renderers';

export class XmlRenderer implements OutputRenderer {
  render(results: ScanResult[], context: OutputContext): string {
    // Generate XML output
    return `<report>...</report>`;
  }

  getExtension(): string {
    return '.xml';
  }

  getMimeType(): string {
    return 'application/xml';
  }

  supportsStreaming(): boolean {
    return false;
  }
}
```

2. Register the renderer:

```typescript
import { rendererRegistry } from './src/core/renderers';
import { XmlRenderer } from './xmlRenderer';

rendererRegistry.registerRenderer('xml', new XmlRenderer());
```

3. Update types:

```typescript
// In src/types/core/outputFormat.ts
export type OutputFormat =
  | 'json'
  | 'markdown'
  | 'csv'
  | 'table'
  | 'html'
  | 'xml';
```

### Customizing Existing Renderers

You can extend existing renderers by subclassing:

```typescript
import { MarkdownRenderer } from './src/core/renderers';

export class CustomMarkdownRenderer extends MarkdownRenderer {
  render(results: ScanResult[], context: OutputContext): string {
    // Add custom header
    let output = '# Custom Report\n\n';
    output += super.render(results, context);
    return output;
  }
}
```

## Metadata and Context

All renderers receive a consistent `OutputContext` that includes:

- **Metadata**: Scan date, file count, violation statistics
- **Filters**: Applied severity and category filters
- **Options**: Pagination, limits, and other settings
- **Output Options**: Color, verbosity, quiet mode

This ensures consistent information across all output formats.

## Best Practices

1. **Choose the right format**:

   - Use JSON for API integration
   - Use Markdown for documentation
   - Use CSV for data analysis
   - Use HTML for web dashboards
   - Use Table for terminal output

2. **Consider streaming**: For large datasets, prefer streaming formats (markdown, csv, table)

3. **Include metadata**: All formats include comprehensive metadata for context

4. **Test thoroughly**: Each renderer has unit tests to ensure consistency

## Troubleshooting

### Common Issues

1. **Invalid format error**: Ensure the format is supported by checking `rendererRegistry.getAvailableFormats()`

2. **Missing metadata**: Use `MetadataBuilder.buildContext()` to ensure proper metadata

3. **Streaming issues**: Check `supportsStreaming()` before attempting to stream large outputs

### Debugging

Enable verbose mode to see detailed renderer information:

```bash
promptshield scan data.json --output json --verbose
```

## Future Enhancements

- **PDF Output**: For formal reports and documentation
- **JUnit XML**: For CI/CD integration
- **SARIF**: For security tool integration
- **Custom Templates**: User-defined output templates
- **Interactive HTML**: JavaScript-enhanced web reports
