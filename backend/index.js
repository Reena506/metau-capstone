const express = require('express')
const cors = require('cors')
const session = require('express-session')
const PORT = 3000

const triproutes=require('./routes/trips')
const authRoutes = require('./routes/auth')
const app = express()



app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend's origin
  credentials: true
}))

app.use(express.json())

app.use(session({
  secret: 'travel', 
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 } // 1-hour session
}))
app.use(authRoutes)
app.use('/trips', triproutes)



app.get('/', (req, res) => {
  res.send('Welcome to my homepage!')
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
