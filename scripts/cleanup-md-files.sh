#!/bin/bash

# PromptShield Markdown Files Cleanup Script
# Categorizes and removes old development markdown files

set -e

echo "📝 Cleaning Up Development Markdown Files..."
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create archive directory
mkdir -p archive/old-documentation

echo -e "${BLUE}📊 Analyzing markdown files...${NC}"

# Count total files
TOTAL_MD=$(find . -name "*.md" -not -path "./node_modules/*" -not -path "./archive/*" | wc -l)
echo "Total markdown files found: $TOTAL_MD"

echo ""
echo -e "${GREEN}✅ KEEP (Production documentation):${NC}"

# Files to KEEP (production documentation)
KEEP_FILES=(
    "./README.md"
    "./CLAUDE.md"
    "./LICENSE"
    "./docs/CLI_REFERENCE.md"
    "./docs/QUICKSTART.md"
    "./docs/EXTENSIONS.md"
    "./docs/RULEPACK_GUIDE.md"
    "./scripts/README.md"
)

for file in "${KEEP_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  - $file"
    fi
done

echo ""
echo -e "${YELLOW}🗂️ ARCHIVE (Development documentation):${NC}"

# Files to ARCHIVE (development documentation)
ARCHIVE_FILES=(
    "./API_DOCUMENTATION.md"
    "./COMPLETE_FEATURE_ANALYSIS.md"
    "./DEMO_PLAN.md"
    "./DOCUMENTATION.md"
    "./FEATURES.md"
    "./MIGRATION_ANALYSIS.md"
    "./NPM_PUBLISHING_PLAN.md"
    "./PRIVATE_PACKAGE_GUIDE.md"
    "./PROMPTSHIELD_PITCH.md"
    "./REFACTOR_STATUS.md"
    "./docs/ARCHITECTURE.md"
    "./docs/CI_CD.md"
    "./docs/CONTRIBUTING.md"
    "./docs/ERROR_HANDLING_PLAN.md"
    "./docs/INTEGRATION.md"
    "./docs/OUTPUT_INTEGRATION_SUMMARY.md"
    "./docs/OUTPUT_RENDERERS.md"
    "./docs/PERFORMANCE.md"
    "./docs/RULEPACK_REGISTRY.md"
    "./docs/RULEPACK_SCHEMA.md"
    "./docs/RULE_ENGINE.md"
)

for file in "${ARCHIVE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  - $file"
    fi
done

echo ""
echo -e "${RED}🗑️ REMOVE (Temporary/obsolete files):${NC}"

# Files to REMOVE (temporary/obsolete)
REMOVE_FILES=(
    "./old.md"
    "./results.md"
    "./output/test-improved.md"
    "./examples/output-formats.md"
    "./examples/sample-markdown-output.md"
    "./tests/fixtures/README.md"
)

for file in "${REMOVE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  - $file"
    fi
done

echo ""
echo -e "${RED}🗑️ REMOVE (Entire directories):${NC}"

# Directories to REMOVE entirely
REMOVE_DIRS=(
    "./vibecode"
    "./.github"
)

for dir in "${REMOVE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  - $dir/ ($(find "$dir" -name "*.md" | wc -l) files)"
    fi
done

echo ""
echo -e "${YELLOW}This will:${NC}"
echo "  - Keep 8 production documentation files"
echo "  - Archive 20 development documentation files"
echo "  - Remove 6 temporary/obsolete files"
echo "  - Remove 2 entire directories (vibecode/, .github/)"
echo ""
read -p "Continue with cleanup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

# Archive development documentation
echo -e "${YELLOW}🗂️ Archiving development documentation...${NC}"
for file in "${ARCHIVE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${BLUE}📦 Archiving: $file${NC}"
        mv "$file" "archive/old-documentation/$(basename "$file")"
    fi
done

# Remove temporary/obsolete files
echo -e "${YELLOW}🗑️ Removing temporary/obsolete files...${NC}"
for file in "${REMOVE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${RED}🗑️ Removing: $file${NC}"
        rm -f "$file"
    fi
done

# Remove entire directories
echo -e "${YELLOW}🗑️ Removing obsolete directories...${NC}"
for dir in "${REMOVE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${RED}🗑️ Removing directory: $dir${NC}"
        rm -rf "$dir"
    fi
done

# Remove empty directories
echo -e "${YELLOW}🧹 Cleaning up empty directories...${NC}"
find . -type d -empty -not -path "./node_modules/*" -not -path "./archive/*" -delete 2>/dev/null || true

# Count final results
echo -e "${BLUE}📊 Counting final results...${NC}"
FINAL_MD=$(find . -name "*.md" -not -path "./node_modules/*" -not -path "./archive/*" | wc -l)
ARCHIVED_MD=$(find archive/old-documentation -name "*.md" 2>/dev/null | wc -l)
REMOVED_COUNT=$((TOTAL_MD - FINAL_MD - ARCHIVED_MD))

echo ""
echo -e "${GREEN}🎉 CLEANUP COMPLETE!${NC}"
echo "===================="
echo ""
echo -e "${BLUE}📊 STATISTICS:${NC}"
echo -e "${GREEN}✅ Files before: $TOTAL_MD${NC}"
echo -e "${GREEN}✅ Files after: $FINAL_MD${NC}"
echo -e "${GREEN}✅ Files archived: $ARCHIVED_MD${NC}"
echo -e "${GREEN}✅ Files removed: $REMOVED_COUNT${NC}"
echo -e "${GREEN}✅ Reduction: $(echo "scale=1; ($TOTAL_MD - $FINAL_MD) * 100 / $TOTAL_MD" | bc)%${NC}"
echo ""
echo -e "${BLUE}📝 REMAINING DOCUMENTATION:${NC}"
find . -name "*.md" -not -path "./node_modules/*" -not -path "./archive/*" | sort | sed 's/^/  ✅ /'
echo ""
echo -e "${YELLOW}📁 Archived documentation: archive/old-documentation/${NC}"
echo -e "${YELLOW}🔄 To restore if needed: cp archive/old-documentation/[file].md [location]${NC}"
echo ""
echo -e "${GREEN}🎯 Documentation is now clean and production-ready!${NC}"
