let videoListJson, alarmDate, eventText;

const zeroPadding = (num, length) => {
    'use strict';
    return (Array(length).join('0') + num).slice(-length);
};

let dateDiff, nowDate;
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

const getDateOffset = () => {
    'use strict';
    const localDate = Date.now();
    $.ajax({
        type: 'GET',
        url: `https://ntp-a1.nict.go.jp/cgi-bin/json?${localDate / 1000}`,
        dataType: 'json'
    })
        .done(res => {
            dateDiff = res.st * 1000 + (localDate - res.it * 1000) / 2 - localDate;
        })
        .fail(() => {
            dateDiff = 0;
        });
};

const clock = () => {
    'use strict';
    nowDate = new Date(Date.now() + dateDiff);

    if (dateDiff !== undefined) {
        $('#now-clock-text').html(formatDate(nowDate).replace(/\n/g, '<br>'));
    }

    if (alarmDate < nowDate) {
        $('#now-clock-text').addClass('red-text');
        $('.selectBtn').prop('disabled', true);
    }

    setTimeout(clock, 200);
};

(() => {
    getDateOffset();
    setInterval(getDateOffset, 1000 * 60);
})();

$(() => {
    'use strict';
    $('#popup-layer, #popup-content, #popup-content-wide').show();
    const ua = navigator.userAgent;
    if (ua.indexOf('iPhone') > 0 || ua.indexOf('Android') > 0) {
        // スマホ以外
        $('#popup-layer, #popup-pc, #container').remove();
        $('#popup-content').attr('id', 'popup-content-wide');
        return;
    } else {
        $('#popup-other').remove();
    }

    $.ajax({
        type: 'GET',
        cache: false,
        url: 'event.json',
        dataType: 'json'
    })
        .done(res => {
            eventText = res.name;
            alarmDate = new Date(res.date.year, res.date.month - 1, res.date.day, res.date.hour, res.date.minute, res.date.second);
            if (Date.now() > alarmDate) {
                alarmDate = new Date(res.next.date.year, res.next.date.month - 1, res.next.date.day, res.next.date.hour, res.next.date.minute, res.next.date.second);
                eventText = res.next.name;
            }
            $('.event-name').text(eventText);
            $('#alarm-clock-text').html(formatDate(alarmDate).replace(/\n/g, ' '));
        });
    clock();

    $.ajax({
        type: 'GET',
        cache: false,
        url: 'video-list.json',
        dataType: 'json'
    })
        .done(res => {
            videoListJson = res;
            updateOption(res);
        });
});

const updateOption = videoList => {
    'use strict';
    const selectList = $('.selectList');
    selectList.empty();
    videoList.forEach(video => {
        const list = document.createElement('option');
        list.text = video.name;
        selectList.append(list);
    })
};

$('#popup-close, #popup-layer').on('click', () => {
    'use strict';
    $('#popup-layer, #popup-content, #popup-content-wide').remove();
});

const Player = new Array(30);
const onPlayerReady = event => {
    'use strict';
    setTimeout(() => {
        event.target.pauseVideo();
    }, 1000);
};

const PlayerStart = player => {
    'use strict';
    player.playVideo();
};

$(document).on('click', '.selectBtn', function () {
    'use strict';
    const div = $(this).closest('div');
    const divId = div.attr('id');
    const num = Number(divId.replace('video', ''));

    const video = videoListJson[$(this).prev('select').prop('selectedIndex')];
    Player[num] = new YT.Player(divId, {
        width: div.width(),
        height: div.height(),
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
    console.log(`ID: ${divId} / Time: ${time}ms`);
    setTimeout(() => {
        PlayerStart(Player[num]);
    }, time);
});

$('#vol-mute').on('click', function () {
    'use strict';
    for (const i of Player) {
        if (typeof i === 'undefined') {
            continue;
        }
        if (i.isMuted()) {
            i.unMute();
        } else {
            i.mute();
        }
    }
});

$('#vol-50').on('click', function () {
    'use strict';
    for (const i of Player) {
        if (typeof i === 'undefined') {
            continue;
        }
        i.unMute();
        i.setVolume(50);
    }
});

$('#vol-max').on('click', function () {
    'use strict';
    for (const i of Player) {
        if (typeof i === 'undefined') {
            continue;
        }
        i.unMute();
        i.setVolume(100);
    }
});

const divVideoId = [...Array(30).keys()].map(i => i + 8);
let idLen = divVideoId.length;
while (idLen) {
    const j = Math.floor(Math.random() * idLen);
    const t = divVideoId[--idLen];
    divVideoId[idLen] = divVideoId[j];
    divVideoId[j] = t;
}

const grid = $('#grid');

const addItem = selector => {
    'use strict';
    $(selector).after(`<div class="item"><div class="selectDiv" id="video${divVideoId[0]}"><select class="selectList"></select><button class="selectBtn">決定</button></div></div>`);
    divVideoId.shift();
};

const removeItem = selector => {
    'use strict';
    const item = $(selector);
    const videoId = item.children('.selectDiv').attr('id');
    divVideoId.push(parseInt(videoId.replace('video', '')));
    item.remove();
};

const setGridCss = (type, num) => {
    'use strict';
    let name;
    switch (type) {
        case 'col':
            name = 'columns';
            break;
        case 'row':
            name = 'rows';
            break;
    }
    grid.css(`grid-template-${name}`, `repeat(${num}, 1fr)`);
};

const getColRowNum = () => {
    'use strict';
    const colNum = grid.css('grid-template-columns').split(' ').length;
    const rowNum = grid.css('grid-template-rows').split(' ').length;
    return {colNum, rowNum};
};

$('#grid-col-add').on('click', function () {
    'use strict';
    const {colNum, rowNum} = getColRowNum();
    for (let i = 0; i < rowNum; i++) {
        const j = colNum * (i + 1) + i;
        addItem(`.item:nth-child(${j})`);
    }
    setGridCss('col', colNum + 1);
    updateOption(videoListJson);
});

$('#grid-row-add').on('click', function () {
    'use strict';
    const {colNum, rowNum} = getColRowNum();
    for (let i = 0; i < colNum; i++) {
        addItem('.item:last');
    }
    setGridCss('row', rowNum + 1);
    updateOption(videoListJson);
});

$('#grid-col-rm').on('click', function () {
    'use strict';
    const {colNum} = getColRowNum();
    if (colNum > 1) {
        $(`.item:nth-child(${colNum}n)`).each(function () {
            removeItem(this);
        });
        setGridCss('col', colNum - 1);
    }
});

$('#grid-row-rm').on('click', function () {
    'use strict';
    const {colNum, rowNum} = getColRowNum();
    if (rowNum > 1) {
        for (let i = 0; i < colNum; i++) {
            removeItem('.item:last');
        }
        setGridCss('row', rowNum - 1);
    }
});