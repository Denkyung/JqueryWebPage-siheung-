var lastUpdate = "2021-10-06 10:30";

console.log("");
console.log("==============================");
console.log("Version : " + lastUpdate);

const express = require('express');
const cors = require('cors');

const app = express();
const port = 5001;

app.use(cors()); 

//================================
const ExcelJS = require('exceljs');

//================================
var LRU = require("lru-cache");
var cache = new LRU({ 
  max: 100,
  maxAge: 1000 * 60 * 60 * 4
});
var cache_today = new LRU({ 
  max: 10,
  maxAge: 1000 * 10
});

//================================
//for database
//const { Client } = require('pg');
const { Pool } = require('pg');

//var client = null
var pool = null

var data_cout = 0;

let mDBConnectedFlag = false;

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
  init();
  console.log(`app listening at http://localhost:${port}`);
})


function init() {

  try{
    //var db_host = 'localhost';
    var db_host = '192.168.101.6';
    var db_port = 5432;
    var db_user = 'pdb';
    var db_database = 'log_db';
    //var db_password = '4Z2CrYcasdfLe0OUM9YD';  //localhost
    var db_password = 'zXNWpbYtjm1Xj0pP';  //6번

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
      max: 20,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,      
    });

    pool.on("error", (err) => console.error('[POOL] idle client error:', err));  //important for db restart - 2021.09.15 IYLEE

    connectDB();

  }catch(e){
    console.log("[INIT] error:" + e);
  }
}

function connectDB() {

  try{
    // callback - checkout a client
    pool.connect((err, client, done) => {
      if (err) {
        console.log("[ERROR][pool.connect], error:", err.stack);
        return;  //DB재구동 후 한번 더 누르면 자동 연결되므로 return
      }

      client.query('SELECT NOW()', [], (err, res) => {
        done()
        if (err) {
          console.log(err.stack);
        } else {
          mDBConnectedFlag = true;
          console.log("[connectDB] db connect ok! mDBConnectedFlag:", mDBConnectedFlag);
          console.log(res.rows[0]);
        }
      })
    });
  }catch(e){
    console.log("[connectDB] error:" + e);
  }        
}

//for ejs
app.set('view engine','ejs'); // 1
app.use(express.static(__dirname + '/public'));
//app.use(express.static('public'));
app.engine('html', require('ejs').renderFile);   //important

//==========================================
app.get('/', function(req,res){
  console.log("/login called");
  res.render('login', {count:0});
});

app.get('/login', function(req,res){
  console.log("/login called");
  res.render('login', {count:0});
});

app.get('/chart1', function(req,res){
  console.log("/chart1 called");
  res.render('chart1', {count:0});
});

app.get('/chart2', function(req,res){
  console.log("/chart2 called");
  res.render('chart2', {count:0});
});

app.get('/chart3', function(req,res){
  console.log("/chart3 called");
  res.render('chart3', {count:0});
});

