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

const default_allocations={
  Food: 30,
  Transport: 10,
  Lodging: 25,
  Activities: 20,
  Shopping: 10,
  Other: 5,
}


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
router.get("/:tripId/budget-allocations", async (req, res) => {
  try {
    const tripId = parseInt(req.params.tripId);
    
    const budget = await prisma.budget.findFirst({
      where: {
        tripId: tripId,
      },
      orderBy: { id: 'desc' }
    });
    
    if (budget && budget.allocations) {
      // Return saved allocations
      res.json({ 
        allocations: budget.allocations,
        isDefault: false 
      });
    } else {
      // Return default allocations
      res.json({ 
        allocations: default_allocations,
        isDefault: true 
      });
    }
  } catch (error) {
    console.error("Error fetching budget allocations:", error);
    res.status(500).json({ error: "Something went wrong while fetching budget allocations." });
  }
});

// create/update budget allocations
router.put("/:tripId/budget-allocations", isAuthenticated, async (req, res) => {
  const { allocations } = req.body;
  
  if (!allocations || typeof allocations !== 'object') {
    return res.status(400).json({ error: "Budget allocations are required" });
  }
  
  // Validate that allocations sum to 100
  const total = Object.values(allocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  if (Math.abs(total - 100) > 0) {
    return res.status(400).json({ error: "Budget allocations must sum to 100%" });
  }
  
  try {
    const tripId = parseInt(req.params.tripId);
    
    // Verify trip ownership
    const trip = await prisma.trip.findUnique({
      where: { id: tripId }
    });
  
    if (!trip || trip.userId !== req.session.userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Find existing budget for this trip
    const existingBudget = await prisma.budget.findFirst({
      where: {
        tripId: tripId,
      },
      orderBy: { id: 'desc' }
    });
    
    let updatedBudget;
    
    if (existingBudget) {
      // Update existing budget with new allocations
      updatedBudget = await prisma.budget.update({
        where: { id: existingBudget.id },
        data: { allocations: allocations }
      });
    } else {
      // Create new budget with allocations if none exists
      updatedBudget = await prisma.budget.create({
        data: {
          amount: 0, // Default amount
          allocations: allocations,
          tripId: tripId,
          userId: req.session.userId
        }
      });
    }
  
    res.json({ 
      allocations: updatedBudget.allocations,
      isDefault: false 
    });
  } catch (error) {
    console.error("Error updating budget allocations:", error);
    res.status(500).json({ error: "Something went wrong while updating budget allocations." });
  }
});

// reset budget allocations to default
router.delete("/:tripId/budget-allocations", isAuthenticated, async (req, res) => {
  try {
    const tripId = parseInt(req.params.tripId);
    
    // Verify trip ownership
    const trip = await prisma.trip.findUnique({
      where: { id: tripId }
    });
  
    if (!trip || trip.userId !== req.session.userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Find existing budget
    const existingBudget = await prisma.budget.findFirst({
      where: {
        tripId: tripId,
      },
      orderBy: { id: 'desc' }
    });
    
    if (existingBudget) {
      // Reset allocations to null or default
      await prisma.budget.update({
        where: { id: existingBudget.id },
        data: { allocations: null }
      });
    }
  
    res.json({ 
      allocations: default_allocations,
      isDefault: true,
      message: "Budget allocations reset to default"
    });
  } catch (error) {
    console.error("Error resetting budget allocations:", error);
    res.status(500).json({ error: "Something went wrong while resetting budget allocations." });
  }
}); 
module.exports = router;

