const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "You must be logged in to perform this action." })
    }
    next()
}

router.get("/my", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const trips = await prisma.trip.findMany({
      where: { userId },
    });
    res.json(trips);
  } catch (error) {
    console.error("Error fetching user's trips:", error);
    res.status(500).json({ error: "Failed to load your trips." });
  }
});




router.get("/", async (req, res) => {try {
        const trips = await prisma.trip.findMany()
        res.json(trips)
    } catch (error) {
        console.error("Error fetching trips:", error)
        res.status(500).json({ error: "Something went wrong while fetching trips." })
    }
})

router.get("/allocation-presets", async (req, res) => {
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

router.get("/:tripId", async (req, res) => {
  const tripId = parseInt(req.params.tripId);

  if (isNaN(tripId)) {
    return res.status(400).json({ error: "Invalid trip ID" });
  }

  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId }
    });

    if (trip) {
      res.json(trip);
    } else {
      res.status(404).send("Trip not found");
    }
  } catch (error) {
    console.error("Error fetching trip:", error);
    res.status(500).json({ error: "Something went wrong while fetching the trip." });
  }
});




router.post("/", isAuthenticated, async (req, res) => {
  const { title, destination, start_date, end_date } = req.body;


  if (!title || !destination || !start_date || !end_date) {
    return res.status(400).json({ error: "All fields are required" });
  }


  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: "You must be logged in" });
  }


  try {
    const newTrip = await prisma.trip.create({
      data: {
        title,
        destination,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        userId: req.session.userId
      }
    });


    res.status(201).json(newTrip);
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ error: "Something went wrong while creating the trip." });
  }
});






router.put("/:tripId", isAuthenticated, async (req, res) => {
    const tripId = parseInt(req.params.tripId)
    const { title, destination, start_date, end_date } = req.body

    try {
        const trip = await prisma.trip.findUnique({
            where: { id: tripId }
        })

        if (!trip) {
            return res.status(404).json({ error: "Trip not found" })
        }

        if (trip.userId !== req.session.userId) {
            return res.status(403).json({ error: "You can only update your own trips" })
        }

        const updatedTrip = await prisma.trip.update({
            where: { id: tripId },
            data: { title, destination, start_date:new Date(start_date), end_date:new Date(end_date) }
        })

        res.json(updatedTrip)
    } catch (error) {
        console.error("Error updating trip:", error)
        res.status(500).json({ error: "Something went wrong while updating the trip." })
    }
})

router.delete('/:tripId',isAuthenticated, async (req, res) => {
    const tripId = parseInt(req.params.tripId)

    try {
        const trip = await prisma.trip.findUnique({
            where: { id: tripId }
        })

        if (!trip) {
            return res.status(404).json({ error: "Trip not found" })
        }

        if (trip.userId !== req.session.userId) {
            return res.status(403).json({ error: "You can only delete your own trips" })
        }

        await prisma.trip.delete({
            where: { id: tripId }
        })

        res.json({ message: "Trip deleted successfully" })
    } catch (error) {
        console.error("Error deleting trip:", error)
        res.status(500).json({ error: "Something went wrong while deleting the trip." })
    }
})

 module.exports=router