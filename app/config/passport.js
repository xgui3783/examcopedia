const passport = require('passport')
const localStrategy = require('passport-local').Strategy
const googleStrategy = require('passport-google-oauth').Strategy
const facebookStrategy = require('passport-facebook').Strategy
const passportSocketIO = require('passport.socketio')

const { store, SESSION_SECRET } = require('./session')

const setupPassportJs = (app) => {
  app.use(passport.initialize())
  app.use(passport.session())

  /**
   * TODO enable strategies
   */

   /**
    * TODO set up passportSocketIO
    */
}

const setupSocketIOSession = (io) => {
  io.use(passportSocketIO.authorize({
    secret: SESSION_SECRET,
    store,
    success: function (obj, accept) {
      accept()
    },
    fail: function (data, message, error, accept) {
      accept(null, !error)
    }
  }))
}

module.exports = {
  setupPassportJs,
  setupSocketIOSession
}