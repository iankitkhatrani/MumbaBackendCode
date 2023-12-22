
var mongoose = require('mongoose');
const Gamelist = require("../../models/games_model").GAMELISTMODEL;
const { StaticPool } = require("node-worker-threads-pool");

exports.api = async (req, res, next) => {

    //Create a static worker pool with 8 workers
    const pool = new StaticPool({
      size: 2,
      task: "./controller/integrationController/workthread.js"
    });
    
    //Get a worker from the pool and execute the task
    pool.exec({ router:"PlayerGetBalance", data: req.body }).then((result) => {
    //   console.log(`${result.num}th Fibonacci Number: ${result.fib}`);
      res.send(result)
    });

}