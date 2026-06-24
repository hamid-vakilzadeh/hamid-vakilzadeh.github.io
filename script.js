/*
 * Standalone resume behavior — vanilla port of the original design-canvas
 * DCLogic component. No framework, no build step.
 *
 *   - Light / dark theme toggle (persisted in localStorage)
 *   - Print / PDF (clears any active filter first)
 *   - Focus-area filters: click a focus button or a sidebar tag to show only
 *     the work that matches, with slide animations and sidebar highlighting.
 */
(function () {
  'use strict';

  var root, themeLabel;
  var state = { filter: null, theme: 'light', ready: false };
  var onClick;

  function norm(s) { return (s || '').trim().toLowerCase(); }

  // Tokens for an item = its data-tags + the lowercased text of every .sc-tag inside it.
  function itemTokens(it) {
    var set = new Set((it.getAttribute('data-tags') || '').split(/\s+/).filter(Boolean).map(norm));
    it.querySelectorAll('.sc-tag').forEach(function (c) { set.add(norm(c.textContent)); });
    return set;
  }

  // Dim sidebar tags that no main-column item actually uses (non-clickable).
  function markAttachment() {
    if (!root) return;
    var used = new Set();
    root.querySelectorAll('main [data-item]').forEach(function (it) {
      itemTokens(it).forEach(function (t) { used.add(t); });
    });
    root.querySelectorAll('aside .sc-tag').forEach(function (s) {
      s.classList.toggle('sc-unattached', !used.has(norm(s.textContent)));
    });
  }

  function applyFilter() {
    if (!root) return;
    var f = state.filter;
    var animate = state.ready;

    root.querySelectorAll('[data-filter]').forEach(function (c) {
      c.classList.toggle('sc-active', !!f && c.getAttribute('data-filter') === f);
    });

    var allItems = [].slice.call(root.querySelectorAll('[data-item]'));
    var has = function (it) { return itemTokens(it).has(f); };
    var active = !!f && allItems.some(has);

    root.querySelectorAll('main section').forEach(function (sec) {
      var secItems = [].slice.call(sec.querySelectorAll('[data-item]'));
      if (!secItems.length) return;
      var secHide = active && !secItems.some(has);
      var secWasHidden = sec.classList.contains('sc-hide');

      secItems.forEach(function (it) {
        var hide = active && !has(it);
        var was = it.classList.contains('sc-hide');
        if (animate && !secHide && !secWasHidden && hide !== was) {
          slide(it, hide ? 'hide' : 'show');
        } else {
          cancelAnim(it);
          it.classList.toggle('sc-hide', hide);
        }
      });

      if (secHide !== secWasHidden) {
        if (animate) { slide(sec, secHide ? 'hide' : 'show'); }
        else { cancelAnim(sec); sec.classList.toggle('sc-hide', secHide); }
      }
    });

    // Highlight (dark tone) every sidebar tag used by a currently-matching item.
    var relevant = new Set();
    if (active) allItems.filter(has).forEach(function (it) {
      itemTokens(it).forEach(function (t) { relevant.add(t); });
    });
    root.querySelectorAll('aside .sc-tag').forEach(function (s) {
      var on = active && !s.classList.contains('sc-unattached') && relevant.has(norm(s.textContent));
      s.classList.toggle('sc-hi', on);
    });
  }

  function slide(el, dir) {
    if (el._scTarget === dir) return;
    cancelAnim(el);
    el._scTarget = dir;
    if (dir === 'show') el.classList.remove('sc-hide');
    var full = el.scrollHeight;
    var mb = el._mb0 || '0px';
    var mbN = parseFloat(mb) || 0;
    el.style.overflow = 'hidden';
    var dur = 280, t0 = performance.now();
    var ease = function (p) { return 1 - Math.pow(1 - p, 3); };
    var commit = function () {
      if (el._scTarget !== dir) return;
      el._scTarget = null;
      if (el._scRAF) { cancelAnimationFrame(el._scRAF); el._scRAF = null; }
      if (el._scTimer) { clearTimeout(el._scTimer); el._scTimer = null; }
      el.style.height = ''; el.style.overflow = ''; el.style.opacity = '';
      el.style.marginBottom = mb;
      if (dir === 'hide') el.classList.add('sc-hide');
    };
    var step = function (now) {
      if (el._scTarget !== dir) return;
      var p = Math.min(1, (now - t0) / dur);
      var e = ease(p);
      var k = dir === 'show' ? e : 1 - e;
      el.style.height = (full * k) + 'px';
      el.style.marginBottom = (mbN * k) + 'px';
      el.style.opacity = String(k);
      if (p < 1) el._scRAF = requestAnimationFrame(step);
      else commit();
    };
    el._scRAF = requestAnimationFrame(step);
    el._scTimer = setTimeout(commit, dur + 80);
  }

  function cancelAnim(el) {
    if (el._scRAF) { cancelAnimationFrame(el._scRAF); el._scRAF = null; }
    if (el._scTimer) { clearTimeout(el._scTimer); el._scTimer = null; }
    el._scTarget = null;
    el.style.height = ''; el.style.overflow = ''; el.style.opacity = '';
    if (el._mb0 !== undefined) el.style.marginBottom = el._mb0;
  }

  function setTheme(theme) {
    state.theme = theme;
    root.setAttribute('data-theme', theme);
    if (themeLabel) themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
    try { localStorage.setItem('resume-theme', theme); } catch (e) { /* ignore */ }
  }

  function toggleTheme() { setTheme(state.theme === 'dark' ? 'light' : 'dark'); }

  function setFilter(f) {
    state.filter = state.filter === f ? null : f;
    applyFilter();
  }

  function clearFilter() { state.filter = null; applyFilter(); }

  function printResume() { state.filter = null; applyFilter(); window.print(); }

  function init() {
    root = document.getElementById('resume-root');
    if (!root) return;
    themeLabel = document.getElementById('theme-label');

    // Restore persisted theme, falling back to the document's initial value.
    var saved = null;
    try { saved = localStorage.getItem('resume-theme'); } catch (e) { /* ignore */ }
    setTheme(saved || root.getAttribute('data-theme') || 'light');

    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    var printBtn = document.getElementById('print-btn');
    if (printBtn) printBtn.addEventListener('click', printResume);
    var clearBtn = document.getElementById('clear-filter');
    if (clearBtn) clearBtn.addEventListener('click', clearFilter);

    onClick = function (e) {
      var c = e.target.closest('[data-filter]');
      if (!c || !root.contains(c)) return;
      if (c.classList.contains('sc-unattached')) return;
      setFilter(c.getAttribute('data-filter'));
    };
    root.addEventListener('click', onClick);

    markAttachment();
    root.querySelectorAll('[data-item], main section').forEach(function (n) {
      n._mb0 = n.style.marginBottom || '0px';
    });

    applyFilter();
    state.ready = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
