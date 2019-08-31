
const PORT = process.env.PORT || 3001

console.log(`waiting 5 sec before attempting to connecting`)
setTimeout(() => {
  const app = require('./app/app')
  app.listen(PORT, () => console.log(`app listening on port ${PORT}`))
}, 5000)
