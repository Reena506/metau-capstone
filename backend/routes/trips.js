const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  const trips = await prisma.trip.findMany();
  res.json(trips);
});

router.get("/:tripId", async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const trip = await prisma.trip.findUnique({
    where: { id: parseInt(tripId) },
  });
  res.json(trip);
});

router.post("/", async (req, res) => {
  const { title, destination, start_date, end_date } = req.body;
  const newTrip = await prisma.trip.create({
    data: {
      title,
      destination,
      start_date,
      end_date,
    },
  });

  res.status(201).json(newTrip);
});

router.put("/:tripId", async (req, res) => {
  const { tripId } = req.params;
  const { title, destination, start_date, end_date } = req.body;
  const updatedTrip = await prisma.trip.update({
    where: { id: parseInt(tripId) },
    data: {
      title,
      destination,
      start_date,
      end_date,
    },
  });
  res.json(updatedTrip);
});

router.delete('/:tripId', async(req, res) => {
  const { tripId } = req.params
  const deletedTrip = await prisma.trip.delete({
    where: { id: parseInt(tripId) }
  })
  res.json(deletedTrip)
})

 module.exports=router