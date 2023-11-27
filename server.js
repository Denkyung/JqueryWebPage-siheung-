var lastUpdate = "23 11 27";
// 최신화
console.log("");
console.log("==============================");
console.log("Version : " + lastUpdate);
const express = require('express'); 
const cors = require('cors');
const mysql = require('mysql');
const app = express();
const port = 5001;

//npm install --save influx
const influx = require('influx');   
var mInfluxClient = null;  

const moment = require("moment"); 

app.use(cors());

//================================
//세션 사용
var session = require('express-session');

app.use(session({
  key: 'ddddsiiidddd',
  secret: 'secretisasecret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    //maxAge: 1 * ( 1000 * 60 * 60 ) // 쿠키 유효기간 24시간
    maxAge: 1000 * 60 * 60
  }
}));
//req.session.user = result;
//================================
//bcrypt 사용
const bcrypt = require('bcrypt')

//================================
//bodyparser 사용

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); 


app.get('/test', function (req, res) {
  var sess = req.session;

  const password = '1234';

  const encryptedPassowrd = bcrypt.hashSync(password, 10);
  console.log(encryptedPassowrd);
  //비교하기
  const same = bcrypt.compareSync(password, "$2b$10$mI.q0om/InyrMCH4X.UyguM0diraRehE9ppHzRrWCIm/R.I3ALgxu"); // sync
  console.log(same);

  if (sess.user == "han") {
    console.log("auth");
  }
  else {
    sess.user = "han";
    console.log("no auth");
  }

  res.json({
    result: 'male'
  });

});
//================================
const ExcelJS = require('exceljs');  //for excel download

//================================
var LRU = require("lru-cache");
const e = require('express');
var cache = new LRU({
  max: 100,
  maxAge: 1000 * 60 * 60 * 4
});
var cache_today = new LRU({
  max: 10,
  maxAge: 1000 * 10
});

//================================
let mDBConnectedFlag = false;  

let mLogDB_host = null;
let mLogDB_port = null;
let mLogDB_user = null;
let mLogDB_pwd = null;
let mLogDB_db = null;

//================================
app.get('/sample', function (req, res) {
  res.sendFile(__dirname + '/sample.htm');
});

app.listen(port, () => {
  init();
  console.log(`app listening at http://localhost:${port}`);
})

//for influxDB test
app.get('/count', (req, res) => {
  var query = 'select count("category") as totalCount from events';
  executeQuery(query, (err, result) => {
    if (err) {
      console.log("[count] query fail, err:", err);
      res.status(500).json({ err });
    }else{
      try{
        console.log("[count] query result:", result[0].totalCount);
        res.status(200).json(result[0].totalCount) ;
      }catch(err) {
        console.log("[count] query fail, err:", err);
        res.status(500).json({ "error" : "see log file" });  
      }
    }
  });  
});

//======================================
let mariaPool = null;

function connetMariaDb() {

    var db_host = '192.168.101.6';
    //var db_host = '127.0.0.1';
    //var db_port = 5432;
    var db_port = 3306;
    var db_user = 'pdb';
    var db_database = 'pdb';
    //var db_password = '4Z2CrYcasdfLe0OUM9YD';  //localhost
    var db_password = 'zXNWpbYtjm1Xj0pP';  //6번  

    //.env 환경으로 세팅
    if (process.env.DB_ADDRESS != null && process.env.DB_ADDRESS.length > 0) {
      db_host = process.env.DB_ADDRESS;
      if (db_host.indexOf(":") != -1) {
        var host = db_host.split(":")[0];
        var port = db_host.split(":")[1];

        db_host = host;
        db_port = Number(port);
      }
    }
    if (process.env.DB_PASSWORD != null && process.env.DB_PASSWORD.length > 0) {
      db_password = process.env.DB_PASSWORD;
    }

    //for mariadb
    console.log("==============================");
    console.log(`[INIT] maria db_host:${db_host}`);
    console.log(`[INIT] maria db_port:${db_port}`);
    console.log(`[INIT] maria db_user:${db_user}`);
    console.log(`[INIT] maria db_database:${db_database}`);    

  const mariaDbConifg = {
    "host": db_host,
    "port": db_port,
    "user": db_user,
    "password": db_password,
    "database": db_database,
    "connectionLimit": 30
  }

  mariaPool = mysql.createPool(mariaDbConifg);
  mariaPool.getConnection(function (err, connection) {
    if (err) {
      console.error('[ERR mariaDB] getConnection Fail : ' + err);
      return;
    }
    connection.release();
    console.log("[mariaDB connect] Connection Success");
  });

} 

function init() {

  console.log("[init()] called");

  let flag = false;

  try { 

    //먼저 주차장 정보 파싱
    initParkinglotConfigJson();
    connetMariaDb()

    var db_host = '192.168.101.6';
    var db_port = 8086;
    var db_user = 'pdb';
    var db_database = 'log_db';
    var db_password = 'temperate_db';  //6번

    //.env 환경으로 세팅
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

    //for influxDB
    mLogDB_user = db_user;
    mLogDB_pwd = db_password;
    mLogDB_host = db_host;
    mLogDB_port = db_port;
    mLogDB_db = db_database;

    console.log("==============================");
    console.log(`[INIT] db_host:${mLogDB_host}`);
    console.log(`[INIT] db_port:${mLogDB_port}`);
    console.log(`[INIT] db_user:${mLogDB_user}`);
    console.log(`[INIT] db_database:${mLogDB_db}`);

    connectLogDB();

    flag = true;

  } catch (e) {
    console.log("[INIT] error:", e);
  }

  console.log("[init()] end, flag:" + flag);
}  

