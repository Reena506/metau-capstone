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

router.get("/", async (req, res) => {try {
        const trips = await prisma.trip.findMany()
        res.json(trips)
    } catch (error) {
        console.error("Error fetching trips:", error)
        res.status(500).json({ error: "Something went wrong while fetching trips." })
    }
})

router.get("/:tripId", async (req, res) => {
  const tripId = parseInt(req.params.tripId)

    try {
        const trip = await prisma.trip.findUnique({
            where: { id: tripId }
        })

        if (trip) {
            res.json(trip)
        } else {
            res.status(404).send('Trip not found')
        }
    } catch (error) {
        console.error("Error fetching trip:", error)
        res.status(500).json({ error: "Something went wrong while fetching the trip." })
    }
})

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
            data: { title, destination, start_date, end_date }
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