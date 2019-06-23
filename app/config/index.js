const setupEnvVar = require('./env')
const { setupSession } = require('./session')
const { setupPassportJs } = require('./passport')

const configApp = (app) => {

  /**
   * set up env var
   */
  setupEnvVar(app)

  /**
   * set up session
   */
  setupSession(app)

  /**
   * set up passportjs
   */
  setupPassportJs(app)
}

module.exports = configApp