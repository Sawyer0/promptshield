#!/bin/bash

# PromptShield Real-World Demo - Perfect for Screenshots
# This script demonstrates detection of 2 major real-world prompt injection attacks

set -e

echo "🔒 PromptShield: Real-World Prompt Injection Detection"
echo "======================================================"
echo ""

echo "Scanning for real-world prompt injection attacks..."
echo ""

# Run the scan with colored console output (default markdown format)
./bin/promptshield scan examples/real-world-injections.json --rulepack rulepacks/prompt-injection.yaml

echo ""
echo "✅ Detection completed!"
echo ""
echo "Real-world attacks detected:"
echo "  • System prompt extraction attempts"
echo "  • DAN jailbreak attempts"
echo ""
echo "🎯 PromptShield protects AI systems from real-world threats"
