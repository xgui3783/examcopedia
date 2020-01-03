
const PORT = process.env.PORT || 3001

const app = require('./app/app')
app.listen(PORT, () => console.log(`app listening on port ${PORT}`))
