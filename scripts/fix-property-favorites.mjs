#!/usr/bin/env node
import pg from 'pg'

const { Client } = pg
const connectionString = (process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL)
  .replace(/([?&])sslmode=[^&]*/g, '$1')
  .replace(/[?&]$/, '')

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  try {
    await client.connect()
    console.log('Connected to database')

    // 1. Add foreign key constraint if not exists
    console.log('Adding foreign key constraint...')
    await client.query(`
      ALTER TABLE property_favorites
      ADD CONSTRAINT fk_property_favorites_property_id
      FOREIGN KEY (property_id) REFERENCES properties_external(id) ON DELETE CASCADE
      DEFERRABLE INITIALLY DEFERRED
    `)
    console.log('✓ Foreign key added')

    // 2. Create indices for performance
    console.log('Creating indices...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_property_favorites_user_id 
      ON property_favorites(user_id)
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_property_favorites_property_id 
      ON property_favorites(property_id)
    `)
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_property_favorites_user_property 
      ON property_favorites(user_id, property_id)
    `)
    console.log('✓ Indices created')

    // 3. Enable RLS for security
    console.log('Enabling RLS...')
    try {
      await client.query(`ALTER TABLE property_favorites ENABLE ROW LEVEL SECURITY`)
      console.log('✓ RLS enabled')
    } catch (e) {
      if (e.message.includes('already enabled')) {
        console.log('✓ RLS already enabled')
      } else {
        throw e
      }
    }

    console.log('\n✅ All fixes applied successfully!')
    process.exit(0)
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
      console.log('⚠️  Constraint/index already exists - skipping')
      process.exit(0)
    }
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
