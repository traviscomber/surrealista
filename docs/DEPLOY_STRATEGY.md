# Production Deployment & Release Strategy

## Issue #10: Deploy Strategy Checklist / Review

### Current Deployment Configuration

**Production URL:** https://sur-realista.vercel.app
**Staging URL:** https://sur-realista-git-staging.vercel.app
**Development:** http://localhost:3000

**Current Config:** `vercel.json`
```json
{
  "buildCommand": "next build",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

---

## Critical Environment Variables

### Missing Configuration (Status: ⚠️ INCOMPLETE)

```bash
# Database (Supabase)
✅ NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
✅ SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
❌ OPENAI_API_KEY=sk-xxx (MISSING IN PRODUCTION)
❌ ANTHROPIC_API_KEY=sk-xxx (Optional)

# External APIs
❌ GOOGLE_DRIVE_CLIENT_ID=xxx (MISSING - KMZ Search)
❌ GOOGLE_DRIVE_CLIENT_SECRET=xxx (MISSING)
❌ SII_API_KEY=xxx (MISSING - Chilean Registry)
❌ BANCO_CENTRAL_API_KEY=xxx (MISSING)

# Storage
✅ BLOB_READ_WRITE_TOKEN=vercel_blob_xxx

# Authentication
❌ NEXTAUTH_SECRET=xxx (MISSING - Session)
❌ NEXTAUTH_URL=https://sur-realista.vercel.app (MISSING)

# Email (Optional)
❌ SENDGRID_API_KEY=SG-xxx (MISSING)
```

**Status: 6/12 variables configured (50%)**

---

## Pre-Deployment Checklist

### ✅ Code Quality

```bash
# Run checks
□ npm run lint          # Check TypeScript + ESLint
□ npm run type-check   # Full type checking
□ npm test             # Run test suite
□ npm run build        # Ensure build succeeds
```

### ✅ Configuration

```bash
# Set all 12 environment variables in Vercel dashboard
□ NEXT_PUBLIC_SUPABASE_URL
□ NEXT_PUBLIC_SUPABASE_ANON_KEY
□ SUPABASE_SERVICE_ROLE_KEY
□ OPENAI_API_KEY
□ GOOGLE_DRIVE_CLIENT_ID
□ GOOGLE_DRIVE_CLIENT_SECRET
□ SII_API_KEY
□ BANCO_CENTRAL_API_KEY
□ BLOB_READ_WRITE_TOKEN
□ NEXTAUTH_SECRET
□ NEXTAUTH_URL
□ SENDGRID_API_KEY (optional)
```

### ✅ Database

```bash
□ Run migrations: npm run db:migrate
□ Verify schema in Supabase dashboard
□ Create staging backup: pg_dump > backup-$(date +%s).sql
□ Test database connection from Vercel
```

### ✅ Security

```bash
□ Enable branch protection on main
□ Require code review for PRs
□ Set up Dependabot for security updates
□ Configure Vercel secrets (never commit .env)
□ Enable Vercel analytics
□ Set up error tracking (Sentry)
```

### ✅ Monitoring

```bash
□ Set up Sentry for error tracking
□ Configure uptime monitoring (Pingdom/UptimeRobot)
□ Create alerting for API failures
□ Enable Vercel analytics
□ Set up log streaming
```

---

## Deployment Process

### Step 1: Prepare Release

```bash
# Create release branch
git checkout -b release/v1.0.0

# Update version
npm version patch  # or minor/major

# Create release notes
echo "# v1.0.0 Release Notes" > RELEASE_NOTES.md
# ... document changes

# Commit
git add .
git commit -m "chore: release v1.0.0"
git push origin release/v1.0.0
```

### Step 2: Testing on Staging

```bash
# Merge to staging branch
git checkout staging
git merge release/v1.0.0
git push origin staging

# Vercel automatically deploys to staging preview
# URL: https://sur-realista-git-staging.vercel.app

