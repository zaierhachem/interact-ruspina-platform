/* =========================================================================
   ICRM — ESPACE MEMBRES · AUTHENTIFICATION (helpers partagés)
   Utilisé par members.js, providers/supabase.js, login.js et reset-password.js.

   Principe : toute erreur (Supabase, réseau, base de données, JavaScript) est
   ramenée à un CODE ; chaque code a un texte français. Aucun message technique
   (SQL, Postgres, trace) n'est jamais affiché ; les détails ne vont qu'à la
   console, au niveau « debug ».

   NB : ces vérifications servent l'interface. L'autorisation réelle des données
   est imposée par PostgreSQL (Row Level Security), jamais par ce code.
   ========================================================================= */
(function () {
  'use strict';
  var P = window.ICRMPortal = window.ICRMPortal || {};
  var A = P.auth = {};

  /* ---------------------------- messages (français) ---------------------------- */
  var MESSAGES = {
    NO_SESSION:       { title: 'Connexion requise',        text: 'Connecte-toi pour accéder à ton espace membre.' },
    PROFILE_MISSING:  { title: 'Profil introuvable',       text: 'Ton compte est bien connecté, mais ton profil membre est introuvable. Contacte le bureau exécutif pour qu’il soit créé.' },
    PROFILE_INACTIVE: { title: 'Compte non actif',         text: 'Ton compte n’est pas actif pour le moment. Contacte le bureau exécutif.' },
    NETWORK:          { title: 'Connexion impossible',     text: 'Impossible de joindre le serveur. Vérifie ta connexion internet puis réessaie.' },
    RATE_LIMIT:       { title: 'Trop de tentatives',       text: 'Trop de tentatives. Patiente quelques minutes avant de réessayer.' },
    QUERY:            { title: 'Données indisponibles',    text: 'Nous n’avons pas pu charger tes données. Réessaie dans un instant ; si le problème persiste, contacte le bureau.' },
    LIB_UNAVAILABLE:  { title: 'Service indisponible',     text: 'Le service d’authentification n’a pas pu être chargé. Vérifie ta connexion internet puis recharge la page.' },
    CONFIG:           { title: 'Configuration incomplète', text: 'L’espace membres n’est pas encore configuré correctement. Contacte le bureau exécutif.' },
    SIGNOUT_FAILED:   { title: 'Déconnexion impossible',   text: 'La déconnexion n’a pas pu être effectuée. Vérifie ta connexion internet et réessaie.' },
    UNEXPECTED:       { title: 'Une erreur est survenue',  text: 'Une erreur inattendue est survenue. Réessaie dans un instant.' }
  };
  A.messageFor = function (code) { return MESSAGES[code] || MESSAGES.UNEXPECTED; };

  /* ---------------------------- classification des erreurs ---------------------------- */
  function isNetwork(err) {
    return !!err && (err.name === 'AuthRetryableFetchError' || err.status === 0 ||
      /failed to fetch|networkerror|network request failed|load failed|fetch failed|timed? ?out/i.test(String(err.message || '')));
  }
  /* Seuls 401 et les codes « jeton invalide / session absente » signifient « reconnecte-toi ».
     Un 403 de la base (droit refusé) n'est PAS une session expirée : il reste une erreur de requête. */
  var NO_AUTH_CODES = ['PGRST301', 'PGRST303', 'session_not_found', 'refresh_token_not_found', 'refresh_token_already_used',
                       'bad_jwt', 'invalid_jwt', 'user_not_found', 'no_authorization', 'not_authenticated'];
  A.classify = function (err) {
    if (!err) return 'UNEXPECTED';
    if (err.coded && MESSAGES[err.code]) return err.code;
    if (isNetwork(err)) return 'NETWORK';
    if (err.status === 429 || err.code === 'over_request_rate_limit' || err.code === 'over_email_send_rate_limit') return 'RATE_LIMIT';
    if (err.status === 401 || NO_AUTH_CODES.indexOf(err.code) > -1 || /jwt/i.test(String(err.message || ''))) return 'NO_SESSION';
    return 'UNEXPECTED';
  };

  /* Erreur codée : son `message` est déjà le texte français destiné à l'utilisateur. */
  A.coded = function (code, cause) {
    var known = !!MESSAGES[code], e = new Error(A.messageFor(code).text);
    e.code = known ? code : 'UNEXPECTED'; e.coded = true; e.cause = cause;
    if (cause && window.console && console.debug) console.debug('[ICRM] ' + e.code, cause.code || cause.status || cause.message || cause);
    return e;
  };
  /* Convertit n'importe quelle erreur en erreur codée ; `fallback` remplace « UNEXPECTED ». */
  A.toError = function (err, fallback) {
    if (err && err.coded) return err;
    var c = A.classify(err); if (c === 'UNEXPECTED' && fallback) c = fallback;
    return A.coded(c, err);
  };
  A.friendly = function (err) { return A.messageFor(A.classify(err)).text; };

  /* Connexion : réponse volontairement identique que le compte existe ou non. */
  A.loginMessage = function (err) {
    var k = A.classify(err);
    if (k === 'NETWORK' || k === 'RATE_LIMIT') return A.messageFor(k).text;
    var c = err && err.code, s = err && err.status;
    if (c === 'invalid_credentials' || c === 'email_not_confirmed' || c === 'user_banned' || c === 'user_not_found' || s === 400 || s === 401 || s === 422) return 'Adresse e-mail ou mot de passe incorrect.';
    return 'Une erreur est survenue. Réessaie dans un instant.';
  };

  /* ---------------------------- rôles et statuts ---------------------------- */
  var ROLES = ['member', 'commission_head', 'bureau', 'super_admin'];
  /* La valeur vient de profiles.role (base). Valeur inconnue → « member » (affichage le plus restreint). */
  A.normalizeRole = function (raw) {
    var r = String(raw || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
    if (ROLES.indexOf(r) > -1) return r;
    if (window.console) console.warn('[ICRM] rôle inconnu dans le profil : affichage « membre » par défaut.');
    return 'member';
  };
  /* Statuts bloquants : config.js › BLOCKED_STATUSES. Un statut vide est refusé (fail-closed côté interface). */
  A.isUsableStatus = function (raw) {
    var s = String(raw == null ? '' : raw).toLowerCase().trim();
    return !!s && ((P.config && P.config.BLOCKED_STATUSES) || []).indexOf(s) < 0;
  };
  A.normalizeStatus = function (raw) {
    var s = String(raw || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
    if (['watch', 'follow', 'to_follow', 'a_suivre'].indexOf(s) > -1) return 'watch';
    return A.isUsableStatus(s) ? 'active' : 'inactive';
  };

  /* ---------------------------- profil de l'utilisateur connecté ---------------------------- */
  A.PROFILE_COLUMNS = 'id, full_name, avatar_url, phone, role, status, joined_at, mandate';

  /* Ligne profiles → objet « user » attendu par les vues. */
  function toSessionUser(profile, authUser) {
    var full = String(profile.full_name || '').trim(), parts = full.split(/\s+/).filter(Boolean);
    var role = A.normalizeRole(profile.role), emailName = String((authUser && authUser.email) || '').split('@')[0];
    return {
      id: profile.id, fullName: full || emailName, firstName: parts[0] || emailName || 'Membre', lastName: parts.slice(1).join(' '),
      role: role, position: P.config.ROLES[role].label, commissionId: null,
      email: (authUser && authUser.email) || '', phone: profile.phone || '—', avatarUrl: profile.avatar_url || null,
      joinedAt: profile.joined_at ? String(profile.joined_at).slice(0, 10) : null,
      mandate: profile.mandate ? String(profile.mandate) : null, status: A.normalizeStatus(profile.status)
    };
  }

  /* Lit public.profiles pour l'UUID authentifié (la RLS ne renvoie que ce que la base autorise),
     vérifie que le profil existe et que le compte est utilisable, puis renvoie l'objet « user ».
     Erreurs codées : PROFILE_MISSING, PROFILE_INACTIVE, NETWORK, NO_SESSION, QUERY. */
  A.fetchProfile = async function (client, authUser) {
    var r;
    try { r = await client.from('profiles').select(A.PROFILE_COLUMNS).eq('id', authUser.id).maybeSingle(); }
    catch (e) { throw A.toError(e, 'NETWORK'); }
    if (r.error) throw A.toError(r.error, 'QUERY');
    if (!r.data) throw A.coded('PROFILE_MISSING');
    if (!A.isUsableStatus(r.data.status)) throw A.coded('PROFILE_INACTIVE');
    return toSessionUser(r.data, authUser);
  };

  /* Termine la session via Supabase Auth (portée « local » : seul cet appareil est déconnecté).
     Ne lève jamais d'exception ; renvoie true si la session a bien pris fin. */
  A.signOutQuiet = async function (client) {
    try { var r = await client.auth.signOut({ scope: 'local' }); return !(r && r.error); }
    catch (e) { return false; }
  };
})();
