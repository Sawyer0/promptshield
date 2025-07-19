# PromptShield Private NPM Package Guide

## Publishing to a Private NPM Registry

### Prerequisites

- Access to your private npm registry
- npm authentication configured for your registry

### 1. Configure NPM for Your Private Registry

```bash
# Set your private registry (replace with your actual registry URL)
npm config set registry https://your-private-registry.com

# Or use a scoped registry for this package
npm config set @yourscope:registry https://your-private-registry.com

# Authenticate to your registry
npm login --registry https://your-private-registry.com
```

### 2. Build the Package

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Run tests to ensure everything works
npm test
```

### 3. Publish the Package

```bash
# Publish to your private registry
npm publish

# Or if using a scoped package
npm publish --access restricted
```

### 4. Installing the Private Package

On machines that need to use this package:

```bash
# Configure npm to use your private registry
npm config set registry https://your-private-registry.com

# Or for scoped packages
npm config set @yourscope:registry https://your-private-registry.com

# Install the package
npm install promptshield

# Or install globally for CLI usage
npm install -g promptshield
```

### 5. Using .npmrc for Team Configuration

Create a `.npmrc` file in your project:

```
registry=https://your-private-registry.com
# Or for scoped packages
@yourscope:registry=https://your-private-registry.com
```

### 6. Version Management

To publish a new version:

```bash
# Update version (patch, minor, or major)
npm version patch

# Build and publish
npm run build
npm publish
```

### 7. Local Testing Before Publishing

```bash
# Create a local package
npm pack

# This creates promptshield-1.0.0.tgz
# Install it locally in another project for testing
cd /path/to/test/project
npm install /path/to/promptshield-1.0.0.tgz
```

## Common Private Registry Options

### Option 1: Verdaccio (Self-hosted)

```bash
# Install Verdaccio
npm install -g verdaccio

# Run Verdaccio
verdaccio

# Publish to local Verdaccio
npm publish --registry http://localhost:4873
```

### Option 2: Nexus Repository Manager

- Configure npm to point to your Nexus npm repository
- Use npm login with your Nexus credentials

### Option 3: Artifactory

- Similar to Nexus, configure npm to use your Artifactory npm repository

### Option 4: AWS CodeArtifact

```bash
# Configure AWS CodeArtifact
aws codeartifact login --tool npm --repository my-repo --domain my-domain

# Publish
npm publish
```

## Security Considerations

1. **Keep the package private**: The `"private": true` flag in package.json prevents accidental public publishing
2. **Use authentication**: Always require authentication for your private registry
3. **Audit dependencies**: Run `npm audit` regularly
4. **Use exact versions**: Consider using `npm shrinkwrap` or `package-lock.json` for reproducible builds

## Troubleshooting

### Authentication Issues

```bash
# Clear npm cache and re-login
npm cache clean --force
npm logout
npm login --registry https://your-private-registry.com
```

### Publishing Errors

- Ensure you have publish permissions on the registry
- Check that the package name isn't already taken
- Verify your npm authentication token is valid

### Installation Issues

- Verify registry configuration with `npm config list`
- Check network connectivity to your private registry
- Ensure the package version exists in the registry
