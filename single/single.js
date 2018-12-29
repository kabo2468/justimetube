// var alarmDate = new Date();
// alarmDate.setSeconds(0);
// alarmDate.setHours(alarmDate.getHours() + 1);
var videoListJson, alarmDate, eventText;

function zeroPadding(num, length) {
  'use strict';
  return (Array(length).join('0') + num).slice(-length);
}

var dateDiff, updateOffset, nowDate;
function formatDate(date) {
  'use strict';
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const h = date.getHours();
  const min = date.getMinutes();
  const sec = date.getSeconds();
  return `${y}年${m}月${d}日\n${h}時${zeroPadding(min, 2)}分${zeroPadding(sec,2)}秒`;
}

function getDateOffset() {
  'use strict';
  const localDate = Date.now();
  $.ajax({
  type: 'GET',
  url: `https://ntp-a1.nict.go.jp/cgi-bin/json?${localDate / 1000}`,
  dataType: 'json'
  })
  .done(function(res) {
    dateDiff = res.st * 1000 + (localDate - res.it * 1000) / 2 - localDate;
  })
  .fail(function() {
    dateDiff = 0;
  });
  updateOffset = true;
}

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
  $.getJSON('../event.json', d => {
    eventText = d.name;
    alarmDate = new Date(d.date.year, d.date.month - 1, d.date.day, d.date.hour, d.date.minute, d.date.second);
    $('#eventText').text(eventText);
    $('#setDateText').html(formatDate(alarmDate).replace(/\n/g, '<br>'));
  });

  clock();

  $.getJSON('../video-list.json', data => {
    videoListJson = data;
    let list;
    for (let i in data) {
      list = document.createElement('option');
      list.text = data[i].name;
      $('#selectList').append(list);
    }
  });
});

$('#applyBtn').on('click', function() {
  alarmDate = new Date($('#setDateInput').val());
  $('#setDateText').html(formatDate(alarmDate).replace(/\n/g, '<br>'));
  $('#eventText').text('カスタム');
});

var player;
function onPlayerReady(event) {
  event.target.pauseVideo();
}

function PlayerStart(player) {
  player.playVideo();
}

$('#selectBtn').on('click', function() {
  const video = videoListJson[$('#selectList').prop('selectedIndex')];
  const w = $('body').width() > 640 ? 640 : $('body').width() - 2;
  const h = w === $('body').width() - 2 ? ($('body').width() - 2) / 16 * 9 : 360;
  player = new YT.Player('youtube', {
    width: w,
    height: h,
    videoId: video.id,
    playerVars: {
      start: video.start,
      end: video.end,
      control: 0,
      showinfo: 0,
      rel: 0,
      autoplay: 1,
      disablekb: 0,
      fs: 0
    },
    events: {
      onReady: onPlayerReady
    }
  });
  setTimeout(function() {
    PlayerStart(player);
  }, alarmDate - video.fit * 1000 - video.start * 1000 - nowDate - 500);
});

$('#aboutBtn').on('click', function() {
  if ($('#about').is(':visible')) {
    $('#about').hide();
    $(this).text('開く');
  } else {
    $('#about').show();
    $(this).text('閉じる');
  }
});
