// #region clock
var dateDiff;
function getDateOffset() {
    var localDate = Date.now();
    $.ajax({
        type: "GET",
        url: `https://ntp-a1.nict.go.jp/cgi-bin/json?${localDate / 1000}`,
        dataType: "json"
    }).done(function(res){
        dateDiff = res.st * 1000 + (localDate - res.it * 1000) / 2 - localDate;
    }).fail(function(){
        dateDiff = 0;
    });
}

function clock() {
    var date = new Date(Date.now() + dateDiff);

    $("#clock").html(`${date.getFullYear()}年${date.getMonth() + 1}月${date.getDay()}日<br>${date.getHours()}時${date.getMinutes()}分${date.getSeconds()}秒`);

    if (date.getSeconds() === 30) {
        getDateOffset();
    }

    setTimeout(clock, 200);
}

function startClock(){
    getDateOffset();
    clock();
}
// #endregion clock
