#!/bin/bash

# PromptShield Old Code Cleanup Script
# Safely removes old/commented code files

set -e

echo "🗑️ Cleaning Up Old Code Files..."
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create archive directory
echo -e "${YELLOW}📁 Creating archive directory...${NC}"
mkdir -p archive/old-code

# Function to safely move files
move_old_file() {
    local src_file="$1"
    local dest_name="$2"

    if [ -f "$src_file" ]; then
        echo -e "${RED}🗃️ Archiving: $src_file${NC}"
        mv "$src_file" "archive/old-code/$dest_name"
    else
        echo -e "${YELLOW}⚠️ File not found: $src_file${NC}"
    fi
}

# Move old code files to archive
echo -e "${YELLOW}Moving old code files to archive...${NC}"

# Old CLI commands
move_old_file "src/cli/commands/scan/index.ts" "old-scan-index.ts"
move_old_file "src/cli/commands/scan/output.ts" "old-scan-output.ts"
move_old_file "src/cli/commands/scan/runner.ts" "old-scan-runner.ts"
move_old_file "src/cli/commands/test/index.ts" "old-test-index.ts"
move_old_file "src/cli/commands/test/runner.ts" "old-test-runner.ts"

# Old core files
move_old_file "src/core/json/processor.ts" "old-json-processor.ts"
move_old_file "src/core/scanner.ts" "old-scanner.ts"
move_old_file "src/core/scanners/fileScanner.ts" "old-file-scanner.ts"

# Old services
move_old_file "src/services/compression.ts" "old-compression.ts"

# Old utils
move_old_file "src/utils/configValidator.ts" "old-config-validator.ts"
move_old_file "src/cli/utils/optionParsers/scanOptionParser.ts" "old-scan-option-parser.ts"

# Old processing
move_old_file "src/processing/index.ts" "old-processing-index.ts"

# Remove empty directories
echo -e "${YELLOW}🧹 Removing empty directories...${NC}"
find src -type d -empty -delete 2>/dev/null || true

# Update tsconfig.json to remove exclusions
echo -e "${YELLOW}📝 Updating tsconfig.json...${NC}"
if [ -f "tsconfig.json" ]; then
    # Remove the exclude section since we've moved the files
    sed -i '/^  "exclude": \[/,/^  \]/d' tsconfig.json
    echo -e "${GREEN}✅ Updated tsconfig.json${NC}"
fi

# Test the build
echo -e "${YELLOW}🔨 Testing build...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build successful after cleanup!${NC}"
else
    echo -e "${RED}❌ Build failed! You may need to check for missing dependencies.${NC}"
    exit 1
fi

# Show final statistics
echo ""
echo -e "${GREEN}📊 CLEANUP COMPLETE!${NC}"
echo "===================="

ARCHIVED_COUNT=$(ls -1 archive/old-code/ | wc -l)
REMAINING_COUNT=$(find src -name "*.ts" | wc -l)

echo -e "${GREEN}Files archived: $ARCHIVED_COUNT${NC}"
echo -e "${GREEN}Files remaining: $REMAINING_COUNT${NC}"
echo -e "${GREEN}Archive location: archive/old-code/${NC}"

echo ""
echo -e "${GREEN}🎉 The codebase is now clean and contains only the new architecture!${NC}"
echo ""
echo -e "${YELLOW}To restore old files if needed:${NC}"
echo "cp archive/old-code/[filename] src/[original-location]"
echo ""
echo -e "${YELLOW}To permanently delete old files:${NC}"
echo "rm -rf archive/old-code"
