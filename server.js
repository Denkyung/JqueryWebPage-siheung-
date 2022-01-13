var lastUpdate = "2022-01-13 13:30";

console.log("");
console.log("==============================");
console.log("Version : " + lastUpdate);

const express = require('express'); 

const cors = require('cors');
const mysql = require('mysql');
const app = express();
const port = 5001;

//npm install --save influx
const influx = require('influx');   //2021.11.08 IYLEE
var mInfluxClient = null;  //2021.11.08 IYLEE

const moment = require("moment");  //for time format - 2021.11.11 IYLEE

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
    //var db_host = '127.0.0.1';
    //var db_port = 5432;
    var db_port = 8086;
    var db_user = 'pdb';
    var db_database = 'log_db';
    //var db_password = '4Z2CrYcasdfLe0OUM9YD';  //localhost
    var db_password = 'zXNWpbYtjm1Xj0pP';  //6번

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

//2021.11.08 IYLEE
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

//2021.11.08 IYLEE
function executeQuery(query, callbackFunc) {

  if(!query) throw "[executeQuery] empty query!";
  if(mInfluxClient == null) throw "[executeQuery] mInfluxClient is null!";

  console.log("[executeQuery] query:", query);

  /*
  //for DB 재시작 감지
  await mInfluxClient.ping(3000).then(hosts => {
    hosts.forEach(host => {
      if (host.online) {
        mDBConnectedFlag = true;
      } else {
        //DB 재연결
        mInfluxClient = new influx.InfluxDB('http://' + mLogDB_user + ':' + mLogDB_pwd + '@' + mLogDB_host + ':' + mLogDB_port + '/' + mLogDB_db);
      }
    })
  })
  */

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
  //let day = today.getDay();  // 요일

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
function chartData_real(req, res, excelFlag, callbackFunc) {
  try {

    console.log("[chartData_real] called, excelFlag:" + excelFlag, ", callbackFunc:", callbackFunc);

    var fromDate = req.query.fromDate;
    var toDate = req.query.toDate;
    var toDateOrg = toDate;  //원래 toDate
    var parkinglotIdList = req.query.parkingLotList;  //시흥 주차장 번호 (여러개시 분리자는 '_')
    var strChartTimeUnit = req.query.chartTimeUnit;  //시흥 주차장 time unit : 1h, 1d

    //for test
    var testFlag = false;
    if(testFlag){
      fromDate = "2021-11-08";
      toDate = "2021-11-10";
      toDateOrg = "2021-11-10";
      parkinglotIdList = "1_2_3_4";
      strChartTimeUnit = "1h";
    }

    var arrParkinglotlist = [];    
    if(parkinglotIdList) arrParkinglotlist = parkinglotIdList.split("_"); 

    console.log("[chartData_real] fromDate:" + fromDate);
    console.log("[chartData_real] toDate:" + toDate);
    console.log("[chartData_real] toDateOrg:" + toDateOrg);
    console.log("[chartData_real] parkinglotlist:" + parkinglotIdList);
    console.log("[chartData_real] arrParkinglotlist:", arrParkinglotlist);
    console.log("[chartData_real] strChartTimeUnit:", strChartTimeUnit);

    if (!fromDate) {
      throw "[ERROR][chartData_real] empty fromDate!";
    }
    if (!toDate) {
      throw "[ERROR][chartData_real] empty toDate!";
    }

    var todayFlag = false;
    if (fromDate == getToday()) {
      todayFlag = true;
    }

    toDate = getNextDay(toDate);  //'<='가 아니라 '<'이므로 다음날을 구함

    //=======================================
    var cacheKey = "chartData_" + fromDate + "_" + toDateOrg;
    console.log("[chartData_real] todayFlag:" + todayFlag + ", cacheKey:" + cacheKey + ", parkinglotlist:" + parkinglotIdList);

    var option_cache = null;

    if (!excelFlag) {
      if (todayFlag) {
        option_cache = cache_today.get(cacheKey);  //for cache - 오늘 날짜는 짧게 캐쉬
      } else {
        option_cache = cache.get(cacheKey);  //for cache
      }

      if (option_cache) {
        console.log("[chartData_real] cache found! return ok!");

        res.json({
          option: option_cache,
        });

        return;
      }
    }

    var option_cache_excel = cache.get(cacheKey + "_excel");  //for cache
    if (option_cache_excel) {
      if (excelFlag) {
        console.log("[chartData_real] option_cache_excel found! return ok! option_cache_excel:", option_cache_excel);
        return callbackFunc(req, res, option_cache_excel);
      }
    }

    if (!mDBConnectedFlag) {
      connectLogDB();
      return;  //DB재구동 후 한번 더 누르면 자동 연결되므로 return
    } 

    console.log("==========================================");

    console.log("fromDate:" + fromDate);
    console.log("toDate:" + toDate);
    console.log("arrParkinglotlist:", arrParkinglotlist);    

    var arrPromise = [];

    //[A] 비동기 쿼리를 sum하기 위해 promise로 실행 - 2021.11.08 IYLEE
    for(var i=0; i<arrParkinglotlist.length; i++) {
      var parkinglotId = arrParkinglotlist[i];
      arrPromise.push(new Promise(promiseResponse => {
        executeTimeUnitQuery(promiseResponse, fromDate, toDate, parkinglotId, strChartTimeUnit, mEtcWhere);  //주차장별 쿼리 실행
      }));
    }//for

    //[B] promise로 전체 결과를 동기적으로 받아옴 - 2021.11.08 IYLEE
    Promise.allSettled(arrPromise).then((results) => {

      let flag = false;

      try{

        console.log("[Promise.allSettled] called"); 
        console.log("[Promise.allSettled] results:", results); 

        let chartOption = "";

        if(!results || results.length == 0) {
          chartOption = makeEmptyChartOption(fromDate, toDateOrg, strChartTimeUnit);
        }else{
        
          console.log("[Promise.allSettled] results[0].value:", results[0].value); 
  
          let arrTimelines = [];  //arrTimeline의 배열
          let arrQueryRet = [];  //[parkinglotId, arrTimeline, arrCount, totalCount]의 배열
    
          //[B-1] 쿼리 결과 모든 시간대 취합
          for(var i=0; i<results.length; i++) {
            let ret = results[i].value;  //[parkinglotId, arrTimeline, arrCount, totalCount]
            arrTimelines.push(ret[1]);
          }//for
    
          //[B-2] 시간대 normalize
          let arrTimeline_real = normalizeTimeline(...arrTimelines);
          let arrTimelineIndex = 1;
          let arrCountIndex = 2;
  
          //[B-3] 쿼리 결과 시간대 보정
          for(var i=0; i<results.length; i++) {
            let queryRet = results[i].value;  //[parkinglotId, arrTimeline, arrCount, totalCount]          
    
            let arrCount_real = normalizeCountByTimeline(arrTimeline_real, queryRet[arrTimelineIndex], queryRet[arrCountIndex]);
    
            //time, count 모두 normalize된 값으로 보정
            queryRet[arrTimelineIndex] = arrTimeline_real;  //모두 동일해야 함
            queryRet[arrCountIndex] = arrCount_real;
  
            arrQueryRet.push(queryRet);  //[parkinglotId, arrTimeline, arrCount, totalCount]      
          }//for      
    
          //[B-4] chart 데이터 생성
          chartOption = makeChartOption(fromDate, toDateOrg, strChartTimeUnit, arrQueryRet);
        } 

        console.log("[Promise.allSettled] chartOption:", chartOption);

        let title = chartOption.title.text;  //엑섹 title 수정시 여기에서 할 것

        //[B-5] 결과 캐쉬 저장
        if (todayFlag) {
          cache_today.set(cacheKey, chartOption);  //for cache      
        }else{
          cache.set(cacheKey, chartOption);  //for cache           
        } 
        if(excelFlag){          
          if (todayFlag) {
            cache_today.set(cacheKey + "_excel", [title, chartOption]);  //for cache - title이 다른 경우 지원
          }else{
            cache.set(cacheKey + "_excel", [title, chartOption]);  //for cache - title이 다른 경우 지원    
          }
        }        

        //[B-6] excel download면 callback 호출 후 종료
        if(excelFlag){
          console.log("[Promise.allSettled] end - call excel callbackFunc()");

          return callbackFunc(req,res,[title, chartOption]);
        }         
  
        //[B-7] 결과 리턴
        res.json({
          option: chartOption,
          err: ""
        });        

        console.log("[Promise.allSettled] end");

        flag = true;

      }catch(e) {
        console.log("[ERROR][Promise.allSettled] err:", e);
      } 

      console.log("[Promise.allSettled] end, flag:" + flag); 

    }).catch(err => {
      console.log("[chartData] error:", err);
    }); 

  } catch (e) {
    console.log("[chartData] error:", e);
  } 

  //[주의] 이 코드는 promise result보다 먼저 처리됨
  console.log("[chartData_real] end");

} 

//주차장별로 time unit 쿼리 실행
//promiseResponse : for 비동기 결과 리턴
//influxDB에서 지원되는 strTimeUnit : 1h, 1d
function executeTimeUnitQuery(promiseResponse, fromDate, toDate, parkinglotId, strTimeUnit, etcWhere) {  
    
  console.log("[executeTimeUnitQuery] called, fromDate:" + fromDate + ", toDate:" + toDate 
                  + ", parkinglotId:" + parkinglotId + ", strTimeUnit:" + strTimeUnit + ", etcWhere:" + etcWhere);

  if(!fromDate) throw "[executeTimeUnitQuery] empty fromDate!";
  if(!toDate) throw "[executeTimeUnitQuery] empty toDate!";
  if(!parkinglotId) throw "[executeTimeUnitQuery] empty parkinglotId!";
  if(!strTimeUnit) throw "[executeTimeUnitQuery] empty strTimeUnit!";

  if(etcWhere == null) etcWhere = "";  //없으면 공백처리

  var cctvWhereClause_real = "";
  if(parkinglotId){ 
    var parkingLotJson = getTargetParkinglotJson(parkinglotId);
    var cctvWhereClause = getWhereClauseByParkinglot(parkingLotJson);  //해당 주차장에 속하는 cctv 리스트 where절
    cctvWhereClause_real = " AND (" + cctvWhereClause + ")";  //해당 주차장 cctv
  }

  var query = "select count(category) as count from events " + 
        "where 1=1 " + 
        "AND time >= '" + fromDate + "T00:00:00Z' " + 
        "AND time < '" + toDate + "T00:00:00Z' " + 
        cctvWhereClause_real + " " +   
        etcWhere + " " + //추가 쿼리 옵션이 있으면 - ex) category = '주차관제'
        "group by time(" + strTimeUnit + ") limit 100";  //너무 많이 나올 수 있으므로 안전하게 최대 100으로 한정함(시간은 하루를 넘기지 말 것)

  console.log("");
  console.log("[executeTimeUnitQuery] ◆ query : ", query);
  console.log(""); 

  executeQuery(query, (err, result) => {
    try {
      var arrTimeline = [];
      var arrCount = []; 
      var totalCount = 0;

      if(result == null) {  //쿼리에 오류가 있으면 null이 리턴되므로 여기서 먼저 걸러야 함
        throw "[executeTimeUnitQuery] invalid query! query:" + query;
      }

      console.log("[executeTimeUnitQuery] query end, result.length:" + result.length);

      // 쿼리 결과
      for (var i = 0; i < result.length; i++) {
        console.log("");
        console.log("[executeTimeUnitQuery] time[" + i + "] : " + result[i].time);
        console.log("[executeTimeUnitQuery] count[" + i + "] : " + result[i].count); 

        arrTimeline.push(result[i].time);
        arrCount.push(result[i].count);

        totalCount += result[i].count;  //총합
      } 

      //비동기 완료 call
      console.log("[executeTimeUnitQuery] call promiseResponse() parkinglotId:" + parkinglotId + ", arrTimeline:", arrTimeline + ", arrCount:", arrCount + ", totalCount:" + totalCount);
      promiseResponse([parkinglotId, arrTimeline, arrCount, totalCount]);
      console.log("[executeTimeUnitQuery] call after promiseResponse()");

    } catch (e) {
      console.log("[ERROR][executeTimeUnitQuery] res error:", e);  //e
      throw e;  //전파
    }

  });

  console.log("[executeTimeUnitQuery] end");
}

//혹시 서로 다른 time이 있을 수 있으므로 time unit을 sum함
function normalizeTimeline(...arrTimelines) {

  if(!arrTimelines) {
    throw "empty arrTimelines!";
  }

  if(arrTimelines.length == 0) {
    console.log("[WARN][normalizeTimeline()] empty arrTimelines, skip..");
    return arrTimelines;
  }

  console.log("[normalizeTimeline()] called, arrTimelines.length:" + arrTimelines.length);

  let arrTimeline_real = [];
  let timelineMap = new Map();  //중복 방지용 Array.includes는 time이 안됨

  for(var i=0; i<arrTimelines.length; i++) { //배열의 배열
    let arrTimeline = arrTimelines[i];

    for(var k=0; k<arrTimeline.length; k++) {  //time 배열
      let time = arrTimeline[k];
      let timeString = time.toUTCString();  //time은 key로 비교가 안되는 듯(문자열 변환)
      
      if(!timelineMap.has(timeString)){  //없는 time이면 추가
        timelineMap.set(timeString, "Y");
        arrTimeline_real.push(time);        

        if(i>0) { //첫번째 루프가 아닌데도
          console.log("[WARN][normalizeTimeline()] new time[" + i + "][" + k + "]:", time);  //시간이 모두 같아야 하는데도 같지 않은 시간이 있다면 확인 필요
        }
      }
    }//for
  }//for

  console.log("[normalizeTimeline()] end, arrTimeline_real.length:" + arrTimeline_real.length);

  return arrTimeline_real;
}

//누락된 time 값이 있으면 그 순서에 0으로 채워 넣음
function normalizeCountByTimeline(arrTimeline_real, arrTimeline, arrCount) {

  if(!arrTimeline_real) {
    throw "empty arrTimeline_real!";
  }  
  if(arrTimeline_real.length == 0) {
    return [];
  }
  if(arrTimeline.length != arrCount.length) {  //항상 개수는 같아야 함
    throw "arrTimeline.length != arrCount.length, arrTimeline.length:" + arrTimeline.length +  ", arrCount.length:" + arrCount.length;
  }  

  let arrCount_real = [];

  //loop를 돌면서 누락된 time 값이 있으면 그 순서에 0으로 채워 넣음
  for(var i=0; i<arrTimeline_real.length; i++) {
    let targetTime = arrTimeline_real[i];
    let targetTimeString = targetTime.toUTCString();  //time은 key로 비교가 안되는 듯(문자열 변환)

    let flag = false;

    //let targetIndex = arrTimeline.indexOf(targetTime);  //Array.includes나 indexOf는 time이 안됨
    for(var k=0; k<arrTimeline.length; k++) {  //time 배열
      let time = arrTimeline[k];
      let timeString = time.toUTCString();  //time은 key로 비교가 안되는 듯(문자열 변환)

      if(targetTimeString == timeString) {
        arrCount_real.push(arrCount[k]);  //해당 time에 count가 있다면
        flag = true;
        break;
      } 

      if(time > targetTime) {  //arrTimeline은 정렬되어 있으므로 지나가면 더 찾을 필요X        
        break;
      }
    }//for     

    if(!flag) {  //시간대를 못찾았으며 0으로 추가      
      arrCount_real.push(0);
      console.log("[WARN][normalizeCountByTimeline()] time not found! add 0 ok, time:", time);  //원래는 이런게 없어야 하므로 로그 기록
    }

  }//for

  return arrCount_real;
}

//참고 차트 : https://echarts.apache.org/examples/en/editor.html?c=line-stack
//fromDate : 분리자는 '-'
//parkinglotIdList : 분리자는 '_' (모두 넘기려면 모두 지정해야 함)
//strChartTimeUnit : 1d(일별), 1h(시간별)
//arrQueryRet : [parkinglotId, arrTimeline, arrCount, totalCount]의 배열
function makeChartOption(fromDate, toDate, strChartTimeUnit, arrQueryRet) {  

    if(!arrQueryRet) {
      throw "[makeChartOption] empty arrQueryRet!";
    } 

    console.log("[makeChartOption()] called, arrQueryRet.length:" + arrQueryRet.length);

    var title = "주차장별 주차 현황 (" + fromDate + " ~ " + toDate + ")";
    var arrParkinglotName = [];  //주차장 리스트
    var arrXUnitString = [];  //x축 문자열    
    var arrChartSeries = [];  //차트 데이터 

    var parkinglotIdIndex = 0;
    var arrTimelineIndex = 1;
    var arrCountIndex = 2;
    var arrTotalCount = 3;

    if(strChartTimeUnit == "1d"){
      title = "일자별 " + title;
    }else if(strChartTimeUnit == "1h"){
      title = "시간별 " + title;
    }

    //[1] 주차장 이름 취합
    for(var i=0; i<arrQueryRet.length; i++) {
      let queryRet = arrQueryRet[i]; //[parkinglotId, arrTimeline, arrCount, totalCount]

      let parkinglotId = queryRet[parkinglotIdIndex];
      if(!parkinglotId) throw "empty parkinglotId!";

      let parkinglotName = getParkinglotName(parkinglotId);
      if(!parkinglotName) throw "empty parkinglotName!";

      arrParkinglotName.push(parkinglotName);
    }//for

    console.log("[makeChartOption()] arrParkinglotName:", arrParkinglotName);

    //[2] x축 time line 문자화(모두 normalize되었으므로 첫번째 것 하나만 하면 됨) 
    let arrTimeline = arrQueryRet[0][arrTimelineIndex];

    for(var i=0; i<arrTimeline.length; i++) {
      var time = arrTimeline[i];
      var strTime = "";

      if(strChartTimeUnit == "1d"){
        strTime = moment(time).format("MM.DD") + ".";
      }else if(strChartTimeUnit == "1h"){
        strTime = moment(time).format("HH") + "시";
      }

      arrXUnitString.push(strTime);      
    }//for

    console.log("[makeChartOption()] arrXUnitString:", arrXUnitString);

    //[3] 주차장별 count data 생성
    for(var i=0; i<arrQueryRet.length; i++) {
      var queryRet = arrQueryRet[i]; //[parkinglotId, arrTimeline, arrCount, totalCount]

      var parkinglotName = getParkinglotName(queryRet[parkinglotIdIndex]);
      var arrTimeLine = queryRet[arrTimelineIndex];
      var countData = queryRet[arrCountIndex];
      var totalCount = queryRet[arrTotalCount];

      //cartDataJson
      var cartDataJson = {
        name : parkinglotName,
        data : countData,
        stack: 'Total',
        type: 'line',
        etcXDisplayUnit : arrXUnitString, //X축 단위 - 차트 스펙에는 없지만 추가적으로 더 보냄 (2021.11.12 IYLEE)
        etcXTimeline : arrTimeLine, //x축 실제 시간 - 차트 스펙에는 없지만 추가적으로 더 보냄 (2021.11.12 IYLEE)
        etcTotalCount: totalCount //총 개수 - 차트 스펙에는 없지만 추가적으로 더 보냄 (2021.11.12 IYLEE)
      }

      console.log("[makeChartOption()] cartDataJson[" + i + "]:", cartDataJson);

      arrChartSeries.push(cartDataJson);
    }//for

    //============================================    
    console.log("[makeChartOption()] title:" + title);

    option = {
      title: {
        text: title,
        //left: 'center'
        left: 'left'
      },
      legend: {
        data: arrParkinglotName  //주차장 리스트
      },          
      xAxis: {
        type: 'category',
        data: arrXUnitString  //x축 시간대
      },
      yAxis: {
        type: 'value'
      },
      series: arrChartSeries
    };

    console.log("[makeChartOption()] end");
    
    return option;
}

//빈차트 생성
function makeEmptyChartOption(fromDate, toDate, strChartTimeUnit) {  

  console.log("[makeEmptyChartOption()] called, fromDate:" + fromDate + ", toDate:" + toDate + ", strChartTimeUnit:" + strChartTimeUnit);

  var title = "주차장별 주차 현황 (" + fromDate + " ~ " + toDate + ")"; 

  if(strChartTimeUnit == "1d"){
    title = "일자별 " + title;
  }else if(strChartTimeUnit == "1h"){
    title = "시간별 " + title;
  } 

  //============================================    
  console.log("[makeEmptyChartOption()] title:" + title);

  option = {
    title: {
      text: title,
      //left: 'center'
      left: 'left'
    },
    legend: {
      data: [] //주차장 리스트
    },          
    xAxis: {
      type: 'category',
      data: []  //x축 시간대
    },
    yAxis: {
      type: 'value'
    },
    series: []
  };

  console.log("[makeEmptyChartOption()] end");
  
  return option;
}

//차트 데이터 조회 후 엑셀 생성 로직
function excelCallback(req, res, objParm) {

  var title = objParm[0];
  var chartOption = objParm[1]; 

  console.log('[chartDataExcel callback] called');
  console.log('[chartDataExcel callback] title:', title);
  console.log('[chartDataExcel callback] chartOption:', chartOption); 

  var workbook = new ExcelJS.Workbook();

  workbook.creator = '';
  workbook.lastModifiedBy = '';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.properties.date1904 = true;

  workbook.views = [
    {
      x: 0, y: 0, width: 10000, height: 20000,
      firstSheet: 0, activeTab: 1, visibility: 'visible'
    }
  ];
  var worksheet = workbook.addWorksheet(title);
  worksheet.columns = [
    { header: '주차장명', key: 'id', width: 30 },
    { header: '주차일자', key: 'time', width: 30 },
    { header: '주차 차량수', key: 'count', width: 30 }
  ];

  console.log("");

  //=============================
  let parkinglotList = chartOption.series;

  for (var i = 0; i < parkinglotList.length; i++) {

    let parkinglot = parkinglotList[i];

    let name = parkinglot.name;
    let countList = parkinglot.data;
    let timeline = parkinglot.etcXTimeline;

    for (var k = 0; k < timeline.length; k++) {
      var time = timeline[k];
      var strTime = time.toLocaleString();  //다른 포맷은 moment 사용할 것
      var count = countList[k];
      if (!count) count = 0;
  
      console.log("data[" + i + "] name:" + name + ", time:" + strTime + ", count:" + count);
      worksheet.addRow({ id: name, time: strTime, count: Number(count) });
    }//for

  }//for 

  //=============================
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader("Content-Disposition", "attachment; filename=" + "ReportByDates.xlsx");
  workbook.xlsx.write(res)
    .then(function (data) {
      res.end();
      console.log('File write done...');
    });
}


//==============================================


app.get('/chartData_Search', function (req3, res3) {


});

//==============================================
// 시흥 주차 특화 
//==============================================

var mEtcWhere = null;  //쿼리에 붙힐 추가 where절 옵션이 있다면 환경변수로 받음

//process.env.parkinglotcctv 로 환경변수로 받을 것(파싱을 알맞게 작성할 것)
//(시흥 주차 카메라가 20대 뿐이므로)
var mParkinglotJson = null;  //{ id:{name, cctv} } 작업 편이성을 위해 전역변수로 설정

function getParkinglotName(id) {  //id는 문자
  if(!id) throw "[getParkinglotName] empty id!";

  let parkingLotJson = mParkinglotJson[id]; //{ id:{name, cctv} } 
  if(!parkingLotJson) throw "[getParkinglotName] invalid id! id:" + id;

  return parkingLotJson["name"];
}

//local test용
var mParkinglotConfigString_test = "{ '1' : { 'name' : '8공영', 'cctv' : '1,2,3,4,5' }, '2' : { 'name' : '9공영', 'cctv' : '6,7,8,9,10' }, '3' : { 'name' : '10공영', 'cctv' : '11,12,13,14,15' }, '4' : { 'name' : '배곧광장', 'cctv' : '16,17,18,19,20' } }";

//주차장 정보를 환경정보에 받아옴
function initParkinglotConfigJson() {
  var parkingLotJson = null;

  if(process.env.etcWhere != null) {  //쿼리에 붙힐 추가 where절 옵션이 있다면 환경변수로 받음
    mEtcWhere = process.env.etcWhere;

    console.log("[initParkinglotConfigJson()] parkinglotcctv etcWhere:[" + mEtcWhere + "]");
  }

  if(process.env.parkinglotcctv != null) {
    var option = process.env.parkinglotcctv;

    console.log("[initParkinglotConfigJson()] parkinglotcctv option:[" + option + "]");
    if (option.indexOf("'") != -1) { //큰 따옴표 대신에 작은 따옴표로 되어 있다면 replace
      option = option.replace(/'/ig,'"');
    }
    console.log("[initParkinglotConfigJson()] parkinglotcctv after option:[" + option + "]");

    parkingLotJson = JSON.parse(option);
  }else{
    if (mParkinglotConfigString_test.indexOf("'") != -1) { //큰 따옴표 대신에 작은 따옴표로 되어 있다면 replace
      mParkinglotConfigString_test = mParkinglotConfigString_test.replace(/'/ig,'"');
    }

    parkingLotJson = JSON.parse(mParkinglotConfigString_test);
  }

  if(!parkingLotJson) {
    throw "[initParkinglotConfigJson] invalid parkingLotJson!";
  }

  mParkinglotJson = parkingLotJson;

  return mParkinglotJson;
}

//해당 parkinglot 객체를 리턴함
function getTargetParkinglotJson(parkinglotId) {

  console.log("[getTargetParkinglotJson()] called, parkinglotId:", parkinglotId);

  if(!parkinglotId) {  //빈값이면
    throw "[getTargetParkinglotJson] empty parkinglotId!";
  }
  if (mParkinglotJson[parkinglotId] == null) {
    throw "[getTargetParkinglotJson] invalid parkinglotId! parkinglotId:" + parkinglotId;
  }  

  let parkingLotJson = mParkinglotJson[parkinglotId];

  return parkingLotJson;
}


//where절의 in 문자열을 만들어 리턴함
//parkingLotJson : ex) { "name" : "8공영", "cctv" : "1,2,3,4,5" }
function getWhereClauseByParkinglot(parkingLotJson) {

  if(!parkingLotJson) {
    throw "empty parkingLotJson!";
  }
  if(!parkingLotJson["name"]) {
    throw "invalid parkingLotJson! cannot find name!";
  }  
  if(!parkingLotJson["cctv"]) {
    throw "invalid parkingLotJson! cannot find cctv!";
  }    

  console.log("[getWhereClauseByParkinglot()] called, parkingLotJson.name:", parkingLotJson["name"], ", cctv:", parkingLotJson["cctv"]);

  let whereString = "";

  try{

    let arrParkinglotCctvList = parkingLotJson["cctv"].split(",");  //분리자가 없어도 정상 파싱됨

    //influxDB는 'in'이 안됨
    if (arrParkinglotCctvList != null && arrParkinglotCctvList.length > 0) {
      whereString = "cctv='" + arrParkinglotCctvList.join("' or cctv='") + "'";
    }else{
      throw "[getWhereClauseByParkinglot()] not found, invalid parkinglot! parkinglot:" + parkinglot;
    }

  }catch(e) {
    console.log("[ERROR][getWhereClauseByParkinglot()] error:", e);
    throw e;
  } 

  console.log("[getWhereClauseByParkinglot()] end, inString:", whereString);

  return whereString
}