app.get('/chart4', function(req,res){
  console.log("/chart4 called");
  res.render('chart4', {count:0});
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

  if(!targetDate) {
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
app.get('/chartData1', function(req,res){  
  chartData1_real(req,res,false);
});
app.get('/chartData2', function(req,res){  
  chartData2_real(req,res,false);
});
// app.get('/chartData3', function(req,res){  
//   chartData3_real(req,res,false);
// });
app.get('/chartData4', function(req,res){  
  chartData4_real(req,res,false);
});
 
//===========================================
function chartData1_real(req,res,excelFlag,callbackFunc){  
  try{

    console.log("/chartData1_real called, excelFlag:" + excelFlag);

    var option_cache = cache.get("chartData1");  //for cache
    if(option_cache){
      
      if(!excelFlag){
        console.log("[chartData1_real] cache found! return ok!");

        res.json({
          option: option_cache,
        });    
        return;
      }      
    }

    var option_cache_excel = cache.get("chartData1_excel");  //for cache
    if(option_cache_excel){
      if(excelFlag){ 
        console.log("[chartData1_real] option_cache_excel found! return ok! option_cache_excel:", option_cache_excel);
        return callbackFunc(req,res,option_cache_excel);
      }      
    }    

    if(!mDBConnectedFlag){
      connectDB();
      return;  //DB재구동 후 한번 더 누르면 자동 연결되므로 return
    }

    var query = "	select distinct \
                  category, \
                  COUNT(*) OVER (partition by category ) as count, \
                  COUNT(*) OVER () as sum, \
                  round( \
                    ((COUNT(*) OVER (partition by category )) * 100)::numeric  \
                    / COUNT(*) OVER ()  \
                  , 2) as percent \
                  from events order by percent desc";

    console.log("");
    console.log("[chartData1_real] query : ", query);
    console.log("");

    pool.query(query, (err, result) => {
      try{

        var arr_data = [];
        var arr_data_excel = [];

        var sum = 0;

        for(var i = 0; i < result.rows.length; i++){
          console.log("category[" + i + "] : " + result.rows[i].category);
          console.log("percent[" + i + "] : " + result.rows[i].percent);
          console.log("count[" + i + "] : " + result.rows[i].count);

          sum = result.rows[i].sum;
          var strCount = Number(result.rows[i].count).toLocaleString();

          arr_data.push({name:result.rows[i].category + " (" + strCount + "건)", value:result.rows[i].percent});
          arr_data_excel.push({name:result.rows[i].category, count:result.rows[i].count, value:result.rows[i].percent});
        }          

        var strSum = Number(sum).toLocaleString();
        var title = '이벤트 현황 (총계, 총 ' + strSum + '건)';

        option = {
          title: {
              text: title, 
              left: 'center'
          },
          tooltip: {
              trigger: 'item'
          },
          legend: {
              orient: 'vertical',
              left: 'left',
          },
          series: [
              {
                  name: 'event',
                  type: 'pie',
                  radius: '50%',
                  data : arr_data,
                  emphasis: {
                      itemStyle: {
                          shadowBlur: 10,
                          shadowOffsetX: 0,
                          shadowColor: 'rgba(0, 0, 0, 0.5)'
                      }
                  }
              }
          ]
      };     

        cache.set("chartData1", option);  //for cache
        cache.set("chartData1_excel", [title, arr_data_excel]);  //for cache
        if(excelFlag){
          return callbackFunc(req,res,[title, arr_data_excel]);
        }          

        res.json({
          option: option,
        });

      }catch(e){
        console.log("[chartData1_real] res error:" + e);  //e.stack
      }      
        
    });  
  }catch(e){
    console.log("[chartData1_real] error:" + e);
  }    
}

function chartData2_real(req,res,excelFlag,callbackFunc){  
  try{

    console.log("[chartData2_real] called, excelFlag:" + excelFlag);

    var fromDate = req.query.fromDate;
    var toDate = req.query.toDate;
    var toDateOrg = toDate;  //원래 toDate

    console.log("[chartData2_real] fromDate:" + fromDate);
    console.log("[chartData2_real] toDate:" + toDate);
    console.log("[chartData2_real] toDateOrg:" + toDateOrg);

    if(!fromDate) {
      throw "[ERROR][chartData2_real] empty fromDate!";
    }
    if(!toDate) {
      throw "[ERROR][chartData2_real] empty toDate!";
    }    

    var todayFlag = false;
    if (fromDate == getToday()) {
      todayFlag = true;
    }

    toDate = getNextDay(toDate);  //'<='가 아니라 '<'이므로 다음날을 구함

    var cacheKey = "chartData2_" + fromDate + "_" + toDateOrg;
    console.log("[chartData2_real] todayFlag:" + todayFlag + ", cacheKey:" + cacheKey);    
    
    var option_cache = null;

    if(!excelFlag){
      if(todayFlag){
        var option_cache = cache_today.get(cacheKey);  //for cache - 오늘 날짜는 짧게 캐쉬
      }else{
        var option_cache = cache.get(cacheKey);  //for cache
      } 

      if(option_cache){
        console.log("[chartData2_real] cache found! return ok!");

        res.json({
          option: option_cache,
        }); 

        return;       
      }   
    }      

    var option_cache_excel = cache.get(cacheKey + "_excel");  //for cache
    if(option_cache_excel){
      if(excelFlag){ 
        console.log("[chartData2_real] option_cache_excel found! return ok! option_cache_excel:", option_cache_excel);
        return callbackFunc(req,res,option_cache_excel);
      }      
    }      

    if(!mDBConnectedFlag){
      connectDB();
      return;  //DB재구동 후 한번 더 누르면 자동 연결되므로 return
    }     

    console.log("==========================================");

    console.log("fromDate:" + fromDate);
    console.log("toDate:" + toDate);

    var query = "select category, count(*) as count, SUM(count(*)) over () as sum from events \
          where 1=1 \
          and time >= '" + fromDate + "T00:00:00+09:00'::TIMESTAMP WITH TIME ZONE \
          AND time < '" + toDate + "T00:00:00+09:00'::TIMESTAMP WITH TIME ZONE \
          group by category"; 

    console.log("");
    console.log("[chartData2_real] query : ", query);
    console.log("");

    pool.query(query, (err, result) => {
      try{
        var arr_data_level = []
        var arr_data = []
        var sum = 0;
        var count = 0;

        for(var i = 0; i < result.rows.length; i++){
          console.log("");
          console.log("category[" + i + "] : " + result.rows[i].category);
          console.log("count[" + i + "] : " + result.rows[i].count);
          console.log("sum[" + i + "] : " + result.rows[i].sum);

          sum = result.rows[i].sum;
          count = result.rows[i].count;

          if(excelFlag){
            arr_data_level.push(result.rows[i].category);
          }else{
            arr_data_level.push(result.rows[i].category + " (" + Number(count).toLocaleString() + "건)")
          }
         
          arr_data.push(result.rows[i].count)
        }
        
        var strDate = fromDate + "~" + toDateOrg;
        if (fromDate == toDateOrg){
          strDate = fromDate;
        }

        var title = "날짜별 발생 현황 (" + strDate + ", 총 " + Number(sum).toLocaleString() + "건)";
        if(excelFlag){
          var strDate_new = fromDate.substring(5,10) + "~" + toDateOrg.substring(5,10);
          title = "총 " + Number(sum).toLocaleString() + "건(" + strDate_new + ")";
        }

        console.log("");
        console.log("title:" + title);

        option = {
          title: {
            text: title,
            left: 'center'
          },          
          xAxis: {
              type: 'category',
              data: arr_data_level
          },
          yAxis: {
              type: 'value'
          },
          series: [{
              data: arr_data,
              type: 'bar'
          }]
        };

        if (todayFlag) {
          cache_today.set(cacheKey, option);  //for cache      
        }else{
          cache.set(cacheKey, option);  //for cache           
        } 

        if(excelFlag){
          if (todayFlag) {
            cache_today.set(cacheKey + "_excel", [title, arr_data_level, arr_data]);  //for cache - title이 달라 excel일 경우만 저장     
          }else{
            cache.set(cacheKey + "_excel", [title, arr_data_level, arr_data]);  //for cache - title이 달라 excel일 경우만 저장     
          }
          return callbackFunc(req,res,[title, arr_data_level, arr_data]);
        }       

        res.json({
          option: option,
          err : ""
        });

      }catch(e){
        console.log("[chartData2] res error:" + e);  //e.stack
      }      
        
    });  

  }catch(e){
    console.log("[chartData2] error:" + e);
  }    
}
 
/*
function chartData3_real(req,res,excelFlag,callbackFunc){  
  try{

    console.log("/chartData3_real called, excelFlag:" + excelFlag);

    var option_cache = cache.get("chartData3");  //for cache
    if(option_cache){
      console.log("[chartData3] cache found! return ok!");

      if(excelFlag){
        return option_cache;
      }      

      res.json({
        option: option_cache,
      });    
      return;
    }    

    if(!mDBConnectedFlag){
      connectDB();
      return;
    }    

    var query = "SELECT count(*) as ret from events";

    console.log("[chartData3_real] query : ", query);

    pool.query(query, (err, result) => {
      try{
        console.log("ret:"+ result.rows[0].ret)
        data_cout = result.rows[0].ret

        //res.send('data_cout :'  + data_cout)
        option = {
          title: {
            left: 'center'
          },  
          legend: {
              data: ['움직임', '쓰러짐']
          },
          radar: {
              // shape: 'circle',
              indicator: [
                  { name: '0시', max: 6500},
                  { name: '4시', max: 16000},
                  { name: '8시', max: 30000},
                  { name: '12시', max: 38000},
                  { name: '16시', max: 52000},
                  { name: '20시', max: 25000}
              ]
          },
          series: [{
              name: 'a）',
              type: 'radar',
              data: [
                  {
                      value: [0, 0, 0, 0, 0, 0],
                      name: '움직임'
                  },
                  {
                      value: [0, 0, 0, 0, 0, 0],
                      name: '쓰러짐'
                  }
              ]
          }]
      };

        cache.set("chartData3", option);  //for cache

        if(excelFlag){
          return option;
        }          

        res.json({
          option: option,
        });

      }catch(e){
        console.log("[chartData3] res error:" + e);  //e.stack
      }      
        
    });  
  }catch(e){
    console.log("[chartData3] error:" + e);
  }    
}
*/

function chartData4_real(req,res,excelFlag,callbackFunc){  
  try{

    console.log("/chartData4_real called, excelFlag:" + excelFlag);

    var option_cache = cache.get("chartData4");  //for cache
    if(option_cache){      
      if(!excelFlag){
        console.log("[chartData4_real] cache found! return ok!");

        res.json({
          option: option_cache,
        });    
        return;
      }      
    }

    var option_cache_excel = cache.get("chartData4_excel");  //for cache
    if(option_cache_excel){
      if(excelFlag){ 
        console.log("[chartData4_excel] option_cache_excel found! return ok! option_cache_excel:", option_cache_excel);
        return callbackFunc(req,res,option_cache_excel);
      }      
    }    

    if(!mDBConnectedFlag){
      connectDB();
      return;
    }    

    var query = "select code2, category, count(*) as count, SUM(count(*)) over () as sum from events group by code2,category  order by code2,category";

    console.log("");
    console.log("[chartData4_real] query : ", query);
    console.log("");

    pool.query(query, (err, result) => {
      try{

        var arr_data_level = [];
        var arr_data_loc = [];  
        
        var hashmap_loc = {};

        for(var i = 0; i < result.rows.length; i++){
          console.log("code2[" + i + "] : " + result.rows[i].code2);
          console.log("category[" + i + "] : " + result.rows[i].category);
          console.log("count[" + i + "] : " + result.rows[i].count);
          console.log("sum[" + i + "] : " + result.rows[i].sum);

          var loc = result.rows[i].code2;
          var level = result.rows[i].category;
          var count = result.rows[i].count;

          if(!loc) {  //빈값은 skip
            //loc = "없음";
            continue;
          }          

          if(!level) {  //빈값은 skip
            continue;
          }

          if (arr_data_loc.indexOf(loc) == -1){
            arr_data_loc.push(loc);
          }
          if (arr_data_level.indexOf(level) == -1){
            arr_data_level.push(level);
          }

          if(!hashmap_loc[loc]){
            hashmap_loc[loc] = {};            
          }
          hashmap_loc[loc][level] = count;
          
          //console.log("level[i] : " + level);
          //console.log("count[i] : " + count);
          console.log("hashmap_loc[" + loc + "][" + level + "] : " + hashmap_loc[loc][level]);
          console.log(""); 
        }//for    

        var arrSource = [];

        for(var k=0; k<arr_data_loc.length; k++) {
          var oneSource = {};

          var loc = arr_data_loc[k];
          if(!loc){  //빈값은 skip
            //loc = "없음";
            continue;
          }

          oneSource["product"] = loc;

          for(var i=0; i<arr_data_level.length; i++) {
          
            var level = arr_data_level[i]; 
            if(!level){  //빈값은 skip
              continue;
            }

            var count = 0;

            if(hashmap_loc[loc][level]){
              count = hashmap_loc[loc][level];
            }

            oneSource[level] = count;
          }//for

          arrSource.push(oneSource);
        }

        var arrSeries = [];
        console.log("===============================");

        for(var i=0; i<arr_data_level.length; i++) {
          var level = arr_data_level[i];
          console.log("level[" + i + "] : " + level); 

          arrSeries.push({ type: 'bar' }); 
        }
 
      option = {
        legend: {},
        tooltip: {},
        dataset: {
          dimensions: ['product', ...arr_data_level],
          source:arrSource
          /*
          source: [
            { product: 'Matcha Latte', '2015': 43.3, '2016': 85.8, '2017': 93.7 },
            { product: 'Milk Tea', '2015': 83.1, '2016': 73.4, '2017': 55.1 },
            { product: 'Cheese Cocoa', 2015: 86.4, 2016: 65.2, 2017: 82.5 },
            { product: 'Walnut Brownie', 2015: 72.4, 2016: 53.9, 2017: 39.1 }
          ]
          */
        },
        xAxis: { type: 'category' },
        yAxis: {},
        series: arrSeries
      };      

        cache.set("chartData4", option);  //for cache
        cache.set("chartData4_excel", [arr_data_level, arr_data_loc, hashmap_loc]);  //for cache

        if(excelFlag){          
          return callbackFunc(req,res,[arr_data_level, arr_data_loc, hashmap_loc]);
        }        

        res.json({
          option: option,
        });

      }catch(e){
        console.log("[chartData4] res error:" + e);  //e.stack
      }      
        
    });  
  }catch(e){
    console.log("[chartData4] error:" + e);
  }    
}


//========================================================
app.get('/chartData1Excel', function (req2, res2) {

  var excelMethod = function(req,res,objParm) {

      var title = objParm[0];
      var dataList = objParm[1]; 
      
      console.log('chartData1Excel called, dataList.length:' + dataList.length);
      console.log('chartData1Excel title:' + title);

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
          { header: '이벤트', key: 'id', width: 20 },
          { header: '건수', key: 'count', width: 20 },
          { header: '비율', key: 'name', width: 20 }
      ];

      console.log("");
    
      //=============================
      for (var i=0; i<dataList.length; i++){
        var data = dataList[i];
        console.log('data[' + i + ']:', data);
        worksheet.addRow({ id: data.name, count: Number(data.count), name: Number(data.value) });
      }
    
      //=============================
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader("Content-Disposition", "attachment; filename=" + "ReportByAllEvents.xlsx");
      workbook.xlsx.write(res)
          .then(function (data) {
              res.end();
              console.log('File write done...');
          });
  }

  chartData1_real(req2, res2, true, excelMethod);

});

app.get('/chartData2Excel', function (req2, res2) {

  var excelMethod = function(req,res,objParm) {

      var title = objParm[0];
      var eventList = objParm[1]; 
      var countList = objParm[2];

      console.log('chartData2Excel called');
      //console.log('chartData2Excel called, objParm:', objParm);
      
      console.log('chartData2Excel title:', title);
      console.log('chartData2Excel eventList:', eventList);
      console.log('chartData2Excel countList:', countList);      

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
          { header: '이벤트', key: 'id', width: 20 },
          { header: '건수', key: 'count', width: 20 }
      ];

      console.log("");
    
      //=============================
      for (var i=0; i<eventList.length; i++){
        var event = eventList[i];
        var count = countList[i];
        if(!count) count = 0;

        console.log('data[' + i + '] event:' + event + ", count:" + count);
        worksheet.addRow({ id: event, count: Number(count)});
      }
    
      //=============================
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader("Content-Disposition", "attachment; filename=" + "ReportByDates.xlsx");
      workbook.xlsx.write(res)
          .then(function (data) {
              res.end();
              console.log('File write done...');
          });
  }

  chartData2_real(req2, res2, true, excelMethod);

});



app.get('/chartData4Excel', function (req2, res2) { 

  var excelMethod = function(req,res,dataList) {

    console.log('chartData4Excel called, dataList.length:' + dataList.length);

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
    
    var arr_data_level = dataList[0];
    var arr_data_loc = dataList[1];      
    var hashmap_loc = dataList[2];   
    var title = dataList[3];    

    var worksheet = workbook.addWorksheet(title);

    var arr_columns = [];

    //=============================
    var column = { header: "장소", key: 'id', width: 20 }
    arr_columns.push(column);

    for (var i=0; i<arr_data_level.length; i++){
      var column = { header: arr_data_level[i], key: 'id_' + i, width: 20 }
      arr_columns.push(column);
    }

    worksheet.columns = arr_columns;

    console.log("[chartData4Excel] arr_data_level:", arr_data_level); 
    console.log("[chartData4Excel] arr_data_loc:", arr_data_loc); 
    console.log("[chartData4Excel] hashmap_loc:", hashmap_loc);  
  
    //=============================
    for (var i=0; i<arr_data_loc.length; i++){
      var loc = arr_data_loc[i];

      if(!loc) {
        continue;
      }

      var rowObj = {};
      rowObj["id"] = loc; 

      console.log("[chartData4Excel][" + i + "] loc:" + loc);
      console.log("[chartData4Excel][" + i + "] hashmap_loc[loc]:", hashmap_loc[loc]); 

      for (var k=0; k<arr_data_level.length; k++){ 
        var level = arr_data_level[k];
        var count = hashmap_loc[loc][level];
        if (!count) count = 0;

        console.log("");
        console.log("[chartData4Excel][" + i + "][" + loc + "] level:", level);
        console.log("[chartData4Excel][" + i + "][" + k + "] hashmap_loc:",count);
        rowObj["id_" + k] = Number(count);  //Number 중요     
      }//for

      worksheet.addRow(rowObj);
    }
  
    //=============================
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader("Content-Disposition", "attachment; filename=" + "ReportByAllLocation.xlsx");
    workbook.xlsx.write(res)
        .then(function (data) {
            res.end();
            console.log('File write done...');
        });
  }

  chartData4_real(req2, res2, true, excelMethod);  

});

