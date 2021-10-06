
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
        myDate.setDate(myDate.getDate() + 1);

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

    function isValidDate(strDate) {

        if(!strDate) {
            return false;
        }

        var strNum = strDate.replace(/-/gi,"");

        if(strNum.length != 8) {
            return false;
        }        

        if(isNaN(strNum)) {
            return false;
        }

        var myDateStr= new Date(strDate);
        if( ! isNaN ( myDateStr.getMonth() ) ) {
           return true;
        }

        return false;
    }

    function convertDateToNumber(strDate) {

        if(!isValidDate(strDate)) {
            return -1;
        }

        var strNum = strDate.replace(/-/gi,"");

        var num = Number(strNum);

        return num;
    }
