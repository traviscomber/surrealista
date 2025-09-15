# Database Documentation

## Structure

- **schema/** - Database schema definitions organized by version
- **migrations/** - Database migration scripts with rollback support
- **functions/** - PostgreSQL functions and stored procedures
- **scripts/** - Utility scripts for seeding and maintenance

## Schema Versions

- **001_initial_setup.sql** - Core tables (properties, users, images)
- **002_ai_features.sql** - AI and ML related tables
- **003_integrations.sql** - External integration tables (SII, SIRENE, CIREN)

## Running Migrations

1. Execute schema files in order (001, 002, 003...)
2. Run migration scripts as needed
3. Use the provided TypeScript scripts for seeding

## Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
