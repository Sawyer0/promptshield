# CI/CD Pipeline Documentation

## Overview

PromptShield uses GitHub Actions for comprehensive CI/CD automation. The pipeline includes security scanning, testing, dependency management, output validation, and deployment workflows.

## Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers:** Pull requests and pushes to `main` and `develop` branches

**Jobs:**

- **Validate**: Comprehensive validation (type-check, lint, format, security)
- **Security**: npm audit and Snyk vulnerability scanning
- **Lint & Format**: Code formatting and linting checks
- **Test**: Multi-node testing with coverage reporting
- **Integration Tests**: End-to-end testing
- **Output Validation**: CLI output format validation
- **Performance Tests**: Performance benchmarking
- **Build Artifacts**: Creates and uploads build artifacts
- **Dependency Review**: Automated dependency vulnerability review

**Features:**

- Multi-node testing (Node.js 16, 18, 20)
- Code coverage reporting with Codecov integration
- Parallel job execution for faster feedback
- Artifact retention for 30 days
- Output format validation for JSON and Markdown
- CLI functionality testing with real RulePacks

### 2. Release Workflow (`release.yml`)

**Triggers:** Tag pushes (v\*) and manual dispatch

**Jobs:**

- **Validate**: Comprehensive validation before release
- **Release**: Automated npm publishing and GitHub release creation
- **Notify**: Success/failure notifications

**Features:**

- Automated changelog generation
- NPM package publishing
- GitHub release creation with assets
- Release notifications

### 3. Security Workflow (`security.yml`)

**Triggers:** Weekly schedule, PRs, and manual dispatch

**Jobs:**

- **SAST**: CodeQL static analysis
- **Dependency Scan**: npm audit and Snyk scanning
- **Secret Scan**: Gitleaks for secret detection
- **Container Scan**: Trivy vulnerability scanning
- **License Compliance**: Dependency license checking

**Features:**

- Weekly automated security scans
- SARIF output for GitHub Security tab
- Comprehensive vulnerability assessment

### 4. Deploy Workflow (`deploy.yml`)

**Triggers:** Pushes to `develop` and manual dispatch

**Jobs:**

- **Validate Deployment**: Pre-deployment validation
- **Deploy Staging**: Staging environment deployment
- **Deploy Production**: Production environment deployment
- **Notify**: Deployment status notifications

**Features:**

- Environment-specific deployments
- Artifact creation and retention
- Deployment validation

### 5. Dependencies Workflow (`dependencies.yml`)

**Triggers:** Weekly schedule and manual dispatch

**Jobs:**

- **Update Dependencies**: Automated dependency updates
- **Security Updates**: Security vulnerability fixes
- **Maintenance**: Dependency cleanup and reporting

**Features:**

- Weekly dependency updates
- Automated PR creation for updates
- Dependency health reporting

## Local Development

### Prerequisites

```bash
# Install dependencies
npm install

# Install development tools
npm install -g typescript jest eslint prettier
```

### Available Commands

```bash
# Full validation
npm run validate

# Output validation
npm run validate:output

# Testing
npm run test              # All tests
npm run test:coverage     # Tests with coverage
npm run test:integration  # Integration tests
npm run test:performance  # Performance tests

# Code Quality
npm run lint              # Lint code
npm run lint:fix          # Fix linting issues
npm run format            # Format code
npm run format:check      # Check formatting
npm run type-check        # Type checking

# Security
npm run security:audit    # Security audit
npm run security:fix      # Fix vulnerabilities

# Dependencies
npm run deps:check        # Check outdated deps
npm run deps:update       # Update dependencies
npm run deps:clean        # Clean and reinstall

# Build
npm run build             # Build project
npm run clean             # Clean build artifacts

# CI/CD Pipeline
make ci                   # Run full CI pipeline
make release-prep         # Prepare for release
```

### Makefile Commands

```bash
# Quick commands
make install              # Install dependencies
make test                 # Run tests
make lint                 # Lint code
make format               # Format code
make validate             # Full validation
make validate-output      # Validate CLI output formats
make security             # Security audit
make build                # Build project
make ci                   # Run CI pipeline
make help                 # Show all commands
```

## Output Validation

### Purpose

The output validation job ensures that CLI output formats remain consistent and valid across releases. This is critical for:

- **API Consumers**: Ensures consistent JSON output structure
- **Integration Testing**: Validates output format compatibility
- **Regression Prevention**: Catches breaking changes in output structure
- **Quality Assurance**: Tests actual CLI execution with real data

### What It Tests

1. **JSON Output Structure**: Validates required fields and data types
2. **Markdown Output Format**: Checks for required sections and formatting
3. **Clean Data Scenarios**: Ensures no violations are reported for clean files
4. **RulePack Testing**: Tests output with different RulePacks (PII, Bias)
5. **Severity and Category Validation**: Ensures proper enum values

### Integration

- Runs after tests pass but before build artifacts
- Fails CI if output validation fails
- Tests with real fixtures and RulePacks
- Validates both JSON and Markdown outputs

## GitHub Secrets

The following secrets are required for the CI/CD pipeline:

