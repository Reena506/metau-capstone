const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory 
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

//  multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// Authentication
const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ error: "You must be logged in to perform this action." });
  }
  next();
};

// Get all photos for a trip
router.get("/:tripId/photos", async (req, res) => {
  const tripId = parseInt(req.params.tripId);

  if (isNaN(tripId)) {
    return res.status(400).json({ error: "Invalid trip ID" });
  }

  try {
    const photos = await prisma.photo.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" },
    });

    res.json(photos);
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ error: "Failed to load photos." });
  }
});

// Upload a photo to a trip
router.post(
  "/:tripId/photos",
  isAuthenticated,
  upload.single("photo"),
  async (req, res) => {
    const tripId = parseInt(req.params.tripId);
    const { caption } = req.body;

    if (isNaN(tripId)) {
      return res.status(400).json({ error: "Invalid trip ID" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No photo uploaded" });
    }

    try {
      // Check if trip exists and belongs to the user
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
      });

      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      if (trip.userId !== req.session.userId) {
        return res
          .status(403)
          .json({ error: "You can only add photos to your own trips" });
      }

      // Create a URL 
      const fileUrl = `/uploads/${req.file.filename}`;

      // Create the photo  
      const photo = await prisma.photo.create({
        data: {
          url: fileUrl,
          caption: caption || null,
          tripId,
          userId: req.session.userId,
        },
      });

      res.status(201).json(photo);
    } catch (error) {
      console.error("Error uploading photo:", error);
      res
        .status(500)
        .json({ error: "Something went wrong while uploading the photo." });
    }
  }
);

// Delete a photo
router.delete("/:tripId/photos/:photoId", isAuthenticated, async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const photoId = parseInt(req.params.photoId);

  if (isNaN(tripId) || isNaN(photoId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  try {
    // Check if photo exists and belongs to the user
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    if (photo.userId !== req.session.userId) {
      return res
        .status(403)
        .json({ error: "You can only delete your own photos" });
    }

    // Delete the file from the filesystem
    const filePath = path.join(__dirname, "..", photo.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete the photo record from the database
    await prisma.photo.delete({
      where: { id: photoId },
    });

    res.json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Error deleting photo:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while deleting the photo." });
  }
});

// Update a photo's caption
router.put("/:tripId/photos/:photoId", isAuthenticated, async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const photoId = parseInt(req.params.photoId);
  const { caption } = req.body;

  if (isNaN(tripId) || isNaN(photoId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  try {
    // Check if photo exists and belongs to the user
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    if (photo.userId !== req.session.userId) {
      return res
        .status(403)
        .json({ error: "You can only update your own photos" });
    }

    // Update the photo caption
    const updatedPhoto = await prisma.photo.update({
      where: { id: photoId },
      data: { caption },
    });

    res.json(updatedPhoto);
  } catch (error) {
    console.error("Error updating photo:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while updating the photo." });
  }
});

module.exports = router;
