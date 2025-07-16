#!/bin/bash

# PromptShield - Run All Commands Script
# This script demonstrates all available PromptShield commands with various options

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function to print command being executed
print_command() {
    echo -e "${YELLOW}Running: $1${NC}"
}

# Function to check if command succeeded
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
        exit 1
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Build the project first
print_section "Building Project"
print_command "npm run build"
npm run build
check_success

# Create output directory for results
mkdir -p output

print_section "1. LIST COMMANDS"

print_command "List all available RulePacks"
./bin/promptshield list
check_success

print_command "List rules from PII RulePack"
./bin/promptshield list --rulepack rulepacks/pii.yaml
check_success

print_command "List only enabled rules"
./bin/promptshield list --enabled-only
check_success

print_command "List rules by category"
./bin/promptshield list --category pii
check_success

print_command "List rules by severity"
./bin/promptshield list --severity high
check_success

print_section "2. VALIDATE COMMANDS"

print_command "Validate sample JSON file"
./bin/promptshield validate tests/fixtures/sample.json
check_success

print_command "Validate with basic schema"
./bin/promptshield validate tests/fixtures/sample.json --schema basic
check_success

print_command "Validate with extended schema"
./bin/promptshield validate tests/fixtures/schema-extended.json --schema extended
check_success

print_command "Validate against PII RulePack"
./bin/promptshield validate tests/fixtures/sample.json --rulepack rulepacks/pii.yaml
check_success

print_command "Validate with JSON output"
./bin/promptshield validate tests/fixtures/sample.json --output json
check_success

print_section "3. SCAN COMMANDS - Basic Scanning"

print_command "Scan sample JSON file (default markdown output)"
./bin/promptshield scan tests/fixtures/sample.json
check_success

print_command "Scan with JSON output"
./bin/promptshield scan tests/fixtures/sample.json --output json
check_success

print_command "Scan with CSV output"
./bin/promptshield scan tests/fixtures/sample.json --output csv
check_success

print_command "Scan with table output"
./bin/promptshield scan tests/fixtures/sample.json --output table
check_success

print_command "Scan with HTML output"
./bin/promptshield scan tests/fixtures/sample.json --output html
check_success

print_command "Scan with NDJSON output"
./bin/promptshield scan tests/fixtures/sample.json --output ndjson
check_success

print_section "4. SCAN COMMANDS - Advanced Options"

print_command "Scan with custom RulePack"
./bin/promptshield scan tests/fixtures/sample.json --rulepack rulepacks/pii.yaml
check_success

print_command "Scan with severity filtering"
./bin/promptshield scan tests/fixtures/multiple-severities.json --severity high,medium
check_success

print_command "Scan with category filtering"
./bin/promptshield scan tests/fixtures/multiple-categories.json --category pii,bias
check_success

print_command "Scan with fail-on severity"
./bin/promptshield scan tests/fixtures/violations.json --fail-on high
check_success

print_command "Scan with custom fields"
./bin/promptshield scan tests/fixtures/sample.json --fields prompt,response
check_success

print_command "Scan with scan-entire-object"
./bin/promptshield scan tests/fixtures/sample.json --scan-entire-object
check_success

print_section "5. SCAN COMMANDS - Output Options"

print_command "Scan with output to file"
./bin/promptshield scan tests/fixtures/sample.json --output json --output-file output/scan-result.json
check_success

print_command "Scan with compressed output"
./bin/promptshield scan tests/fixtures/sample.json --output json --output-file output/compressed-result.json.gz --compress gzip
check_success

print_command "Scan with pagination"
./bin/promptshield scan tests/fixtures/large-result-set.json --limit 5 --offset 0
check_success

print_command "Scan with max violations limit"
./bin/promptshield scan tests/fixtures/large-result-set.json --max-violations 10
check_success

print_section "6. SCAN COMMANDS - Performance & Large Files"

