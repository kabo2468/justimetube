function zeroPadding(num, length) {
    'use strict';
	return (Array(length).join('0') + num).slice(-length);
}

// #region clock
var dateDiff;
function formatDate(date) {
    'use strict';
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDay();
    const h = date.getHours();
    const min = date.getMinutes();
    const sec = date.getSeconds();
    return `${y}年${m}月${d}日\n${h}時${zeroPadding(min, 2)}分${zeroPadding(sec, 2)}秒`;
}

function getDateOffset() {
    'use strict';
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
    'use strict';
    var date = new Date(Date.now() + dateDiff);

    if (dateDiff !== undefined) {
        $("#clock-text").html(formatDate(date).replace(/\n/g, '<br>'));
    }

    if (date.getSeconds() === 30) {
        getDateOffset();
    }

    setTimeout(clock, 200);
}

(function(){
    getDateOffset();
}());

window.addEventListener('DOMContentLoaded', function() {
    'use strict';
    clock();
});
// #endregion clock
