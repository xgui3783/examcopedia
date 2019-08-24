const app = require('./app/app')

const PORT = process.env.PORT || 3001

setTimeout(() => {
  app.listen(PORT, () => console.log(`app listening on port ${PORT}`))
}, 5000)