print_command "Scan large result set with streaming"
./bin/promptshield scan tests/fixtures/large-result-set.json --output ndjson --output-file output/large-result.ndjson
check_success

print_command "Scan with NDJSON input"
./bin/promptshield scan tests/fixtures/large-result-set.ndjson --ndjson
check_success

print_command "Scan with memory optimization"
./bin/promptshield scan tests/fixtures/large-result-set.json --max-objects 100 --streaming-threshold 500
check_success

print_command "Scan with timeout"
./bin/promptshield scan tests/fixtures/large-result-set.json --timeout 60
check_success

print_section "7. SCAN COMMANDS - Schema Validation"

print_command "Scan with basic schema validation"
./bin/promptshield scan tests/fixtures/sample.json --schema basic
check_success

print_command "Scan with extended schema validation"
./bin/promptshield scan tests/fixtures/schema-extended.json --schema extended
check_success

print_command "Scan with flexible schema validation"
./bin/promptshield scan tests/fixtures/sample.json --schema flexible
check_success

print_section "8. SCAN COMMANDS - Debug & Verbose Options"

print_command "Scan with debug mode"
./bin/promptshield scan tests/fixtures/sample.json --debug
check_success

print_command "Scan with verbose output"
./bin/promptshield scan tests/fixtures/sample.json --verbose
check_success

print_command "Scan with quiet mode"
./bin/promptshield scan tests/fixtures/sample.json --quiet
check_success

print_command "Scan with no color"
./bin/promptshield scan tests/fixtures/sample.json --no-color
check_success

print_section "9. SCAN COMMANDS - Error Handling"

print_command "Scan malformed JSON (should show errors)"
./bin/promptshield scan tests/fixtures/malformed.json
check_success

print_command "Scan with strict mode"
./bin/promptshield scan tests/fixtures/sample.json --strict
check_success

print_section "10. CREATE COMMANDS"

print_command "Create basic RulePack"
./bin/promptshield create my-test-pack --template basic --description "Test RulePack" --category test
check_success

print_command "Create PII RulePack"
./bin/promptshield create my-pii-pack --template pii --description "PII Detection Pack" --category pii
check_success

print_command "Create bias RulePack"
./bin/promptshield create my-bias-pack --template bias --description "Bias Detection Pack" --category bias
check_success

print_section "11. UPDATE COMMANDS"

print_command "Update RulePacks"
./bin/promptshield update
check_success

print_command "Force update RulePacks"
./bin/promptshield update --force
check_success

print_section "12. COMPREHENSIVE TEST SCENARIOS"

print_command "Test nested JSON scanning"
./bin/promptshield scan tests/fixtures/nested.json --scan-entire-object --max-depth 3
check_success

print_command "Test keyword-based scanning"
./bin/promptshield scan tests/fixtures/keyword-test.json --rulepack rulepacks/pii.yaml
check_success

print_command "Test compression scenarios"
./bin/promptshield scan tests/fixtures/compression-test.json --compress gzip --compression-level 9
check_success

print_command "Test multiple output formats"
for format in json markdown csv table html ndjson; do
    echo "Testing $format output format..."
    ./bin/promptshield scan tests/fixtures/sample.json --output $format --output-file output/test-$format
    check_success
done

print_section "13. CLEANUP"

print_command "Cleaning up test RulePacks"
rm -f rulepacks/my-test-pack.yaml rulepacks/my-pii-pack.yaml rulepacks/my-bias-pack.yaml
check_success

print_section "14. SUMMARY"

echo -e "${GREEN}All commands executed successfully!${NC}"
echo -e "${BLUE}Output files created in: output/${NC}"
echo -e "${YELLOW}Test RulePacks cleaned up${NC}"

# Show output directory contents
echo -e "\n${BLUE}Generated output files:${NC}"
ls -la output/ 2>/dev/null || echo "No output files generated"

echo -e "\n${GREEN}✅ All PromptShield commands tested successfully!${NC}"
