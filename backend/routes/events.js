const express = require('express')
const {PrismaClient} =require ("@prisma/client")
const router = express.Router()
const prisma=new PrismaClient();


// router.get('/', async(req, res)=>{
//     const events=await prisma.event.findMany();
//     res.json(events);
    
// })

router.get('/:tripId/events', async(req, res)=>{
    const events=await prisma.event.findMany({
        where: {tripId: parseInt(req.params.tripId)}
    });
    res.json(events);
    
})

router.get('/:tripId/events/eventId', async(req, res) => {
  const eventId = parseInt(req.params.eventId)
  const event=await prisma.event.findUnique({
    where: { id: parseInt(eventId) },
})
console.log(event)
res.json(event);

})


router.post('/:tripId/events', async(req, res) => {
  const {} = req.body
  const newEvent=await prisma.event.create({
    data: {
       
       
    }
  })

  res.status(201).json(newEvent)
})

router.put('/:tripId/events/eventId', async(req, res) => {
const { eventId } = req.params
  const {} = req.body
  const updatedEvent = await prisma.event.update({
    where: { id: parseInt(eventId) },
    data: {
        
    }
  })
  res.json(updatedEvent)

})



router.delete('/:tripId/events/eventId', async(req, res) => {
  const { eventId } = req.params
  const deletedEvent = await prisma.event.delete({
    where: { id: parseInt(eventId) }
  })
  res.json(deletedEvent)
})

 module.exports=router