### Required Secrets

- `NPM_TOKEN`: NPM authentication token for publishing
- `SNYK_TOKEN`: Snyk authentication token for security scanning

### Optional Secrets

- `CODECOV_TOKEN`: Codecov token for coverage reporting
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## Environment Setup

### Staging Environment

- **Branch**: `develop`
- **Deployment**: Automatic on push
- **Artifacts**: 7-day retention

### Production Environment

- **Branch**: `main`
- **Deployment**: Manual via workflow dispatch
- **Artifacts**: 30-day retention

## Security Features

### Automated Scanning

1. **Static Analysis**: CodeQL for JavaScript/TypeScript
2. **Dependency Scanning**: npm audit and Snyk
3. **Secret Detection**: Gitleaks for credential scanning
4. **Container Scanning**: Trivy for container vulnerabilities
5. **License Compliance**: Dependency license checking

### Security Gates

- All PRs require passing security scans
- Moderate+ vulnerabilities block merges
- Weekly security scanning schedule
- Automated vulnerability fixes

## Testing Strategy

### Test Types

1. **Unit Tests**: Jest-based unit testing
2. **Integration Tests**: End-to-end functionality
3. **Performance Tests**: Performance benchmarking
4. **Security Tests**: Vulnerability testing
5. **Output Validation**: CLI output format testing

### Coverage Requirements

- Minimum 90% code coverage
- All critical paths must be tested
- Integration tests for all major features
- Performance regression testing
- Output format validation for all formats

## Deployment Strategy

### Staging Deployment

- Automatic deployment on `develop` branch
- Full validation before deployment
- Artifact creation and storage
- 7-day artifact retention

### Production Deployment

- Manual deployment via workflow dispatch
- Comprehensive validation required
- Release notes generation
- NPM package publishing
- GitHub release creation

## Monitoring and Observability

### Metrics Tracked

- Build success/failure rates
- Test coverage trends
- Security vulnerability counts
- Deployment frequency
- Performance metrics
- Output validation success rates

### Notifications

- Slack/Teams integration (configurable)
- Email notifications for failures
- GitHub issue creation for security issues
- Release notifications

## Troubleshooting

### Common Issues

1. **Build Failures**

   ```bash
   # Check for TypeScript errors
   npm run type-check

   # Check for linting issues
   npm run lint

   # Check for formatting issues
   npm run format:check
   ```

2. **Test Failures**

   ```bash
   # Run tests locally
   npm run test

   # Run with verbose output
   npm run test -- --verbose
   ```

3. **Output Validation Failures**

   ```bash
   # Run output validation locally
   npm run validate:output

   # Check CLI output manually
   node bin/promptshield scan tests/fixtures/violations.json --rulepack rulepacks/pii.yaml --output json
   ```

4. **Security Issues**

   ```bash
   # Run security audit
   npm run security:audit

   # Fix vulnerabilities
   npm run security:fix
   ```

5. **Dependency Issues**

   ```bash
   # Check outdated dependencies
   npm run deps:check

   # Update dependencies
   npm run deps:update

   # Clean and reinstall
   npm run deps:clean
   ```

### Debug Workflows

1. **Enable Debug Logging**

   ```bash
   # Set debug flag
   export ACTIONS_STEP_DEBUG=true
   ```

2. **Re-run Failed Jobs**

   - Use GitHub Actions UI to re-run specific jobs
   - Check workflow logs for detailed error messages

3. **Local Validation**
   ```bash
   # Run full CI pipeline locally
   make ci
   ```

## Best Practices

### Development Workflow

1. **Feature Development**

   - Create feature branch from `develop`
   - Write tests for new functionality
   - Ensure all CI checks pass
   - Create PR to `develop`

2. **Release Process**

   - Merge `develop` to `main`
   - Create and push version tag
   - Monitor release workflow
   - Verify NPM package and GitHub release

3. **Security Maintenance**
   - Review weekly security reports
   - Address security vulnerabilities promptly
   - Update dependencies regularly
   - Monitor for new vulnerabilities

### Code Quality

1. **Pre-commit Hooks**

   - Use pre-commit hooks for local validation
   - Run `npm run validate` before commits
   - Ensure tests pass locally

2. **PR Requirements**

   - All CI checks must pass
   - Code coverage must not decrease
   - No security vulnerabilities
   - Proper documentation updates
   - Output validation must pass

3. **Release Quality**
   - Full test suite passes
   - Security audit clean
   - Performance benchmarks met
   - Documentation updated
   - Output formats validated

## Contributing

### Adding New Workflows

1. Create workflow file in `.github/workflows/`
2. Follow existing naming conventions
3. Include proper documentation
4. Add to this documentation

### Modifying Existing Workflows

1. Test changes locally first
2. Update documentation
3. Consider backward compatibility
4. Test in staging environment

### Workflow Best Practices

1. **Idempotency**: Workflows should be rerunnable
2. **Failure Handling**: Proper error handling and notifications
3. **Performance**: Optimize for speed and resource usage
4. **Security**: Follow least privilege principle
5. **Monitoring**: Include proper logging and metrics
