#!/bin/bash

# Create GitHub Issues and Projects from Vibecode Structure
# This script uses GitHub CLI to create issues and projects from the vibecode directory

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO="$(git remote get-url origin | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/' | sed 's/\.git$//')"
echo -e "${BLUE}Detected repository: $REPO${NC}"
ISSUE_TEMPLATE_DIR=".github/ISSUE_TEMPLATE"
WORKFLOW_DIR=".github/workflows"

echo -e "${BLUE}🚀 Converting Vibecode to GitHub Issues and Projects${NC}"
echo -e "${BLUE}Repository: ${REPO}${NC}"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Install from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Create directories
mkdir -p "$ISSUE_TEMPLATE_DIR"
mkdir -p "$WORKFLOW_DIR"

echo -e "${GREEN}✅ Created directory structure${NC}"

# Function to create issue template
create_issue_template() {
    local template_name="$1"
    local template_content="$2"

    cat > "$ISSUE_TEMPLATE_DIR/$template_name" << EOF
$template_content
EOF
    echo -e "${GREEN}✅ Created issue template: $template_name${NC}"
}

# Create issue templates
create_issue_template "task.md" '---
name: Task
about: A development task from the vibecode plan
title: "[TASK] "
labels: ["task", "vibecode"]
assignees: ""
---

## Task Description
<!-- Describe what needs to be done -->

## Week & Day
- **Week:**
- **Day:**

## Deliverables
- [ ]

## Code Snippets
```javascript
// Add relevant code snippets here
```

## Testing Strategy
<!-- How will this be tested? -->

## Notes
<!-- Any additional notes or context -->
'

create_issue_template "bug.md" '---
name: Bug
about: A bug in the codebase
title: "[BUG] "
labels: ["bug"]
assignees: ""
---

## Bug Description
<!-- Describe the bug -->

## Steps to Reproduce
1.
2.
3.

## Expected Behavior
<!-- What should happen -->

## Actual Behavior
<!-- What actually happens -->

## Environment
- OS:
- Node.js version:
- PromptShield version:

## Additional Context
<!-- Any other context about the problem -->
'

create_issue_template "feature.md" '---
name: Feature Request
about: A new feature for PromptShield
title: "[FEATURE] "
labels: ["enhancement"]
assignees: ""
---

## Feature Description
<!-- Describe the feature -->

## Use Case
<!-- Why is this feature needed? -->

## Proposed Solution
<!-- How should this be implemented? -->

## Alternatives Considered
<!-- Any alternative solutions? -->

## Additional Context
<!-- Any other context -->
'

# Create GitHub Actions workflow
cat > "$WORKFLOW_DIR/create-vibecode-issues.yml" << 'EOF'
name: Create Vibecode Issues and Projects

on:
  workflow_dispatch:
    inputs:
      github_token:
        description: 'GitHub Token'
        required: true
        type: string

jobs:
  create-issues:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          pip install PyGithub

      - name: Create Issues and Projects
        run: |
          python scripts/convert_vibecode_to_github.py --token ${{ inputs.github_token }} --repo ${{ github.repository }}
        env:
          GITHUB_TOKEN: ${{ inputs.github_token }}
EOF

echo -e "${GREEN}✅ Created GitHub Actions workflow${NC}"

# Function to check if label exists
label_exists() {
    local label_name="$1"
    gh api repos/$REPO/labels --jq ".[] | select(.name == \"$label_name\") | .name" 2>/dev/null | grep -q "^$label_name$" 2>/dev/null || false
}

# Function to create label if it doesn't exist
create_label_if_missing() {
    local name="$1"
    local color="$2"
    local description="$3"

    if label_exists "$name"; then
        echo -e "${YELLOW}⚠️  Label '$name' already exists, skipping${NC}"
        update_counters "label" "skipped"
    else
        echo -e "${BLUE}📝 Creating label: $name${NC}"
        gh api repos/$REPO/labels -f name="$name" -f color="$color" -f description="$description" 2>/dev/null || {
            echo -e "${RED}❌ Failed to create label '$name' - check permissions${NC}"
            update_counters "label" "skipped"
        }
        update_counters "label" "created"
    fi
}

