import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Pool } from 'pg'

config({ path: '.env.local' })

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function createSchema() {
  const client = await db.connect()
  try {
    const sql = readFileSync(join(__dirname, 'auth.sql'), 'utf-8')
    await client.query(sql)
    console.log('✅ Schema created successfully')
  } catch (error) {
    console.error('❌ Error creating schema:', error)
    throw error
  } finally {
    client.release()
    await db.end()
  }
}

createSchema()
