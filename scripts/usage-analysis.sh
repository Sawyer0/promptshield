#!/bin/bash

# PromptShield Usage Analysis Script
# Analyzes what's actually being used from old architecture directories

set -e

echo "🔍 Analyzing Actual Usage in Old Architecture..."
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create temporary files for analysis
TEMP_DIR=$(mktemp -d)
IMPORTS_FILE="$TEMP_DIR/imports.txt"
USAGE_FILE="$TEMP_DIR/usage.txt"
ANALYSIS_FILE="$TEMP_DIR/analysis.txt"

echo -e "${BLUE}📊 Step 1: Find all imports from old architecture directories${NC}"
echo "============================================================"

# Find all imports from old architecture directories
find src -name "*.ts" -exec grep -H "from.*'\.\./.*\(types\|utils\|services\|validation\|models\)" {} \; > $IMPORTS_FILE 2>/dev/null || true

echo -e "${YELLOW}📁 Imports from src/types/:${NC}"
grep "from.*types" $IMPORTS_FILE | cut -d: -f1 | sort | uniq -c | sort -nr | head -10

echo -e "${YELLOW}📁 Imports from src/utils/:${NC}"
grep "from.*utils" $IMPORTS_FILE | cut -d: -f1 | sort | uniq -c | sort -nr | head -10

echo -e "${YELLOW}📁 Imports from src/services/:${NC}"
grep "from.*services" $IMPORTS_FILE | cut -d: -f1 | sort | uniq -c | sort -nr | head -10

echo -e "${YELLOW}📁 Imports from src/validation/:${NC}"
grep "from.*validation" $IMPORTS_FILE | cut -d: -f1 | sort | uniq -c | sort -nr | head -10

echo -e "${YELLOW}📁 Imports from src/models/:${NC}"
grep "from.*models" $IMPORTS_FILE | cut -d: -f1 | sort | uniq -c | sort -nr | head -10

echo ""
echo -e "${BLUE}📊 Step 2: Check what the new architecture imports${NC}"
echo "================================================="

echo -e "${GREEN}✅ New architecture imports:${NC}"
find src/domains src/shared src/infrastructure src/application src/cli/bootstrap.ts src/cli/index-new-temp.ts -name "*.ts" -exec grep -H "from.*'\.\./.*\(types\|utils\|services\|validation\|models\)" {} \; 2>/dev/null | head -10

echo ""
echo -e "${BLUE}📊 Step 3: Analyze what's actually being used${NC}"
echo "============================================="

echo -e "${YELLOW}🔍 Most imported files from old architecture:${NC}"
grep -o "from.*'\.\./.*'" $IMPORTS_FILE | sort | uniq -c | sort -nr | head -15

echo ""
echo -e "${YELLOW}🔍 Files that import from old architecture:${NC}"
cut -d: -f1 $IMPORTS_FILE | sort | uniq -c | sort -nr | head -15

echo ""
echo -e "${BLUE}📊 Step 4: Check what new architecture provides${NC}"
echo "==============================================="

echo -e "${GREEN}✅ New architecture capabilities:${NC}"
echo "  - Domains: $(find src/domains -name "*.ts" | wc -l) files"
echo "  - Shared Types: $(find src/shared/types -name "*.ts" | wc -l) files"
echo "  - Infrastructure: $(find src/infrastructure -name "*.ts" | wc -l) files"
echo "  - Application: $(find src/application -name "*.ts" | wc -l) files"

echo ""
echo -e "${BLUE}📊 Step 5: Specific function analysis${NC}"
echo "===================================="

# Check specific functionality
echo -e "${YELLOW}🔍 Checking renderers:${NC}"
echo "  New architecture renderers: $(find src/domains/reporting/adapters/renderers -name "*.ts" | wc -l)"
echo "  Old architecture renderers: $(find src/core/renderers -name "*.ts" 2>/dev/null | wc -l)"

echo -e "${YELLOW}🔍 Checking processors:${NC}"
echo "  New architecture processors: $(find src/domains/scanning/adapters/processors -name "*.ts" | wc -l)"
echo "  Old architecture processors: $(find src/core/processors -name "*.ts" 2>/dev/null | wc -l)"

echo -e "${YELLOW}🔍 Checking error handling:${NC}"
echo "  New architecture errors: $(find src/infrastructure/errors -name "*.ts" | wc -l)"
echo "  Old architecture errors: $(find src/utils/errors -name "*.ts" 2>/dev/null | wc -l)"

echo ""
echo -e "${BLUE}📊 Step 6: Identify redundancies${NC}"
echo "================================"

echo -e "${RED}❌ Potential redundancies found:${NC}"

# Check for duplicate renderer logic
if [ -d "src/core/renderers" ] && [ -d "src/domains/reporting/adapters/renderers" ]; then
    echo "  - Duplicate renderers: old (src/core/renderers) vs new (src/domains/reporting/adapters/renderers)"
fi

# Check for duplicate processor logic
if [ -d "src/core/processors" ] && [ -d "src/domains/scanning/adapters/processors" ]; then
    echo "  - Duplicate processors: old (src/core/processors) vs new (src/domains/scanning/adapters/processors)"
fi

# Check for duplicate type definitions
if [ -d "src/types" ] && [ -d "src/shared/types" ]; then
    echo "  - Duplicate types: old (src/types) vs new (src/shared/types)"
fi

echo ""
echo -e "${BLUE}📊 Step 7: Usage recommendations${NC}"
echo "=================================="

echo -e "${GREEN}💡 RECOMMENDATIONS:${NC}"
echo ""
echo "1. KEEP (New architecture already provides):"
echo "   - Renderers: Use src/domains/reporting/adapters/renderers"
echo "   - Processors: Use src/domains/scanning/adapters/processors"
echo "   - Types: Use src/shared/types"
echo "   - Error handling: Use src/infrastructure/errors"
echo ""
echo "2. MIGRATE (Missing from new architecture):"
echo "   - Utility functions (CSV, HTML, Markdown, Table formatting)"
echo "   - Memory monitoring"
echo "   - Logging utilities"
echo "   - Validation logic"
echo "   - File/JSON services"
echo "   - Rulepack resolution"
echo ""
echo "3. REMOVE (Redundant/unused):"
echo "   - Old renderers in src/core/renderers"
echo "   - Old processors in src/core/processors"
echo "   - Duplicate type definitions"

# Cleanup
rm -rf $TEMP_DIR

echo ""
echo -e "${GREEN}🎉 Usage analysis complete!${NC}"
