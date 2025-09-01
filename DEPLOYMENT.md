# Deploying to Vercel

This guide covers deploying your Turborepo monorepo to Vercel.

## Prerequisites

- Vercel account
- GitHub/GitLab repository connected to Vercel
- Bun package manager (already configured)

## Deployment Methods

### Method 1: Vercel Dashboard (Recommended)

1. **Import Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub/GitLab repository
   - Vercel will automatically detect the monorepo structure

2. **Configure Project Settings**
   - **Framework Preset**: No Framework (monorepo)
   - **Root Directory**: `/` (root of monorepo)
   - **Build Command**: `turbo build`
   - **Install Command**: `bun install`
   - **Output Directory**: Leave empty (handled by app-specific configs)

3. **Environment Variables**
   - Add any required environment variables from your `.env` files
   - For remote caching (optional):
     - `TURBO_TEAM`: Your Vercel team name
     - `TURBO_TOKEN`: Your Vercel token

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your applications

### Method 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Root**
   ```bash
   cd kirmadai-new
   vercel
   ```

4. **Follow the prompts**
   - Link to existing project or create new
   - Set build settings
   - Deploy

## Project Structure

```
kirmadai-new/
├── vercel.json              # Root monorepo config
├── turbo.json               # Turborepo configuration
├── apps/
│   ├── web/
│   │   ├── vercel.json     # Web app config
│   │   └── package.json
│   └── server/
│       ├── vercel.json     # Server app config
│       └── package.json
└── package.json
```

## Configuration Files

### Root `vercel.json`
- Configures the monorepo build process
- Sets Bun as the package manager
- Defines global build command

### App-specific `vercel.json`
- `apps/web/vercel.json`: Configures the Next.js web app
- `apps/server/vercel.json`: Configures the Next.js API server

### `turbo.json`
- Defines build dependencies and outputs
- Optimizes build caching
- Manages workspace relationships

## Build Process

1. **Install Dependencies**
   ```bash
   bun install
   ```

2. **Build All Apps**
   ```bash
   turbo build
   ```

3. **Build Specific App**
   ```bash
   turbo build --filter=web
   turbo build --filter=server
   ```

## Remote Caching (Optional)

Enable Turborepo remote caching for faster builds:

1. **Authenticate with Vercel**
   ```bash
   npx turbo login
   ```

2. **Link to Remote Cache**
   ```bash
   npx turbo link
   ```

3. **Set Environment Variables**
   ```bash
   TURBO_TEAM=your-team-name
   TURBO_TOKEN=your-token
   ```

## Environment Variables

### Required Variables
- Database connection strings
- API keys
- Authentication secrets

### Optional Variables
- `TURBO_TEAM`: For remote caching
- `TURBO_TOKEN`: For remote caching

## Troubleshooting

### Build Failures
```bash
# View build logs
vercel logs

# Check Turborepo status
turbo run build --dry-run
```

### Cache Issues
```bash
# Clear local cache
turbo run build --force

# Verify remote cache
turbo run build --remote-only
```

### Common Issues
1. **Output directory errors**: Check `outputs` in `turbo.json`
2. **Build dependency issues**: Verify `dependsOn` configuration
3. **Package manager issues**: Ensure Bun is available in Vercel environment

## Deployment URLs

After deployment, you'll get:
- **Web App**: `https://your-project.vercel.app`
- **API Server**: `https://your-project.vercel.app/api/*`

## Best Practices

1. **Use Turborepo caching**: Leverage `turbo build` for faster deployments
2. **Environment variables**: Set all required env vars in Vercel dashboard
3. **Build optimization**: Ensure `outputs` are correctly specified in `turbo.json`
4. **Dependency management**: Use Bun for consistent package management

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Next.js Documentation](https://nextjs.org/docs)
