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
		$('#now-clock-text').html(formatDate(nowDate).replace(/\n/g, '<br>'));
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

(() => {
	getDateOffset();
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
	.done(function(res) {
		eventText = res.name;
		alarmDate = new Date(res.date.year, res.date.month - 1, res.date.day, res.date.hour, res.date.minute, res.date.second);
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
	.done(function(res) {
		videoListJson = res;
		updateOption(res);
	});
});

function updateOption(videoList) {
	$('.selectList').empty();
	for (const i in videoList) {
		const list = document.createElement('option');
		list.text = videoList[i].name;
		$('.selectList').append(list);
	}
}

$('#popup-close, #popup-layer').click(() => {
	$('#popup-layer, #popup-content, #popup-content-wide').remove();
});

var Player = new Array(100);
function onPlayerReady(event) {
	event.target.pauseVideo();
}

function PlayerStart(player) {
	player.playVideo();
}

$(document).on('click', '.selectBtn', function () {
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
	const time = alarmDate - (video.fit - video.start) * 1000 - nowDate - 500;
	console.log(`ID: ${divId} / Time: ${time}`);
	setTimeout(function() {
		PlayerStart(Player[num]);
  }, time);
});

$('#vol-mute').on('click', function() {
  for(const i of Player) {
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

$('#vol-50').on('click', function() {
  for (const i of Player) {
    if (typeof i === 'undefined') {
      continue;
    }
    i.unMute();
    i.setVolume(50);
  }
});

$('#vol-max').on('click', function() {
  for (const i of Player) {
    if (typeof i === 'undefined') {
      continue;
    }
    i.unMute();
    i.setVolume(100);
  }
});

var divVideoId = [...Array(30).keys()].map(i => i+8);
var idLen = divVideoId.length;
while (idLen) {
	const j = Math.floor(Math.random() * idLen);
	const t = divVideoId[--idLen];
	divVideoId[idLen] = divVideoId[j];
	divVideoId[j] = t;
}

var grid = $('#grid');

function gridRmvItem(num) {
	for (let i = 0; i < num; i++) {
		const last = $('.item:last');
		const videoId = last.children('.selectDiv').attr('id');
		divVideoId.push(parseInt(videoId.replace('video', '')));
		last.remove();
	}
}

function gridAddItem(num) {
	for (let i = 0; i < num; i++) {
		const item = '<div class="item"><div class="selectDiv" id="video' + divVideoId[0] + '"><select class="selectList"></select><button class="selectBtn">決定</button></div></div>';
		divVideoId.shift();
		grid.append(item);
	}
}

function getColRowNum() {
	const colNum = grid.css('grid-template-columns').split(' ').length;
	const rowNum = grid.css('grid-template-rows').split(' ').length;
	return { rowNum, colNum };
}

$('#grid-col-add').on('click', function () {
	const { rowNum, colNum } = getColRowNum();
	gridAddItem(rowNum);
	grid.css('grid-template-columns', `repeat(${colNum + 1}, 1fr)`);
	updateOption(videoListJson);
});

$('#grid-row-add').on('click', function () {
	const { rowNum, colNum } = getColRowNum();
	gridAddItem(colNum);
	grid.css('grid-template-rows', `repeat(${rowNum + 1}, 1fr)`);
	updateOption(videoListJson);
});

$('#grid-col-rm').on('click', function () {
	const { rowNum, colNum } = getColRowNum();
	if (colNum > 1) {
		gridRmvItem(rowNum);
		grid.css('grid-template-columns', `repeat(${colNum - 1}, 1fr)`);	
	}
});

$('#grid-row-rm').on('click', function () {
	const { rowNum, colNum } = getColRowNum();
	if (rowNum) {
		gridRmvItem(colNum);
		grid.css('grid-template-rows', `repeat(${rowNum - 1}, 1fr)`);	
	}
});
