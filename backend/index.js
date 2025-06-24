const express = require('express')
const cors = require('cors')
const app = express()
const PORT = 3000

const triproutes=require('./routes/trips')
const eventroutes=require('./routes/events')

app.use(express.json())
app.use(cors())
app.use('/trips', triproutes)
// app.use('/events', eventroutes)

app.get('/', (req, res) => {
  res.send('Welcome to my homepage!')
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})