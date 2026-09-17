const dialog = document.getElementById('leadDialog');
const form = document.getElementById('leadForm');
const submitButton = document.getElementById('submitButton');
const status = document.getElementById('formStatus');

document.getElementById('openForm').addEventListener('click', () => {
  dialog.showModal();
  setTimeout(() => document.getElementById('name').focus(), 80);
});

document.getElementById('closeForm').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const webhook = window.VISION_CONFIG?.googleSheetWebhook;
  if (!webhook) {
    status.textContent = 'Google Sheets hali ulanmagan.';
    return;
  }

  const data = new URLSearchParams({
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    source: 'Vision School',
    createdAt: new Date().toISOString()
  });

  submitButton.disabled = true;
  submitButton.textContent = 'YUBORILMOQDA…';
  status.textContent = '';

  try {
    const queued = navigator.sendBeacon?.(webhook, data);
    if (!queued) {
      await fetch(webhook, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
        body: data.toString()
      });
    }
    sessionStorage.setItem('visionLeadSent', '1');
    window.location.assign('thank-you.html');
  } catch (error) {
    status.textContent = 'Internet bilan muammo. Qayta urinib ko‘ring.';
    submitButton.disabled = false;
    submitButton.textContent = 'DARSNI OLISH';
  }
});
