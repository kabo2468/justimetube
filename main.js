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
		$('#alarm-clock-text').html(formatDate(alarmDate).replace(/\n/g, '<br>'));
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
		let list;
		for (const i in res) {
			list = document.createElement('option');
			list.text = res[i].name;
			$('.selectList').append(list);
		}
	});
});

$('#popup-close, #popup-layer').click(() => {
	$('#popup-layer, #popup-content, #popup-content-wide').remove();
});

var Player = new Array(7);
function onPlayerReady(event) {
	event.target.pauseVideo();
}

function PlayerStart(player) {
	player.playVideo();
}

$('.selectBtn').on('click', function() {
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
	setTimeout(function() {
		PlayerStart(Player[num]);
  }, alarmDate - (video.fit - video.start) * 1000 - nowDate - 500);
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
