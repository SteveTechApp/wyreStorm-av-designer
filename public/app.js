/* global location */
(function() {
  const els = {
    name: document.getElementById('name'),
    lang: document.getElementById('lang'),
    join: document.getElementById('join'),
    chat: document.getElementById('chat'),
    messages: document.getElementById('messages'),
    input: document.getElementById('input'),
    composer: document.getElementById('composer'),
    linkSteve: document.getElementById('link-steve'),
    linkAndrea: document.getElementById('link-andrea'),
  };

  // Pre-fill from URL params
  const params = new URLSearchParams(location.search);
  if (params.get('name')) els.name.value = params.get('name');
  if (params.get('lang')) els.lang.value = params.get('lang');

  // Quick links
  els.linkSteve.href = `/?name=Steve&lang=en`;
  els.linkAndrea.href = `/?name=Andrea&lang=hu`;

  let ws = null;
  let myName = '';
  let myLang = 'en';

  function scrollToBottom() {
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function formatTime(ts) {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return '';
    }
  }

  function renderMessage({ id, name, text, ts, translatedText, sourceLang }) {
    const wrapper = document.createElement('div');
    wrapper.className = `msg ${name === myName ? 'me' : 'them'}`;

    const header = document.createElement('div');
    header.className = 'meta';
    header.textContent = `${name} • ${formatTime(ts)}`;
    wrapper.appendChild(header);

    const body = document.createElement('div');
    body.className = 'bubble';
    const showText = translatedText || text;
    body.textContent = showText;

    if (!translatedText && sourceLang && sourceLang !== myLang) {
      const note = document.createElement('div');
      note.className = 'note';
      note.textContent = 'Translation unavailable';
      body.appendChild(note);
    }

    wrapper.appendChild(body);
    els.messages.appendChild(wrapper);
    scrollToBottom();
  }

  async function translateText(q, source, target) {
    try {
      const res = await fetch('/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, source, target })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.translatedText || null;
    } catch (_) {
      return null;
    }
  }

  function connect() {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${protocol}://${location.host}/ws`);

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'join', name: myName, lang: myLang }));
    });

    ws.addEventListener('message', async (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch (_) { return; }

      if (msg.type === 'hello' && Array.isArray(msg.history)) {
        for (const m of msg.history) {
          if (m.sourceLang !== myLang) {
            const t = await translateText(m.text, m.sourceLang || 'auto', myLang);
            renderMessage({ ...m, translatedText: t });
          } else {
            renderMessage(m);
          }
        }
        return;
      }

      if (msg.type === 'message') {
        if (msg.sourceLang !== myLang) {
          const t = await translateText(msg.text, msg.sourceLang || 'auto', myLang);
          renderMessage({ ...msg, translatedText: t });
        } else {
          renderMessage(msg);
        }
        return;
      }
    });

    ws.addEventListener('close', () => {
      setTimeout(connect, 1500);
    });
  }

  els.join.addEventListener('click', () => {
    myName = (els.name.value || '').trim() || 'Guest';
    myLang = els.lang.value || 'en';

    els.chat.classList.remove('hidden');
    document.querySelector('.user-setup').classList.add('hidden');

    connect();
    els.input.focus();
  });

  els.composer.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = (els.input.value || '').trim();
    if (!text || !ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify({ type: 'message', text }));
    els.input.value = '';
  });
})();