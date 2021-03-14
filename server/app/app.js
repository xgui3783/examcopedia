const express = require('express')
const app = express()
const path = require('path')
const basicAuth = require('express-basic-auth')
const rateLimimter = require('express-rate-limit')

if (process.env.NODE_ENV !== 'production') {
  app.use(require('cors')())
  require('dotenv').config()
}

const {
  EXAMCOPEDIA_USER = 'makeup-sort-pica-usher',
  EXAMCOPEDIA_PSWD = 'workbag-capo-vacant-safety-leonine-shut-perfuse-horse-centimo'
} = process.env

app.use(rateLimimter({
  windowMs: 60 * 1000,
  max: 100,
}), basicAuth({
  users: {
    [EXAMCOPEDIA_USER]: EXAMCOPEDIA_PSWD
  },
  challenge: true
}))

const publicPath = path.join(__dirname, '../../dist')

app.use(express.static(publicPath))

const api = require('./api')

require('./db')

/**
 * routes
 */
app.use('/api', api)

module.exports = app