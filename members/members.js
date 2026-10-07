/* =========================================================================
   ICRM — ESPACE MEMBRES · COQUE & ROUTEUR
   - construit la navigation depuis la configuration du rôle ;
   - routeur par hash (#/page/param) : fonctionne sur un hébergement statique
     et en ouvrant le fichier directement ;
   - gère le tiroir mobile, le focus, le titre de page et les annonces vocales.
   ========================================================================= */
(function () {
  'use strict';
  var P = window.ICRMPortal, U = P.ui, cfg = P.config, e = U.esc;
  var $ = function (s, c) { return (c || document).querySelector(s); };

  var main = $('#main'), sidebar = $('#sidebar'), scrim = $('#scrim'), burger = $('#burger'), live = $('#pt-live');
  var desktop = window.matchMedia('(min-width: 1024px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ticket = 0, firstRender = true, drawerOpen = false;

  burger.innerHTML = U.icon('menu');

  /* ---------------------------- Navigation ---------------------------- */
  function link(item) {
    return '<a class="pt-nav__link" href="#/' + item.id + '" data-route="' + item.id + '">' + U.icon(item.icon) + '<span>' + e(item.label) + '</span></a>';
  }
  function buildNav() {
    var role = cfg.ROLES[P.session.role], allowed = role.nav;
    var primary = cfg.NAV_PRIMARY.filter(function (i) { return allowed.indexOf(i.id) > -1; });
    $('#navPrimary').innerHTML = primary.map(link).join('');
    $('#navSecondary').innerHTML = cfg.NAV_SECONDARY.map(link).join('') +
      '<button type="button" class="pt-nav__link" id="signOut">' + U.icon('logout') + '<span>Se déconnecter</span></button>' +
      '<a class="pt-nav__link pt-nav__link--muted" href="../index.html">' + U.icon('globe') + '<span>Retour au site public</span></a>';

    var quick = ['dashboard', 'calendrier', 'taches', 'annonces'].map(function (id) { return primary.filter(function (i) { return i.id === id; })[0]; }).filter(Boolean);
    $('#tabbar').innerHTML = quick.map(function (i) {
      return '<a class="pt-tab" href="#/' + i.id + '" data-route="' + i.id + '">' + U.icon(i.icon) + '<span>' + e(i.label.replace('Mes ', '')) + '</span></a>';
    }).join('') + '<button type="button" class="pt-tab" id="tabMenu" aria-expanded="false" aria-controls="sidebar">' + U.icon('menu') + '<span>Menu</span></button>';

    var u = P.session.user, name = u.firstName + ' ' + u.lastName;
    $('#userChip').innerHTML = U.avatar(name, 'md') + '<span><b>' + e(name) + '</b><small>' + e(P.session.roleLabel) + '</small></span>';

    $('#signOut').addEventListener('click', function () {
      /* Pas de fausse session : l'API renvoie « non implémenté » tant qu'aucun backend n'est branché. */
      P.api.signOut().catch(function (err) { U.toast(err.message); });
    });
    $('#tabMenu').addEventListener('click', function () { setDrawer(true); });
  }
  function markCurrent(id) {
    document.querySelectorAll('[data-route]').forEach(function (a) {
      if (a.dataset.route === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  /* ---------------------------- Tiroir (< 1024 px) ---------------------------- */
  function setDrawer(open, opts) {
    opts = opts || {};
    if (desktop.matches) open = false;
    drawerOpen = open;
    sidebar.classList.toggle('is-open', open);
    scrim.hidden = !open;
    document.body.classList.toggle('pt-lock', open);
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    var tm = $('#tabMenu'); if (tm) tm.setAttribute('aria-expanded', open);
    /* `inert` : pendant que le tiroir est ouvert, le reste de la page n'est ni focalisable ni lisible (piège à focus natif). */
    ['shell', 'tabbar'].forEach(function (id) { var n = document.getElementById(id); if (n) n.inert = open; });
    if (open) { var first = sidebar.querySelector('a, button'); if (first) first.focus({ preventScroll: true }); }
    else if (opts.restoreFocus) burger.focus({ preventScroll: true });
  }
  burger.addEventListener('click', function () { setDrawer(!drawerOpen, { restoreFocus: true }); });
  scrim.addEventListener('click', function () { setDrawer(false, { restoreFocus: true }); });
  sidebar.addEventListener('click', function (ev) { if (ev.target.closest('a') && !desktop.matches) setDrawer(false); });
  document.addEventListener('keydown', function (ev) {
    if (!drawerOpen) return;
    if (ev.key === 'Escape') { setDrawer(false, { restoreFocus: true }); return; }
    if (ev.key === 'Tab') {
      var f = Array.prototype.slice.call(sidebar.querySelectorAll('a[href], button')), a = f[0], z = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === a) { ev.preventDefault(); z.focus(); }
      else if (!ev.shiftKey && document.activeElement === z) { ev.preventDefault(); a.focus(); }
    }
  });
  desktop.addEventListener('change', function () { setDrawer(false); });

  /* ---------------------------- Routeur ---------------------------- */
  function parse() {
    var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    return { id: parts[0] || '', params: parts.slice(1) };
  }
  function render() {
    var role = cfg.ROLES[P.session.role], r = parse(), allowed = role.nav.concat(['parametres']);
    if (!r.id || allowed.indexOf(r.id) < 0 || !P.views[r.id]) { location.replace('#/' + role.home); return; }

    var view = P.views[r.id], my = ++ticket, ctx = { id: r.id, params: r.params };
    main.setAttribute('aria-busy', 'true');
    view.load(P.api, ctx).then(function (data) {
      if (my !== ticket) return;                                 // une navigation plus récente a pris le relais
      main.innerHTML = '<div class="pt-page' + (reduce ? '' : ' is-entering') + '">' + view.render(data, ctx) + '</div>';
      main.removeAttribute('aria-busy');
      if (view.mount) view.mount(main, data, ctx);
      markCurrent(r.id);
      document.title = view.title + ' — Espace Membres · ICRM';
      $('#crumb').textContent = view.title;
      if (!firstRender) {                                         // focus + annonce vocale (jamais au premier chargement)
        window.scrollTo(0, 0);
        var target = (r.params.length && $('#pt-md-title')) || $('#pt-h1') || main;
        target.focus({ preventScroll: true });
        live.textContent = view.title;
      }
      firstRender = false;
    }).catch(function (err) {
      if (my !== ticket) return;
      main.innerHTML = '<div class="pt-page"><section class="pt-card"><h1 class="pt-h1" id="pt-h1" tabindex="-1">Oups</h1><p class="pt-lede">Impossible d’afficher cette page. ' + e(err && err.message || '') + '</p></section></div>';
      main.removeAttribute('aria-busy');
    });
  }

  /* ---------------------------- Démarrage ---------------------------- */
  P.api.getSession().then(function (s) {
    P.session = { user: s.user, role: s.role, roleLabel: s.roleLabel, permissions: s.permissions, commission: s.commission };
    buildNav();
    window.addEventListener('hashchange', render);
    render();
  }).catch(function (err) {
    main.removeAttribute('aria-busy');
    main.innerHTML = '<div class="pt-page"><section class="pt-card"><h1 class="pt-h1" id="pt-h1" tabindex="-1">Espace indisponible</h1><p class="pt-lede">' + e((err && err.message) || 'Impossible de charger la session.') + '</p></section></div>';
  });
})();
