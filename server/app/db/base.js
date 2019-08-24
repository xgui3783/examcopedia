const arangojs = require('arangojs')
const Database = arangojs.Database

const DB_USERNAME = process.env.DB_USERNAME || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || ''
const DB_HOST = process.env.DB_HOST || 'localhost:8529'
const DB_PROTOCOL = process.env.DB_PROTOCOL || 'http'

const DATABASE_NAME = process.env.DATABASE_NAME || 'examcopedia'

const db = new Database()
db.useBasicAuth(DB_USERNAME, DB_PASSWORD)

const getListDb = async () => await db.listDatabases()

const init = async () => {
  const arr = await getListDb()
  const exists = arr.find(name => name === DATABASE_NAME)
  if (!exists) {
    await db.createDatabase(DATABASE_NAME)
  }
  console.log('db init success')
  return db.useDatabase(DATABASE_NAME)
}

module.exports = init