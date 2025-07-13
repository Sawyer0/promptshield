# Vibecode to GitHub Conversion Scripts

This directory contains scripts to convert the vibecode development plan into GitHub issues, projects, and milestones.

## 🚀 Quick Start

### Option 1: Using the Shell Script (Recommended)

```bash
# Make the script executable
chmod +x scripts/create_github_issues.sh

# Run the conversion (smart - only creates what doesn't exist)
./scripts/create_github_issues.sh
```

### Option 2: Using the Python Script

```bash
# Install dependencies
pip install PyGithub

# Run the conversion
python scripts/convert_vibecode_to_github.py --token YOUR_GITHUB_TOKEN --repo owner/repo
```

## 📋 What Gets Created

### Smart Creation
The scripts are **intelligent** and will:
- ✅ **Check for existing items** before creating new ones
- ✅ **Skip duplicates** and show what was skipped
- ✅ **Only create what's missing** to avoid conflicts
- ✅ **Provide a summary** of what was created vs skipped

### GitHub Issues
- One issue per day in the vibecode plan
- Properly labeled with week and task type
- Includes deliverables and testing strategies
- Links back to the vibecode directory structure

### GitHub Projects
- One project board per week
- Columns: Backlog, To Do, In Progress, Review, Done
- Ready for Kanban-style workflow

### GitHub Labels
- **Vibecode labels**: `vibecode`, `week-1`, `week-2`, etc.
- **Task type labels**: `cli`, `rules`, `output`, `testing`, `error-handling`
- **Priority labels**: `priority-high`, `priority-medium`, `priority-low`
- **Status labels**: `blocked`, `ready`, `in-progress`

### GitHub Milestones
- One milestone per week
- Due dates set 1 week apart
- Ready for sprint planning

### Issue Templates
- **Task template**: For vibecode development tasks
- **Bug template**: For bug reports
- **Feature template**: For feature requests

## 🛠️ Prerequisites

### For Shell Script
- GitHub CLI (`gh`) installed and authenticated
- Git repository with remote origin set

### For Python Script
- Python 3.7+
- PyGithub library
- GitHub personal access token

## 📁 Output Structure

After running the scripts, you'll have:

```
.github/
├── ISSUE_TEMPLATE/
│   ├── task.md
│   ├── bug.md
│   └── feature.md
└── workflows/
    └── create-vibecode-issues.yml

github_outputs/ (Python script only)
├── issues.json
├── projects.json
├── labels.json
├── milestones.json
└── summary.json
```

## 🔧 Configuration

### Shell Script Configuration
The shell script automatically detects:
- Repository from git remote
- GitHub CLI authentication
- Creates all necessary directories

### Python Script Configuration
```bash
python scripts/convert_vibecode_to_github.py \
  --token YOUR_GITHUB_TOKEN \
  --repo owner/repo \
  --output-dir github_outputs
```

## 📊 Managing the Issues

### View All Vibecode Issues
```bash
gh issue list --label vibecode
```

### View Issues by Week
```bash
gh issue list --label week-1
gh issue list --label week-2
# etc.
```

### View Issues by Type
```bash
gh issue list --label cli
gh issue list --label testing
gh issue list --label rules
```

### Assign Issues to Team Members
```bash
gh issue edit ISSUE_NUMBER --add-assignee username
```

### Move Issues Between Project Columns
```bash
# First, get the project ID
gh api repos/owner/repo/projects

# Then move the issue
gh api repos/owner/repo/projects/PROJECT_ID/columns/COLUMN_ID/cards \
  -f content_id=ISSUE_ID \
  -f content_type=Issue
```

## 🎯 Workflow Integration

### Daily Workflow
1. **Start the day**: Move today's issues to "In Progress"
2. **Work on tasks**: Follow the vibecode plan for that day
3. **Update progress**: Comment on issues with progress
4. **Complete tasks**: Move issues to "Done" when finished

### Weekly Workflow
1. **Week planning**: Review the week's project board
2. **Sprint setup**: Assign team members to issues
3. **Daily standups**: Use project board for status updates
4. **Week review**: Close completed issues and plan next week

### Automation Ideas
- **Auto-assign**: Assign issues based on team member expertise
- **Auto-label**: Automatically label issues based on content
- **Auto-move**: Move issues to "Done" when PRs are merged
- **Auto-close**: Close issues when milestones are completed

## 🔄 Updating the Plan

### Adding New Days
1. Add the day directory to vibecode structure
2. Create the README.md with detailed plan
3. Run the conversion script again
4. **Only new issues will be created** (existing ones are skipped)

### Modifying Existing Days
1. Update the vibecode README.md files
2. Update corresponding GitHub issues manually
3. Or delete and recreate issues using the script

### Adding New Weeks
1. Add the week directory to vibecode structure
2. Create plan.md and day directories
3. Run the conversion script again
4. **Only new project boards and issues will be created**



## 🚨 Troubleshooting

### Common Issues

#### GitHub CLI Not Authenticated
```bash
gh auth login
```

#### Repository Not Found
```bash
git remote -v
# Make sure origin is set to your GitHub repo
```

#### Permission Denied
- Check that your GitHub token has repo permissions
- For organization repos, ensure you have write access

#### Issues Not Created
- Check GitHub API rate limits
- Verify the vibecode directory structure
- Look for errors in the script output

### Debug Mode
```bash
# Enable debug output
set -x
./scripts/create_github_issues.sh
```

## 📈 Metrics and Reporting

### Issue Statistics
```bash
# Count issues by week
gh issue list --label vibecode --json number,labels | jq '.[] | select(.labels[].name | startswith("week-")) | .labels[].name' | sort | uniq -c

# Count issues by type
gh issue list --label vibecode --json number,labels | jq '.[] | select(.labels[].name | IN("cli", "rules", "output", "testing", "error-handling")) | .labels[].name' | sort | uniq -c
```

### Project Progress
```bash
# View project board
gh api repos/owner/repo/projects/PROJECT_ID
```

## 🎯 Best Practices

### Issue Management
- **Keep issues small**: One issue per day, break down if needed
- **Update regularly**: Comment on progress and blockers
- **Link to code**: Reference specific files and commits
- **Use labels**: Tag issues appropriately for filtering

### Project Board Management
- **Regular updates**: Move issues as work progresses
- **Team visibility**: Use board for standups and planning
- **Automation**: Set up rules for auto-moving issues
- **Cleanup**: Archive completed projects

### Documentation
- **Keep vibecode updated**: Sync changes back to vibecode directory
- **Update READMEs**: Keep day plans current with actual progress
- **Share learnings**: Document insights in issue comments

## 🔮 Future Enhancements

### Planned Features
- **Auto-sync**: Keep vibecode and GitHub issues in sync
- **Progress tracking**: Automatic progress reporting
- **Team assignment**: Smart assignment based on skills
- **Integration**: Connect with CI/CD pipelines

### Customization
- **Custom labels**: Add project-specific labels
- **Custom templates**: Modify issue templates for your needs
- **Custom workflows**: Adapt to your team's workflow
- **Custom automation**: Add your own automation rules

## 📞 Support

For issues with the conversion scripts:
1. Check the troubleshooting section
2. Review the script output for errors
3. Verify your GitHub permissions
4. Create an issue in the repository

For questions about the vibecode structure:
1. Review the vibecode directory documentation
2. Check the individual day README files
3. Refer to the main project documentation 