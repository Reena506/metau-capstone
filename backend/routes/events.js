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
      include:{
        expenses:true
      }
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
      include:{
        expenses:true
      }
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
  const { event, date, start_time, end_time, location, expense } =
    req.body;

  if (
    !event ||
    !date ||
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
        date,
        start_time,
        end_time,
        location,
        tripId: parseInt(req.params.tripId),
        userId: req.session.userId,
      },
    });

    // If there's an associated expense, create it
    if (expense && expense.title && expense.amount) {
      await prisma.expense.create({
        data: {
          title: expense.title,
          amount: parseFloat(expense.amount),
          category: expense.category || "Activities",
          date: new Date(date),
          tripId: parseInt(req.params.tripId),
          userId: req.session.userId,
          eventId: newEvent.id
        }
      });
    }
    // Fetch the event with expenses
    const eventWithExpenses = await prisma.event.findUnique({
      where: { id: newEvent.id },
      include: { expenses: true }
    });

    res.status(201).json(eventWithExpenses);
  } catch (error) {
    console.error("Error creating event:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while creating the event." });
  }
});

router.put("/:tripId/events/:eventId", isAuthenticated, async (req, res) => {
  const { eventId } = req.params;
  const { event, date, start_time, end_time, location, expense } = req.body;
  
  try {
    const updatedEvent = await prisma.event.update({
      where: { id: parseInt(eventId) },
      data: {
        event,
        date,
        start_time,
        end_time,
        location,
        userId: req.session.userId,
      },
    });
    // Handle expense if provided
    if (expense && expense.title && expense.amount) {
      // Check if there's an existing expense for this event
      const existingExpense = await prisma.expense.findFirst({
        where: { eventId: parseInt(eventId) }
      });

      if (existingExpense) {
        // Update existing expense
        await prisma.expense.update({
          where: { id: existingExpense.id },
          data: {
            title: expense.title,
            amount: parseFloat(expense.amount),
            category: expense.category || "Activities",
            date: new Date(date)
          }
        });
      } else {
        // Create new expense
        await prisma.expense.create({
          data: {
            title: expense.title,
            amount: parseFloat(expense.amount),
            category: expense.category || "Activities",
            date: new Date(date),
            tripId: parseInt(req.params.tripId),
            userId: req.session.userId,
            eventId: updatedEvent.id
          }
        });
      }
    }

    // Fetch the updated event with expenses
    const eventWithExpenses = await prisma.event.findUnique({
      where: { id: updatedEvent.id },
      include: { expenses: true }
    });

    res.json(eventWithExpenses);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Something went wrong while updating the event." });
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
      where: { id: eventId },
    });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while deleting the event." });
  }
});

router.post("/:tripId/events/batch", isAuthenticated, async (req, res) => {
  const { tripId } = req.params;
  const events = req.body.events;

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: "Events must be a non-empty array" });
  }

  try {
    await prisma.$transaction(
      events.map((event) => {
        const { event: title, date, start_time, end_time, location } = event;

        if (!title || !date || !start_time || !end_time || !location) {
          throw new Error("Missing fields in one or more events");
        }

        return prisma.event.create({
          data: {
            event: title,
            date,
            start_time,
            end_time,
            location,
            tripId: parseInt(tripId),
            userId: req.session.userId,
          },
        });
      })
    );

    res.status(201).json({ message: "All events created successfully" });
  } catch (error) {
    console.error("Error creating batch events:", error);
    res.status(500).json({ error: "Failed to create events" });
  }
});

router.get("/:tripId/events/:eventId/expenses", async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { 
        tripId: parseInt(req.params.tripId),
        eventId: parseInt(req.params.eventId)
      },
    });
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching event expenses:", error);
    res.status(500).json({ error: "Something went wrong while fetching expenses." });
  }
});


module.exports = router;
