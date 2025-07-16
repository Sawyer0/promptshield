#!/bin/bash

# PromptShield - Quick Test Script
# Fast validation of core functionality

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== PromptShield Quick Test ===${NC}"

# Build project
echo -e "${YELLOW}Building project...${NC}"
npm run build

# Create output directory
mkdir -p output

# Test core commands
echo -e "\n${BLUE}Testing core commands...${NC}"

echo "✓ List RulePacks"
./bin/promptshield list --enabled-only

echo "✓ Validate sample file"
./bin/promptshield validate tests/fixtures/sample.json

echo "✓ Scan with default output"
./bin/promptshield scan tests/fixtures/sample.json --quiet

echo "✓ Scan with JSON output"
./bin/promptshield scan tests/fixtures/sample.json --output json --output-file output/quick-test.json

echo "✓ Scan with custom RulePack"
./bin/promptshield scan tests/fixtures/sample.json --rulepack rulepacks/pii.yaml --quiet

echo "✓ Test different output formats"
for format in csv table html ndjson; do
    echo "  Testing $format format..."
    ./bin/promptshield scan tests/fixtures/sample.json --output $format --quiet > /dev/null
done

echo "✓ Test error handling"
./bin/promptshield scan tests/fixtures/malformed.json --quiet

echo -e "\n${GREEN}✅ Quick test completed successfully!${NC}"
echo -e "${BLUE}Output files:${NC}"
ls -la output/ 2>/dev/null || echo "No output files generated"
