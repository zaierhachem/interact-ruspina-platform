/* =========================================================================
   ICRM — ESPACE MEMBRES · CONFIGURATION
   Rôles, navigation et permissions. Aucune logique de sécurité ici :
   ces données décident de ce qui est AFFICHÉ. L'accès réel aux données
   sera imposé plus tard par Supabase (Auth + Row Level Security).
   ========================================================================= */
(function () {
  'use strict';
  var P = window.ICRMPortal = window.ICRMPortal || {};
  P.views = P.views || {};

  /* Permissions par rôle — cumulatives (chaque rôle hérite du précédent). */
  var MEMBER = [
    'profile:read-own', 'profile:edit-own', 'calendar:read', 'commission:read-own',
    'meetings:read', 'tasks:read-own', 'tasks:update-own', 'documents:read', 'announcements:read'
  ];
  var HEAD   = MEMBER.concat(['tasks:create', 'meetings:create', 'commission:manage']);
  var BUREAU = HEAD.concat(['members:read-all', 'announcements:create', 'documents:upload', 'analytics:read']);
  var ADMIN  = BUREAU.concat(['roles:manage', 'audit:read']);

  var MEMBER_NAV = ['dashboard', 'profil', 'calendrier', 'commission', 'reunions', 'taches', 'documents', 'annonces'];

  P.config = {
    APP_NAME: 'Espace Membres',

    /* ---- Point d'intégration du backend -------------------------------------
       provider : 'mock' (données fictives, défaut) | 'supabase' (phase suivante).
       Pour brancher Supabase : créer js/providers/supabase.js qui enregistre
       ICRMPortal.providers.supabase (mêmes méthodes que providers/mock.js),
       renseigner url + anonKey ci-dessous, passer provider à 'supabase'.
       RÈGLES : seule la clé « anon » (publique) peut apparaître ici ;
       JAMAIS de clé service_role ni de mot de passe ; aucun fichier .env côté navigateur.
       Volontairement VIDE dans cette phase. */
    BACKEND: {
      provider: 'mock',
      supabase: { url: '', anonKey: '' }
    },

    /* Entrées de navigation principale (id → route hash). */
    NAV_PRIMARY: [
      { id: 'dashboard',  label: 'Dashboard',     icon: 'dashboard' },
      { id: 'profil',     label: 'Mon Profil',    icon: 'user' },
      { id: 'calendrier', label: 'Calendrier',    icon: 'calendar' },
      { id: 'commission', label: 'Ma Commission', icon: 'users' },
      { id: 'reunions',   label: 'Réunions',      icon: 'message' },
      { id: 'taches',     label: 'Mes Tâches',    icon: 'tasks' },
      { id: 'documents',  label: 'Documents',     icon: 'file' },
      { id: 'annonces',   label: 'Annonces',      icon: 'megaphone' }
    ],
    NAV_SECONDARY: [
      { id: 'parametres', label: 'Paramètres', icon: 'settings' }
    ],

    /* Rôles. `home` = vue d'accueil. Les dashboards Commission / Bureau / Admin
       seront de nouvelles vues enregistrées dans ICRMPortal.views, puis
       référencées ici (home + nav) : aucune autre modification de l'architecture. */
    ROLES: {
      member:          { label: 'Membre',            home: 'dashboard', nav: MEMBER_NAV, permissions: MEMBER },
      commission_head: { label: 'Chef de commission', home: 'dashboard', nav: MEMBER_NAV, permissions: HEAD },   // TODO : dashboard commission
      bureau:          { label: 'Bureau exécutif',   home: 'dashboard', nav: MEMBER_NAV, permissions: BUREAU }, // TODO : dashboard bureau
      super_admin:     { label: 'Super admin',       home: 'dashboard', nav: MEMBER_NAV, permissions: ADMIN }    // TODO : administration
    }
  };

  /* Session courante (renseignée au démarrage par ICRMPortal.api.getSession()).
     can() sert uniquement à l'affichage — ce n'est PAS un contrôle d'accès. */
  P.session = { user: null, role: 'member', permissions: [] };
  P.can = function (permission) { return P.session.permissions.indexOf(permission) > -1; };
})();
