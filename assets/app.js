/* Al Bunt · direct booking · v1
   Every room opens WhatsApp with its name in the message. Dates/nights/guests are optional extras.
   No storage, no network calls, no innerHTML. */
(function () {
  'use strict';
  var VERSION = 'al-bunt v1 · 6 Nov 2026';
  var WA = '201143650240'; // demo: messages reach Nour (concept, not a real hotel)

  var state = { nights: 2, guests: 2 };
  var LIM = { nights: [1, 14], guests: [1, 4] };

  var digits = '٠١٢٣٤٥٦٧٨٩';
  function ar(n) { return String(n).replace(/[0-9]/g, function (d) { return digits[d]; }); }

  function nightsTxt(n) { return n === 1 ? 'ليلة وحدة' : n === 2 ? 'ليلتين' : n <= 10 ? ar(n) + ' ليالي' : ar(n) + ' ليلة'; }
  function guestsTxt(n) { return n === 1 ? 'شخص واحد' : n === 2 ? 'شخصين' : ar(n) + ' أشخاص'; }

  function dateTxt(v) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return '';
    var p = v.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    if (isNaN(d)) return '';
    try {
      return new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-arab', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
    } catch (e) { return ar(p[2]) + '/' + ar(p[1]); }
  }

  var dateEl = document.getElementById('f-date');

  function message(room) {
    var lines = ['السلام عليكم،'];
    lines.push(room ? 'أبغى أحجز غرفة «' + room + '» في البنط.' : 'عندي سؤال عن الغرف في البنط.');
    var dt = dateEl ? dateTxt(dateEl.value) : '';
    if (room || dt) {
      var meta = [];
      if (dt) meta.push('الوصول: ' + dt);
      meta.push(nightsTxt(state.nights));
      meta.push(guestsTxt(state.guests));
      lines.push(meta.join(' · '));
    }
    return lines.join('\n');
  }

  function link(room) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(message(room)); }

  // refresh every WhatsApp link (so long-press / copy link also carries the room name)
  var rooms = Array.prototype.slice.call(document.querySelectorAll('.room'));
  function refresh() {
    rooms.forEach(function (li) {
      var a = li.querySelector('.room-a');
      if (a) a.href = link(li.getAttribute('data-name'));
    });
    ['ask', 'dock-wa'].forEach(function (id) { var a = document.getElementById(id); if (a) a.href = link(''); });
    document.getElementById('f-nights').textContent = ar(state.nights);
    document.getElementById('f-guests').textContent = ar(state.guests);
    document.querySelectorAll('[data-step]').forEach(function (b) {
      var k = b.getAttribute('data-step'), d = +b.getAttribute('data-d');
      b.disabled = d < 0 ? state[k] <= LIM[k][0] : state[k] >= LIM[k][1];
    });
  }

  document.querySelectorAll('[data-step]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-step');
      state[k] = Math.min(LIM[k][1], Math.max(LIM[k][0], state[k] + (+b.getAttribute('data-d'))));
      refresh();
    });
  });

  if (dateEl) {
    var t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
    dateEl.min = t.toISOString().slice(0, 10);
    dateEl.addEventListener('change', refresh);
    dateEl.addEventListener('input', refresh);
  }
  var form = document.getElementById('when');
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); });

  // house section: tap a room name → scroll to its card and flash it
  document.querySelectorAll('.house a[data-room]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var li = document.getElementById('room-' + a.getAttribute('data-room'));
      if (!li) return;
      e.preventDefault();
      li.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      li.classList.remove('flash'); void li.offsetWidth; li.classList.add('flash');
      setTimeout(function () { li.classList.remove('flash'); }, 1600);
      var go = li.querySelector('.room-a'); if (go) go.focus({ preventScroll: true });
    });
  });

  // dock: show after the hero, hide while the rooms are on screen
  var dock = document.getElementById('dock');
  if (dock && 'IntersectionObserver' in window) {
    var heroIn = true, roomsIn = false;
    var upd = function () { dock.classList.toggle('show', !heroIn && !roomsIn); };
    new IntersectionObserver(function (es) { heroIn = es[0].isIntersecting; upd(); }, { threshold: 0.15 }).observe(document.querySelector('.hero'));
    new IntersectionObserver(function (es) { roomsIn = es[0].isIntersecting; upd(); }, { rootMargin: '-30% 0px -30% 0px' }).observe(document.querySelector('.room-list'));
  }

  refresh();
  if (window.console) console.info(VERSION);
})();
