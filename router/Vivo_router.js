const express = require('express');
const router = express.Router();
const vivogamesController = require("../controller/integrationController/vivogamesController");

router.get("/Authenticate", async (req,res,next)=> {
    console.time()
    let vivoObj = new vivogamesController();
    let data =  await Promise.all([vivoObj.Authenticate(req)]);
    console.timeEnd()
    res.set('Content-Type', 'text/xml');
    res.send(data[0])
})

router.get("/ChangeBalance",async (req,res,next) => {
    
    console.time()
    let vivoObj = new vivogamesController();
    let data =  await Promise.all([vivoObj.ChangeBalance(req)]);
    console.timeEnd()
    res.set('Content-Type', 'text/xml');
    res.send(data[0])
})
router.get("/Status",async (req,res,next) => {
  
    console.time()
    let vivoObj = new vivogamesController();
    let data =  await Promise.all([vivoObj.Status(req)]);
    console.timeEnd()
    res.set('Content-Type', 'text/xml');
    res.send(data[0])

})
router.get("/Getbalance", async(req,res,next) => {
   
    console.time()
    let vivoObj = new vivogamesController();
    let data =  await Promise.all([vivoObj.Getbalance(req)]);
    console.timeEnd()
    res.set('Content-Type', 'text/xml');
    res.send(data[0])

})

module.exports = router;