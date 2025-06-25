const express = require('express')
const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = express.Router()

// Signup Route
router.post('/signup', async (req, res) => {
    const { username, password } = req.body

    try {
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required." })
        }
        
        if (password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters long." })
        }

        // Check if username is already taken
        const existingUser = await prisma.user.findUnique({
            where: { username },
        })

        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" })
        }

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create a new user in the database
        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword
            }
        })

        res.status(201).json({ message: "Signup successful!" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Something went wrong during signup" })
    }
})

// Login Route
router.post('/login', async (req, res) => {
    const { username, password } = req.body

    try {
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" })
        }

        const user = await prisma.user.findUnique({
            where: { username }
        })

        if (!user) {
            return res.status(401).json({ error: "Invalid username or password" })
        }

        const isValidPassword = await bcrypt.compare(password, user.password)

        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid username or password" })
        }

        // Store user ID and username in the session
        req.session.userId = user.id
        req.session.username = user.username

        res.json({ id: user.id, username: user.username }) // Include id and username in the response
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Something went wrong during login" })
    }
})

// Check if user is logged in
router.get('/me', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Not logged in" })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.session.userId },
            select: { username: true }
        })

        res.json({ id: req.session.userId, username: user.username })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching user session data" })
    }
})

// Logout Route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.json({ message: 'Logout successful' });
  });
});

module.exports = router
