#!/bin/bash

# PromptShield Safe Cleanup Script
# Safely removes only the confirmed old code files

set -e

echo "🧹 PromptShield Safe Cleanup"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Confirm with user
echo -e "${YELLOW}This will move old/commented code files to archive/old-code/${NC}"
echo -e "${YELLOW}The new architecture will remain fully functional.${NC}"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

# Create archive directory
mkdir -p archive/old-code

# Files that are definitively old and commented out
OLD_FILES=(
    "src/cli/commands/scan/index.ts"
    "src/cli/commands/scan/output.ts"
    "src/cli/commands/scan/runner.ts"
    "src/cli/commands/test/index.ts"
    "src/cli/commands/test/runner.ts"
    "src/cli/utils/optionParsers/scanOptionParser.ts"
    "src/core/json/processor.ts"
    "src/core/scanner.ts"
    "src/core/scanners/fileScanner.ts"
    "src/processing/index.ts"
    "src/services/compression.ts"
    "src/utils/configValidator.ts"
)

# Move old files
echo -e "${YELLOW}Moving old code files...${NC}"
for file in "${OLD_FILES[@]}"; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        dirname=$(dirname "$file" | sed 's/src\///' | sed 's/\//-/g')
        new_name="old-${dirname}-${filename}"

        echo -e "${RED}📦 $file -> archive/old-code/$new_name${NC}"
        mv "$file" "archive/old-code/$new_name"
    fi
done

# Remove empty directories
echo -e "${YELLOW}Cleaning up empty directories...${NC}"
find src -type d -empty -delete 2>/dev/null || true

# Update tsconfig.json exclude section
echo -e "${YELLOW}Updating tsconfig.json...${NC}"
if [ -f "tsconfig.json" ]; then
    # Remove the exclude section since files are gone
    sed -i '/^  "exclude": \[/,/^  \]/d' tsconfig.json
    echo -e "${GREEN}✅ Updated tsconfig.json${NC}"
fi

# Test the build
echo -e "${YELLOW}Testing build...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed! Rolling back...${NC}"

    # Rollback - restore files
    for file in archive/old-code/old-*; do
        if [ -f "$file" ]; then
            original_name=$(echo "$file" | sed 's/archive\/old-code\/old-//' | sed 's/-/\//g')
            original_path="src/$original_name"
            mkdir -p "$(dirname "$original_path")"
            mv "$file" "$original_path"
            echo -e "${YELLOW}Restored: $original_path${NC}"
        fi
    done

    exit 1
fi

# Final verification
echo -e "${YELLOW}Running final verification...${NC}"
if echo "Test content" | node dist/cli/index.js scan - --output json > /dev/null 2>&1; then
    echo -e "${GREEN}✅ CLI still working perfectly!${NC}"
else
    echo -e "${RED}❌ CLI test failed!${NC}"
    exit 1
fi

# Show results
echo ""
echo -e "${GREEN}🎉 CLEANUP COMPLETE!${NC}"
echo "===================="

archived_count=$(ls -1 archive/old-code/ 2>/dev/null | wc -l)
remaining_count=$(find src -name "*.ts" | wc -l)

echo -e "${GREEN}✅ Files archived: $archived_count${NC}"
echo -e "${GREEN}✅ Files remaining: $remaining_count${NC}"
echo -e "${GREEN}✅ Build: PASSING${NC}"
echo -e "${GREEN}✅ CLI: FUNCTIONAL${NC}"

echo ""
echo -e "${YELLOW}📁 Archived files location: archive/old-code/${NC}"
echo -e "${YELLOW}🔄 To restore if needed: cp archive/old-code/[file] src/[original-location]${NC}"
echo -e "${YELLOW}🗑️ To delete permanently: rm -rf archive/old-code${NC}"

echo ""
echo -e "${GREEN}The codebase is now clean and contains only the new architecture!${NC}"
