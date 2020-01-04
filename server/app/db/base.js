const request = require('request')
const constants = require('./constants')
const { log, error } = require("../../log")

const DB_USERNAME = process.env.DB_USERNAME || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || ''

const DB_PORT = process.env.DB_PORT || 5984
const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PROTOCOL = process.env.DB_PROTOCOL || 'http'

const getDatabaseUri = ({ name, suffix = '' } = {}) => name
  ? `${DB_PROTOCOL}://${DB_HOST}:${DB_PORT}/${name}/${suffix}`
  : `${DB_PROTOCOL}://${DB_HOST}:${DB_PORT}`

const createDb = async ({ dbname }) => new Promise((rs, rj) => {
  const uri = getDatabaseUri({ name: dbname })
  request.put({
    uri
  }, (err, resp, body) => {
    if (err) return rj(err)
    if (resp.statusCode >= 400) return rj(body)
    rs(body)
  })
})

const initDb = async ({ dbname }) => new Promise((rs, rj) => {
  const uri = getDatabaseUri({ name: dbname })
  request.get({
    uri
  }, async (err, resp, body) => {
    if (err) return rj(err)
    if (resp.statusCode === 404) {
      log(`db ${dbname} does not yet exist, creating db ...`)
      const created = await createDb({ dbname })
      log(`successfully created db: ${dbname}`)
      rs(created)
    }
    if (resp.statusCode >= 400) return rj(body)
    log(`db ${dbname} already exist, skipping ... `)
    rs(body)
  })
})

const createIndex = async () => {
  // TODO create index
}

const init = async () => {
  for (const key in constants){
    const dbname = constants[key]
    log(`creating db: ${dbname}`)
    await initDb({ dbname })
  }
}

module.exports = {
  getDatabaseUri,
  init
}