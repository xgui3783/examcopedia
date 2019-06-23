const { 
  PERSISTENT_DATA_DIR,
  MYSQL_DB_HOST,
  MYSQL_DB_USERNAME,
  MYSQL_DB_PASSWORD,
  MYSQL_DB_NAME
} = require('../constants')

const setupEnvVar = (app) => {

  /**
   * set the presistent data dir
   * useful for CD/CI, where not all dir are writable
   * or persistent
   */
  app.set(PERSISTENT_DATA_DIR, process.env.PERSISTENT_DATA_DIR || './public/')

  /**
   * setup mysqlvar
   */
  app.set(MYSQL_DB_HOST, process.env.MYSQL_DB_HOST || 'localhost')
  app.set(MYSQL_DB_USERNAME, process.env.MYSQL_DB_USERNAME || 'root')
  app.set(MYSQL_DB_PASSWORD, process.env.MYSQL_DB_PASSWORD || '')
  app.set(MYSQL_DB_NAME, process.env.MYSQL_DB_NAME || 'examcopedia')
}

module.exports = setupEnvVar