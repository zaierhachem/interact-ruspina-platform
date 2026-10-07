/* ICRM — ESPACE MEMBRES · VUES : Commission, Documents, Annonces */
(function () {
  'use strict';
  var P = window.ICRMPortal, U = P.ui, e = U.esc, V = P.views, T = U.META;

  /* ============================ COMMISSION ============================ */
  V.commission = {
    title: 'Ma Commission',
    load: function (api) { return api.getCommission(); },
    render: function (d) {
      var c = d.commission;
      var stat = function (v, l) { return '<div class="pt-cstat"><b>' + v + '</b><span>' + e(l) + '</span></div>'; };
      return U.pageHead('Ma commission', 'Commission ' + e(c.name)) +
        '<section class="pt-card pt-card--feature pt-chead" aria-label="Résumé de la commission">' +
          '<svg class="pt-card__rings" viewBox="0 0 400 400" aria-hidden="true" focusable="false"><circle cx="200" cy="200" r="198"/><circle cx="200" cy="200" r="140"/><circle cx="200" cy="200" r="82"/></svg>' +
          '<div class="pt-chead__id"><p class="pt-eyebrow pt-eyebrow--light">Responsable</p><p class="pt-chead__name">' + e(c.headName) + '</p><p class="pt-chead__members">' + c.memberCount + ' membres</p></div>' +
          '<div class="pt-chead__stats">' + stat(c.upcomingProjects, 'Projets à venir') + stat(c.openTasks, 'Tâches ouvertes') + stat(c.meetings, 'Réunions') + '</div>' +
        '</section>' +
        '<section class="pt-card pt-tablecard" aria-labelledby="pt-ml"><header class="pt-card__head"><h2 class="pt-h3" id="pt-ml">Membres de la commission</h2></header>' +
          '<table class="pt-table"><thead><tr><th scope="col">Membre</th><th scope="col">Statut</th><th scope="col">Présence</th><th scope="col">Tâches</th></tr></thead><tbody>' +
          d.members.map(function (m) {
            return '<tr><th scope="row" data-label="Membre"><span class="pt-person">' + U.avatar(m.name, 'sm') + e(m.name) + '</span></th>' +
              '<td data-label="Statut">' + U.statusChip('memberStatus', m.status) + '</td>' +
              '<td data-label="Présence"><span class="pt-meter">' + U.bar(m.attendance, 'Présence ' + m.attendance + ' %') + '<b>' + m.attendance + '%</b></span></td>' +
              '<td data-label="Tâches"><b>' + m.tasks[0] + '/' + m.tasks[1] + '</b></td></tr>';
          }).join('') + '</tbody></table></section>';
    }
  };

  /* ============================ DOCUMENTS ============================ */
  V.documents = {
    title: 'Documents',
    load: function (api) { return api.getDocuments(); },
    render: function (d) {
      var count = function (k) { return k === 'all' ? d.documents.length : d.documents.filter(function (x) { return x.folder === k; }).length; };
      return U.pageHead('Ressources du club', 'Documents', 'Les documents partagés, classés par dossier et par niveau d’accès.') +
        '<div class="pt-toolbar pt-toolbar--docs">' +
          '<div class="pt-field pt-field--search"><label for="docSearch" class="pt-sr">Rechercher un document</label>' + U.icon('search') + '<input id="docSearch" type="search" placeholder="Rechercher un document" autocomplete="off"></div>' +
          '<div class="pt-folders" role="group" aria-label="Dossiers">' + T.folders.map(function (f, i) {
            return '<button type="button" class="pt-folder" data-folder="' + f[0] + '" aria-pressed="' + (i === 0) + '">' + (i ? U.icon('folder') : '') + e(f[1]) + ' <span>' + count(f[0]) + '</span></button>';
          }).join('') + '</div></div>' +
        '<section class="pt-card pt-tablecard" aria-label="Liste des documents" id="docCard"></section>';
    },
    mount: function (root, d) {
      var folder = 'all', q = '', card = root.querySelector('#docCard');
      var folderName = function (k) { return (T.folders.filter(function (f) { return f[0] === k; })[0] || [0, k])[1]; };
      function draw() {
        var rows = d.documents.filter(function (x) { return (folder === 'all' || x.folder === folder) && x.name.toLowerCase().indexOf(q) > -1; })
          .sort(function (a, b) { return b.date.localeCompare(a.date); });
        card.innerHTML = rows.length
          ? '<table class="pt-table pt-table--docs"><thead><tr><th scope="col">Nom</th><th scope="col">Type</th><th scope="col">Date</th><th scope="col">Ajouté par</th><th scope="col">Accès</th></tr></thead><tbody>' +
            rows.map(function (x) {
              return '<tr><th scope="row" data-label="Nom"><span class="pt-file"><span class="pt-file__ico pt-file__ico--' + e(x.type) + '">' + U.icon('file') + '</span><span><b>' + e(x.name) + '</b><small>' + e(folderName(x.folder)) + '</small></span></span></th>' +
                '<td data-label="Type">' + e(U.fileTypeLabel[x.type] || x.type) + '</td><td data-label="Date">' + e(U.date.short(x.date)) + ' ' + e(U.date.parse(x.date).getFullYear()) + '</td>' +
                '<td data-label="Ajouté par">' + e(x.uploadedBy) + '</td><td data-label="Accès">' + U.statusChip('access', x.access) + '</td></tr>';
            }).join('') + '</tbody></table>'
          : U.empty('Aucun document ne correspond à ta recherche.');
      }
      root.querySelector('#docSearch').addEventListener('input', function (ev) { q = ev.target.value.trim().toLowerCase(); draw(); });
      root.querySelectorAll('[data-folder]').forEach(function (b) {
        b.addEventListener('click', function () { folder = b.dataset.folder; root.querySelectorAll('[data-folder]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); draw(); });
      });
      draw();
    }
  };

  /* ============================ ANNONCES ============================ */
  V.annonces = {
    title: 'Annonces',
    load: function (api) { return api.getAnnouncements(); },
    render: function (d, ctx) {
      var sel = ctx.params[0] ? d.announcements.filter(function (a) { return a.id === ctx.params[0]; })[0] : null;
      if (sel) {
        return '<article class="pt-article" aria-labelledby="pt-h1"><a class="pt-back" href="#/annonces">' + U.icon('back') + 'Toutes les annonces</a>' +
          '<div class="pt-article__meta">' + U.statusChip('announce', sel.priority) + '<span>' + e(U.date.full(sel.date)) + '</span></div>' +
          '<h1 class="pt-h1 pt-h1--article" id="pt-h1" tabindex="-1">' + e(sel.title) + '</h1>' +
          '<p class="pt-article__by">Par <b>' + e(sel.author) + '</b> · Destinataires : ' + e(sel.audience) + '</p>' +
          '<div class="pt-article__body">' + sel.body.map(function (p) { return '<p>' + e(p) + '</p>'; }).join('') + '</div>' +
          (sel.attachments.length ? '<section class="pt-attach" aria-label="Pièces jointes"><h2 class="pt-h4">Pièces jointes</h2><ul>' + sel.attachments.map(function (a) { return '<li>' + U.icon('clip') + '<span>' + e(a) + '</span></li>'; }).join('') + '</ul></section>' : '') +
          '</article>';
      }
      var action = P.can('announcements:create') ? '<button type="button" class="pt-btn pt-btn--primary" data-soon>' + U.icon('plus') + 'Nouvelle annonce</button>' : '';
      return U.pageHead('Communication officielle', 'Annonces', 'Les informations officielles du club, de la plus récente à la plus ancienne.', action) +
        '<ul class="pt-annlist">' + d.announcements.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).map(function (a) {
          return '<li><a class="pt-ann pt-ann--' + e(a.priority) + '" href="#/annonces/' + e(a.id) + '"><span class="pt-ann__meta">' + U.statusChip('announce', a.priority) + '<time>' + e(U.date.short(a.date)) + '</time></span>' +
            '<b class="pt-ann__title">' + e(a.title) + '</b><span class="pt-ann__excerpt">' + e(a.body[0]) + '</span>' +
            '<span class="pt-ann__foot">' + e(a.author) + ' · ' + e(a.audience) + (a.attachments.length ? ' · ' + U.icon('clip') + a.attachments.length : '') + '</span></a></li>';
        }).join('') + '</ul>';
    },
    mount: function (root) { var b = root.querySelector('[data-soon]'); if (b) b.addEventListener('click', U.soon); }
  };
})();
