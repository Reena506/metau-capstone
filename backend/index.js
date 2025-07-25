require(`dotenv`).config();
const express = require('express')
const cors = require('cors')
const session = require('express-session')
const PORT = 3000

const triproutes=require('./routes/trips')
const eventroutes=require('./routes/events')
const expenseroutes=require('./routes/expenses')
const noteroutes=require('./routes/notes')
const budgetroutes=require('./routes/budget')
const authRoutes = require('./routes/auth')
const suggestionroutes= require('./routes/suggestions')
const app = express()



app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend's origin
  credentials: true
}))

app.use(express.json())

app.use(session({
  secret: process.env.SESSION_SECRET, 
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 } // 1-hour session
}))
app.get("/trips/allocation-presets", async (req, res) => {
  const tripId = req.query.tripId ? parseInt(req.query.tripId) : null;
  const presets = {
    balanced: {
      Food: 30,
      Transport: 10,
      Lodging: 25,
      Activities: 20,
      Shopping: 10,
      Other: 5,
    },
    luxury: {
      Food: 25,
      Transport: 20,
      Lodging: 35,
      Activities: 15,
      Shopping: 3,
      Other: 2,
    },
    budget: {
      Food: 40,
      Transport: 15,
      Lodging: 30,
      Activities: 10,
      Shopping: 3,
      Other: 2,
    }
  };

  // Only add the historical preset if the user is logged in
  if (req.session.userId) {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      // If tripId is provided, get the current trip's start date
      let currentTripStartDate = null;
      if (tripId) {
        const currentTrip = await prisma.trip.findUnique({
          where: { id: tripId }
        });
        if (currentTrip) {
          currentTripStartDate = currentTrip.start_date;
        }
      }
      // Get trips for the current user
      const userTrips = await prisma.trip.findMany({
        where: {
          userId: req.session.userId,
          // Only include trips that end before the current trip starts 
          ...(currentTripStartDate ? {
            end_date: {
              lt: currentTripStartDate
            }
          } : {})
        },
        include: {
          expenses: true,
          budget: true
        },
        orderBy: { start_date: 'desc' }
      });
      // Filter trips that have expenses
      const tripsWithExpenses = userTrips.filter(trip => trip.expenses.length > 0);
      // If there are trips with expenses, calculate the spending pattern
      if (tripsWithExpenses.length > 0) {
        // Initialize categories and spending totals
        const categories = ['Food', 'Transport', 'Lodging', 'Activities', 'Shopping', 'Other'];
        const categorySpending = {};
        let totalSpending = 0;
        categories.forEach(category => categorySpending[category] = 0);
        // Sum up actual spending by category for all trips
        tripsWithExpenses.forEach(trip => {
          trip.expenses.forEach(expense => {
            const category = expense.category;
            const amount = parseFloat(expense.amount);
            if (categories.includes(category)) {
              categorySpending[category] += amount;
              totalSpending += amount;
            } else {
              // If category doesn't match predefined categories, add to Other
              categorySpending['Other'] += amount;
              totalSpending += amount;
            }
          });
        });
        // Calculate percentages based on actual spending
        const historical = {};
        if (totalSpending > 0) {
          categories.forEach(category => {
            const percentage = (categorySpending[category] / totalSpending) * 100;
            historical[category] = Math.round(percentage);
          });
          // Ensure allocations sum to 100%
          const total = Object.values(historical).reduce((acc, val) => acc + val, 0);
          if (total !== 100) {
            const adjustment = 100 - total;
            // Distribute the adjustment across categories
            const adjustmentPerCategory = Math.floor(adjustment / categories.length);
            categories.forEach(category => {
              historical[category] += adjustmentPerCategory;
            });
            // Add any remaining adjustment to the first category
            const remaining = adjustment - (adjustmentPerCategory * categories.length);
            historical[categories[0]] += remaining;
          }
          // Add historical preset
          presets.historical = historical;
        }
      }
    } catch (error) {
      console.error("Error calculating historical budget allocations:", error);
      // Don't add the historical preset if there's an error
    }
  }

  res.json({presets});
});
app.use(authRoutes)
app.use('/trips', triproutes)
app.use('/trips', eventroutes)
app.use('/trips', expenseroutes)
app.use('/trips', noteroutes)
app.use('/trips', budgetroutes)
app.use('/suggestions', suggestionroutes)



app.get('/', (req, res) => {
  res.send('Welcome to my homepage!')
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
