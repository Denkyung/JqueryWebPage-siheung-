
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
    //var db_host = 'localhost';
    var db_host = '192.168.101.6';
    var db_port = 5432;
    var db_user = 'pdb';
    var db_database = 'log_db';
    //var db_password = '4Z2CrYcasdfLe0OUM9YD';
    var db_password = 'zXNWpbYtjm1Xj0pP';

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

app.get('/', function(req,res){
  console.log("/login called");
  res.render('login', {count:0});
});

app.get('/login', function(req,res){
  console.log("/login called");
  res.render('login', {count:0});
});

app.get('/timeChart', function(req,res){
  console.log("/timeChart called");
  res.render('timeChart', {count:0});
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

// app.get('/timeChartData', function(req,res){  
//   try{

//     console.log("/timeChartData called");

//     var query = "SELECT count(*) as ret from events";

//     pool.query(query, (err, result) => {
//       try{
//         console.log("ret:"+ result.rows[0].ret)
//         data_cout = result.rows[0].ret

//         //res.send('data_cout :'  + data_cout)

//         option = {
//           xAxis: {
//               type: 'category',
//               data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
//           },
//           yAxis: {
//               type: 'value'
//           },
//           series: [{
//               data: [120, 220, 150, 80, 70, 110, 130],
//               type: 'bar'
//           }]
//       };        

//         res.json({
//           option: option,
//         });

//       }catch(e){
//         console.log("[COUNT] res error:" + e);  //e.stack
//       }      
        
//     });  
//   }catch(e){
//     console.log("[COUNT] error:" + e);
//   }    
// });


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
          title: {
              text: '이벤트 현황',
              subtext: '총계',
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
                  name: '访问来源',
                  type: 'pie',
                  radius: '50%',
                  data: [
                      {value: 1048, name: '움직임 (20%)'},
                      {value: 735, name: '배회 (10%)'},
                      {value: 580, name: '번호판 (10%)'},
                      {value: 484, name: '쓰러짐 (10%)'},
                      {value: 300, name: '침입 (10%)'}
                  ],
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
 

app.get('/chartData1', function(req,res){  
  try{

    console.log("/chartData1 called");

    var query = "	select distinct \
                  category, \
                  round( \
                    ((COUNT(*) OVER (partition by category )) * 100)::numeric  \
                    / COUNT(*) OVER ()  \
                  , 2) as percent \
                  from events order by percent desc";

    pool.query(query, (err, result) => {
      try{

        var arr_data = []

        for(var i = 0; i < result.rows.length; i++){
          console.log("category[" + i + "] : " + result.rows[i].category);
          console.log("percent[" + i + "] : " + result.rows[i].percent);

          arr_data.push({name:result.rows[i].category + " (" + result.rows[i].percent + "%)", value:result.rows[i].percent})
        }          

        option = {
          title: {
              text: '이벤트 현황 (총계)', 
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
                  // data: [
                  //     {value: 1048, name: '움직임 (20%)'},
                  //     {value: 735, name: '배회 (10%)'},
                  //     {value: 580, name: '번호판 (10%)'},
                  //     {value: 484, name: '쓰러짐 (10%)'},
                  //     {value: 300, name: '침입 (10%)'}
                  // ],
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


function getNextDay() {

  let today = new Date();    

  var myDate = new Date(new Date().getTime()+(1*24*60*60*1000)); 

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

app.get('/chartData2', function(req,res){  
  try{ 

    var fromDate = req.params.fromDate;
    var endDate = req.params.endDate;

    if (!fromDate){
      //fromDate = "2021-09-17";
      fromDate = getToday();
    }
    if (!endDate){
      endDate = getNextDay();
    }    

    var title = "날짜별 발생 현황 (" + fromDate + ")";

    console.log("==========================================");
    console.log("/chartData2 called");

    console.log("fromDate:" + fromDate);
    console.log("endDate:" + endDate);
    console.log("title:" + title);

    var query = "select category, count(*) as count, SUM(count(*)) over () as sum from events \
          where 1=1 \
          and time >= '" + fromDate + "T00:00:00+09:00'::TIMESTAMP WITH TIME ZONE \
          AND time < '" + endDate + "T00:00:00+09:00'::TIMESTAMP WITH TIME ZONE \
          group by category"; 

    pool.query(query, (err, result) => {
      try{
        var arr_data_level = []
        var arr_data = []

        for(var i = 0; i < result.rows.length; i++){
          console.log("category[" + i + "] : " + result.rows[i].category);
          console.log("count[" + i + "] : " + result.rows[i].count);
          console.log("sum[" + i + "] : " + result.rows[i].sum);

          arr_data_level.push(result.rows[i].category)
          arr_data.push(result.rows[i].count)
        }  

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
 

app.get('/chartData3', function(req,res){  
  try{

    console.log("/chartData3 called");

    var query = "SELECT count(*) as ret from events";

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
                      value: [4200, 3000, 20000, 35000, 50000, 18000],
                      name: '움직임'
                  },
                  {
                      value: [5000, 14000, 28000, 26000, 42000, 21000],
                      name: '쓰러짐'
                  }
              ]
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
 


app.get('/chartData4', function(req,res){  
  try{

    console.log("/chartData2 called");

    var query = "select code2, category, count(*) as count, SUM(count(*)) over () as sum from events group by code2,category  order by code2,category";

    pool.query(query, (err, result) => {
      try{

        var arr_data_loc = [];
        var arr_data_level = [];
        var arr_data = []; 
        
        var hashmap_category = {}; 

        for(var i = 0; i < result.rows.length; i++){
          console.log("code2[" + i + "] : " + result.rows[i].code2);
          console.log("category[" + i + "] : " + result.rows[i].category);
          console.log("count[" + i + "] : " + result.rows[i].count);
          console.log("sum[" + i + "] : " + result.rows[i].sum);

          var loc = result.rows[i].code2;
          var level = result.rows[i].category;
          var count = result.rows[i].count;

          if (arr_data_loc.indexOf(loc) == -1){
            arr_data_loc.push(loc);
          }
          if (arr_data_level.indexOf(level) == -1){
            arr_data_level.push(level);
          }
          if (arr_data.indexOf(count) == -1){
            arr_data.push(count);
          }

          if (!hashmap_category[level]){
            hashmap_category[level] = {name:level, datas:[]};
          }
          console.log("level[i] : " + level);
          console.log("count[i] : " + count);

          hashmap_category[level].datas.push(count);
        }//for   

        var arrSeries = [];
        console.log("===============================");

        for(var i=0; i<arr_data_level.length; i++) {
          var level = arr_data_level[i];
          console.log("level[" + i + "] : " + level);

          var datas_name = hashmap_category[level].name;
          var datas_array = hashmap_category[level].datas;     
          
          console.log("datas_name[" + i + "] : " + datas_name);
          console.log("datas_array[" + i + "] : " + datas_array);

          arrSeries.push(
            {
              name: datas_name,
              type: 'bar',
              stack: 'total',
              label: {
                  show: true
              },
              emphasis: {
                  focus: 'series'
              },
              data: datas_array
            });
        }

        option = {
      
          tooltip: {
              trigger: 'axis',
              axisPointer: {            // Use axis to trigger tooltip
                  type: 'shadow'        // 'shadow' as default; can also be 'line' or 'shadow'
              }
          },
          legend: {
              data: arr_data_level
          },
          grid: {
              left: '3%',
              right: '4%',
              bottom: '3%',
              containLabel: true
          },
          xAxis: {
              type: 'value'
          },
          yAxis: {
              type: 'category',
              data: arr_data_loc
          },
          series: arrSeries, 
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
 


app.get('/chartData5', function(req,res){  
  try{

    console.log("/chartData5 called");

    var query = "select code2, category, count(*) as count, SUM(count(*)) over () as sum from events group by code2,category  order by code2,category";

    pool.query(query, (err, result) => {
      try{

        var arr_data_loc = [];
        var arr_data_level = [];
        var arr_data = [];

        var hashmap_category = {}; 

        for(var i = 0; i < result.rows.length; i++){
          console.log("code2[" + i + "] : " + result.rows[i].code2);
          console.log("category[" + i + "] : " + result.rows[i].category);
          console.log("count[" + i + "] : " + result.rows[i].count);
          console.log("sum[" + i + "] : " + result.rows[i].sum);

          var loc = result.rows[i].code2;
          var level = result.rows[i].category;
          var count = result.rows[i].category;

          if (arr_data_loc.indexOf(loc) == -1){
            arr_data_loc.push(loc);
          }
          if (arr_data_level.indexOf(level) == -1){
            arr_data_level.push(level);
          }
          if (arr_data.indexOf(count) == -1){
            arr_data.push(count);
          }

          if (!hashmap_category[level]){
            hashmap_category[level] = {name:level, datas:[]};
          }

          hashmap_category[level].datas.push(count);
        }//for   

        var arrSeries = [];

        for(var i=0; i<hashmap_category.length; i++) {
          var datas_name = hashmap_category[i].name;
          var datas_array = hashmap_category[i].datas;
          arrSeries[i].push(
            {
              name: datas_name,
              type: 'bar',
              stack: 'total',
              label: {
                  show: true
              },
              emphasis: {
                  focus: 'series'
              },
              data: datas_array
            });
        }

        option = {
      
          tooltip: {
              trigger: 'axis',
              axisPointer: {            // Use axis to trigger tooltip
                  type: 'shadow'        // 'shadow' as default; can also be 'line' or 'shadow'
              }
          },
          legend: {
              data: arr_data_level
          },
          grid: {
              left: '3%',
              right: '4%',
              bottom: '3%',
              containLabel: true
          },
          xAxis: {
              type: 'value'
          },
          yAxis: {
              type: 'category',
              data: arr_data_loc
          },
          series: arrSeries, 
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