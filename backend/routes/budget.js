const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "You must be logged in to perform this action." });
  }
  next();
};

// get budget for a trip
router.get("/:tripId/budget", async (req, res) => {
  try {
    const budget = await prisma.budget.findFirst({
      where: {
        tripId: parseInt(req.params.tripId),
      },
      orderBy: { id: 'desc' } 
    });
   
    res.json({ budget: budget ? parseFloat(budget.amount) : 0 });
  } catch (error) {
    console.error("Error fetching budget:", error);
    res.status(500).json({ error: "Something went wrong while fetching budget." });
  }
});

// create/update budget
router.put("/:tripId/budget", isAuthenticated, async (req, res) => {
  const { budget } = req.body;
  
  if (budget === undefined || budget === null) {
    return res.status(400).json({ error: "Budget amount is required" });
  }
  
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: parseInt(req.params.tripId) }
    });
   
    if (!trip || trip.userId !== req.session.userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    await prisma.budget.deleteMany({
      where: {
        tripId: parseInt(req.params.tripId),
      }
    });
    const newBudget = await prisma.budget.create({
      data: {
        amount: parseFloat(budget),
        tripId: parseInt(req.params.tripId),
        userId: req.session.userId
      }
    });
   
    res.json({ budget: parseFloat(newBudget.amount) });
  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(500).json({ error: "Something went wrong while updating budget." });
  }
});

module.exports = router;

