const express = require('express');
const router = express.Router();
const wacplayerController = require("../controller/integrationController/wacplayerController");
const xmlparser = require("express-xml-bodyparser")
const xml2jsDefaults = {
    explicitArray: false,
    normalize: false,
    normalizeTags: false,
    trim: false
}
const { StaticPool } = require("node-worker-threads-pool");
const conf = require("../db")
const task = conf.BASEURL + "/controller/integrationController/wacworkthread.js"
const pool = new StaticPool({
    size: 10,
    task: task
})

router.post("/",xmlparser(xml2jsDefaults), async (req,res)=>{
    // console.time()
    // let wacObj = new wacplayerController();
    // let data = await wacObj.api(req,res);
    // res.set('Content-Type', 'text/xml');
    // console.log(data)
    // console.timeEnd()
    // res.send(data)
    pool.exec({ data: req.body }).then((result) => {
        res.set('Content-Type', 'text/xml');
        res.send(result)
    });

})

module.exports = router;
