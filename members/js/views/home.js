/* ICRM — ESPACE MEMBRES · VUES : Dashboard, Profil, Paramètres
   Contrat d'une vue : { title, load(api, params), render(data, ctx) → html, mount?(root, data, ctx) } */
(function () {
  'use strict';
  var P = window.ICRMPortal, U = P.ui, e = U.esc, V = P.views;

  /* ============================ DASHBOARD ============================ */
  V.dashboard = {
    title: 'Dashboard',
    load: function (api) { return api.getDashboard(); },
    render: function (d) {
      var s = d.stats, m = d.nextMeeting, c = d.commission;
      var att = s.attendance, tk = s.tasks, dash = '—';                      // null = donnée non disponible → « — »
      var pctAtt = att && att.total ? att.present / att.total * 100 : 0, pctTask = tk && tk.total ? tk.done / tk.total * 100 : 0;
      var mandate = d.user.mandate ? ' · mandat ' + e(d.user.mandate) : '';

      var kpis =
        '<section class="pt-kpis" aria-label="Mes indicateurs">' +
          '<div class="pt-kpi"><p class="pt-kpi__label">Statut</p><p class="pt-kpi__value pt-kpi__value--text">' + U.statusChip('memberStatus', d.user.status).replace('pt-chip ', 'pt-chip pt-chip--lg ') + '</p><p class="pt-kpi__sub">' + e(P.config.ROLES[d.user.role].label) + mandate + '</p></div>' +
          '<div class="pt-kpi"><p class="pt-kpi__label">Activité</p><p class="pt-kpi__value">' + (s.activity == null ? dash : s.activity + '<small>%</small>') + '</p>' + U.bar(s.activity || 0, s.activity == null ? 'Activité : non disponible' : 'Activité : ' + s.activity + ' %') + '<p class="pt-kpi__sub">Indice d’engagement</p></div>' +
          '<div class="pt-kpi"><p class="pt-kpi__label">Présence</p><p class="pt-kpi__value">' + (att ? att.present + '<small> / ' + att.total + '</small>' : dash) + '</p>' + U.bar(pctAtt, att ? 'Présence : ' + att.present + ' réunions sur ' + att.total : 'Présence : non disponible') + '<p class="pt-kpi__sub">Réunions suivies</p></div>' +
          '<div class="pt-kpi"><p class="pt-kpi__label">Tâches</p><p class="pt-kpi__value">' + (tk ? tk.done + '<small> / ' + tk.total + '</small>' : dash) + '</p>' + U.bar(pctTask, tk ? 'Tâches : ' + tk.done + ' terminées sur ' + tk.total : 'Tâches : aucune') + '<p class="pt-kpi__sub">Tâches terminées</p></div>' +
        '</section>';

      var meeting = m
        ? '<article class="pt-card pt-card--feature pt-span-7" aria-labelledby="pt-nm">' +
            '<svg class="pt-card__rings" viewBox="0 0 400 400" aria-hidden="true" focusable="false"><circle cx="200" cy="200" r="198"/><circle cx="200" cy="200" r="140"/><circle cx="200" cy="200" r="82"/></svg>' +
            '<p class="pt-eyebrow pt-eyebrow--light">Prochaine réunion</p>' +
            '<div class="pt-next">' +
              '<div class="pt-next__date" aria-hidden="true"><span>' + e(U.date.day(m.date)) + '</span><b>' + e(U.date.monthName(m.date)) + '</b></div>' +
              '<div><h2 class="pt-h2" id="pt-nm">' + e(m.commission) + '</h2>' +
                '<p class="pt-next__line">' + e(U.date.weekday(m.date)) + ' ' + Number(U.date.day(m.date)) + ' ' + e(U.date.monthName(m.date)) + '</p>' +
                '<ul class="pt-meta pt-meta--light"><li>' + U.icon('clock') + '<span>' + e(m.start) + '</span></li><li>' + U.icon('pin') + '<span>' + e(m.location) + '</span></li></ul></div>' +
            '</div>' +
            '<div class="pt-card__foot"><span class="pt-chip pt-chip--light">' + e(U.date.relative(d.today, m.date)) + '</span><a class="pt-link pt-link--light" href="#/reunions/' + e(m.id) + '">Voir la réunion ' + U.icon('right') + '</a></div>' +
          '</article>'
        : '<article class="pt-card pt-span-7">' + U.empty('Aucune réunion planifiée.') + '</article>';

      var tasks = '<article class="pt-card pt-span-5" aria-labelledby="pt-mt"><header class="pt-card__head"><h2 class="pt-h3" id="pt-mt">Mes tâches</h2><a class="pt-link" href="#/taches">Tout voir</a></header>' + (!d.myTasks.length ? U.empty('Aucune tâche pour le moment.') : '<ul class="pt-checks">' +
        d.myTasks.slice(0, 3).map(function (t) {
          var done = t.status === 'completed';
          return '<li class="pt-check' + (done ? ' is-done' : '') + '"><span class="pt-check__box" aria-hidden="true">' + (done ? U.icon('check') : '') + '</span>' +
            '<span class="pt-check__text"><b>' + e(t.title) + '</b><small><span class="pt-sr">' + (done ? 'Terminée. ' : 'À faire. ') + '</span>' + (done ? 'Terminée' : 'Pour le ' + e(U.date.short(t.deadline))) + '</small></span></li>';
        }).join('') + '</ul>') + '</article>';

      var commission = !c ? '<article class="pt-card pt-span-4" aria-labelledby="pt-cm"><header class="pt-card__head"><h2 class="pt-h3" id="pt-cm">Ma commission</h2></header>' + U.empty('Tu n’es rattaché à aucune commission pour le moment.') + '</article>' : '<article class="pt-card pt-span-4" aria-labelledby="pt-cm"><header class="pt-card__head"><h2 class="pt-h3" id="pt-cm">Ma commission</h2></header>' +
        '<p class="pt-bignote">' + e(c.name) + '</p>' +
        '<dl class="pt-dl pt-dl--stack"><div><dt>Responsable</dt><dd>' + e(c.headName || '—') + '</dd></div><div><dt>Statut</dt><dd>' + U.statusChip('memberStatus', c.status) + '</dd></div><div><dt>Membres</dt><dd>' + c.memberCount + '</dd></div></dl>' +
        '<a class="pt-link" href="#/commission">Voir la commission ' + U.icon('right') + '</a></article>';

      var ann = '<article class="pt-card pt-span-8" aria-labelledby="pt-an"><header class="pt-card__head"><h2 class="pt-h3" id="pt-an">Annonces</h2><a class="pt-link" href="#/annonces">Toutes les annonces</a></header>' + (!d.announcements.length ? U.empty('Aucune annonce pour le moment.') : '<ul class="pt-rows">' +
        d.announcements.map(function (a) {
          return '<li><a class="pt-row" href="#/annonces/' + e(a.id) + '"><span class="pt-row__main"><b>' + e(a.title) + '</b><small>' + e(a.author) + ' · ' + e(U.date.short(a.date)) + '</small></span>' + U.statusChip('announce', a.priority) + '</a></li>';
        }).join('') + '</ul>') + '</article>';

      var act = '<article class="pt-card pt-span-12" aria-labelledby="pt-ac"><header class="pt-card__head"><h2 class="pt-h3" id="pt-ac">Activité récente</h2></header>' + (!d.activity.length ? U.empty('Aucune activité récente.') : '<ol class="pt-timeline">' +
        d.activity.map(function (a) {
          var ico = { meeting: 'message', task: 'tasks', document: 'file', announcement: 'megaphone' }[a.kind];
          return '<li><span class="pt-timeline__ico">' + U.icon(ico) + '</span><span class="pt-timeline__text"><b>' + e(a.text) + '</b><small>' + e(a.detail) + '</small></span><time class="pt-timeline__when">' + e(a.when) + '</time></li>';
        }).join('') + '</ol>') + '</article>';

      return U.pageHead('Espace membres' + (d.user.mandate ? ' · Mandat ' + d.user.mandate : ''),
          'Bonjour, ' + e(d.user.firstName) + ' <span class="pt-wave" role="img" aria-label="main qui salue">👋</span>', 'Content de te revoir.') +
        kpis + '<div class="pt-grid">' + meeting + tasks + commission + ann + act + '</div>';
    }
  };

  /* ============================ PROFIL ============================ */
  V.profil = {
    title: 'Mon Profil',
    load: function (api) { return api.getProfile(); },
    render: function (d) {
      var u = d.user, name = u.firstName + ' ' + u.lastName, roleLabel = P.config.ROLES[u.role].label;
      var rows = [
        ['Rôle', roleLabel], ['Commission', d.commission ? 'Commission ' + d.commission.name : 'Aucune commission'], ['Poste', u.position],
        ['Email', u.email], ['Téléphone', u.phone], ['Membre depuis', (u.joinedAt ? U.date.my(u.joinedAt) : '—')],
        ['Mandat / promotion', u.mandate || '—'], ['Statut', U.statusChip('memberStatus', u.status)]
      ];
      return U.pageHead('Mon compte', 'Mon profil', 'Les informations qui te concernent au sein du club.',
          P.can('profile:edit-own') ? '<button type="button" class="pt-btn pt-btn--ghost" data-soon>Modifier</button>' : '') +
        '<div class="pt-profile">' +
          '<section class="pt-card pt-card--feature pt-profile__id" aria-labelledby="pt-pn">' +
            '<svg class="pt-card__rings" viewBox="0 0 400 400" aria-hidden="true" focusable="false"><circle cx="200" cy="200" r="198"/><circle cx="200" cy="200" r="140"/></svg>' +
            '<span class="pt-avatar pt-avatar--xl pt-avatar--v0" role="img" aria-label="Photo de profil à venir">' + e(U.initials(name)) + '</span>' +
            '<h2 class="pt-h2" id="pt-pn">' + e(name) + '</h2>' +
            '<p class="pt-profile__role">' + e(roleLabel) + '</p><p class="pt-profile__sub">' + e(d.commission ? 'Commission ' + d.commission.name : 'Aucune commission') + '</p>' +
            (u.mandate ? '<p class="pt-profile__sub">Mandat ' + e(u.mandate) + '</p>' : '') +
          '</section>' +
          '<section class="pt-card" aria-labelledby="pt-pd"><header class="pt-card__head"><h2 class="pt-h3" id="pt-pd">Informations</h2></header><dl class="pt-dl pt-dl--grid">' +
            rows.map(function (r) { return '<div><dt>' + e(r[0]) + '</dt><dd>' + (r[0] === 'Statut' ? r[1] : e(r[1])) + '</dd></div>'; }).join('') +
          '</dl><p class="pt-note">Seules les informations utiles à la vie du club sont affichées. Les coordonnées personnelles sont des exemples dans cette maquette.</p></section>' +
        '</div>';
    },
    mount: function (root) { var b = root.querySelector('[data-soon]'); if (b) b.addEventListener('click', U.soon); }
  };

  /* ============================ PARAMÈTRES ============================ */
  V.parametres = {
    title: 'Paramètres',
    load: function (api) { return api.getSettings(); },
    render: function (d) {
      var s = d.settings;
      var sw = function (n) {
        return '<div class="pt-switch"><input type="checkbox" id="' + e(n.id) + '" name="' + e(n.id) + '"' + (n.enabled ? ' checked' : '') + '><label for="' + e(n.id) + '"><b>' + e(n.label) + '</b><small>' + e(n.hint) + '</small></label></div>';
      };
      return U.pageHead('Mon compte', 'Paramètres', 'Préférences de ton espace membre.') +
        '<form class="pt-card pt-form" id="settingsForm" novalidate>' +
          '<fieldset><legend class="pt-h3">Compte</legend>' +
            '<div class="pt-field"><label for="s-email">Adresse email</label><input id="s-email" type="email" value="' + e(d.user.email) + '" readonly aria-describedby="s-email-h"><p class="pt-hint" id="s-email-h">L’adresse de connexion sera gérée par le système d’authentification.</p></div>' +
            '<div class="pt-field"><label for="s-lang">Langue</label><select id="s-lang" name="lang">' + s.languages.map(function (l) { return '<option value="' + e(l[0]) + '"' + (l[0] === s.language ? ' selected' : '') + '>' + e(l[1]) + '</option>'; }).join('') + '</select></div>' +
          '</fieldset>' +
          '<fieldset><legend class="pt-h3">Notifications</legend>' +
            s.notifications.map(sw).join('') +
          '</fieldset>' +
          '<div class="pt-form__actions"><button type="submit" class="pt-btn pt-btn--primary">Enregistrer</button><p class="pt-hint">Maquette : les préférences ne sont pas encore enregistrées.</p></div>' +
        '</form>';
    },
    mount: function (root) {
      root.querySelector('#settingsForm').addEventListener('submit', function (ev) { ev.preventDefault(); U.toast('Préférences non enregistrées : aucun backend connecté (maquette).'); });
    }
  };
})();