//=========================================

function connectLogDB() {

  if(!mLogDB_host) throw "[connectLogDB] empty host!";
  if(!mLogDB_port) throw "[connectLogDB] empty port!";
  if(!mLogDB_user) throw "[connectLogDB] empty user!";
  if(!mLogDB_pwd) throw "[connectLogDB] empty password!";  
  if(!mLogDB_db) throw "[connectLogDB] empty db!";

  if(!mInfluxClient) {
    mInfluxClient = new influx.InfluxDB('http://' + mLogDB_user + ':' + mLogDB_pwd + '@' + mLogDB_host + ':' + mLogDB_port + '/' + mLogDB_db);
  }
  
  //var query = 'select count("category") as totalCount from events';
  var query = 'select * from events order by time desc limit 1';  //동작 확인 쿼리

  executeQuery(query, (err, result) => {
    if (err) {
      mDBConnectedFlag = false;
      console.log("[connectLogDB] connect fail, err:", err);
      
    }else{
      mDBConnectedFlag = true;

      try{
        console.log("==============================================");
        //console.log("[connectLogDB] connect ok! result:", result[0].totalCount);
        console.log("[connectLogDB] connect ok! result:", result[0]);
        console.log("==============================================");
      }catch(e){}
    }
  });

} 

function executeQuery(query, callbackFunc) {

  if(!query) throw "[executeQuery] empty query!";
  if(mInfluxClient == null) throw "[executeQuery] mInfluxClient is null!";

  console.log("[executeQuery] query:", query);


  //mInfluxClient.queryRaw(query)
  mInfluxClient.query(query)  //자동 재연결 되는 듯(확인요망)
    .then(result => {
      try{
        console.log("==============================================");
        console.log("[executeQuery] query return ok! result:", result[0]);
        console.log("==============================================");
      }catch(e) {} //result[0]이 없으면 skip함

      try{
        callbackFunc(null, result);
      }catch(e) {
        console.log("[executeQuery] call callbackFunc error:", e);
      }
    })
    .catch(err => {
      console.log("[executeQuery] error:", err);  //stack
      callbackFunc(err, null);
    });  
}

//=========================================

//for ejs
app.set('view engine', 'ejs'); // 1
app.use(express.static(__dirname + '/public'));
//app.use(express.static('public'));
app.engine('html', require('ejs').renderFile);   //important

//==========================================
// 한 번 로그인 하면 안해도 된다 (여기서 시작 !! 10_28)
app.get('/', function (req, res) {
  console.log("/login called");
  res.render('login', { count: 0 });
});

app.get('/login', function (req, res) {
  console.log("/login called");
  res.render('login', { count: 0 });
});

//post 여기서부터 시작.
app.post('/login', function (req, res) {
  if( req.session.user != undefined ) {
    res.render( 'chart2' );
  }
  else {
    var username = req.body.username;
    console.log(username)
    var password = req.body.password;
    console.log(password)

    if( username == "" || password == "" ) {
      res.render( 'login', { msg : "아이디 또는 비밀번호가 잘못 되었습니다" } );
    }
    else {
      mariaPool.getConnection(function (err, conn) {
        if (err) throw err;

        conn.query("SELECT encrypted_password FROM user_infos where id_string =" + conn.escape( username ), function (error, results, fields) {
          if (error) throw error;
          
          var err_flag = false
          if( results.length == 1 ) {
            // bcrypt compare
            if( bcrypt.compare( password, results[0].encrypted_password ) ) {
              req.session.user =
              {
                username: username,
                password: password,
                authorized: true
              };
              err_flag = true
            }
          }
          conn.release();
          if( err_flag ) {
            console.log("check");
            res.redirect( '/chart' );
          }
          else {
            res.render( 'login', { msg : "아이디 또는 비밀번호가 잘못 되었습니다" } );
          }
        });
      });
    }
  }
});

//=========================================

app.get('/chart', function (req, res) {
  //console.log("chart start");
  if( req.session.user != undefined ) {
    res.render( 'chart2');
  }
  else {
    res.render( 'login');
  }
}); 


//======================================

function getToday() {

  let today = new Date();

  let year = today.getFullYear(); // 년도
  let month = today.getMonth() + 1;  // 월
  let date = today.getDate();  // 날짜


  if (month < 10) {
    month = "0" + month;
  }
  if (date < 10) {
    date = "0" + date;
  }

  var ret = year + '-' + month + '-' + date;
  return ret;
}


function getNextDay(targetDate) {

  if (!targetDate) {
    throw "[getNextDay] invalid targetDate! targetDate:" + targetDate;
  }

  let today = new Date(targetDate);

  var myDate = today;
  myDate.setDate(myDate.getDate() + 1);  //important

  let year = myDate.getFullYear(); // 년도
  let month = myDate.getMonth() + 1;  // 월
  let date = myDate.getDate();  // 날짜
  //let day = myDate.getDay();  // 요일

  if (month < 10) {
    month = "0" + month;
  }
  if (date < 10) {
    date = "0" + date;
  }

  var ret = year + '-' + month + '-' + date;
  return ret;
}

//=========================================== 
app.get('/chartData', function (req, res) {
  chartData_real(req, res, false, null);
}); 

app.get('/chartDataExcel', function (req, res) {
  console.log('[chartDataExcel] called');
  chartData_real(req, res, true, excelCallback);
});

//=========================================== 

