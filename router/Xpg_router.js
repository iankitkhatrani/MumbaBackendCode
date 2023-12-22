const express = require('express');
const router = express.Router();
const { StaticPool } = require("node-worker-threads-pool");
const conf = require("../db")
const task = conf.BASEURL + "/controller/integrationController/workthread.js"
const pool = new StaticPool({
    size: 10,
    task: task
});

router.post("/PlayerGetBalance", (req, res) => {

    //Create a static worker pool with 8 workers
      
      //Get a worker from the pool and execute the task
    pool.exec({ router: "PlayerGetBalance", data: req.body }).then((result) => {
        res.send(result)
    });

});

router.post("/Debit",(req, res) => {
   
    //Get a worker from the pool and execute the task
    pool.exec({ router: "Debit", data: req.body }).then((result) => {
        res.send(result)
    });
});
router.post("/Credit", (req, res) => {
   
    //Get a worker from the pool and execute the task
    pool.exec({ router: "Credit", data: req.body }).then((result) => {
        res.send(result)
    });
});
router.post("/CancelTransaction", (req, res) => {
   
  
    //Get a worker from the pool and execute the task
    pool.exec({ router: "CancelTransaction", data: req.body }).then((result) => {
        res.send(result)
    });
});
router.post("/CancelRound", (req, res) => {
   
  
    //Get a worker from the pool and execute the task
    pool.exec({ router: "CancelRound", data: req.body }).then((result) => {
        res.send(result)
    });
});

router.post("/ProcessDebit", (req, res) => {
  
    //Get a worker from the pool and execute the task
    pool.exec({ router: "ProcessDebit", data: req.body }).then((result) => {
        res.send(result)
    });
});
router.post("/ProcessCredit", (req, res) => {
   
  
    //Get a worker from the pool and execute the task
    pool.exec({ router: "ProcessCredit", data: req.body }).then((result) => {
        res.send(result)
    });
});
router.post("/PerformRefund", (req, res) => {
  
  
    //Get a worker from the pool and execute the task
    pool.exec({ router: "PerformRefund", data: req.body }).then((result) => {
        res.send(result)
    });
});

module.exports = router;