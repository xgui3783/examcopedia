const app = require('./app/app')

const PORT = process.PORT || 3001

app.listen(PORT, () => console.log(`app listening on port ${PORT}`))