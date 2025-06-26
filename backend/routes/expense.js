const express = require('express')
const {PrismaClient} =require ("@prisma/client")
const router = express.Router()
const prisma=new PrismaClient();

router.get('/:tripId/expenses', async(req, res)=>{
    const expenses=await prisma.expense.findMany({
        where: {tripId: parseInt(req.params.tripId)}
    });
    res.json(expenses);
    
})

router.get('/:tripId/expenses/expenseId', async(req, res) => {
  const expenseId = parseInt(req.params.expenseId)
  const expense=await prisma.expense.findUnique({
    where: { id: parseInt(eId) },
})
res.json(expense);

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

