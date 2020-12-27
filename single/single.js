let videoListJson, alarmDate, eventText, dateDiff, updateOffset, nowDate;

const zeroPadding = (num, length) => {
    'use strict';
    return ('0'.repeat(length) + num).slice(-length);
};

const formatDate = date => {
    'use strict';
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const h = date.getHours();
    const min = date.getMinutes();
    const sec = date.getSeconds();
    return `${y}年${m}月${d}日\n${h}時${zeroPadding(min, 2)}分${zeroPadding(sec, 2)}秒`;
};

const getDateOffset = async () => {
    'use strict';
    const localDate = Date.now();
    await fetch(`https://ntp-a1.nict.go.jp/cgi-bin/json?${localDate / 1000}`).then(res => res.json()).then(json => {
        dateDiff = json.st * 1000 + (localDate - json.it * 1000) / 2 - localDate;
    }).catch(() => {
        dateDiff = 0;
    });
};

function clock() {
    'use strict';
    nowDate = new Date(Date.now() + dateDiff);

    if (dateDiff !== undefined) {
        $('#nowDateText').html(formatDate(nowDate).replace(/\n/g, '<br>'));
    }

    if (nowDate.getSeconds() === 30) {
        if (updateOffset === false) {
            getDateOffset();
        }
    } else {
        updateOffset = false;
    }

    if (alarmDate < nowDate) {
        $('#nowDateText').addClass('red-text');
    } else {
        $('#nowDateText').removeClass('red-text');
    }

    setTimeout(clock, 250);
}

(() => {
    getDateOffset();
})();

$(() => {
    'use strict';
    fetch('../event.json').then(res => res.json()).then(json => {
        eventText = json.name;
        alarmDate = new Date(json.date.year, json.date.month - 1, json.date.day, json.date.hour, json.date.minute, json.date.second);
        $('#eventText').text(eventText);
        $('#setDateText').html(formatDate(alarmDate).replace(/\n/g, '<br>'));
    });

    clock();

    fetch('../video-list.json').then(res => res.json()).then(json => {
        videoListJson = json;
        let list;
        for (let i in json) {
            list = document.createElement('option');
            list.text = json[i].name;
            $('#selectList').append(list);
        }
    });
});

$('#applyBtn').on('click', function () {
    alarmDate = new Date($('#setDateInput').val());
    $('#setDateText').html(formatDate(alarmDate).replace(/\n/g, '<br>'));
    $('#eventText').text('カスタム');
});

let player;

function onPlayerReady(event) {
    setTimeout(() => {
        event.target.pauseVideo();
    }, 1000);
}

function PlayerStart(p) {
    p.playVideo();
}

$('#selectBtn').on('click', function () {
    const body = $('body');
    const video = videoListJson[$('#selectList').prop('selectedIndex')];
    const w = body.width() > 640 ? 640 : body.width() - 2;
    const h = w === body.width() - 2 ? (body.width() - 2) / 16 * 9 : 360;
    player = new YT.Player('youtube', {
        width: w,
        height: h,
        videoId: video.id,
        playerVars: {
            start: video.start,
            end: video.end,
            control: 0,
            rel: 0,
            autoplay: 1,
            disablekb: 1,
            fs: 0,
            enablejsapi: 1
        },
        events: {
            onReady: onPlayerReady
        }
    });
    const time = alarmDate - (video.fit - video.start) * 1000 - nowDate - 1500;
    console.log(time);
    setTimeout(function () {
        PlayerStart(player);
    }, time);
});

$('#aboutBtn').on('click', function () {
    const about = $('#about');
    if (about.is(':visible')) {
        about.hide();
        $(this).text('開く');
    } else {
        about.show();
        $(this).text('閉じる');
    }
});
