
    const express = require('express');
    const mongoose = require('mongoose');
    const bodyParser = require('body-parser');
    const config = require('../db');
    const cors = require('cors');
    const app = express();
    const PlayerRouter = require("../router");
    const xmlparser = require("express-xml-bodyparser");
    const DB = require("./db.json");
    const path = require("path");
    
  
    mongoose.connect(DB.DBCONNECT,  { useNewUrlParser: true ,useFindAndModify: false,useUnifiedTopology: true,useCreateIndex : true}).then(() => { console.log('Database is connected')  },
      err => { console.log('Can not connect to the database'+ err)}
    );
  
    app.use(cors());
    app.use(express.static('../clients'));
    app.use(express.static('../builds'));
    app.use(bodyParser.json({limit: "15360mb", type:'application/json'}));
    app.use(bodyParser.raw());
    app.use(bodyParser.text({ type: 'text/html' }))
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(xmlparser());
    app.use('/player',(req,res,next)=>{ console.log(req.url);console.log(req.body); PlayerRouter(req,res,next); });
    app.get('*', (req, res) => { res.sendFile(path.join(config.BASEURL, 'clients/index.html')); });  
    app.listen(DB.ServerPort, () => {   console.log(`Started server on => http://localhost:${DB.ServerPort}`); });
    app.on('error', (appErr, appCtx) => { console.log(appErr,appCtx) });
  
  // }

