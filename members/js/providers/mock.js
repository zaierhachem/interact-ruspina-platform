/* =========================================================================
   ICRM — ESPACE MEMBRES · FOURNISSEUR « MOCK »
   Implémente le contrat de données de l'application avec des données
   fictives (js/mock-data.js). C'est le SEUL fichier qui lit ICRMPortal.mock.
   Un futur js/providers/supabase.js devra exposer exactement les mêmes méthodes.
   ========================================================================= */
(function () {
  'use strict';
  var P = window.ICRMPortal, M = P.mock;
  P.providers = P.providers || {};

  var clone = function (v) { return JSON.parse(JSON.stringify(v)); };
  var resolve = function (v) { return Promise.resolve(clone(v)); };
  var fullName = function () { return M.user.firstName + ' ' + M.user.lastName; };

  P.providers.mock = {
    name: 'mock',

    /* Identité + profil + rôle + permissions.
       SUPABASE : auth.getUser() → profiles (id = auth.uid()) → role, commission_id. */
    getSession: function () {
      var role = M.user.role, cfg = P.config.ROLES[role];
      return resolve({ user: M.user, role: role, roleLabel: cfg.label, permissions: cfg.permissions, commission: M.commission });
    },

    /* SUPABASE : agrégations (vues SQL / RPC) filtrées par RLS sur l'utilisateur. */
    getDashboard: function () {
      var mine = M.tasks.filter(function (t) { return t.assignee === fullName(); });
      var next = M.meetings.filter(function (m) { return m.status === 'upcoming' && m.commission === M.commission.name; })[0] || null;
      return resolve({
        user: M.user, stats: M.stats, commission: M.commission, nextMeeting: next, today: M.today,
        myTasks: mine.sort(function (a, b) { return (a.status === 'completed') - (b.status === 'completed') || a.deadline.localeCompare(b.deadline); }),
        announcements: M.announcements.slice(0, 3), activity: M.activity
      });
    },
    getProfile:       function () { return resolve({ user: M.user, commission: M.commission }); },
    getCalendar:      function () { return resolve({ events: M.events, today: M.today }); },
    getCommission:    function () { return resolve({ commission: M.commission, members: M.commissionMembers }); },
    getMeetings:      function () { return resolve({ meetings: M.meetings, today: M.today }); },
    getTasks:         function () { return resolve({ tasks: M.tasks, me: fullName(), today: M.today }); },
    /* SUPABASE STORAGE : documents.path → createSignedUrl() à la demande (jamais d'URL publique permanente). */
    getDocuments:     function () { return resolve({ documents: M.documents }); },
    getAnnouncements: function () { return resolve({ announcements: M.announcements }); },
    getSettings:      function () { return resolve({ user: M.user, settings: M.settings }); },

    /* SUPABASE : auth.signOut(). Volontairement non implémenté : pas de fausse session. */
    signOut: function () {
      var e = new Error('Déconnexion : non disponible dans cette phase (aucun backend connecté).'); e.code = 'NOT_IMPLEMENTED';
      return Promise.reject(e);
    }
  };
})();
