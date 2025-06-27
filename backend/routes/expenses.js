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

router.get("/:tripId/expenses", async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { tripId: parseInt(req.params.tripId) },
    });
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while fetching expenses." });
  }
});

router.get("/:tripId/expenses/:expenseId", async (req, res) => {
  const expenseId = parseInt(req.params.expenseId);
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: parseInt(expenseId) },
    });
    res.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while fetching the expense." });
  }
});

router.post("/:tripId/expenses", isAuthenticated, async (req, res) => {
  const { title, amount, category, date } = req.body;

  if (!title || !amount || !category || !date) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: "You must be logged in" });
  }

  try {
    const newExpense = await prisma.expense.create({
      data: {
        title,
        amount,
        category,
        date:new Date(date),
        tripId: parseInt(req.params.tripId),
        userId: req.session.userId,
      },
    });

    res.status(201).json(newExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while creating the expense." });
  }
});

router.put(
  "/:tripId/expenses/:expenseId",
  isAuthenticated,
  async (req, res) => {
    const { expenseId } = req.params;
    const { title, amount, category, date } = req.body;
    try {
      const updatedExpense = await prisma.expense.update({
        where: { id: parseInt(expenseId) },
        data: {
          title,
          amount,
          category,
          date:new Date(date),
          tripId: parseInt(req.params.tripId),
          userId: req.session.userId,
        },
      });
      res.json(updatedExpense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res
        .status(500)
        .json({ error: "Something went wrong while updating the expense." });
    }
  }
);

router.delete(
  "/:tripId/expenses/:expenseId",
  isAuthenticated,
  async (req, res) => {
    const expenseId = parseInt(req.params.expenseId);

    try {
      const expense = await prisma.expense.findUnique({
        where: { id: expenseId },
      });

      if (!expense) {
        return res.status(404).json({ error: "expense not found" });
      }

      if (expense.userId !== req.session.userId) {
        return res
          .status(403)
          .json({ error: "You can only delete your own expenses" });
      }

      await prisma.expense.delete({
        where: { id: expenseId },
      });

      res.json({ message: "expense deleted successfully" });
    } catch (error) {
      console.error("Error deleting expense:", error);
      res
        .status(500)
        .json({ error: "Something went wrong while deleting the expense." });
    }
  }
);

module.exports = router;
