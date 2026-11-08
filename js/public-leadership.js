/* ICRM — Synchronisation publique du Bureau exécutif.
   Source officielle : RPC get_public_club_leadership (lecture seule).
   Tant que le Super Admin n'a pas publié une composition valide, le site conserve
   fidèlement le Bureau statique existant dans js/data.js. Aucune donnée privée n'est demandée. */
(function () {
  'use strict';

  var INSTANCE_KEY = '__ICRM_PUBLIC_LEADERSHIP_SYNC__';
  if (window[INSTANCE_KEY]) return;
  window[INSTANCE_KEY] = true;

  var PROJECT_URL = 'https://izxhzmllfdbbvlyoeifz.supabase.co';
  var PUBLISHABLE_KEY = 'sb_publishable_jpQqgCWB6BcbOKKo4XtbsA_KaurghnW';
  var ENDPOINT = PROJECT_URL + '/rest/v1/rpc/get_public_club_leadership';
  var grid = document.getElementById('teamGrid');
  var inFlight = false;
  var lastRenderSignature = null;
  if (!grid || !window.SITE || !Array.isArray(window.SITE.TEAM)) return;

  function safePhoto(value) {
    var url = String(value || '').trim();
    if (/^https:\/\//i.test(url) || (/^\/?assets\/[a-z0-9_./-]+$/i.test(url) && !/(^|\/)\.\.(\/|$)/.test(url))) return url;
    return '';
  }
  function fallbackPhoto(name) {
    var wanted = String(name || '').trim().toLocaleLowerCase('fr');
    var item = window.SITE.TEAM.filter(function (m) {
      return String(m.name || '').trim().toLocaleLowerCase('fr') === wanted;
    })[0];
    return item && item.photo ? item.photo : '';
  }
  function makeCard(member, index) {
    var name = String(member.name || '').trim();
    var role = String(member.role || '').trim();
    var photo = safePhoto(member.photo) || fallbackPhoto(name);
    var featured = member.featured === true || /président/i.test(role);
    var li = document.createElement('li');
    li.className = 'member' + (featured ? ' member--lead' : '') + ' in';
    li.style.setProperty('--i', String(index));

    var picture = document.createElement('div');
    picture.className = 'member__photo' + (photo ? '' : ' is-ph');
    if (!photo) {
      picture.setAttribute('role', 'img');
      picture.setAttribute('aria-label', 'Photo de ' + (name || 'membre') + ' à venir');
      var placeholder = document.createElement('img');
      placeholder.className = 'ph-logo';
      placeholder.src = window.SITE.MEDIA.INTERACT_LOGO_WHITE;
      placeholder.alt = '';
      placeholder.width = 34;
      placeholder.height = 34;
      picture.appendChild(placeholder);
    } else {
      var img = document.createElement('img');
      img.src = photo;
      img.alt = 'Portrait de ' + (name || 'un membre du Bureau');
      img.loading = 'lazy';
      img.width = 640;
      img.height = 800;
      picture.appendChild(img);
    }

    var info = document.createElement('div');
    info.className = 'member__info';
    var heading = document.createElement('h3');
    heading.className = 'member__name' + (name ? '' : ' is-ph');
    heading.textContent = name || 'Nom à renseigner';
    var position = document.createElement('p');
    position.className = 'member__role' + (role ? '' : ' is-ph');
    position.textContent = role || 'Fonction';
    info.appendChild(heading);
    info.appendChild(position);
    li.appendChild(picture);
    li.appendChild(info);
    return li;
  }
  function renderStaticFallback() {
    var fragment = document.createDocumentFragment();
    window.SITE.TEAM.forEach(function (member, index) {
      if (member && typeof member === 'object') fragment.appendChild(makeCard(member, index));
    });
    grid.replaceChildren(fragment);
    lastRenderSignature = '__static_fallback__';
  }

  async function synchronize() {
    if (inFlight || document.visibilityState === 'hidden') return;
    inFlight = true;
    try {
      var response = await fetch(ENDPOINT, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          /* Publishable keys are API keys, not JWTs. Never send one as Bearer. */
          apikey: PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: '{}'
      });
      if (!response.ok) return;
      var data = await response.json();
      if (!data || typeof data !== 'object') return;
      if (data.published !== true) {
        if (lastRenderSignature !== null && lastRenderSignature !== '__static_fallback__') {
          renderStaticFallback();
        }
        return;
      }
      if (!Array.isArray(data.members)) return;

      var signature = JSON.stringify(data.members);
      if (signature === lastRenderSignature) return;

      var fragment = document.createDocumentFragment();
      data.members.forEach(function (member, index) {
        if (member && typeof member === 'object') fragment.appendChild(makeCard(member, index));
      });
      if (!fragment.childNodes.length) {
        var empty = document.createElement('li');
        empty.className = 'team__empty';
        empty.textContent = 'Composition du Bureau en cours de mise à jour.';
        fragment.appendChild(empty);
      }
      /* Replace, never append: a public refresh cannot duplicate static cards. */
      grid.replaceChildren(fragment);
      lastRenderSignature = signature;
    } catch (_) {
      /* Keep the already-rendered static or last-known-good roster on API failure. */
    } finally {
      inFlight = false;
    }
  }

  function boot() {
    if (window[INSTANCE_KEY + '_BOOTED']) return;
    window[INSTANCE_KEY + '_BOOTED'] = true;
    /* main.js registers its ready callback first and paints the static fallback.
       Only then may this script replace it with the published roster. */
    synchronize();
    window.addEventListener('focus', synchronize);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') synchronize();
    });
    window.setInterval(synchronize, 15000);
  }

  var contentReady = window.SITE_CONTENT_READY;
  if (contentReady && typeof contentReady.then === 'function') {
    contentReady.then(boot, boot);
  } else {
    boot();
  }
})();
