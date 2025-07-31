#!/bin/bash
#
# This script demonstrates the core functionality of the PromptShield scanner.
# It scans a sample JSON file containing AI prompts and responses against a
# custom rulepack designed to detect security vulnerabilities like prompt injection.
#
# Usage:
# ./scripts/showcase.sh
#

echo "🚀 Running PromptShield Showcase Script..."
echo "=========================================="
echo "Scanning 'examples/hamed-test.json' with rules from 'examples/hamed.yaml'..."
echo ""

# Execute the scan command and save the output to a file
npx ts-node src/cli/index.ts scan examples/hamed-test.json --rulepack examples/hamed.yaml --format table > scan-results.txt

echo "Scan complete. Results:"
echo "-----------------------"
cat scan-results.txt
echo "-----------------------"
echo ""
echo "=========================================="
echo "✅ Showcase script finished."
echo "Review the output above to see the detected violations."
echo "Results are also saved in scan-results.txt"
