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
  const server = app.listen(PORT, () => {
    const addr = server.address()
    if (addr) {
      console.log(`Resource server listening on ${addr.address}:${addr.port} (family=${addr.family})`)
    } else {
      console.log(`Resource server listening on ${PORT}`)
    }
  })
}

module.exports = app
