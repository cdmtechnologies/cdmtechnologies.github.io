/* CDM Assistant: the website chat for CDM Technologies.
 * One script, no libraries. Add it to a page with:
 *   <script src="/bot/cdm-bot.js" defer data-app="site"></script>
 * data-app: site | erp | school | prep | finrep | people | clearance | partners (which product page it is on)
 * data-api: optional, the salesbot function address.
 * The chat hides itself when the signed-in "Ask AI" assistant is on the page, so customers only see one helper.
 * The conversation is kept in this browser tab only (sessionStorage) and is not stored on the server.
 */
(function () {
  'use strict'
  if (window.__cdmBot) return
  window.__cdmBot = true

  var me = document.currentScript
  var APP = (me && me.getAttribute('data-app')) || 'site'
  var API = (me && me.getAttribute('data-api')) || 'https://olgorunaxsgbpewnvvkc.supabase.co/functions/v1/salesbot'
  var WA = 'https://wa.me/2348064068800?text=' + encodeURIComponent('Hello CDM, I have a question about your software.')
  var ASK_AI = '[aria-controls="cdm-ask-ai"],[aria-controls="cdm-assistant"],[aria-controls="cdm-tutor"]'
  var STORE = 'cdm-bot-chat'
  var VOICE = 'cdm-ai-voice'

  var STARTERS = {
    site: ['Which CDM app is right for me?', 'How much does CDM ERP cost?', 'Can I book a free demo?'],
    erp: ['Does it work without internet?', 'How much is it for 2 branches?', 'Can I book a free demo?'],
    school: ['How much for 250 pupils?', 'Can parents pay fees online?', 'Can I book a free demo?'],
    prep: ['Which exams do you cover?', 'How does the AI tutor work?', 'Is there a free account?'],
    finrep: ['What does FinRep produce?', 'How much is it?', 'Can I book a free demo?'],
    people: ['Does it use the 2026 PAYE rules?', 'How much for 30 staff?', 'Can I book a free demo?'],
    clearance: ['What is NRS e-invoicing?', 'How much is it?', 'Can I book a free demo?'],
    partners: ['How do partners earn?', 'Is the training free?', 'How do I apply?'],
  }

  var BOT = '<svg class="bot" viewBox="0 0 64 64" aria-hidden="true">' +
    '<g class="wv l"><path d="M6 30q-3 6 0 12"/></g><g class="wv l w2"><path d="M1 27q-4 9 0 18"/></g>' +
    '<g class="wv"><path d="M58 30q3 6 0 12"/></g><g class="wv w2"><path d="M63 27q4 9 0 18"/></g>' +
    '<g class="all"><line x1="32" y1="8" x2="32" y2="17" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
    '<circle class="ant" cx="32" cy="7" r="4" fill="#22d3ee" stroke="currentColor" stroke-width="2"/>' +
    '<rect class="ear" x="5" y="30" width="6" height="13" rx="3" fill="#22d3ee" stroke="currentColor" stroke-width="2"/>' +
    '<rect class="ear" x="53" y="30" width="6" height="13" rx="3" fill="#22d3ee" stroke="currentColor" stroke-width="2"/>' +
    '<rect x="9" y="17" width="46" height="40" rx="14" fill="currentColor"/>' +
    '<rect x="15" y="23" width="34" height="27" rx="9" fill="#0f172a" stroke="#7dd3fc" stroke-opacity=".7" stroke-width="2"/>' +
    '<g class="eyes" fill="#5eead4"><rect x="21" y="29" width="7" height="9" rx="3.5"/><rect x="36" y="29" width="7" height="9" rx="3.5"/></g>' +
    '<rect class="mouth" x="27" y="42" width="10" height="3" rx="1.5" fill="#5eead4"/>' +
    '<circle cx="19.5" cy="42" r="2" fill="#f472b6" opacity=".55"/><circle cx="44.5" cy="42" r="2" fill="#f472b6" opacity=".55"/></g></svg>'

  var CSS = [
    ':host{all:initial}',
    '[hidden]{display:none!important}',
    '*{box-sizing:border-box;font-family:Poppins,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
    '.launch{position:fixed;right:18px;bottom:18px;z-index:2147483000;display:flex;align-items:center;gap:8px;border:0;cursor:pointer;background:#0b2a55;color:#fff;border-radius:999px;padding:7px 18px 7px 8px;font-size:15px;font-weight:600;box-shadow:0 10px 30px rgba(2,14,40,.35)}',
    '.launch:hover{background:#123c78}.launch:focus-visible,button:focus-visible,a:focus-visible,textarea:focus-visible{outline:3px solid #f28c1e;outline-offset:2px}',
    '.launch .bot{width:38px;height:38px;color:#fff}',
    '.tip{position:fixed;right:18px;bottom:78px;z-index:2147483000;background:#fff;color:#0f172a;border-radius:14px;padding:10px 34px 10px 14px;font-size:14px;box-shadow:0 8px 24px rgba(2,14,40,.2);max-width:240px}',
    '.tip button{position:absolute;right:6px;top:6px;border:0;background:none;font-size:16px;cursor:pointer;color:#64748b}',
    '.panel{position:fixed;right:12px;bottom:84px;z-index:2147483001;width:min(390px,calc(100vw - 24px));height:min(600px,calc(100vh - 110px));display:flex;flex-direction:column;background:#fff;color:#0f172a;border-radius:20px;overflow:hidden;box-shadow:0 24px 60px rgba(2,14,40,.35);border:1px solid #e2e8f0}',
    '.hd{display:flex;align-items:center;gap:10px;background:#0b2a55;color:#fff;padding:12px 12px 12px 14px}',
    '.hd .bot{width:44px;height:44px;color:#fff;flex:none}.hd b{display:block;font-size:16px}.hd small{display:block;font-size:12px;opacity:.85}',
    '.hd .sp{flex:1;min-width:0}.ib{border:1px solid rgba(255,255,255,.45);background:none;color:#fff;border-radius:8px;width:34px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer}.ib.on{background:rgba(255,255,255,.2)}',
    '.list{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;font-size:14.5px;line-height:1.45}',
    '.hello{display:flex;gap:10px;align-items:center;color:#334155}.hello .bot{width:58px;height:58px;color:#0b2a55;flex:none}',
    '.chips{display:flex;flex-direction:column;gap:7px;margin-top:4px}.chips button{text-align:left;border:1px solid #cbd5e1;background:#fff;border-radius:12px;padding:8px 12px;font-size:14px;cursor:pointer;color:#0f172a}.chips button:hover{background:#f1f5f9}',
    '.u{align-self:flex-end;max-width:85%;background:#0b2a55;color:#fff;padding:9px 13px;border-radius:16px 16px 4px 16px;white-space:pre-wrap;word-break:break-word}',
    '.a{display:flex;gap:8px;align-items:flex-end}.a .bot{width:30px;height:30px;color:#0b2a55;flex:none}',
    '.a .bub{max-width:85%;background:#f1f5f9;padding:9px 13px;border-radius:16px 16px 16px 4px;white-space:pre-wrap;word-break:break-word}',
    '.a .bub a{color:#1662c4}.lis{display:flex;gap:4px;align-items:center;margin-top:4px;border:0;background:none;color:#64748b;font-size:12px;cursor:pointer;padding:0}',
    '.err{color:#b91c1c;font-size:13.5px}.caret{display:inline-block;width:.5em;border-bottom:2px solid currentColor;animation:fl .6s steps(2) infinite}',
    '.dots span{display:inline-block;width:6px;height:6px;margin:0 2px;border-radius:50%;background:#64748b;animation:dot 1s infinite}.dots span:nth-child(2){animation-delay:.15s}.dots span:nth-child(3){animation-delay:.3s}',
    '.ft{border-top:1px solid #e2e8f0;padding:10px}.row{display:flex;gap:6px;align-items:flex-end}',
    'textarea{flex:1;resize:none;border:1px solid #cbd5e1;border-radius:12px;padding:9px 11px;font-size:14.5px;min-height:42px;max-height:110px;color:#0f172a;background:#fff}',
    '.sb{border:0;border-radius:12px;width:42px;height:42px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none}.send{background:#0b2a55;color:#fff}.send:disabled{opacity:.45;cursor:default}',
    '.mic{background:#fff;border:1px solid #cbd5e1;color:#334155}.mic.on{background:#fef2f2;border-color:#fca5a5;color:#dc2626;animation:fl 1s infinite}',
    '.wa{margin-top:8px;display:flex;align-items:center;justify-content:center;gap:8px;background:#16a34a;color:#fff;text-decoration:none;font-weight:600;border-radius:12px;padding:9px;font-size:14px}.wa:hover{background:#15803d}',
    '.note{margin-top:6px;font-size:11.5px;color:#64748b;text-align:center}',
    '.bot .all{transform-box:fill-box;transform-origin:50% 100%}.bot .eyes,.bot .mouth,.bot .ant,.bot .ear{transform-box:fill-box;transform-origin:50% 50%}',
    '.bot .wv{opacity:0;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;transform-box:fill-box;transform-origin:0 50%}.bot .wv.l{transform-origin:100% 50%}',
    '.s-idle .all{animation:fl8 3.2s ease-in-out infinite}.bot:not(.s-still) .eyes{animation:bl 4.6s infinite}.s-idle .ant{animation:gl 2.4s ease-in-out infinite}',
    '.s-thinking .eyes{animation:sc 1.3s ease-in-out infinite}.s-thinking .ant{animation:fl .5s steps(2) infinite}.s-thinking .all{animation:tl 1.3s ease-in-out infinite}',
    '.s-writing .eyes{animation:rd 1s ease-in-out infinite}.s-writing .all{animation:nd .5s ease-in-out infinite}',
    '.s-talking .mouth{animation:tk .22s ease-in-out infinite alternate}.s-talking .all{animation:nd .6s ease-in-out infinite}.s-talking .wv{animation:wv 1s ease-out infinite}.s-talking .w2{animation-delay:.33s}',
    '.s-listening .all{animation:fl8 3.2s ease-in-out infinite}.s-listening .ear{animation:er .8s ease-in-out infinite alternate}.s-listening .wv{animation:wi 1s ease-in infinite}',
    '@keyframes fl8{0%,100%{transform:translateY(0)}50%{transform:translateY(-6%)}}@keyframes tl{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}',
    '@keyframes nd{0%,100%{transform:translateY(0)}50%{transform:translateY(-3%)}}@keyframes bl{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}',
    '@keyframes sc{0%,100%{transform:translateX(-14%)}50%{transform:translateX(14%)}}@keyframes rd{0%{transform:translate(-12%,10%)}100%{transform:translate(12%,10%)}}',
    '@keyframes tk{from{transform:scaleY(.35)}to{transform:scaleY(1.6)}}@keyframes fl{from{opacity:1}to{opacity:.3}}@keyframes gl{0%,100%{opacity:1}50%{opacity:.45}}',
    '@keyframes er{from{opacity:.5}to{opacity:1}}@keyframes wv{0%{opacity:.9;transform:scale(.7)}100%{opacity:0;transform:scale(1.25)}}@keyframes wi{0%{opacity:0;transform:scale(1.25)}100%{opacity:.9;transform:scale(.8)}}',
    '@keyframes dot{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-5px);opacity:1}}',
    '.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    '@media (prefers-reduced-motion: reduce){*{animation:none!important}}',
    '@media print{.launch,.panel,.tip{display:none}}',
  ].join('\n')

  var ICON = {
    spk: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>',
    mute: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>',
    x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    send: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>',
    mic: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="17" x2="12" y2="22"/></svg>',
    wa: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.4c.1.2.6 1 1.3 1.6.9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.7-.9c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.2.1.8-.1 1.3z"/></svg>',
    stop: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  }

  function store(k, v) { try { if (v === undefined) return window.sessionStorage.getItem(k); window.sessionStorage.setItem(k, v) } catch (e) { return null } }
  function local(k, v) { try { if (v === undefined) return window.localStorage.getItem(k); window.localStorage.setItem(k, v) } catch (e) { return null } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] }) }
  // safe text with web links made clickable (only https links to known sites stay links)
  function linkify(s) {
    return esc(s).replace(/(https:\/\/[A-Za-z0-9./?=&%#_~+-]+|\b(?:cdm24\.netlify\.app|cdm[a-z]+\.bolt\.host|cdmtechnologies\.github\.io)\b)/g, function (u) {
      var href = u.indexOf('https://') === 0 ? u : 'https://' + u
      return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + u + '</a>'
    })
  }
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---------- state ----------
  var msgs = []
  try { msgs = JSON.parse(store(STORE) || '[]') || [] } catch (e) { msgs = [] }
  var open = false, busy = false, typing = -1, speaking = -1, listening = false, voiceOn = local(VOICE) === 'on', waLink = WA, err = ''
  var stopListen = null

  // ---------- DOM ----------
  var host = document.createElement('div')
  host.id = 'cdm-bot'
  var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host
  root.innerHTML = '<style>' + CSS + '</style>' +
    '<button class="launch" type="button" aria-expanded="false" aria-controls="cdm-bot-panel">' + BOT.replace('class="bot"', 'class="bot s-idle"') + '<span>Chat with us</span></button>' +
    '<div class="tip" hidden><span>Hi! Need help choosing? Ask me anything about CDM.</span><button type="button" aria-label="Hide">×</button></div>' +
    '<section class="panel" id="cdm-bot-panel" role="dialog" aria-label="CDM Assistant chat" hidden>' +
      '<div class="hd">' + BOT.replace('class="bot"', 'class="bot hdbot s-idle"') + '<div class="sp"><b>CDM Assistant</b><small class="st" aria-live="polite">Ask about any CDM app</small></div>' +
        '<button class="ib vo" type="button"></button><button class="ib cl" type="button" aria-label="Close the chat">' + ICON.x + '</button></div>' +
      '<div class="list" aria-live="polite"></div>' +
      '<form class="ft"><div class="row"><label class="sr" for="cdm-bot-q">Your question</label><textarea id="cdm-bot-q" rows="1" maxlength="1000" placeholder="Type your question…"></textarea>' +
        '<button class="sb mic" type="button" hidden aria-label="Ask by voice" title="Ask by voice (uses your browser\'s speech service)">' + ICON.mic + '</button>' +
        '<button class="sb send" type="submit" aria-label="Send">' + ICON.send + '</button></div>' +
        '<a class="wa" target="_blank" rel="noopener noreferrer">' + ICON.wa + 'Chat on WhatsApp</a>' +
        '<div class="note">AI assistant. Please don\'t share passwords or card details.</div></form>' +
    '</section>'
  var $ = function (s) { return root.querySelector(s) }
  var launch = $('.launch'), tip = $('.tip'), panel = $('.panel'), list = $('.list'), form = $('.ft'), input = $('textarea'),
    sendB = $('.send'), micB = $('.mic'), voB = $('.vo'), hdBot = $('.hdbot'), status = $('.st'), wa = $('.wa')

  var canSpeak = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined'
  var Rec = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!canSpeak) voB.hidden = true
  if (Rec) micB.hidden = false

  function state() { return listening ? 'listening' : busy ? 'thinking' : speaking >= 0 ? 'talking' : typing >= 0 ? 'writing' : 'idle' }
  var STATUS = { idle: 'Ask about any CDM app', listening: 'Listening…', thinking: 'Thinking…', writing: 'Writing…', talking: 'Speaking…' }

  function setBot(svg, s) { svg.setAttribute('class', 'bot ' + (svg.classList.contains('hdbot') ? 'hdbot ' : '') + 's-' + s) }
  function paintHeader() {
    var s = state()
    setBot(hdBot, s)
    status.textContent = STATUS[s]
    voB.innerHTML = voiceOn ? ICON.spk : ICON.mute
    voB.className = 'ib vo' + (voiceOn ? ' on' : '')
    voB.setAttribute('aria-pressed', voiceOn ? 'true' : 'false')
    voB.setAttribute('aria-label', voiceOn ? 'Turn voice off' : 'Turn voice on')
    voB.title = voiceOn ? 'Voice on: replies are read aloud' : 'Voice off: tap to hear replies'
    micB.className = 'sb mic' + (listening ? ' on' : '')
    micB.setAttribute('aria-pressed', listening ? 'true' : 'false')
    sendB.disabled = busy || !input.value.trim()
    wa.href = waLink
    setBot(launch.querySelector('.bot'), busy ? 'thinking' : 'idle')
  }

  function render() {
    var h = ''
    if (!msgs.length) {
      h += '<div class="hello">' + BOT.replace('class="bot"', 'class="bot s-idle"') + '<div>Hi! I\'m the CDM Assistant. I can help you choose the right app, tell you prices and set up a free demo.</div></div><div class="chips">'
      ;(STARTERS[APP] || STARTERS.site).forEach(function (s) { h += '<button type="button">' + esc(s) + '</button>' })
      h += '</div>'
    }
    msgs.forEach(function (m, i) {
      if (m.role === 'user') { h += '<div class="u">' + esc(m.content) + '</div>'; return }
      var st = i === speaking ? 'talking' : i === typing ? 'writing' : 'still'
      h += '<div class="a">' + BOT.replace('class="bot"', 'class="bot s-' + st + '"') + '<div class="bub" data-i="' + i + '">' +
        (i === typing ? '<span class="sr">' + esc(m.content) + '</span><span class="tw" aria-hidden="true"></span>' : '<span class="sr">CDM Assistant: </span>' + linkify(m.content)) +
        (canSpeak && i !== typing ? '<button type="button" class="lis" data-say="' + i + '">' + (i === speaking ? ICON.stop + ' Stop' : ICON.spk + ' Listen') + '</button>' : '') +
        '</div></div>'
    })
    if (busy) h += '<div class="a">' + BOT.replace('class="bot"', 'class="bot s-thinking"') + '<div class="bub"><span class="dots" aria-hidden="true"><span></span><span></span><span></span></span><span class="sr">Thinking</span></div></div>'
    if (err) h += '<div class="err" role="alert">' + esc(err) + '</div>'
    list.innerHTML = h
    list.scrollTop = list.scrollHeight
    paintHeader()
  }

  function save() { store(STORE, JSON.stringify(msgs.slice(-30))) }

  // ---------- typing effect ----------
  function typeOut(i) {
    var text = msgs[i].content
    var el = function () { return list.querySelector('.bub[data-i="' + i + '"] .tw') }
    if (!el() || reduced) { typing = -1; render(); return }
    var dur = Math.min(6000, Math.max(700, text.length * 18)), t0 = performance.now()
    function tick(now) {
      if (typing !== i) return
      var n = Math.min(text.length, Math.floor(((now - t0) / dur) * text.length))
      var t = el()
      if (t) t.innerHTML = esc(text.slice(0, n)) + (n < text.length ? '<span class="caret"></span>' : '')
      list.scrollTop = list.scrollHeight
      if (n < text.length) requestAnimationFrame(tick)
      else { typing = -1; render() }
    }
    list.onclick = function (e) { if (typing === i && e.target.closest && e.target.closest('.bub[data-i="' + i + '"]')) { typing = -1; render() } }
    requestAnimationFrame(tick)
  }

  // ---------- voice ----------
  function speechText(s) {
    return String(s).replace(/https?:\/\/\S+/g, 'the link').replace(/ > /g, ', then ').replace(/[#*_`|>~]+/g, ' ').replace(/^\s*[-•]\s+/gm, '')
      .replace(/([^.!?:;,\s])[ \t]*\n+/g, '$1. ').replace(/₦\s?([\d,]+(?:\.\d+)?)/g, '$1 naira').replace(/\s+/g, ' ').trim().slice(0, 3000)
  }
  var runId = 0
  function say(i) {
    if (!canSpeak) return
    window.speechSynthesis.cancel()
    var id = ++runId
    var parts = speechText(msgs[i].content).match(/[^.!?]+[.!?]*\s*/g) || []
    var chunks = [], cur = ''
    parts.forEach(function (p) { if ((cur + p).length > 200 && cur) { chunks.push(cur); cur = '' } cur += p })
    if (cur.trim()) chunks.push(cur)
    if (!chunks.length) return
    speaking = i; render()
    var lang = document.documentElement.lang || navigator.language || 'en'
    var voices = window.speechSynthesis.getVoices(), base = lang.split('-')[0]
    var v = voices.filter(function (x) { return x.lang === lang })[0] || voices.filter(function (x) { return x.lang.toLowerCase().indexOf(base) === 0 })[0]
    chunks.forEach(function (c, k) {
      var u = new SpeechSynthesisUtterance(c)
      u.lang = (v && v.lang) || lang
      if (v) u.voice = v
      u.rate = 1.03
      var done = function () { if (id === runId) { runId++; speaking = -1; render() } }
      if (k === chunks.length - 1) u.onend = done
      u.onerror = done
      window.speechSynthesis.speak(u)
    })
  }
  function hush() { runId++; if (canSpeak) window.speechSynthesis.cancel(); if (speaking >= 0) { speaking = -1; render() } }

  function listen() {
    if (listening) { if (stopListen) stopListen(); return }
    hush()
    var rec = new Rec(), heard = ''
    rec.lang = document.documentElement.lang || navigator.language || 'en-NG'
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = function (e) {
      heard = Array.prototype.map.call(e.results, function (r) { return (r[0] && r[0].transcript) || '' }).join(' ').replace(/\s+/g, ' ').trim()
      input.value = heard
      paintHeader()
    }
    rec.onerror = function (e) {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') err = 'Allow the microphone for this site to ask by voice.'
      else if (e.error === 'no-speech') err = 'I did not hear anything. Tap the microphone and try again.'
    }
    rec.onend = function () { listening = false; stopListen = null; render(); if (heard) ask(heard, true) }
    try { rec.start(); listening = true; err = ''; stopListen = function () { try { rec.stop() } catch (e) { } }; render() } catch (e) { listening = false }
  }

  // ---------- asking ----------
  function ask(q, spoken) {
    var question = String(q || input.value).trim()
    if (!question || busy) return
    hush()
    err = ''
    msgs.push({ role: 'user', content: question.slice(0, 1000) })
    input.value = ''
    busy = true
    save(); render()
    var x = new XMLHttpRequest()
    x.open('POST', API)
    x.setRequestHeader('Content-Type', 'application/json')
    x.timeout = 60000
    x.onload = function () {
      busy = false
      var r = {}
      try { r = JSON.parse(x.responseText) } catch (e) { }
      if (r.whatsapp && /^https:\/\/wa\.me\//.test(r.whatsapp)) waLink = r.whatsapp
      if (r.reply) {
        msgs.push({ role: 'assistant', content: String(r.reply) })
        typing = msgs.length - 1
        save(); render(); typeOut(typing)
        if (voiceOn || spoken) say(msgs.length - 1)
      } else {
        msgs.pop()
        input.value = question
        err = r.error || 'Something went wrong. Please try again, or chat with us on WhatsApp.'
        render()
      }
    }
    x.onerror = x.ontimeout = function () {
      busy = false; msgs.pop(); input.value = question
      err = 'No connection just now. Please try again, or chat with us on WhatsApp.'
      render()
    }
    x.send(JSON.stringify({ messages: msgs.slice(-14), app: APP, page: (location.pathname || '/').slice(0, 200) }))
  }

  // ---------- events ----------
  function setOpen(v) {
    open = v
    panel.hidden = !v
    tip.hidden = true
    launch.setAttribute('aria-expanded', v ? 'true' : 'false')
    launch.querySelector('span').textContent = v ? 'Close' : 'Chat with us'
    if (v) { render(); setTimeout(function () { input.focus() }, 50) } else { hush(); if (stopListen) stopListen() }
  }
  launch.addEventListener('click', function () { setOpen(!open) })
  $('.cl').addEventListener('click', function () { setOpen(false); launch.focus() })
  tip.querySelector('button').addEventListener('click', function () { tip.hidden = true; store('cdm-bot-tip', '1') })
  tip.querySelector('span').addEventListener('click', function () { setOpen(true) })
  voB.addEventListener('click', function () { voiceOn = !voiceOn; local(VOICE, voiceOn ? 'on' : 'off'); if (!voiceOn) hush(); paintHeader() })
  micB.addEventListener('click', listen)
  form.addEventListener('submit', function (e) { e.preventDefault(); ask() })
  input.addEventListener('input', function () { input.style.height = 'auto'; input.style.height = Math.min(110, input.scrollHeight) + 'px'; paintHeader() })
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() } })
  list.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null
    if (!b) return
    if (b.hasAttribute('data-say')) { var i = +b.getAttribute('data-say'); if (speaking === i) hush(); else say(i); return }
    if (b.parentNode && b.parentNode.className === 'chips') ask(b.textContent)
  })
  root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) { setOpen(false); launch.focus() } })

  // hide while the signed-in Ask AI assistant is on the page
  function sync() {
    var hide = !!document.querySelector(ASK_AI)
    host.style.display = hide ? 'none' : ''
    if (hide && open) setOpen(false)
  }

  function start() {
    document.body.appendChild(host)
    sync()
    if (window.MutationObserver) new MutationObserver(sync).observe(document.body, { childList: true, subtree: true })
    if (!store('cdm-bot-tip') && !msgs.length) setTimeout(function () { if (!open && host.style.display !== 'none') { tip.hidden = false; store('cdm-bot-tip', '1') } }, 6000)
    paintHeader()
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start)
})()