# Run smoke tests
□ Test login flow
□ Test KMZ search with 10 files
□ Test file upload (5MB+)
□ Test search functionality
□ Verify database connectivity
□ Check error logging (Sentry)
```

### Step 3: Production Deployment

```bash
# Create pull request
# PR should include:
# - Release notes
# - Migration scripts (if needed)
# - Known issues / workarounds

# After review and approval:
git checkout main
git merge release/v1.0.0
git tag v1.0.0
git push origin main
git push origin v1.0.0

# Vercel automatically deploys to production
```

### Step 4: Post-Deployment Verification

```bash
# Immediate checks (5 min)
□ Verify production URL responds
□ Check Sentry for new errors
□ Test login flow
□ Verify database queries working

# Extended checks (1 hour)
□ Monitor error rate (should be < 0.1%)
□ Check API response times
□ Verify file uploads working
□ Check KMZ search functionality

# Full verification (24 hours)
□ No critical errors in Sentry
□ All APIs responsive
□ Database backups created
□ User feedback collected
```

---

## Rollback Procedure

```bash
# If critical issue found:

# 1. Identify broken deployment
vercel logs --follow

# 2. Rollback to previous version
vercel rollback

# 3. Or manually redeploy previous commit
git revert HEAD
git push origin main

# 4. Notify team
# - Post incident report
# - Document root cause
# - Plan fix

# 5. After fix is ready, redeploy
```

---

## CI/CD Pipeline Configuration

### Create `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Build
        run: npm run build
      
      - name: Test
        run: npm test -- --coverage
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_TEST }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: success()
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true
      
      - name: Notify on Slack
        if: success()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{"text": "✅ Production deployment successful"}'
      
      - name: Notify on Slack (failure)
        if: failure()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{"text": "❌ Production deployment failed"}'
```

---

## Monitoring Setup

### Install Sentry

```bash
npm install @sentry/nextjs
```

**Create:** `sentry.client.config.ts`

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: false,
});
```

### Add Health Check Endpoint

**Create:** `app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Check database connectivity
    const supabase = await createClient();
    const { error } = await supabase.from('kmz_collection').select('count', { count: 'exact', head: true });
    
    if (error) throw error;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      },
      { status: 503 }
    );
  }
}
```

---

## Backup & Recovery

### Database Backups (Supabase)

```bash
# Enable daily backups in Supabase dashboard:
# Dashboard → Your Project → Settings → Backups
# - Daily backup: ENABLED
# - Retention: 30 days

# Manual backup:
pg_dump --no-password \
  -h db.supabase.co \
  -U postgres \
  -d postgres \
  > backup-$(date +%s).sql

# Restore from backup:
psql -h db.supabase.co -U postgres -d postgres < backup-1234567890.sql
```

### File Storage Backups

```bash
# Vercel Blob backups (automatic)
# - Stored in Vercel's S3-compatible storage
# - Daily snapshots available
# - 30-day retention

# Manual export:
vercel env ls  # List all file storage
```

---

## Performance Targets

```
✅ Lighthouse Score: > 75
✅ First Contentful Paint: < 2s
✅ Time to Interactive: < 5s
✅ API Response Time: < 500ms (p95)
✅ Database Query Time: < 100ms (p95)
✅ Uptime: 99.5% monthly
✅ Error Rate: < 0.1%
```

---

## Incident Response

### Critical Alert Response

```
1. IMMEDIATE (< 5 min)
   - Assess issue severity
   - Notify team in Slack
   - Check Sentry for root cause

2. SHORT TERM (< 15 min)
   - Implement hotfix or rollback
   - Deploy emergency fix
   - Verify deployment succeeded

3. POST-INCIDENT (< 24 hours)
   - Document root cause
   - Create improvement task
   - Schedule postmortem
   - Update runbooks
```

---

## Related Issues

- #10: Deploy Strategy Checklist / Review
- #7: Testing Checklist for Document Management and KMZ System
- #8: Debug KMZ Search Feature Reliability
- #9: Optimize File/Image Upload Pipeline
