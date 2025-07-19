#!/bin/bash

# PromptShield Dependency Analysis Script
# Analyzes which files are actually used by the new architecture

set -e

echo "🔍 Analyzing Code Dependencies..."
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create temporary file for analysis
TEMP_FILE=$(mktemp)

# Function to analyze imports
analyze_imports() {
    echo -e "${BLUE}📊 Analyzing import dependencies...${NC}"

    # Find all import statements in the new architecture
    echo "=== IMPORTS FROM NEW ARCHITECTURE ===" > $TEMP_FILE
    find src/domains src/shared src/infrastructure src/application src/cli/bootstrap.ts src/cli/index-new-temp.ts -name "*.ts" -exec grep -H "^import.*from.*'\.\./" {} \; >> $TEMP_FILE

    echo -e "${GREEN}✅ New architecture imports:${NC}"
    cat $TEMP_FILE | grep -E "(domains|shared|infrastructure|application)" | cut -d: -f1 | sort -u | sed 's/^/  /'

    echo ""
    echo -e "${RED}❌ Imports that reference old code:${NC}"
    cat $TEMP_FILE | grep -v -E "(domains|shared|infrastructure|application)" | cut -d: -f1 | sort -u | sed 's/^/  /'
}

# Function to find unused files
find_unused_files() {
    echo -e "${BLUE}🔍 Finding potentially unused files...${NC}"

    # Get all TypeScript files
    ALL_FILES=$(find src -name "*.ts" | sort)

    # Get files that are imported
    IMPORTED_FILES=$(find src -name "*.ts" -exec grep -l "^import.*from.*'\.\./" {} \; | sort)

    echo -e "${YELLOW}📁 Files that are never imported:${NC}"
    comm -23 <(echo "$ALL_FILES") <(echo "$IMPORTED_FILES") | head -20 | sed 's/^/  /'

    echo ""
    echo -e "${YELLOW}📊 Summary:${NC}"
    echo "  Total files: $(echo "$ALL_FILES" | wc -l)"
    echo "  Imported files: $(echo "$IMPORTED_FILES" | wc -l)"
    echo "  Potentially unused: $(comm -23 <(echo "$ALL_FILES") <(echo "$IMPORTED_FILES") | wc -l)"
}

# Function to check what's actually compiled
check_compiled_files() {
    echo -e "${BLUE}🔨 Checking compiled output...${NC}"

    if [ -d "dist" ]; then
        echo -e "${GREEN}✅ Files in compiled output:${NC}"
        find dist -name "*.js" | wc -l | sed 's/^/  Total compiled files: /'

        echo -e "${GREEN}✅ New architecture in dist:${NC}"
        find dist -path "*/domains/*" -o -path "*/shared/*" -o -path "*/infrastructure/*" -o -path "*/application/*" | wc -l | sed 's/^/  New architecture files: /'
    else
        echo -e "${RED}❌ No dist directory found. Run 'npm run build' first.${NC}"
    fi
}

# Function to find dead code
find_dead_code() {
    echo -e "${BLUE}💀 Finding dead code patterns...${NC}"

    echo -e "${RED}❌ Files marked as OLD CODE:${NC}"
    find src -name "*.ts" -exec grep -l "OLD CODE - COMMENTED OUT" {} \; | wc -l | sed 's/^/  Count: /'

    echo -e "${RED}❌ Files with only comments:${NC}"
    find src -name "*.ts" -exec sh -c 'if [ $(grep -v "^[[:space:]]*\(//\|/\*\|\*\|$\)" "$1" | wc -l) -eq 0 ]; then echo "$1"; fi' _ {} \; | wc -l | sed 's/^/  Count: /'
}

# Main analysis
echo -e "${YELLOW}🎯 Starting dependency analysis...${NC}"
echo ""

analyze_imports
echo ""
find_unused_files
echo ""
check_compiled_files
echo ""
find_dead_code

# Cleanup
rm -f $TEMP_FILE

echo ""
echo -e "${GREEN}🎉 Analysis complete!${NC}"
echo ""
echo -e "${YELLOW}💡 Recommendations:${NC}"
echo "1. Files marked as 'OLD CODE' can be safely removed"
echo "2. Files that are never imported might be unused"
echo "3. Check the compiled output to verify what's actually needed"
echo "4. Run tests after removing files to ensure nothing breaks"
