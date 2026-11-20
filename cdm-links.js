/* CDM links: keeps every link to a CDM app pointing at that app's current web address.
   The owner sets the addresses in CDM Partners > Admin > App addresses. This script reads them from the public
   app-links endpoint (remembered for 10 minutes), then switches any link, button or address text that points at an
   older address of a CDM app to the current one. If the endpoint cannot be reached, the built-in list below is used,
   so links are never broken. The same file is copied into every CDM app and the CDM Technologies website.
   window.CDM_LINKS.url('cdmschool') gives an app's current address; .fix(url) switches one address. */
(function () {
  'use strict';
  if (window.CDM_LINKS) return;
  var ENDPOINT = 'https://uopvnuzjktebdsavwgbn.supabase.co/functions/v1/app-links';
  var CACHE = 'cdm-links-v1';
  var FRESH_MS = 10 * 60 * 1000;
  var KEEP_MS = 30 * 24 * 60 * 60 * 1000;
  // Built-in addresses: used until the endpoint answers, and whenever it cannot be reached.
  var BUILT_IN = [
    { id: 'cdm24', url: 'https://cdm24.netlify.app', old_urls: ['https://cdm24.bolt.host'] },
    { id: 'cdmschool', url: 'https://cdmschool.netlify.app', old_urls: ['https://cdmschool.bolt.host'] },
    { id: 'cdmfinrep', url: 'https://cdmfinrep.bolt.host', old_urls: [] },
    { id: 'cdmprep', url: 'https://cdmprep.bolt.host', old_urls: [] },
    { id: 'cdmpeople', url: 'https://cdmpeople.bolt.host', old_urls: [] },
    { id: 'cdmclearance', url: 'https://cdmclearance.bolt.host', old_urls: [] },
    { id: 'cdmfood', url: 'https://cdm-food.netlify.app', old_urls: [] },
    { id: 'cdmpartners', url: 'https://cdmpartners.bolt.host', old_urls: [] },
    { id: 'home', url: 'https://cdmtechnologies.github.io', old_urls: [] }
  ];
  var ORIGIN = /^https:\/\/([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;

  var apps = BUILT_IN;
  var map = {}; // old origin -> current origin
  var hostMap = {}; // old host -> current host

  function clean(list) {
    if (!Array.isArray(list)) return null;
    var out = [];
    for (var i = 0; i < list.length && i < 50; i++) {
      var a = list[i];
      if (!a || typeof a.id !== 'string' || typeof a.url !== 'string' || !ORIGIN.test(a.url)) continue;
      var old = [];
      if (Array.isArray(a.old_urls)) for (var j = 0; j < a.old_urls.length; j++) if (typeof a.old_urls[j] === 'string' && ORIGIN.test(a.old_urls[j])) old.push(a.old_urls[j]);
      out.push({ id: a.id, url: a.url, old_urls: old });
    }
    return out.length ? out : null;
  }

  function build(list) {
    // Start from the built-in list so an app missing from the answer still keeps its links.
    var byId = {};
    var i;
    for (i = 0; i < BUILT_IN.length; i++) byId[BUILT_IN[i].id] = { id: BUILT_IN[i].id, url: BUILT_IN[i].url, old_urls: BUILT_IN[i].old_urls.slice() };
    for (i = 0; i < list.length; i++) {
      var b = byId[list[i].id];
      var olds = list[i].old_urls.slice();
      if (b && b.url !== list[i].url) olds.push(b.url);
      if (b) for (var k = 0; k < b.old_urls.length; k++) olds.push(b.old_urls[k]);
      byId[list[i].id] = { id: list[i].id, url: list[i].url, old_urls: olds };
    }
    var m = {}, hm = {}, current = {}, out = [];
    for (var id in byId) { current[byId[id].url] = true; out.push(byId[id]); }
    for (i = 0; i < out.length; i++) {
      for (var j = 0; j < out[i].old_urls.length; j++) {
        var o = out[i].old_urls[j];
        if (o === out[i].url || current[o]) continue; // never move a link away from an address an app uses now
        m[o] = out[i].url;
        hm[o.slice(8)] = out[i].url.slice(8);
      }
    }
    apps = out; map = m; hostMap = hm;
  }

  function fix(href) {
    if (typeof href !== 'string' || href.slice(0, 8) !== 'https://') return href;
    var end = href.indexOf('/', 8);
    var origin = (end < 0 ? href : href.slice(0, end)).toLowerCase();
    var q = origin.search(/[?#]/);
    if (q > 0) origin = origin.slice(0, q);
    var to = map[origin];
    return to ? to + href.slice(origin.length) : href;
  }

  var hostRe = null;
  function hostPattern() {
    var hosts = Object.keys(hostMap);
    if (!hosts.length) return null;
    return new RegExp('\\b(' + hosts.map(function (h) { return h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')\\b', 'gi');
  }

  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, NOSCRIPT: 1, CODE: 1, PRE: 1 };
  function fixNode(root) {
    if (!root || root.nodeType !== 1 && root.nodeType !== 9) return;
    var els = root.querySelectorAll ? root.querySelectorAll('a[href^="https://"], area[href^="https://"], form[action^="https://"], iframe[src^="https://"]') : [];
    var list = [root].concat(Array.prototype.slice.call(els));
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (!el.getAttribute) continue;
      var attr = el.tagName === 'FORM' ? 'action' : el.tagName === 'IFRAME' ? 'src' : 'href';
      var v = el.getAttribute(attr);
      if (v) { var f = fix(v); if (f !== v) el.setAttribute(attr, f); }
    }
    if (!hostRe || !document.createTreeWalker) return;
    var walker = document.createTreeWalker(root, 4, {
      acceptNode: function (n) {
        for (var p = n.parentNode; p && p !== root.parentNode; p = p.parentNode) if (SKIP[p.nodeName] || p.isContentEditable) return 2;
        return 1;
      }
    });
    var t, texts = [];
    while ((t = walker.nextNode())) { hostRe.lastIndex = 0; if (hostRe.test(t.nodeValue)) texts.push(t); }
    for (i = 0; i < texts.length; i++) {
      texts[i].nodeValue = texts[i].nodeValue.replace(hostRe, function (h) { return hostMap[h.toLowerCase()] || h; });
    }
  }

  var queued = [];
  var timer = 0;
  function flush() {
    timer = 0;
    var q = queued; queued = [];
    for (var i = 0; i < q.length; i++) if (q[i].isConnected !== false) fixNode(q[i]);
  }
  function queue(n) { queued.push(n); if (!timer) timer = setTimeout(flush, 30); }

  function applyAll() {
    hostRe = hostPattern();
    if (document.body) fixNode(document.body);
  }

  function useList(list) { build(list); applyAll(); try { window.dispatchEvent(new Event('cdm-links')); } catch (e) { /* old browser */ } }

  // window.open('https://old.address/...') also goes to the current address
  var open = window.open;
  if (typeof open === 'function') {
    window.open = function (u) {
      var args = Array.prototype.slice.call(arguments);
      if (typeof u === 'string') args[0] = fix(u);
      return open.apply(window, args);
    };
  }

  window.CDM_LINKS = {
    url: function (id) { for (var i = 0; i < apps.length; i++) if (apps[i].id === id) return apps[i].url; return null; },
    fix: fix,
    apps: function () { return apps.map(function (a) { return { id: a.id, url: a.url }; }); }
  };

  // 1. built-in list, or what was remembered last time
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE) || 'null'); } catch (e) { cached = null; }
  var remembered = cached && typeof cached.at === 'number' && Date.now() - cached.at < KEEP_MS ? clean(cached.apps) : null;
  build(remembered || []);

  function start() {
    applyAll();
    if (window.MutationObserver) {
      new MutationObserver(function (records) {
        if (!Object.keys(map).length) return;
        for (var i = 0; i < records.length; i++) {
          var r = records[i];
          if (r.type === 'attributes') queue(r.target);
          else if (r.type === 'characterData') queue(r.target.parentNode);
          else for (var j = 0; j < r.addedNodes.length; j++) queue(r.addedNodes[j].nodeType === 3 ? r.addedNodes[j].parentNode : r.addedNodes[j]);
        }
      }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['href', 'action', 'src'] });
    }
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);

  // 2. the owner's current list (at most once every 10 minutes per browser)
  if (cached && Date.now() - cached.at < FRESH_MS && remembered) return;
  if (!window.fetch) return;
  var ctl = window.AbortController ? new AbortController() : null;
  var stop = ctl ? setTimeout(function () { ctl.abort(); }, 5000) : 0;
  fetch(ENDPOINT, { signal: ctl ? ctl.signal : undefined, credentials: 'omit', mode: 'cors' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      clearTimeout(stop);
      var list = j && clean(j.apps);
      if (!list) return;
      try { localStorage.setItem(CACHE, JSON.stringify({ at: Date.now(), apps: list })); } catch (e) { /* private mode */ }
      useList(list);
    })
    .catch(function () { clearTimeout(stop); });
})();
