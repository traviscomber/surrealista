# Development Guide

This guide covers the development workflow, coding standards, and best practices for Sur-Realista.

## Development Workflow

### Branch Strategy

- `main` - Production branch
- `develop` - Development branch
- `feature/*` - Feature branches
- `hotfix/*` - Hotfix branches

### Commit Convention

Use conventional commits:
\`\`\`
feat: add property search functionality
fix: resolve authentication redirect issue
docs: update API documentation
style: format code with prettier
refactor: reorganize component structure
test: add unit tests for property service
\`\`\`

## Project Structure

\`\`\`
sur-realista/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Admin/Agent dashboard routes
│   ├── (features)/        # Main feature routes
│   ├── api/               # API routes
│   └── auth/              # Authentication routes
├── components/            # React components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── shared/           # Shared components
│   ├── layout/           # Layout components
│   ├── properties/       # Property-specific components
│   ├── ai/               # AI-related components
│   └── admin/            # Admin components
├── lib/                  # Utilities and services
│   ├── core/            # Core functionality
│   ├── services/        # External service integrations
│   ├── data/            # Data processing utilities
│   └── utils/           # General utilities
├── database/            # Database schema and migrations
│   ├── schema/          # Database schema files
│   ├── migrations/      # Migration files
│   └── functions/       # Database functions
└── docs/               # Documentation
\`\`\`

## Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Define interfaces for all data structures
- Use proper type annotations
- Avoid `any` type

\`\`\`typescript
// Good
interface Property {
  id: string;
  title: string;
  price: number;
  location: {
    address: string;
    coordinates: [number, number];
  };
}

// Bad
const property: any = { ... };
\`\`\`

### React Components

- Use functional components with hooks
- Implement proper error boundaries
- Use TypeScript for props
- Follow naming conventions

\`\`\`typescript
// Good
interface PropertyCardProps {
  property: Property;
  onSelect: (id: string) => void;
}

export function PropertyCard({ property, onSelect }: PropertyCardProps) {
  return (
    <div className="property-card">
      {/* Component content */}
    </div>
  );
}
\`\`\`

### Styling

- Use Tailwind CSS for styling
- Follow the design system
- Use semantic class names
- Implement responsive design

\`\`\`typescript
// Good
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
  <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
  <Button variant="primary" size="sm">Action</Button>
</div>
\`\`\`

### API Routes

- Use proper HTTP methods
- Implement error handling
- Add request validation
- Include proper TypeScript types

\`\`\`typescript
// Good
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }
    
    const property = await getProperty(id);
    return NextResponse.json(property);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
\`\`\`

## Database Guidelines

### Schema Design

- Use descriptive table and column names
- Implement proper foreign key relationships
- Add appropriate indexes
- Use Row Level Security (RLS)

### Migrations

- Create incremental migration files
- Test migrations thoroughly
- Include rollback procedures
- Document schema changes

## Testing

### Unit Tests

\`\`\`bash
npm run test
\`\`\`

### Integration Tests

\`\`\`bash
npm run test:integration
\`\`\`

### E2E Tests

\`\`\`bash
npm run test:e2e
\`\`\`

## Performance Guidelines

### Frontend Optimization

- Use Next.js Image component for images
- Implement proper loading states
- Use React.memo for expensive components
- Optimize bundle size

### Backend Optimization

- Implement proper caching
- Use database indexes
- Optimize API queries
- Monitor performance metrics

## Security Best Practices

- Validate all user inputs
- Use parameterized queries
- Implement proper authentication
- Follow OWASP guidelines
- Regular security audits

## Deployment

### Development Deployment

\`\`\`bash
npm run build
npm run start
\`\`\`

### Production Deployment

See the [Deployment Guide](./DEPLOYMENT.md) for detailed production deployment instructions.

## Tools and Scripts

### Available Scripts

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm run db:setup     # Set up database
npm run db:seed      # Seed database
npm run db:migrate   # Run migrations
\`\`\`

### Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Git hooks
- **Lint-staged**: Pre-commit linting

## Contributing

See the [Contributing Guide](./CONTRIBUTING.md) for detailed contribution guidelines.

---

*Questions? Check the troubleshooting guide or reach out to the development team.*
