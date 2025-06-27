const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ error: "You must be logged in to perform this action." });
  }
  next();
};

router.get("/:tripId/events", async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { tripId: parseInt(req.params.tripId) },
    });
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while fetching events." });
  }
});

router.get("/:tripId/events/:eventId", async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  try {
    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
    });
    res.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while fetching the event." });
  }
});

router.post("/:tripId/events", isAuthenticated, async (req, res) => {
  const { event, description, day_number, start_time, end_time, location } =
    req.body;

  if (
    !event ||
    !description ||
    !day_number ||
    !start_time ||
    !end_time ||
    !location
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: "You must be logged in" });
  }

  try {
    const newEvent = await prisma.event.create({
      data: {
        event,
        description,
        day_number,
        start_time,
        end_time,
        location,
        tripId: parseInt(req.params.tripId),
        userId: req.session.userId,
      },
    });

    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while creating the event." });
  }
});

router.put("/:tripId/events/:eventId", isAuthenticated, async (req, res) => {
  const { eventId } = req.params;
 const { event, description, day_number, start_time, end_time, location } =
    req.body;
     try {
  const updatedEvent = await prisma.event.update({
    where: { id: parseInt(eventId) },
    data: {
        event,
        description,
        day_number,
        start_time,
        end_time,
        location,
        userId: req.session.userId,
      },
  });
  res.json(updatedEvent);}catch (error) {
        console.error("Error updating event:", error)
        res.status(500).json({ error: "Something went wrong while updating the event." })
    }
});

router.delete("/:tripId/events/:eventId", isAuthenticated, async (req, res) => {
    const eventId = parseInt(req.params.eventId)

    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        })

        if (!event) {
            return res.status(404).json({ error: "Event not found" })
        }

        if (event.userId !== req.session.userId) {
            return res.status(403).json({ error: "You can only delete your own events" })
        }

        await prisma.event.delete({
            where: { id: eventId }
        })

        res.json({ message: "Event deleted successfully" })
    } catch (error) {
        console.error("Error deleting event:", error)
        res.status(500).json({ error: "Something went wrong while deleting the event." })
    }
})

module.exports = router;
