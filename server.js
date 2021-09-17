
const express = require('express');
const cors = require('cors');

const app = express();
const port = 5001;

app.use(cors());



//for database
//const { Client } = require('pg');
const { Pool } = require('pg');

//var client = null
var pool = null

var data_cout = 0;

app.get('/count', (req, res) => {
  try{

    pool.query('SELECT count(*) as ret from events', (err, result) => {
      try{
        console.log("ret:"+ result.rows[0].ret)
        data_cout = result.rows[0].ret

        //res.send('data_cout :'  + data_cout)

        res.json({
          data_cout: data_cout,
        });

      }catch(e){
        console.log("[COUNT] res error:" + e);  //e.stack
      }      
        
    });  
  }catch(e){
    console.log("[COUNT] error:" + e);
  }  
})

app.get('/json', function(req, res) {
  res.json({
    number: 1,
    name: 'John',
    gender: 'male'
  });
});

app.get('/sample', function(req, res) {
  res.sendFile(__dirname + '/sample.htm') ;
});

app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`)
  init()
})

function init() {

  try{
    var db_host = 'localhost';
    var db_port = 5432;
    var db_user = 'pdb';
    var db_database = 'log_db';
    var db_password = '4Z2CrYcasdfLe0OUM9YD';

    //process.env.LOG_DB_ADDRESS = "localhost:5432";

    if (process.env.LOG_DB_ADDRESS != null && process.env.LOG_DB_ADDRESS.length > 0) {      
      db_host = process.env.LOG_DB_ADDRESS;
      if (db_host.indexOf(":") != -1) {
        var host = db_host.split(":")[0];
        var port = db_host.split(":")[1];

        db_host = host;
        db_port = Number(port);
      }
    }
    if (process.env.LOG_DB_PASSWORD != null && process.env.LOG_DB_PASSWORD.length > 0) {
      db_password = process.env.LOG_DB_PASSWORD;
    }  

    console.log("==============================");
    console.log(`[INIT] db_host:${db_host}`);
    console.log(`[INIT] db_port:${db_port}`);
    console.log(`[INIT] db_user:${db_user}`);
    console.log(`[INIT] db_database:${db_database}`);
    //console.log(`db_password:${db_password}`);

    pool = new Pool({    
      host : db_host,
      database : db_database,
      user : db_user,
      password : db_password,
      port : db_port,
      max: 5,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,      
    });

    pool.on("error", (err) => console.error('[POOL] idle client error:', err));  //important for db restart - 2021.09.15 IYLEE

    // callback - checkout a client
    pool.connect((err, client, done) => {
      if (err) throw err;

      client.query('SELECT NOW()', [], (err, res) => {
        done()
        if (err) {
          console.log(err.stack);
        } else {
          console.log("[INIT] db connect ok!");
          console.log(res.rows[0]);
        }
      })
    })    

  }catch(e){
    console.log("[INIT] error:" + e);
  }
}

//for ejs
app.set('view engine','ejs'); // 1
app.use(express.static(__dirname + '/public'));
//app.use(express.static('public'));
app.engine('html', require('ejs').renderFile);   //important


app.get('/test/:count', function(req,res){ // 3
  console.log("/test called, count:" + req.params.count);
  var count = req.params.count
  if (!count) count=0
  res.render('test', {count:count});
});

app.get('/test2', function(req,res){
  console.log("/test2 called");
  res.render('test', {count:0});
});

app.get('/login', function(req,res){
  console.log("/login called");
  res.render('login', {count:0});
});

app.get('/timeChart', function(req,res){
  console.log("/timeChart called");
  res.render('timeChart', {count:0});
});

app.get('/timeChartData', function(req,res){  
  try{

    console.log("/timeChartData called");

    var query = "SELECT count(*) as ret from events";

    pool.query(query, (err, result) => {
      try{
        console.log("ret:"+ result.rows[0].ret)
        data_cout = result.rows[0].ret

        //res.send('data_cout :'  + data_cout)

        option = {
          xAxis: {
              type: 'category',
              data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
          },
          yAxis: {
              type: 'value'
          },
          series: [{
              data: [120, 220, 150, 80, 70, 110, 130],
              type: 'bar'
          }]
      };        

        res.json({
          option: option,
        });

      }catch(e){
        console.log("[COUNT] res error:" + e);  //e.stack
      }      
        
    });  
  }catch(e){
    console.log("[COUNT] error:" + e);
  }    
});
 