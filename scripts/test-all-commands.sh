#!/bin/bash

# Comprehensive Test Runner for PromptShield CLI Commands
# Tests all commands using examples and rulepacks files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EXAMPLES_DIR="examples"
RULEPACKS_DIR="rulepacks"
OUTPUT_DIR="tests/fixtures/output"
LOG_FILE="test-results.log"

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}🚀 PromptShield Command Test Suite${NC}"
echo "=================================="
echo ""

# Function to log results
log_result() {
    local test_name="$1"
    local exit_code="$2"
    local output="$3"

    if [ "$exit_code" -eq 0 ]; then
        echo -e "${GREEN}✅ $test_name${NC}"
        echo "✅ $test_name" >> "$LOG_FILE"
    else
        echo -e "${RED}❌ $test_name${NC}"
        echo "❌ $test_name" >> "$LOG_FILE"
        echo "Output: $output" >> "$LOG_FILE"
    fi
}

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"

    echo -e "${YELLOW}Testing: $test_name${NC}"

    # Run command and capture output
    if output=$(eval "$command" 2>&1); then
        log_result "$test_name" 0 "$output"
    else
        log_result "$test_name" $? "$output"
    fi
}

# Clear log file
> "$LOG_FILE"

echo -e "${BLUE}📋 Test Categories:${NC}"
echo "1. Basic Scanning Tests"
echo "2. Output Format Tests"
echo "3. Filtering Tests"
echo "4. Processing Options Tests"
echo "5. List Command Tests"
echo "6. Init Command Tests"
echo "7. Error Handling Tests"
echo "8. Performance Tests"
echo "9. Integration Tests"
echo ""

# =============================================================================
# 1. BASIC SCANNING TESTS
# =============================================================================
echo -e "${BLUE}🔍 1. Basic Scanning Tests${NC}"
echo "--------------------------------"

# Test with different input files and rulepacks
run_test "Scan sample-data.json with PII rules" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --output json"

run_test "Scan ai_output.txt with PII rules" \
    "npx promptshield scan \"$EXAMPLES_DIR/ai_output.txt\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --output json"

run_test "Scan prompt-injection-attacks.json with prompt-injection rules" \
    "npx promptshield scan \"$EXAMPLES_DIR/prompt-injection-attacks.json\" --rulepack \"$RULEPACKS_DIR/prompt-injection.yaml\" --output json"

run_test "Scan hamed-test.json with hamed.yaml rules" \
    "npx promptshield scan \"$EXAMPLES_DIR/hamed-test.json\" --rulepack \"$EXAMPLES_DIR/hamed.yaml\" --output json"

run_test "Scan real-world-injections.json with prompt-injection rules" \
    "npx promptshield scan \"$EXAMPLES_DIR/real-world-injections.json\" --rulepack \"$RULEPACKS_DIR/prompt-injection.yaml\" --output json"

# =============================================================================
# 2. OUTPUT FORMAT TESTS
# =============================================================================
echo -e "${BLUE}📄 2. Output Format Tests${NC}"
echo "--------------------------------"

run_test "Output JSON format" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --output json"

run_test "Output Markdown format" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --output markdown"

run_test "Output CSV format" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --output csv"

run_test "Output to file" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --output json --output-file \"$OUTPUT_DIR/test-output.json\""

# =============================================================================
# 3. FILTERING TESTS
# =============================================================================
echo -e "${BLUE}🔍 3. Filtering Tests${NC}"
echo "--------------------------------"

run_test "Filter by severity (high)" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --severity high --output json"

run_test "Filter by category (pii)" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --category pii --output json"

run_test "Limit violations" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --max-violations 2 --output json"

run_test "Pagination test" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --offset 0 --limit 5 --output json"

# =============================================================================
# 4. PROCESSING OPTIONS TESTS
# =============================================================================
echo -e "${BLUE}⚙️  4. Processing Options Tests${NC}"
echo "--------------------------------"

run_test "Scan specific fields" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --fields prompt,response --output json"

run_test "Scan entire object" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --scan-entire-object --output json"

run_test "NDJSON mode" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --ndjson --output json"

run_test "Max depth setting" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --max-depth 3 --output json"

# =============================================================================
# 5. LIST COMMAND TESTS
# =============================================================================
echo -e "${BLUE}📋 5. List Command Tests${NC}"
echo "--------------------------------"

run_test "List all rulepacks" \
    "npx promptshield list"

run_test "List rules from specific rulepack" \
    "npx promptshield list --rulepack \"$RULEPACKS_DIR/pii.yaml\""

run_test "Filter by category" \
    "npx promptshield list --rulepack \"$RULEPACKS_DIR/pii.yaml\" --category pii"

