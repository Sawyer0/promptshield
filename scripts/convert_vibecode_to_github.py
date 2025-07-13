#!/usr/bin/env python3
"""
Convert vibecode directory structure to GitHub issues and projects.

This script reads the vibecode directory structure and creates:
1. GitHub issues for each day's tasks
2. GitHub project boards for each week
3. Milestones for each week
4. Labels for different task types and priorities

Usage:
    python scripts/convert_vibecode_to_github.py --token YOUR_GITHUB_TOKEN --repo owner/repo
"""

import os
import re
import argparse
import json
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class Task:
    """Represents a task from the vibecode structure."""
    title: str
    description: str
    week: str
    day: str
    priority: str = "medium"
    labels: List[str] = None
    estimated_time: Optional[str] = None
    deliverables: List[str] = None
    code_snippets: List[str] = None
    testing_strategy: Optional[str] = None

@dataclass
class Week:
    """Represents a week from the vibecode structure."""
    name: str
    number: int
    description: str
    goals: List[str]
    tasks: List[Task]

class VibecodeToGitHub:
    def __init__(self, github_token: str, repo: str):
        self.github_token = github_token
        self.repo = repo
        self.vibecode_path = Path("vibecode")

    def parse_markdown_file(self, file_path: Path) -> Dict[str, Any]:
        """Parse a markdown file and extract structured information."""
        if not file_path.exists():
            return {}

        content = file_path.read_text(encoding='utf-8')

        # Extract sections using regex
        sections = {}

        # Extract goals
        goals_match = re.search(r'## 🎯 \*\*Today\'s Goal\*\*\n(.*?)(?=\n##|\n$)', content, re.DOTALL)
        if goals_match:
            sections['goal'] = goals_match.group(1).strip()

        # Extract success criteria
        success_match = re.search(r'## ✅ \*\*Success Criteria\*\*\n(.*?)(?=\n##|\n$)', content, re.DOTALL)
        if success_match:
            sections['success_criteria'] = success_match.group(1).strip()

        # Extract tasks
        tasks_match = re.search(r'## 🛠️ \*\*Tasks Breakdown\*\*\n(.*?)(?=\n##|\n$)', content, re.DOTALL)
        if tasks_match:
            sections['tasks'] = tasks_match.group(1).strip()

        # Extract deliverables
        deliverables_match = re.search(r'\*\*Deliverables:\*\*\n(.*?)(?=\n\*\*|$)', content, re.DOTALL)
        if deliverables_match:
            sections['deliverables'] = deliverables_match.group(1).strip()

        # Extract code snippets
        code_snippets = re.findall(r'```(?:javascript|bash|json|yaml)\n(.*?)```', content, re.DOTALL)
        if code_snippets:
            sections['code_snippets'] = code_snippets

        # Extract testing strategy
        testing_match = re.search(r'## 🧪 \*\*Testing Strategy\*\*\n(.*?)(?=\n##|\n$)', content, re.DOTALL)
        if testing_match:
            sections['testing_strategy'] = testing_match.group(1).strip()

        return sections

    def parse_week_plan(self, week_path: Path) -> Week:
        """Parse a week's plan.md file."""
        plan_file = week_path / "plan.md"
        if not plan_file.exists():
            return None

        content = plan_file.read_text(encoding='utf-8')

        # Extract week name and description
        name_match = re.search(r'# (.*?)\n', content)
        name = name_match.group(1) if name_match else week_path.name

        # Extract goals
        goals_match = re.search(r'## 🎯 Goals\n(.*?)(?=\n##|\n$)', content, re.DOTALL)
        goals = []
        if goals_match:
            goals_text = goals_match.group(1)
            goals = [goal.strip() for goal in goals_text.split('\n') if goal.strip().startswith('-')]

        return Week(
            name=name,
            number=int(week_path.name.split('_')[0].replace('week', '')),
            description=content[:200] + "..." if len(content) > 200 else content,
            goals=goals,
            tasks=[]
        )

    def parse_day_tasks(self, day_path: Path, week: Week) -> List[Task]:
        """Parse tasks from a day's README.md file."""
        readme_file = day_path / "README.md"
        if not readme_file.exists():
            return []

        sections = self.parse_markdown_file(readme_file)

        tasks = []

        # Create main task for the day
        if 'goal' in sections:
            task = Task(
                title=f"Day {day_path.name.split('_')[0].replace('day', '')}: {sections['goal'][:50]}...",
                description=self._format_task_description(sections),
                week=week.name,
                day=day_path.name,
                deliverables=self._extract_deliverables(sections),
                code_snippets=sections.get('code_snippets', []),
                testing_strategy=sections.get('testing_strategy')
            )
            tasks.append(task)

        # Parse individual tasks from the breakdown
        if 'tasks' in sections:
            task_titles = re.findall(r'### \*\*Task \d+: (.*?)\*\*', sections['tasks'])
            for i, title in enumerate(task_titles, 1):
                task = Task(
                    title=f"Task {i}: {title}",
                    description=f"Part of {day_path.name} - {title}",
                    week=week.name,
                    day=day_path.name,
                    priority="medium"
                )
                tasks.append(task)

        return tasks

    def _format_task_description(self, sections: Dict[str, Any]) -> str:
        """Format task description from parsed sections."""
        description = []

        if 'goal' in sections:
            description.append(f"**Goal:** {sections['goal']}")

        if 'success_criteria' in sections:
            description.append(f"\n**Success Criteria:**\n{sections['success_criteria']}")

        if 'deliverables' in sections:
            description.append(f"\n**Deliverables:**\n{sections['deliverables']}")

        if 'testing_strategy' in sections:
            description.append(f"\n**Testing Strategy:**\n{sections['testing_strategy']}")

        return '\n\n'.join(description)

    def _extract_deliverables(self, sections: Dict[str, Any]) -> List[str]:
        """Extract deliverables from sections."""
        if 'deliverables' not in sections:
            return []

        # Parse checkbox items
        deliverables = []
        for line in sections['deliverables'].split('\n'):
            if line.strip().startswith('- [ ]'):
                deliverables.append(line.strip()[4:].strip())

        return deliverables

    def scan_vibecode_structure(self) -> List[Week]:
        """Scan the vibecode directory and extract all weeks and tasks."""
        weeks = []

        for week_dir in sorted(self.vibecode_path.glob("week*")):
            if not week_dir.is_dir():
                continue

            week = self.parse_week_plan(week_dir)
            if not week:
                continue

            # Parse each day in the week
            for day_dir in sorted(week_dir.glob("day*")):
                if not day_dir.is_dir():
                    continue

                day_tasks = self.parse_day_tasks(day_dir, week)
                week.tasks.extend(day_tasks)

            weeks.append(week)

        return weeks

    def check_github_issue_exists(self, title: str) -> bool:
        """Check if a GitHub issue with the given title already exists."""
        try:
            from github import Github
            g = Github(self.github_token)
            repo = g.get_repo(self.repo)

            # Search for issues with the exact title
            issues = repo.get_issues(state='all', search=title)
            for issue in issues:
                if issue.title == title:
                    return True
            return False
        except Exception as e:
            print(f"Warning: Could not check if issue exists: {e}")
            return False

    def create_github_issue(self, task: Task) -> Dict[str, Any]:
        """Create a GitHub issue from a task."""
        # Check if issue already exists
        if self.check_github_issue_exists(task.title):
            print(f"⚠️  Issue '{task.title}' already exists, skipping")
            return None

        # Determine labels based on task content
        labels = ["vibecode", f"week-{task.week.split('_')[0].replace('week', '')}"]

        if "cli" in task.title.lower() or "command" in task.title.lower():
            labels.append("cli")
        if "test" in task.title.lower():
            labels.append("testing")
        if "rule" in task.title.lower():
            labels.append("rules")
        if "output" in task.title.lower():
            labels.append("output")
        if "error" in task.title.lower():
            labels.append("error-handling")

        # Add priority label
        labels.append(f"priority-{task.priority}")

        # Format the issue body
        body = f"""## Task Description
{task.description}

## Week & Day
- **Week:** {task.week}
- **Day:** {task.day}

## Deliverables
"""

        if task.deliverables:
            for deliverable in task.deliverables:
                body += f"- [ ] {deliverable}\n"
        else:
            body += "- [ ] Complete the task\n"

        if task.code_snippets:
            body += "\n## Code Snippets\n"
            for i, snippet in enumerate(task.code_snippets, 1):
                body += f"```\n{snippet}\n```\n"

        if task.testing_strategy:
            body += f"\n## Testing Strategy\n{task.testing_strategy}\n"

        body += f"""
## Notes
- This task is part of the vibecode development plan
- Follow the detailed instructions in the vibecode directory
- Update this issue with progress and blockers
"""

        return {
            "title": task.title,
            "body": body,
            "labels": labels,
            "assignees": [],
            "milestone": f"Week {task.week.split('_')[0].replace('week', '')}"
        }

    def check_github_project_exists(self, name: str) -> bool:
        """Check if a GitHub project with the given name already exists."""
        try:
            from github import Github
            g = Github(self.github_token)
            repo = g.get_repo(self.repo)

            # Get all projects
            projects = repo.get_projects()
            for project in projects:
                if project.name == name:
                    return True
            return False
        except Exception as e:
            print(f"Warning: Could not check if project exists: {e}")
            return False

    def create_github_project(self, week: Week) -> Dict[str, Any]:
        """Create a GitHub project board for a week."""
        project_name = f"PromptShield {week.name}"

        # Check if project already exists
        if self.check_github_project_exists(project_name):
            print(f"⚠️  Project '{project_name}' already exists, skipping")
            return None

        return {
            "name": project_name,
            "description": f"Development board for {week.name}",
            "columns": [
                {"name": "To Do", "cards": []},
                {"name": "In Progress", "cards": []},
                {"name": "Done", "cards": []}
            ]
        }

    def generate_github_actions(self, weeks: List[Week]) -> str:
        """Generate GitHub Actions workflow for creating issues and projects."""
        workflow = """name: Create Vibecode Issues and Projects

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
"""

        return workflow

    def generate_issue_templates(self) -> Dict[str, str]:
        """Generate issue templates for different task types."""
        templates = {
            "task.md": """---
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
""",

            "bug.md": """---
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
""",

            "feature.md": """---
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
"""
        }

        return templates

    def generate_project_templates(self, weeks: List[Week]) -> Dict[str, Any]:
        """Generate project board templates."""
        templates = {}

        for week in weeks:
            templates[f"project-{week.name}.json"] = {
                "name": f"PromptShield {week.name}",
                "description": f"Development board for {week.name}",
                "columns": [
                    {"name": "Backlog", "cards": []},
                    {"name": "To Do", "cards": []},
                    {"name": "In Progress", "cards": []},
                    {"name": "Review", "cards": []},
                    {"name": "Done", "cards": []}
                ]
            }

        return templates

    def generate_labels_config(self) -> List[Dict[str, str]]:
        """Generate GitHub labels configuration."""
        return [
            # Vibecode labels
            {"name": "vibecode", "color": "0366d6", "description": "Tasks from vibecode development plan"},
            {"name": "week-1", "color": "fbca04", "description": "Week 1 tasks"},
            {"name": "week-2", "color": "fbca04", "description": "Week 2 tasks"},
            {"name": "week-3", "color": "fbca04", "description": "Week 3 tasks"},
            {"name": "week-4", "color": "fbca04", "description": "Week 4 tasks"},

            # Task type labels
            {"name": "cli", "color": "d93f0b", "description": "CLI-related tasks"},
            {"name": "rules", "color": "0e8a16", "description": "Rule system tasks"},
            {"name": "output", "color": "1d76db", "description": "Output formatting tasks"},
            {"name": "testing", "color": "5319e7", "description": "Testing tasks"},
            {"name": "error-handling", "color": "b60205", "description": "Error handling tasks"},

            # Priority labels
            {"name": "priority-high", "color": "b60205", "description": "High priority"},
            {"name": "priority-medium", "color": "fbca04", "description": "Medium priority"},
            {"name": "priority-low", "color": "0e8a16", "description": "Low priority"},

            # Status labels
            {"name": "blocked", "color": "b60205", "description": "Blocked by another issue"},
            {"name": "ready", "color": "0e8a16", "description": "Ready to work on"},
            {"name": "in-progress", "color": "fbca04", "description": "Currently being worked on"}
        ]

    def generate_milestones(self, weeks: List[Week]) -> List[Dict[str, Any]]:
        """Generate milestone configurations."""
        milestones = []

        for week in weeks:
            # Calculate milestone dates (assuming 4 weeks from now)
            start_date = datetime.now() + timedelta(weeks=week.number-1)
            due_date = start_date + timedelta(weeks=1)

            milestones.append({
                "title": f"Week {week.number}: {week.name}",
                "description": f"Development milestone for {week.name}",
                "state": "open",
                "due_on": due_date.isoformat()
            })

        return milestones

    def save_outputs(self, weeks: List[Week], output_dir: str = "github_outputs"):
        """Save all generated outputs to files."""
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)

        # Generate issues
        issues = []
        for week in weeks:
            for task in week.tasks:
                issue = self.create_github_issue(task)
                if issue:  # Only add if issue was created (not skipped)
                    issues.append(issue)

        with open(output_path / "issues.json", "w") as f:
            json.dump(issues, f, indent=2)

        # Generate projects
        projects = []
        for week in weeks:
            project = self.create_github_project(week)
            if project:  # Only add if project was created (not skipped)
                projects.append(project)

        with open(output_path / "projects.json", "w") as f:
            json.dump(projects, f, indent=2)

        # Generate labels
        labels = self.generate_labels_config()
        with open(output_path / "labels.json", "w") as f:
            json.dump(labels, f, indent=2)

        # Generate milestones
        milestones = self.generate_milestones(weeks)
        with open(output_path / "milestones.json", "w") as f:
            json.dump(milestones, f, indent=2)

        # Generate issue templates
        templates = self.generate_issue_templates()
        templates_dir = output_path / "issue_templates"
        templates_dir.mkdir(exist_ok=True)

        for name, content in templates.items():
            with open(templates_dir / name, "w") as f:
                f.write(content)

        # Generate project templates
        project_templates = self.generate_project_templates(weeks)
        for name, content in project_templates.items():
            with open(output_path / name, "w") as f:
                json.dump(content, f, indent=2)

        # Generate GitHub Actions workflow
        workflow = self.generate_github_actions(weeks)
        workflows_dir = output_path / "workflows"
        workflows_dir.mkdir(exist_ok=True)

        with open(workflows_dir / "create-vibecode-issues.yml", "w") as f:
            f.write(workflow)

        # Generate summary report
        summary = {
            "total_weeks": len(weeks),
            "total_tasks": sum(len(week.tasks) for week in weeks),
            "weeks": [
                {
                    "name": week.name,
                    "task_count": len(week.tasks),
                    "goals": week.goals
                }
                for week in weeks
            ]
        }

        with open(output_path / "summary.json", "w") as f:
            json.dump(summary, f, indent=2)

        print(f"Generated outputs in {output_path}/")
        print(f"- {len(issues)} issues")
        print(f"- {len(projects)} projects")
        print(f"- {len(labels)} labels")
        print(f"- {len(milestones)} milestones")
        print(f"- Issue templates")
        print(f"- Project templates")
        print(f"- GitHub Actions workflow")

def main():
    parser = argparse.ArgumentParser(description="Convert vibecode to GitHub issues and projects")
    parser.add_argument("--token", help="GitHub token")
    parser.add_argument("--repo", help="GitHub repository (owner/repo)")
    parser.add_argument("--output-dir", default="github_outputs", help="Output directory")

    args = parser.parse_args()

    converter = VibecodeToGitHub(args.token or "dummy", args.repo or "owner/repo")
    weeks = converter.scan_vibecode_structure()

    if not weeks:
        print("No weeks found in vibecode directory")
        return

    converter.save_outputs(weeks, args.output_dir)

    print("\nNext steps:")
    print("1. Review the generated files in github_outputs/")
    print("2. Copy issue templates to .github/ISSUE_TEMPLATE/")
    print("3. Copy workflow to .github/workflows/")
    print("4. Use the JSON files to create issues and projects via GitHub API")
    print("5. Or use the GitHub CLI to create them manually")

if __name__ == "__main__":
    main()
