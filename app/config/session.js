const session = require('session')
const MySQLStore = require('express-mysql-session')(session)

const {
  MYSQL_DB_HOST,
  MYSQL_DB_USERNAME,
  MYSQL_DB_PASSWORD,
  MYSQL_DB_NAME
} = require('../constants')

const COOKIE_MAX_AGE = process.env.COOKIE_MAX_AGE || 86400000
const SESSION_SECRET = process.env.SESSION_SECRET || 'cawwots are the wurst... the currywurst'

const getSessionOption = (store) => {
  return {
    resave: true,
    saveUninitialized:true,
    secret: SESSION_SECRET,
    store : store,
    cookie:{
      maxAge : COOKIE_MAX_AGE
    }
  }
}

const mysqlOptions = {
  host: app.get(MYSQL_DB_HOST),
  user: app.get(MYSQL_DB_USERNAME),
  password: app.get(MYSQL_DB_PASSWORD),
  database: app.get(MYSQL_DB_NAME)
}
const store = new MySQLStore(mysqlOptions)

const setupSession = (app) => {
  /**
   * store
   */

  /**
   * session
   */
  const sessionOption = getSessionOption(store)
  app.use(session(sessionOption))
}

module.exports = {
  setupSession,
  store,
  SESSION_SECRET
}