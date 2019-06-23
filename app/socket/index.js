const socketIO = require('socket.io')
const { setupSocketIOSession } = require('../config/passport')

const configureSocket = (server) => {
  const io = socketIO(server)
  setupSocketIOSession(io)
}

module.exports = configureSocket