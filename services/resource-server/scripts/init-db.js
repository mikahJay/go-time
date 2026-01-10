const { Pool } = require('pg')

// Use DATABASE_URL if set, otherwise construct from env vars
const connectionString = process.env.DATABASE_URL
  || (process.env.PGHOST ? `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || ''}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'resources'}` : null)

const pool = new Pool(connectionString ? { connectionString, ssl: { rejectUnauthorized: false } } : {})

async function run() {
  const client = await pool.connect()
  try {
    console.log('Creating table resources (if not exists) ...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        owner TEXT,
        tag TEXT,
        public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ
      );
    `)
    console.log('Creating indexes ...')
    await client.query("CREATE INDEX IF NOT EXISTS idx_resources_owner ON resources(owner);")
    await client.query("CREATE INDEX IF NOT EXISTS idx_resources_owner_tag ON resources(owner, tag);")
    await client.query("CREATE INDEX IF NOT EXISTS idx_resources_data_gin ON resources USING gin (data);")
    console.log('Done')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
