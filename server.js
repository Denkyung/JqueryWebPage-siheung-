
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
const port = 5001;
var data_cout = 0;

const { Client } = require('pg');

var client = null

app.get('/count', (req, res) => {

  client.connect();

  client.query('SELECT count(*) as ret from events', (err, res) => {
      console.log("ret:"+ res.rows[0].ret)
      data_cout = res.rows[0].ret
      //console.log(err, res)
      client.end()

      
  });  

  res.send('data_cout :'  + data_cout)
 
})

app.get('/json', function(req, res) {
  res.json({
    number: 1,
    name: 'John',
    gender: 'male'
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
  init()
})

function init() {

  var db_host = 'localhost';
  var db_user = 'pdb';
  var db_database = 'log_db';
  var db_password = '4Z2CrYcasdfLe0OUM9YD';

  if (process.env.LOG_DB_ADDRESS != null && process.env.LOG_DB_ADDRESS.length > 0) {
    db_host = process.env.LOG_DB_ADDRESS;
  }
  if (process.env.LOG_DB_PASSWORD != null && process.env.LOG_DB_PASSWORD.length > 0) {
    db_password = process.env.LOG_DB_PASSWORD;
  }  

  console.log("==============================");
  console.log(`db_host:${db_host}`);
  console.log(`db_user:${db_user}`);
  console.log(`db_database:${db_database}`);
  console.log(`db_password:${db_password}`);

  client = new Client({    
    host : db_host,
    database : db_database,
    user : db_user,
    password : db_password,
    port : 5432,
  });

  client.connect();
}