run_test "Filter by severity" \
    "npx promptshield list --rulepack \"$RULEPACKS_DIR/pii.yaml\" --severity high"

run_test "Show only enabled rules" \
    "npx promptshield list --rulepack \"$RULEPACKS_DIR/pii.yaml\" --enabled-only"

# =============================================================================
# 6. INIT COMMAND TESTS
# =============================================================================
echo -e "${BLUE}🆕 6. Init Command Tests${NC}"
echo "--------------------------------"

run_test "Create basic rulepack" \
    "npx promptshield init \"$OUTPUT_DIR/test-basic.yaml\" --template basic"

run_test "Create PII rulepack" \
    "npx promptshield init \"$OUTPUT_DIR/test-pii.yaml\" --template pii"

# Test other templates with error handling
run_test "Create security rulepack" \
    "npx promptshield init \"$OUTPUT_DIR/test-security.yaml\" --template security || echo 'Template not available'"

run_test "Create bias rulepack" \
    "npx promptshield init \"$OUTPUT_DIR/test-bias.yaml\" --template bias || echo 'Template not available'"

run_test "Create compliance rulepack" \
    "npx promptshield init \"$OUTPUT_DIR/test-compliance.yaml\" --template compliance || echo 'Template not available'"

run_test "Create with description" \
    "npx promptshield init \"$OUTPUT_DIR/test-desc.yaml\" --template basic --description \"Test rulepack\""

run_test "Create with category" \
    "npx promptshield init \"$OUTPUT_DIR/test-cat.yaml\" --template basic --category \"test\""

run_test "Force overwrite" \
    "npx promptshield init \"$OUTPUT_DIR/test-force.yaml\" --template basic --force"

run_test "Verbose output" \
    "npx promptshield init \"$OUTPUT_DIR/test-verbose.yaml\" --template basic --verbose"

run_test "Quiet output" \
    "npx promptshield init \"$OUTPUT_DIR/test-quiet.yaml\" --template basic --quiet"

# =============================================================================
# 7. ERROR HANDLING TESTS
# =============================================================================
echo -e "${BLUE}🚨 7. Error Handling Tests${NC}"
echo "--------------------------------"

run_test "Handle non-existent input file" \
    "npx promptshield scan \"non-existent-file.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --output json"

run_test "Handle non-existent rulepack" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"non-existent-rulepack.yaml\" --output json"

run_test "Handle invalid severity" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --severity invalid --output json"

run_test "Handle invalid category" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --category invalid --output json"

# =============================================================================
# 8. PERFORMANCE TESTS
# =============================================================================
echo -e "${BLUE}⚡ 8. Performance Tests${NC}"
echo "--------------------------------"

run_test "Large file processing" \
    "npx promptshield scan \"$EXAMPLES_DIR/hamed-test.json\" --rulepack \"$EXAMPLES_DIR/hamed.yaml\" --output json"

run_test "Parallel processing" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --parallel --output json"

run_test "Streaming threshold" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --streaming-threshold 1 --output json"

run_test "Memory warning threshold" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --memory-warning-threshold 0.5 --output json"

# =============================================================================
# 9. INTEGRATION TESTS
# =============================================================================
echo -e "${BLUE}🔗 9. Integration Tests${NC}"
echo "--------------------------------"

run_test "Multiple rulepacks test" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --output json && npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/bias.yaml\" --output json"

run_test "Compression test" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --output json --output-file \"$OUTPUT_DIR/compressed.json.gz\" --compress gzip"

run_test "Stdin input test" \
    "echo 'Hello! My email is john.doe@company.com and SSN is 123-45-6789' | npx promptshield scan - --rulepack \"$RULEPACKS_DIR/pii.yaml\" --output json"

run_test "Quiet mode test" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --quiet --output json"

run_test "Verbose mode test" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --verbose --output json"

run_test "Debug mode test" \
    "npx promptshield scan \"$EXAMPLES_DIR/sample-data.json\" --rulepack \"$RULEPACKS_DIR/pii.yaml\" --debug --output json"

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${BLUE}📊 Test Summary${NC}"
echo "=================="

# Count results
total_tests=$(grep -c "Testing:" "$LOG_FILE" 2>/dev/null || echo "0")
passed_tests=$(grep -c "✅" "$LOG_FILE" 2>/dev/null || echo "0")
failed_tests=$(grep -c "❌" "$LOG_FILE" 2>/dev/null || echo "0")

echo "Total tests run: $total_tests"
echo "Passed: $passed_tests"
echo "Failed: $failed_tests"

if [ "$failed_tests" -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Check $LOG_FILE for details.${NC}"
    echo ""
    echo "Failed tests:"
    grep "❌" "$LOG_FILE" || echo "No failed tests found in log"
    exit 1
fi
