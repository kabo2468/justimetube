var alarmDate = new Date(2019, 0, 1, 0, 0, 0, 0);
var eventText = '年越し';

function zeroPadding(num, length) {
    'use strict';
	return (Array(length).join('0') + num).slice(-length);
}

// #region clock
var dateDiff, updateOffset, nowDate;
function formatDate(date) {
    'use strict';
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const h = date.getHours();
    const min = date.getMinutes();
    const sec = date.getSeconds();
    return `${y}年${m}月${d}日\n${h}時${zeroPadding(min, 2)}分${zeroPadding(sec, 2)}秒`;
}

function getDateOffset() {
    'use strict';
    const localDate = Date.now();
    $.ajax({
        type: "GET",
        url: `https://ntp-a1.nict.go.jp/cgi-bin/json?${localDate / 1000}`,
        dataType: "json"
    }).done(function(res){
        dateDiff = res.st * 1000 + (localDate - res.it * 1000) / 2 - localDate;
    }).fail(function(){
        dateDiff = 0;
    });
    updateOffset = true;
}

function clock() {
    'use strict';
    nowDate = new Date(Date.now() + dateDiff);

    if (dateDiff !== undefined) {
        $("#now-clock-text").html(formatDate(nowDate).replace(/\n/g, '<br>'));
    }

    if (nowDate.getSeconds() === 30) {
        if (updateOffset === false) {
            getDateOffset();
        }
    } else {
        updateOffset = false;
    }

    if (alarmDate < nowDate) {
        $('#now-clock-text').addClass('red-text');
    }

    setTimeout(clock, 200);
}
// #endregion clock

(() => {
    getDateOffset();
})();

$(() => {
    'use strict';
    const ua = navigator.userAgent;
    if (ua.indexOf('iPhone') > 0 || ua.indexOf('Android') > 0) {
        // スマホ以外
        $('#popup-pc, #container').remove();
        // $('#popup-content').addClass('wide');
        $('#popup-content').attr('id', 'popup-content-wide');
    } else {
        $('#popup-other').remove();
    }

    $('.event-name').text(eventText);
    $('#alarm-clock-text').html(formatDate(alarmDate).replace(/\n/g, '<br>'));
    clock();

    const list = document.createElement('option');
    list.text = 'Daisuke';
    $('.selectList').append(list);

    $('#popup-layer, #popup-content').show();

    $('#popup-close, #popup-layer').click(() => { 
        $('#popup-layer, #popup-content').remove();
    });
});
