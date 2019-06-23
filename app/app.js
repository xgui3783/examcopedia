const express = require('express')
const app = express()

/**
 * configure the app
 */
require('./config')(app)

/**
 * set up sessions
 */



/**
 * setting up routes
 */
app.use(require('./routes'))

module.exports = app