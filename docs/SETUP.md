# Setup Guide

This guide will help you set up Sur-Realista for local development.

## Prerequisites

- Node.js 18+ and npm/yarn
- Git
- Supabase account
- OpenAI API key (for AI features)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database Configuration
POSTGRES_URL=your_postgres_connection_string
POSTGRES_PRISMA_URL=your_postgres_prisma_url
POSTGRES_URL_NON_POOLING=your_postgres_non_pooling_url

# AI Configuration
OPENAI_API_KEY=your_openai_api_key

# External Integrations (Optional)
SII_API_KEY=your_sii_api_key
CIREN_API_KEY=your_ciren_api_key
GOOGLE_DRIVE_API_KEY=your_google_drive_api_key
\`\`\`

## Installation Steps

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd sur-realista
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Set up the database**
   \`\`\`bash
   # Run the database setup script
   npm run db:setup
   
   # Or manually run the SQL files in order:
   # 1. database/schema/001_initial_setup.sql
   # 2. database/schema/002_ai_features.sql
   # 3. database/schema/003_integrations.sql
   \`\`\`

4. **Seed the database (optional)**
   \`\`\`bash
   npm run db:seed
   \`\`\`

5. **Start the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Database Setup

### Supabase Setup

1. Create a new Supabase project
2. Copy the project URL and anon key to your `.env.local`
3. Run the database schema files in the `database/schema/` directory
4. Enable Row Level Security (RLS) policies
5. Set up authentication providers if needed

### Local Database (Alternative)

If you prefer to use a local PostgreSQL instance:

1. Install PostgreSQL
2. Create a new database
3. Update the `POSTGRES_URL` in your `.env.local`
4. Run the schema files

## Verification

After setup, verify everything is working:

1. **Database Connection**: Check that tables are created
2. **Authentication**: Try signing up/in
3. **AI Features**: Test property analysis (requires OpenAI key)
4. **External APIs**: Test SII/CIREN integrations (requires API keys)

## Common Issues

See the [Troubleshooting Guide](./TROUBLESHOOTING.md) for solutions to common setup issues.

## Next Steps

- Read the [Development Guide](./DEVELOPMENT.md) for development workflow
- Check out the [User Guides](./user-guides/) to understand the features
- Review the [API Documentation](./API.md) for backend integration

---

*Need help? Check the troubleshooting guide or contact the development team.*
