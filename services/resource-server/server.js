const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const resourceRoutes = require('./routes/resourceRoutes')
app.use('/resources', resourceRoutes)

const PORT = process.env.PORT || 4000

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Resource server listening on ${PORT}`)
  })
}

module.exports = app