# Function to create labels
create_labels() {
    echo -e "${BLUE}📝 Creating GitHub labels...${NC}"

    # Vibecode labels
    create_label_if_missing "vibecode" "0366d6" "Tasks from vibecode development plan"
    create_label_if_missing "week-1" "fbca04" "Week 1 tasks"
    create_label_if_missing "week-2" "fbca04" "Week 2 tasks"
    create_label_if_missing "week-3" "fbca04" "Week 3 tasks"
    create_label_if_missing "week-4" "fbca04" "Week 4 tasks"

    # Task type labels
    create_label_if_missing "cli" "d93f0b" "CLI-related tasks"
    create_label_if_missing "rules" "0e8a16" "Rule system tasks"
    create_label_if_missing "output" "1d76db" "Output formatting tasks"
    create_label_if_missing "testing" "5319e7" "Testing tasks"
    create_label_if_missing "error-handling" "b60205" "Error handling tasks"

    # Priority labels
    create_label_if_missing "priority-high" "b60205" "High priority"
    create_label_if_missing "priority-medium" "fbca04" "Medium priority"
    create_label_if_missing "priority-low" "0e8a16" "Low priority"

    # Status labels
    create_label_if_missing "blocked" "b60205" "Blocked by another issue"
    create_label_if_missing "ready" "0e8a16" "Ready to work on"
    create_label_if_missing "in-progress" "fbca04" "Currently being worked on"

    echo -e "${GREEN}✅ GitHub labels ready${NC}"
}

# Function to check if milestone exists
milestone_exists() {
    local milestone_title="$1"
    gh api repos/$REPO/milestones --jq ".[] | select(.title == \"$milestone_title\") | .title" 2>/dev/null | grep -q "^$milestone_title$"
}

# Function to create milestone if it doesn't exist
create_milestone_if_missing() {
    local title="$1"
    local description="$2"
    local due_date="$3"

    if milestone_exists "$title"; then
        echo -e "${YELLOW}⚠️  Milestone '$title' already exists, skipping${NC}"
        update_counters "milestone" "skipped"
    else
        echo -e "${BLUE}📅 Creating milestone: $title${NC}"
        gh api repos/$REPO/milestones -f title="$title" -f description="$description" -f state="open" -f due_on="$due_date" || true
        update_counters "milestone" "created"
    fi
}

# Function to create milestones
create_milestones() {
    echo -e "${BLUE}📅 Creating milestones...${NC}"

    # Calculate dates (4 weeks from now, using RFC 3339 format)
    for week in {1..4}; do
        week_offset=$((week * 7))
        due_date=$(date -d "+$week_offset days" --utc +%Y-%m-%dT00:00:00Z)
        create_milestone_if_missing "Week $week" "Development milestone for Week $week" "$due_date"
    done

    echo -e "${GREEN}✅ GitHub milestones ready${NC}"
}

# Function to check if project exists
project_exists() {
    local project_name="$1"
    gh api repos/$REPO/projects --jq ".[] | select(.name == \"$project_name\") | .name" 2>/dev/null | grep -q "^$project_name$"
}

# Function to create project if it doesn't exist
create_project_if_missing() {
    local name="$1"
    local description="$2"

    if project_exists "$name"; then
        echo -e "${YELLOW}⚠️  Project '$name' already exists, skipping${NC}"
        update_counters "project" "skipped"
    else
        echo -e "${BLUE}📋 Creating project: $name${NC}"
        gh api repos/$REPO/projects -f name="$name" -f description="$description" || true
        update_counters "project" "created"
    fi
}

# Function to create project boards (manual step for new Projects API)
create_projects() {
    echo -e "${BLUE}📋 Creating project boards...${NC}"
    echo -e "${YELLOW}⚠️  Note: GitHub Projects (classic) API is deprecated${NC}"
    echo -e "${YELLOW}💡 Please create project boards manually using the new Projects (beta) UI: https://github.com/orgs/Sawyer0/projects${NC}"
    for week in {1..4}; do
        project_name="PromptShield Week $week"
        echo -e "${BLUE}📋 Project needed: $project_name${NC}"
    done
    echo -e "${GREEN}✅ Project creation noted (manual creation required)${NC}"
}

# Function to check if issue exists
issue_exists() {
    local issue_title="$1"
    gh issue list --search "title:\"$issue_title\"" --json number --jq ".[0].number" 2>/dev/null | grep -q "^[0-9]"
}

