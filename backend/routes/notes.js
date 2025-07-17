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

router.get("/:tripId/notes", async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      where: { tripId: parseInt(req.params.tripId) },
    });
    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while fetching notes." });
  }
});

router.get("/:tripId/notes/:noteId", async (req, res) => {
  const noteId = parseInt(req.params.noteId);
  try {
    const note = await prisma.note.findUnique({
      where: { id: parseInt(noteId) },
    });
    res.json(note);
  } catch (error) {
    console.error("Error fetching note:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while fetching the note." });
  }
});

router.post("/:tripId/notes", isAuthenticated, async (req, res) => {
  const { tripId } = req.params;
  const { title, content } = req.body;
  if (!tripId) {
    return res.status(400).json({ error: "invalid trip ID" });
  }
  if (!title || !content) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: "You must be logged in" });
  }

  try {
    const newnote = await prisma.note.create({
      data: {
        title,
        content,
        tripId: parseInt(req.params.tripId),
        userId: req.session.userId,
      },
    });

    res.status(201).json(newnote);
  } catch (error) {
    console.error("Error creating note:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while creating the note." });
  }
});

router.put("/:tripId/notes/:noteId", isAuthenticated, async (req, res) => {
  const { noteId } = req.params;
  const { title, content } = req.body;
  try {
    const updatednote = await prisma.note.update({
      where: { id: parseInt(noteId) },
      data: {
        title,
        content,
        tripId: parseInt(req.params.tripId),
        userId: req.session.userId,
      },
    });
    res.json(updatednote);
  } catch (error) {
    console.error("Error updating note:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while updating the note." });
  }
});

router.delete("/:tripId/notes/:noteId", isAuthenticated, async (req, res) => {
  const noteId = parseInt(req.params.noteId);

  try {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return res.status(404).json({ error: "note not found" });
    }

    if (note.userId !== req.session.userId) {
      return res
        .status(403)
        .json({ error: "You can only delete your own notes" });
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    res.json({ message: "note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while deleting the note." });
  }
});

module.exports = router;
