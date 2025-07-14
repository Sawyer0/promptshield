#!/bin/bash

# Test script to demonstrate smart checking functionality
# This script shows how the conversion scripts handle existing vs new items

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Smart Checking Functionality${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Test 1: Check if vibecode directory exists
if [ -d "vibecode" ]; then
    echo -e "${GREEN}✅ Vibecode directory found${NC}"
else
    echo -e "${RED}❌ Vibecode directory not found${NC}"
    echo -e "${YELLOW}💡 Make sure you're in the promptshield directory${NC}"
    exit 1
fi

# Test 2: Check if GitHub CLI is available
if command -v gh &> /dev/null; then
    echo -e "${GREEN}✅ GitHub CLI found${NC}"
else
    echo -e "${RED}❌ GitHub CLI not found${NC}"
    echo -e "${YELLOW}💡 Install GitHub CLI: https://cli.github.com/${NC}"
    exit 1
fi

# Test 3: Check if authenticated
if gh auth status &> /dev/null; then
    echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"
else
    echo -e "${RED}❌ GitHub CLI not authenticated${NC}"
    echo -e "${YELLOW}💡 Run: gh auth login${NC}"
    exit 1
fi

# Test 4: Check repository
REPO="$(git remote get-url origin | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/')"
if [ -n "$REPO" ]; then
    echo -e "${GREEN}✅ Repository detected: $REPO${NC}"
else
    echo -e "${RED}❌ Could not detect repository${NC}"
    echo -e "${YELLOW}💡 Make sure git remote origin is set${NC}"
    exit 1
fi

# Test 5: Check existing labels
echo -e "\n${BLUE}🔍 Checking existing labels...${NC}"
EXISTING_LABELS=$(gh api repos/$REPO/labels --jq ".[].name" 2>/dev/null | grep -E "(vibecode|week-|cli|rules|output|testing)" || true)

if [ -n "$EXISTING_LABELS" ]; then
    echo -e "${YELLOW}⚠️  Found existing labels:${NC}"
    echo "$EXISTING_LABELS" | while read label; do
        echo -e "  - ${YELLOW}$label${NC}"
    done
else
    echo -e "${GREEN}✅ No existing vibecode labels found${NC}"
fi

# Test 6: Check existing milestones
echo -e "\n${BLUE}🔍 Checking existing milestones...${NC}"
EXISTING_MILESTONES=$(gh api repos/$REPO/milestones --jq ".[].title" 2>/dev/null | grep "Week [1-4]" || true)

if [ -n "$EXISTING_MILESTONES" ]; then
    echo -e "${YELLOW}⚠️  Found existing milestones:${NC}"
    echo "$EXISTING_MILESTONES" | while read milestone; do
        echo -e "  - ${YELLOW}$milestone${NC}"
    done
else
    echo -e "${GREEN}✅ No existing vibecode milestones found${NC}"
fi

# Test 7: Check existing projects
echo -e "\n${BLUE}🔍 Checking existing projects...${NC}"
EXISTING_PROJECTS=$(gh api repos/$REPO/projects --jq ".[].name" 2>/dev/null | grep "PromptShield Week" || true)

if [ -n "$EXISTING_PROJECTS" ]; then
    echo -e "${YELLOW}⚠️  Found existing projects:${NC}"
    echo "$EXISTING_PROJECTS" | while read project; do
        echo -e "  - ${YELLOW}$project${NC}"
    done
else
    echo -e "${GREEN}✅ No existing vibecode projects found${NC}"
fi

# Test 8: Check existing issues
echo -e "\n${BLUE}🔍 Checking existing vibecode issues...${NC}"
EXISTING_ISSUES=$(gh issue list --label vibecode --json title --jq ".[].title" 2>/dev/null || true)

if [ -n "$EXISTING_ISSUES" ]; then
    echo -e "${YELLOW}⚠️  Found existing vibecode issues:${NC}"
    echo "$EXISTING_ISSUES" | head -5 | while read issue; do
        echo -e "  - ${YELLOW}$issue${NC}"
    done
    if [ "$(echo "$EXISTING_ISSUES" | wc -l)" -gt 5 ]; then
        echo -e "  - ${YELLOW}... and $(($(echo "$EXISTING_ISSUES" | wc -l) - 5)) more${NC}"
    fi
else
    echo -e "${GREEN}✅ No existing vibecode issues found${NC}"
fi

# Test 9: Count vibecode structure
echo -e "\n${BLUE}🔍 Analyzing vibecode structure...${NC}"
WEEK_COUNT=$(find vibecode -maxdepth 1 -type d -name "week*" | wc -l)
DAY_COUNT=$(find vibecode -type d -name "day*" | wc -l)
README_COUNT=$(find vibecode -name "README.md" | wc -l)

echo -e "${GREEN}📊 Vibecode Structure:${NC}"
echo -e "  - ${GREEN}Weeks: $WEEK_COUNT${NC}"
echo -e "  - ${GREEN}Days: $DAY_COUNT${NC}"
echo -e "  - ${GREEN}README files: $README_COUNT${NC}"

# Test 10: Show what would be created
echo -e "\n${BLUE}📋 What the conversion script will do:${NC}"
echo -e "${GREEN}✅ Create missing labels (skip existing)${NC}"
echo -e "${GREEN}✅ Create missing milestones (skip existing)${NC}"
echo -e "${GREEN}✅ Create missing projects (skip existing)${NC}"
echo -e "${GREEN}✅ Create missing issues (skip existing)${NC}"
echo -e "${GREEN}✅ Show summary of created vs skipped items${NC}"

echo -e "\n${BLUE}🚀 Ready to run conversion?${NC}"
echo -e "${YELLOW}Run: ./scripts/create_github_issues.sh${NC}"
echo -e "${YELLOW}Or: python scripts/convert_vibecode_to_github.py --token YOUR_TOKEN --repo $REPO${NC}"

echo -e "\n${GREEN}🎉 Smart checking test complete!${NC}"