# Function to create issue if it doesn't exist
create_issue_if_missing() {
    local title="$1"
    local body="$2"
    local labels="$3"

    if issue_exists "$title"; then
        echo -e "${YELLOW}⚠️  Issue '$title' already exists, skipping${NC}"
        update_counters "issue" "skipped"
    else
        echo -e "${BLUE}📝 Creating issue: $title${NC}"
        gh issue create \
            --title "$title" \
            --body "$body" \
            --label "$labels" \
            --repo "$REPO" || true
        update_counters "issue" "created"
    fi
}

# Function to create issues from vibecode structure
create_issues() {
    echo -e "${BLUE}📝 Creating issues from vibecode structure...${NC}"

    # Process each week
    for week_dir in vibecode/week*; do
        if [ ! -d "$week_dir" ]; then
            continue
        fi

        week_num=$(echo "$week_dir" | sed 's/.*week\([0-9]*\).*/\1/')
        week_name=$(basename "$week_dir")

        echo -e "${YELLOW}Processing $week_name...${NC}"

        # Process each day
        for day_dir in "$week_dir"/day*; do
            if [ ! -d "$day_dir" ]; then
                continue
            fi

            day_num=$(echo "$day_dir" | sed 's/.*day\([0-9]*\).*/\1/')
            day_name=$(basename "$day_dir")

            # Read the README.md file
            readme_file="$day_dir/README.md"
            if [ ! -f "$readme_file" ]; then
                continue
            fi

            # Extract goal from README
            goal=$(grep -A 1 "## 🎯 \*\*Today's Goal\*\*" "$readme_file" | tail -n 1 | sed 's/^[[:space:]]*//' | sed 's/^[[:space:]]*//')

            # If goal is empty, try alternative extraction
            if [ -z "$goal" ] || [ "$goal" = "" ]; then
                # Try to get the first line after the goal header
                goal=$(awk '/## 🎯 \*\*Today'\''s Goal\*\*/ {getline; print}' "$readme_file" | sed 's/^[[:space:]]*//')
            fi

            # If still empty, use a unique fallback goal
            if [ -z "$goal" ] || [ "$goal" = "" ]; then
                goal="Objectives for Week $week_num Day $day_num"
            fi

            # Make issue title unique by including week and day
            issue_title="Week $week_num Day $day_num: $goal"

            # Create issue body
            issue_body=$(cat << EOF
## Task Description
This task is part of the vibecode development plan for $week_name.

**Goal:** $goal

## Week & Day
- **Week:** $week_name
- **Day:** $day_name

## Deliverables
- [ ] Complete the day's objectives
- [ ] Follow the detailed plan in vibecode/$week_name/$day_name/README.md

## Notes
- This task is part of the vibecode development plan
- Follow the detailed instructions in the vibecode directory
- Update this issue with progress and blockers
EOF
)

            # Create the issue if it doesn't exist, and assign to milestone
            create_issue_if_missing_with_milestone "$issue_title" "$issue_body" "vibecode,week-$week_num" "Week $week_num"
        done
    done

    echo -e "${GREEN}✅ GitHub issues ready${NC}"
}

# New function to create issue with milestone
create_issue_if_missing_with_milestone() {
    local title="$1"
    local body="$2"
    local labels="$3"
    local milestone="$4"

    if issue_exists "$title"; then
        echo -e "${YELLOW}⚠️  Issue '$title' already exists, skipping${NC}"
        update_counters "issue" "skipped"
    else
        echo -e "${BLUE}📝 Creating issue: $title${NC}"
        gh issue create \
            --title "$title" \
            --body "$body" \
            --label "$labels" \
            --milestone "$milestone" \
            --repo "$REPO" || true
        update_counters "issue" "created"
    fi
}

# Variables to track what was created
CREATED_LABELS=0
SKIPPED_LABELS=0
CREATED_MILESTONES=0
SKIPPED_MILESTONES=0
CREATED_PROJECTS=0
SKIPPED_PROJECTS=0
CREATED_ISSUES=0
SKIPPED_ISSUES=0

# Function to update counters
update_counters() {
    local type="$1"
    local action="$2"

    case "$type" in
        "label")
            if [ "$action" = "created" ]; then
                CREATED_LABELS=$((CREATED_LABELS + 1))
            else
                SKIPPED_LABELS=$((SKIPPED_LABELS + 1))
            fi
            ;;
        "milestone")
            if [ "$action" = "created" ]; then
                CREATED_MILESTONES=$((CREATED_MILESTONES + 1))
            else
                SKIPPED_MILESTONES=$((SKIPPED_MILESTONES + 1))
            fi
            ;;
        "project")
            if [ "$action" = "created" ]; then
                CREATED_PROJECTS=$((CREATED_PROJECTS + 1))
            else
                SKIPPED_PROJECTS=$((SKIPPED_PROJECTS + 1))
            fi
            ;;
        "issue")
            if [ "$action" = "created" ]; then
                CREATED_ISSUES=$((CREATED_ISSUES + 1))
            else
                SKIPPED_ISSUES=$((SKIPPED_ISSUES + 1))
            fi
            ;;
    esac
}

