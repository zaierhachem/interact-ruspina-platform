/* =========================================================================
   ICRM — ESPACE MEMBRES · FOURNISSEUR « SUPABASE »
   Implémente le même contrat que providers/mock.js :
     Vues → ICRMPortal.api → providers/supabase.js → Supabase (Auth + PostgREST)

   SÉCURITÉ : ce code ne contient aucune clé (config.js : URL + clé publishable uniquement).
   Les rôles lus ici servent à l'AFFICHAGE ; l'autorisation réelle est imposée par la RLS
   de PostgreSQL : on demande, la base décide de ce qui est renvoyé.

   ⚠ Schéma : seules les colonnes de `profiles` sont connues avec certitude. Les autres tables
   sont lues avec select('*') puis converties par les fonctions « map* » ci-dessous, qui acceptent
   plusieurs noms de colonnes courants. Si un nom diffère, ajuster UNIQUEMENT la section MAPPERS.
   ========================================================================= */
(function () {
  'use strict';
  var P = window.ICRMPortal, A = P.auth;
  P.providers = P.providers || {};

  var sb = function () { return P.getClient({ detectSessionInUrl: false }); };
  var cached = null;                                            // dernière session résolue (profil inclus)
  var pad = function (n) { return ('0' + n).slice(-2); };
  var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var hhmm = function (d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  var today = function () { return iso(new Date()); };
  var pick = function (row, keys) { for (var i = 0; i < keys.length; i++) { var v = row[keys[i]]; if (v !== undefined && v !== null && v !== '') return v; } return null; };
  var memberId = function (r) { return pick(r, ['profile_id', 'user_id', 'member_id']); };

  /* ---------------------------- accès aux tables ---------------------------- */
  async function run(build) {
    var r; try { r = await build(); } catch (e) { throw A.toError(e, 'NETWORK'); }
    if (r.error) throw A.toError(r.error, 'QUERY');
    return r.data || [];
  }
  var table = function (name, cols) { return run(function () { return sb().from(name).select(cols || '*'); }); };

  async function current() { return cached || (cached = await provider.getSession()); }

  /* Charge les tables demandées. tolerant=true : une table illisible devient [] (le dashboard ne doit jamais tomber). */
  async function load(keys, tolerant) {
    var out = {}, jobs = keys.map(function (k) {
      var p = k === 'profiles' ? table('profiles', 'id, full_name, status') : table(k);
      return (tolerant ? p.catch(function () { return []; }) : p).then(function (rows) { out[k] = rows; });
    });
    await Promise.all(jobs);
    return out;
  }

  /* ============================== MAPPERS ============================== */
  function dateParts(v, timeV) {
    if (!v) return { date: null, time: '' };
    var s = String(v);
    if (s.indexOf('T') > -1) { var d = new Date(s); if (!isNaN(d)) return { date: iso(d), time: hhmm(d) }; }
    return { date: s.slice(0, 10), time: timeV ? String(timeV).slice(0, 5) : '' };
  }
  function toList(v) {
    if (Array.isArray(v)) return v.map(function (x) { return typeof x === 'string' ? x : (x && (x.title || x.text || x.label)) || ''; }).filter(Boolean);
    if (typeof v === 'string') return v.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
    return [];
  }
  var prio = function (v) { v = String(v || '').toLowerCase(); return /high|urgent|haute|critical/.test(v) ? 'high' : /low|basse|faible/.test(v) ? 'low' : 'medium'; };
  var taskStatus = function (v) { v = String(v || '').toLowerCase(); return /done|complet|termin|closed/.test(v) ? 'completed' : /progress|doing|ongoing|cours/.test(v) ? 'in_progress' : 'pending'; };
  var attStatus = function (v) { v = String(v || '').toLowerCase(); return /present|late|retard/.test(v) ? 'present' : /absent|excus/.test(v) ? 'absent' : 'expected'; };
  function relTime(v) {
    var t = new Date(v); if (isNaN(t)) return '';
    var m = Math.round((Date.now() - t) / 60000);
    if (m < 2) return 'À l’instant'; if (m < 60) return 'Il y a ' + m + ' min';
    var h = Math.round(m / 60); if (h < 24) return 'Il y a ' + h + ' h';
    var d = Math.round(h / 24); return d === 1 ? 'Hier' : 'Il y a ' + d + ' jours';
  }
  function docType(r) {
    var s = String(pick(r, ['file_type', 'type', 'mime_type', 'file_name', 'path', 'name', 'title']) || '').toLowerCase();
    return /pdf/.test(s) ? 'pdf' : /docx?|word/.test(s) ? 'docx' : /xlsx?|sheet|excel|csv/.test(s) ? 'xlsx' : /pptx?|presentation|powerpoint/.test(s) ? 'pptx' : /png|jpe?g|webp|gif|image/.test(s) ? 'img' : 'file';
  }
  function docFolder(r) {
    var s = String(pick(r, ['folder', 'category']) || '').toLowerCase();
    return /even/.test(s) ? 'events' : /form/.test(s) ? 'forms' : /arch/.test(s) ? 'archives' : s;
  }
  function docAccess(r) {
    var s = String(pick(r, ['access_level', 'visibility', 'access']) || '').toLowerCase();
    return /admin/.test(s) ? 'admin' : /bureau/.test(s) ? 'bureau' : /commission/.test(s) ? 'commission' : 'all';
  }

  /* Contexte commun (noms, commissions) construit à partir des tables chargées. */
  function context(d) {
    var names = {}, status = {}, comName = {};
    (d.profiles || []).forEach(function (p) { names[p.id] = p.full_name || 'Membre'; status[p.id] = p.status; });
    (d.commissions || []).forEach(function (c) { comName[c.id] = pick(c, ['name', 'title']) || 'Commission'; });
    return { names: names, status: status, comName: comName };
  }
  function mapTask(r, x) {
    var assigneeId = pick(r, ['assigned_to', 'assignee_id', 'profile_id', 'user_id']);
    return { id: String(r.id), title: pick(r, ['title', 'name']) || 'Tâche', description: pick(r, ['description', 'details']) || '',
      assignee: x.names[assigneeId] || 'Membre', assigneeId: assigneeId, commission: x.comName[r.commission_id] || '',
      priority: prio(r.priority), deadline: dateParts(pick(r, ['due_date', 'deadline', 'due_at'])).date || '', status: taskStatus(r.status), meetingId: r.meeting_id || null };
  }
  function mapMeeting(r, x, d, tasks) {
    var st = dateParts(pick(r, ['starts_at', 'start_at', 'scheduled_at', 'meeting_at', 'date', 'meeting_date']), pick(r, ['start_time', 'time']));
    var en = dateParts(pick(r, ['ends_at', 'end_at']), pick(r, ['end_time']));
    var date = st.date || today();
    return { id: String(r.id), title: pick(r, ['title', 'name']) || 'Réunion', date: date, start: st.time, end: en.time,
      location: pick(r, ['location', 'place']) || 'À préciser', commission: x.comName[r.commission_id] || 'Toutes les commissions',
      status: date < today() ? 'past' : 'upcoming',
      participants: (d.attendance || []).filter(function (a) { return a.meeting_id === r.id; }).map(function (a) { return [x.names[memberId(a)] || 'Membre', attStatus(a.status)]; }),
      agenda: toList(r.agenda), notes: pick(r, ['notes', 'minutes']) || '', decisions: toList(r.decisions),
      tasks: tasks.filter(function (t) { return t.meetingId === r.id; }).map(function (t) { return t.title; }) };
  }
  function mapAnnouncement(r, x) {
    var p = String(r.priority || '').toLowerCase(), aud = String(pick(r, ['audience', 'target']) || '').toLowerCase();
    return { id: String(r.id), title: pick(r, ['title', 'subject']) || 'Annonce',
      priority: /important|high|urgent/.test(p) ? 'important' : /info|low/.test(p) ? 'info' : 'normal',
      date: dateParts(pick(r, ['published_at', 'created_at'])).date || today(),
      author: x.names[pick(r, ['author_id', 'created_by'])] || pick(r, ['author']) || 'Le bureau',
      audience: !aud || /^(all|tous)/.test(aud) ? 'Tous les membres' : /bureau/.test(aud) ? 'Bureau' : /commission/.test(aud) ? 'Ma commission' : String(pick(r, ['audience', 'target'])),
      body: String(pick(r, ['content', 'body', 'message']) || '').split(/\n{2,}/).map(function (s) { return s.trim(); }).filter(Boolean),
      attachments: toList(r.attachments) };
  }
  function myCommission(uid, d, x) {
    var mem = (d.commission_members || []), mine = mem.filter(function (r) { return memberId(r) === uid; })[0];
    if (!mine) return null;
    var com = (d.commissions || []).filter(function (c) { return c.id === mine.commission_id; })[0];
    if (!com) return null;
    var members = mem.filter(function (r) { return r.commission_id === com.id; });
    var headRow = members.filter(function (r) { return /head|lead|chef|respons/i.test(String(r.role || '')); })[0];
    var headId = pick(com, ['head_id', 'lead_id', 'head_profile_id', 'responsible_id']) || (headRow && memberId(headRow));
    var name = x.comName[com.id], tasks = (d.tasks || []).map(function (t) { return mapTask(t, x); }), meetings = (d.meetings || []);
    return { id: com.id, name: name, headName: x.names[headId] || null, status: 'active', memberCount: members.length,
      upcomingProjects: null,                                    // pas de table « projets » : affiché « — »
      openTasks: tasks.filter(function (t) { return t.commission === name && t.status !== 'completed'; }).length,
      meetings: meetings.filter(function (m) { return m.commission_id === com.id; }).length, _members: members };
  }
  var strip = function (c) { if (!c) return null; var o = {}; Object.keys(c).forEach(function (k) { if (k.charAt(0) !== '_') o[k] = c[k]; }); return o; };

  /* ============================== CONTRAT ============================== */
  var provider = P.providers.supabase = {
    name: 'supabase',

    /* Session réelle : getSession() → getUser() (validé par le serveur d'authentification) → profil → rôle. */
    getSession: async function () {
      var client = sb(), r;
      try { r = await client.auth.getSession(); } catch (e) { throw A.toError(e, 'NETWORK'); }
      if (r.error) throw A.toError(r.error, 'UNEXPECTED');
      if (!r.data || !r.data.session) throw A.coded('NO_SESSION');
      var u; try { u = await client.auth.getUser(); } catch (e2) { throw A.toError(e2, 'NETWORK'); }
      if (u.error || !u.data || !u.data.user) {
        var c = u.error ? A.classify(u.error) : 'NO_SESSION';
        if (c === 'UNEXPECTED' || c === 'NO_SESSION') { await A.signOutQuiet(client); throw A.coded('NO_SESSION', u.error); }
        throw A.coded(c, u.error);
      }
      var profile = await A.fetchProfile(client, u.data.user), role = P.config.ROLES[profile.role];
      cached = { user: profile, role: profile.role, roleLabel: role.label, permissions: role.permissions, commission: null };
      return cached;
    },

    /* Déconnexion réelle. Redirection : à la charge de l'appelant (members.js). */
    signOut: async function () {
      var ok = await A.signOutQuiet(sb()); cached = null;
      if (!ok) throw A.coded('SIGNOUT_FAILED');
      return true;
    },

    /* Abonnement aux événements d'authentification. Le callback est reporté (setTimeout) : la documentation
       Supabase interdit d'appeler d'autres fonctions Supabase directement dans le callback (risque de blocage). */
    onAuthChange: function (cb) {
      var res = sb().auth.onAuthStateChange(function (event, session) {
        if (event === 'SIGNED_OUT') cached = null;
        setTimeout(function () { cb(event, { userId: session && session.user ? session.user.id : null }); }, 0);
      });
      var sub = res && res.data && res.data.subscription;
      return function () { if (sub) sub.unsubscribe(); };
    },

    /* Dashboard : jamais bloquant (une lecture qui échoue donne une section vide). */
    getDashboard: async function () {
      var s = await current(), uid = s.user.id;
      var d = await load(['profiles', 'commissions', 'commission_members', 'tasks', 'meetings', 'attendance', 'announcements', 'activity_log'], true);
      var x = context(d), all = d.tasks.map(function (t) { return mapTask(t, x); });
      var mine = all.filter(function (t) { return t.assigneeId === uid; });
      var att = d.attendance.filter(function (a) { return memberId(a) === uid; });
      var com = myCommission(uid, d, x);
      var meetings = d.meetings.map(function (m) { return mapMeeting(m, x, d, all); }).filter(function (m) { return m.status === 'upcoming'; }).sort(function (a, b) { return (a.date + a.start).localeCompare(b.date + b.start); });
      var next = (com && meetings.filter(function (m) { return m.commission === com.name; })[0]) || meetings[0] || null;
      return {
        user: s.user, today: today(), commission: strip(com), nextMeeting: next,
        stats: {
          activity: null,                                        // aucune formule d'« activité » définie : affiché « — »
          attendance: att.length ? { present: att.filter(function (a) { return attStatus(a.status) === 'present'; }).length, total: att.length } : null,
          tasks: mine.length ? { done: mine.filter(function (t) { return t.status === 'completed'; }).length, total: mine.length } : null
        },
        myTasks: mine.sort(function (a, b) { return (a.status === 'completed') - (b.status === 'completed') || String(a.deadline).localeCompare(String(b.deadline)); }),
        announcements: d.announcements.map(function (a) { return mapAnnouncement(a, x); }).sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 3),
        activity: d.activity_log.slice().sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); }).slice(0, 4).map(function (r, i) {
          var hint = String(pick(r, ['entity', 'entity_type', 'table_name', 'action', 'type']) || '').toLowerCase();
          var detail = pick(r, ['description', 'details', 'message']);
          return { id: String(r.id || i), kind: /meeting|r[ée]union/.test(hint) ? 'meeting' : /document/.test(hint) ? 'document' : /announce|annonce/.test(hint) ? 'announcement' : 'task',
            text: String(pick(r, ['action', 'event', 'type']) || 'Activité'), detail: typeof detail === 'string' ? detail : '', when: relTime(r.created_at) };
        })
      };
    },

    getProfile: async function () {
      var s = await current(), d = await load(['profiles', 'commissions', 'commission_members', 'tasks', 'meetings'], true);
      return { user: s.user, commission: strip(myCommission(s.user.id, d, context(d))) };
    },

    getCommission: async function () {
      var s = await current(), d = await load(['profiles', 'commissions', 'commission_members', 'tasks', 'meetings', 'attendance']), x = context(d);
      var com = myCommission(s.user.id, d, x); if (!com) return { commission: null, members: [] };
      var tasks = d.tasks.map(function (t) { return mapTask(t, x); });
      var members = com._members.map(function (r) {
        var id = memberId(r), att = d.attendance.filter(function (a) { return memberId(a) === id; }), mine = tasks.filter(function (t) { return t.assigneeId === id; });
        return { name: x.names[id] || 'Membre', status: A.isUsableStatus(x.status[id]) ? A.normalizeStatus(x.status[id]) : 'inactive',
          attendance: att.length ? Math.round(att.filter(function (a) { return attStatus(a.status) === 'present'; }).length / att.length * 100) : null,
          tasks: [mine.filter(function (t) { return t.status === 'completed'; }).length, mine.length] };
      });
      return { commission: strip(com), members: members };
    },

    getCalendar: async function () {
      var s = await current(), d = await load(['profiles', 'commissions', 'tasks', 'meetings', 'attendance']), x = context(d);
      var tasks = d.tasks.map(function (t) { return mapTask(t, x); });
      var events = d.meetings.map(function (m) { return mapMeeting(m, x, d, tasks); }).map(function (m) {
        return { id: m.id, date: m.date, title: m.title, type: m.commission === 'Toutes les commissions' ? 'club-meeting' : 'commission-meeting', time: m.start, location: m.location };
      }).concat(tasks.filter(function (t) { return t.assigneeId === s.user.id && t.deadline && t.status !== 'completed'; }).map(function (t) {
        return { id: 'task-' + t.id, date: t.deadline, title: 'Échéance — ' + t.title, type: 'deadline', time: '23:59', location: '' };
      }));
      return { events: events, today: today() };
    },

    getMeetings: async function () {
      var d = await load(['profiles', 'commissions', 'tasks', 'meetings', 'attendance']), x = context(d), tasks = d.tasks.map(function (t) { return mapTask(t, x); });
      return { meetings: d.meetings.map(function (m) { return mapMeeting(m, x, d, tasks); }), today: today() };
    },

    getTasks: async function () {
      var s = await current(), d = await load(['profiles', 'commissions', 'tasks']), x = context(d);
      return { tasks: d.tasks.map(function (t) { return mapTask(t, x); }), me: s.user.fullName, meId: s.user.id, today: today() };
    },

    /* Pas de téléchargement dans cette phase : documents.path → URL signée (Storage) viendra plus tard. */
    getDocuments: async function () {
      var d = await load(['profiles', 'documents']), x = context(d);
      return { documents: d.documents.map(function (r) {
        return { id: String(r.id), name: pick(r, ['title', 'name', 'file_name']) || 'Document', type: docType(r), folder: docFolder(r),
          date: dateParts(pick(r, ['created_at', 'uploaded_at'])).date || today(), uploadedBy: x.names[pick(r, ['uploaded_by', 'created_by', 'author_id'])] || 'Le bureau', access: docAccess(r) };
      }) };
    },

    getAnnouncements: async function () {
      var d = await load(['profiles', 'announcements']), x = context(d);
      return { announcements: d.announcements.map(function (a) { return mapAnnouncement(a, x); }) };
    },

    /* Préférences : valeurs par défaut de l'interface (non enregistrées dans cette phase). */
    getSettings: async function () {
      var s = await current();
      return { user: s.user, settings: { language: 'fr', languages: [['fr', 'Français']], notifications: [
        { id: 'n-ann', label: 'Annonces du club', hint: 'Être prévenu des nouvelles annonces.', enabled: true },
        { id: 'n-meet', label: 'Rappels de réunion', hint: 'Un rappel avant chaque réunion de ta commission.', enabled: true },
        { id: 'n-task', label: 'Échéances de tâches', hint: 'Un rappel avant la date limite de tes tâches.', enabled: false } ] } };
    }
  };
})();
