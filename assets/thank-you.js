const VIDEO_ID = '2zA6n6oERDw';
const REQUIRED_WATCH_SECONDS = 13 * 60;
const STORAGE_KEY = 'vision_watched_13m_' + VIDEO_ID;
const watchGate = document.getElementById('watchGate');
const watchProgressBar = document.getElementById('watchProgressBar');
const watchTime = document.getElementById('watchTime');
const openAmoForm = document.getElementById('openAmoForm');
const amoDialog = document.getElementById('amoLeadDialog');
const amoForm = document.getElementById('amoLeadForm');
const amoSubmitButton = document.getElementById('amoSubmitButton');
const amoFormStatus = document.getElementById('amoFormStatus');
const amoPhoneInput = document.getElementById('amoPhone');
let player;
let watchTimer = null;
let watchedSeconds = Math.min(Number(localStorage.getItem(STORAGE_KEY)) || 0, REQUIRED_WATCH_SECONDS);

function keepUzbekPhonePrefix(input) {
  const prefix = '+998 ';
  const digits = input.value.replace(/\D/g, '').replace(/^998/, '').slice(0, 9);
  input.value = prefix + digits;
}

amoPhoneInput.addEventListener('focus', () => keepUzbekPhonePrefix(amoPhoneInput));
amoPhoneInput.addEventListener('input', () => keepUzbekPhonePrefix(amoPhoneInput));

function onYouTubeIframeAPIReady() {
  player = new YT.Player('youtubePlayer', {
    videoId: VIDEO_ID,
    playerVars: {playsinline: 1, rel: 0, modestbranding: 1},
    events: {onStateChange: onPlayerStateChange}
  });
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) startWatchTimer();
  else stopWatchTimer();
}

function startWatchTimer() {
  if (watchTimer || watchedSeconds >= REQUIRED_WATCH_SECONDS) return;
  watchTimer = window.setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    if (!player || player.getPlayerState() !== YT.PlayerState.PLAYING) return;
    watchedSeconds += 1;
    localStorage.setItem(STORAGE_KEY, String(watchedSeconds));
    updateWatchGate();
  }, 1000);
}

function stopWatchTimer() {
  if (!watchTimer) return;
  window.clearInterval(watchTimer);
  watchTimer = null;
}

function updateWatchGate() {
  const remaining = Math.max(0, REQUIRED_WATCH_SECONDS - watchedSeconds);
  watchProgressBar.style.width = Math.min(100, watchedSeconds / REQUIRED_WATCH_SECONDS * 100) + '%';
  watchTime.textContent = 'Qoldi: ' + Math.floor(remaining / 60) + ':' + String(remaining % 60).padStart(2, '0');
  if (remaining === 0) {
    stopWatchTimer();
    watchGate.hidden = true;
    openAmoForm.hidden = false;
  }
}

openAmoForm.addEventListener('click', () => {
  amoDialog.showModal();
  setTimeout(() => document.getElementById('amoName').focus(), 80);
});
document.getElementById('closeAmoForm').addEventListener('click', () => amoDialog.close());
amoDialog.addEventListener('click', event => { if (event.target === amoDialog) amoDialog.close(); });

amoForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!amoForm.reportValidity()) return;
  const webhook = window.VISION_CONFIG?.googleSheetWebhook;
  const botUrl = window.VISION_CONFIG?.telegramUrl;
  if (!webhook) {
    amoFormStatus.textContent = 'amoCRM ulanish manzili topilmadi.';
    return;
  }
  const data = new URLSearchParams({
    action: 'amocrm',
    name: amoForm.name.value.trim(),
    phone: amoPhoneInput.value.trim(),
    source: 'Vision School video'
  });
  amoSubmitButton.disabled = true;
  amoSubmitButton.textContent = 'YUBORILMOQDA…';
  amoFormStatus.textContent = '';
  try {
    const queued = navigator.sendBeacon?.(webhook, data);
    if (!queued) {
      await fetch(webhook, {
        method: 'POST', mode: 'no-cors', keepalive: true,
        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
        body: data.toString()
      });
    }
    if (botUrl) window.location.assign(botUrl);
    else {
      amoFormStatus.classList.add('success');
      amoFormStatus.textContent = 'Ro‘yxatdan o‘tdingiz. Telegram bot havolasi tez orada qo‘shiladi.';
      amoSubmitButton.textContent = 'MUVAFFAQIYATLI';
    }
  } catch (error) {
    amoFormStatus.textContent = 'Internet bilan muammo. Qayta urinib ko‘ring.';
    amoSubmitButton.disabled = false;
    amoSubmitButton.textContent = 'RO‘YXATDAN O‘TISH';
  }
});

updateWatchGate();
