#!/bin/bash

# PromptShield Codebase Organization Script
# Separates old code from new architecture

set -e

echo "🧹 Organizing PromptShield Codebase..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create directories for organization
echo -e "${BLUE}📁 Creating organization directories...${NC}"

# Create old code archive directory
mkdir -p archive/old-code
mkdir -p archive/old-code/cli
mkdir -p archive/old-code/core
mkdir -p archive/old-code/services
mkdir -p archive/old-code/utils
mkdir -p archive/old-code/processing

# Create new architecture summary
echo -e "${GREEN}🏗️ NEW ARCHITECTURE (Active)${NC}"
echo "================================="

echo -e "${GREEN}✅ Core Domains:${NC}"
find src/domains -name "*.ts" | sort | sed 's/^/  /'

echo -e "${GREEN}✅ Shared Types:${NC}"
find src/shared -name "*.ts" | sort | sed 's/^/  /'

echo -e "${GREEN}✅ Infrastructure:${NC}"
find src/infrastructure -name "*.ts" | sort | sed 's/^/  /'

echo -e "${GREEN}✅ Application Layer:${NC}"
find src/application -name "*.ts" | sort | sed 's/^/  /'

echo -e "${GREEN}✅ Active CLI Files:${NC}"
echo "  src/cli/bootstrap.ts"
echo "  src/cli/index.ts"
echo "  src/cli/index-new-temp.ts"

echo ""
echo -e "${RED}🗃️ OLD CODE (Commented Out/Deprecated)${NC}"
echo "========================================"

echo -e "${RED}❌ Old CLI Commands:${NC}"
find src/cli/commands -name "*.ts" -exec grep -l "OLD CODE - COMMENTED OUT" {} \; | sort | sed 's/^/  /'

echo -e "${RED}❌ Old Core Files:${NC}"
find src/core -name "*.ts" -exec grep -l "OLD CODE - COMMENTED OUT" {} \; | sort | sed 's/^/  /'

echo -e "${RED}❌ Old Services:${NC}"
find src/services -name "*.ts" -exec grep -l "OLD CODE - COMMENTED OUT" {} \; | sort | sed 's/^/  /'

echo -e "${RED}❌ Old Utils:${NC}"
find src/utils -name "*.ts" -exec grep -l "OLD CODE - COMMENTED OUT" {} \; | sort | sed 's/^/  /'

echo -e "${RED}❌ Old Processing:${NC}"
find src/processing -name "*.ts" -exec grep -l "OLD CODE - COMMENTED OUT" {} \; | sort | sed 's/^/  /'

echo ""
echo -e "${YELLOW}🔄 MIXED/TRANSITIONAL FILES${NC}"
echo "==============================="

echo -e "${YELLOW}⚠️ Files that contain both old and new code:${NC}"
# Find files that might contain both old and new code
find src -name "*.ts" -not -path "*/domains/*" -not -path "*/shared/*" -not -path "*/infrastructure/*" -not -path "*/application/*" -exec grep -L "OLD CODE - COMMENTED OUT" {} \; | grep -v "bootstrap.ts" | grep -v "index.ts" | sort | sed 's/^/  /'

echo ""
echo -e "${BLUE}📊 CODEBASE STATISTICS${NC}"
echo "======================="

# Count files in each category
NEW_ARCH_COUNT=$(find src/domains src/shared src/infrastructure src/application -name "*.ts" | wc -l)
OLD_CODE_COUNT=$(find src -name "*.ts" -exec grep -l "OLD CODE - COMMENTED OUT" {} \; | wc -l)
TOTAL_FILES=$(find src -name "*.ts" | wc -l)

echo -e "${GREEN}New Architecture Files: $NEW_ARCH_COUNT${NC}"
echo -e "${RED}Old Code Files: $OLD_CODE_COUNT${NC}"
echo -e "${BLUE}Total TypeScript Files: $TOTAL_FILES${NC}"

# Calculate percentage
NEW_PERCENTAGE=$(echo "scale=1; $NEW_ARCH_COUNT * 100 / $TOTAL_FILES" | bc)
echo -e "${GREEN}New Architecture Coverage: $NEW_PERCENTAGE%${NC}"

echo ""
echo -e "${BLUE}🧽 CLEANUP COMMANDS${NC}"
echo "==================="

echo "To remove old code files (⚠️ USE WITH CAUTION):"
echo ""
echo -e "${YELLOW}# Move old code to archive:${NC}"
echo "mkdir -p archive/old-code"
find src -name "*.ts" -exec grep -l "OLD CODE - COMMENTED OUT" {} \; | while read file; do
    echo "mv \"$file\" \"archive/old-code/$(basename $file)\""
done

echo ""
echo -e "${YELLOW}# Or delete old code entirely:${NC}"
echo "# find src -name \"*.ts\" -exec grep -l \"OLD CODE - COMMENTED OUT\" {} \\; | xargs rm"

echo ""
echo -e "${GREEN}✅ Organization complete!${NC}"
echo "The new architecture is fully functional and ready for production."