# Update the create functions to track counters
create_label_if_missing() {
    local name="$1"
    local color="$2"
    local description="$3"

    if label_exists "$name"; then
        echo -e "${YELLOW}⚠️  Label '$name' already exists, skipping${NC}"
        update_counters "label" "skipped"
    else
        echo -e "${BLUE}📝 Creating label: $name${NC}"
        gh api repos/$REPO/labels -f name="$name" -f color="$color" -f description="$description" || true
        update_counters "label" "created"
    fi
}

create_milestone_if_missing() {
    local title="$1"
    local description="$2"
    local due_date="$3"

    if milestone_exists "$title"; then
        echo -e "${YELLOW}⚠️  Milestone '$title' already exists, skipping${NC}"
        update_counters "milestone" "skipped"
    else
        echo -e "${BLUE}📅 Creating milestone: $title${NC}"
        gh api repos/$REPO/milestones -f title="$title" -f description="$description" -f state="open" -f due_on="$due_date" || true
        update_counters "milestone" "created"
    fi
}

create_project_if_missing() {
    local name="$1"
    local description="$2"

    if project_exists "$name"; then
        echo -e "${YELLOW}⚠️  Project '$name' already exists, skipping${NC}"
        update_counters "project" "skipped"
    else
        echo -e "${BLUE}📋 Creating project: $name${NC}"
        gh api repos/$REPO/projects -f name="$name" -f description="$description" || true
        update_counters "project" "created"
    fi
}

create_issue_if_missing() {
    local title="$1"
    local body="$2"
    local labels="$3"

    if issue_exists "$title"; then
        echo -e "${YELLOW}⚠️  Issue '$title' already exists, skipping${NC}"
        update_counters "issue" "skipped"
    else
        echo -e "${BLUE}📝 Creating issue: $title${NC}"
        gh issue create \
            --title "$title" \
            --body "$body" \
            --label "$labels" \
            --repo "$REPO" || true
        update_counters "issue" "created"
    fi
}

# Function to show summary
show_summary() {
    echo -e "\n${GREEN}🎉 Conversion Summary${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}📝 Labels:${NC}     Created: ${GREEN}$CREATED_LABELS${NC}, Skipped: ${YELLOW}$SKIPPED_LABELS${NC}"
    echo -e "${BLUE}📅 Milestones:${NC}  Created: ${GREEN}$CREATED_MILESTONES${NC}, Skipped: ${YELLOW}$SKIPPED_MILESTONES${NC}"
    echo -e "${BLUE}📋 Projects:${NC}    Created: ${GREEN}$CREATED_PROJECTS${NC}, Skipped: ${YELLOW}$SKIPPED_PROJECTS${NC}"
    echo -e "${BLUE}📝 Issues:${NC}      Created: ${GREEN}$CREATED_ISSUES${NC}, Skipped: ${YELLOW}$SKIPPED_ISSUES${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"

    local total_created=$((CREATED_LABELS + CREATED_MILESTONES + CREATED_PROJECTS + CREATED_ISSUES))
    local total_skipped=$((SKIPPED_LABELS + SKIPPED_MILESTONES + SKIPPED_PROJECTS + SKIPPED_ISSUES))

    echo -e "${GREEN}✅ Total Created: $total_created${NC}"
    echo -e "${YELLOW}⚠️  Total Skipped: $total_skipped${NC}"
}

# Main execution
echo -e "${BLUE}🎯 Starting conversion process...${NC}"

# Create labels
create_labels

# Create milestones
create_milestones

# Create project boards
create_projects

# Create issues
create_issues

# Show summary
show_summary

echo -e "\n${BLUE}📋 Next steps:${NC}"
echo -e "1. Review the created issues and projects"
echo -e "2. Assign team members to issues"
echo -e "3. Set up project board columns and automation"
echo -e "4. Start working through the vibecode plan!"
echo -e ""
echo -e "${YELLOW}💡 Tip: Use 'gh issue list --label vibecode' to see all vibecode issues${NC}"
