# Espace Membres — ICRM

Portail privé de l'Interact Club Ruspina Monastir : HTML / CSS / JavaScript sans framework ni build, compatible avec un hébergement statique. L'authentification et les données passent par **Supabase** (Auth + PostgREST), le client officiel `@supabase/supabase-js@2` étant chargé par CDN.

> Servir le dépôt en **http(s)** (n'importe quel hébergement statique). Les liens de réinitialisation de mot de passe ne fonctionnent pas depuis `file://`.

## Arborescence

```
members/
├─ index.html            portail (coque, landmarks, écran de chargement)
├─ login.html            connexion (e-mail + mot de passe, sans inscription)
├─ reset-password.html   choix d'un nouveau mot de passe (lien reçu par e-mail)
├─ members.css           styles du portail (classes pt-)
├─ auth.css              styles des pages de connexion / réinitialisation (classes pta-)
├─ members.js            garde d'authentification, routeur par hash, navigation, tiroir mobile
├─ README.md
└─ js/
   ├─ config.js              backend (URL + clé publishable), rôles, permissions, navigation, statuts bloquants
   ├─ supabase-client.js     création unique du client + refus de toute clé privée
   ├─ auth.js                erreurs → codes → messages français ; lecture/validation du profil ; déconnexion
   ├─ login.js               logique de connexion et de « mot de passe oublié »
   ├─ reset-password.js      logique du nouveau mot de passe
   ├─ api.js                 façade ICRMPortal.api (le seul point d'entrée des vues)
   ├─ providers/
   │  ├─ supabase.js         fournisseur de production
   │  └─ mock.js             fournisseur de développement (données fictives, sans authentification)
   ├─ mock-data.js           données fictives du fournisseur mock
   ├─ ui.js                  échappement, icônes, dates FR, puces, toasts
   └─ views/                 home.js · planning.js · club.js
```

## Architecture

```
Vues → ICRMPortal.api → providers/<config.BACKEND.provider> → Supabase  (ou données fictives)
```

Les vues ne parlent jamais à Supabase. Changer de fournisseur = changer `BACKEND.provider` dans `config.js` (`'supabase'` | `'mock'`). Le fournisseur mock est conservé temporairement comme référence ; il n'affiche aucune donnée en mode `supabase`.

## Parcours d'authentification

```
/members/  →  écran de chargement (application masquée)
           →  supabase.auth.getSession()
                ├─ pas de session ─────────────────→ /members/login.html
                └─ session → supabase.auth.getUser() (validation serveur)
                     → public.profiles (id = auth.uid())
                          ├─ profil absent / compte non actif → écran d'erreur (jamais le dashboard)
                          └─ OK → ICRMPortal.session {user, rôle depuis profiles.role}
                                   → routeur (#/dashboard …) → vues
login.html →  signInWithPassword → profil + statut vérifiés → /members/
              (profil absent ou inactif : session fermée, message affiché)
Déconnexion → supabase.auth.signOut({ scope: 'local' }) → /members/login.html
```

- **Session** : entièrement gérée par supabase-js (persistance, rafraîchissement du jeton, synchronisation entre onglets). Aucun jeton, mot de passe ou rôle n'est stocké à la main.
- **Événements** (`onAuthStateChange`) : `SIGNED_OUT` → retour au login ; `SIGNED_IN` d'un autre compte → rechargement ; `PASSWORD_RECOVERY` → page de nouveau mot de passe ; `TOKEN_REFRESHED` → rien à faire. Le callback reste synchrone et léger (recommandation Supabase) : tout appel au client y est différé.
- **Erreurs** : chaque erreur (réseau, base, session, profil) est ramenée à un code et à un message français. Aucun message SQL / Postgres n'est affiché ; les détails ne vont qu'à la console (niveau debug).
- **Rôles** : `member`, `commission_head`, `bureau`, `super_admin`, lus dans `profiles.role`. Une valeur inconnue s'affiche comme `member`. Ils pilotent **uniquement l'affichage** (menus, boutons).

## Configuration publique requise

Dans `js/config.js` → `BACKEND.supabase` :

| Champ | Valeur |
|---|---|
| `url` | URL **de l'API** du projet : `https://<ref>.supabase.co` (pas l'URL du dashboard) |
| `publishableKey` | clé « Publishable » du projet (`sb_publishable_…`) |

### Pourquoi la clé Publishable peut être dans le navigateur
Elle est conçue pour être publique : seule, elle n'ouvre aucun droit. Ce que chaque utilisateur peut lire ou écrire est décidé par **Row Level Security** dans PostgreSQL, à partir de son identité authentifiée.

### Pourquoi une clé secrète / service_role ne doit JAMAIS y figurer
Elle contourne la RLS : quiconque ouvre le code source obtiendrait un accès total à la base. `supabase-client.js` refuse de démarrer si la clé configurée est de type `sb_secret_…` ou `service_role`. N'ajoutez jamais de clé privée, de mot de passe de base ni de fichier `.env` dans ce dépôt ; les opérations privilégiées (invitations, gestion des rôles) devront passer par un code serveur (Edge Function), jamais par le navigateur.

## Réglages à faire dans le dashboard Supabase

1. **Authentication → URL Configuration** : renseigner *Site URL* (domaine du site) et ajouter à *Redirect URLs* : `https://<domaine>/members/reset-password.html`.
2. **Authentication → Providers → Email** : activé. Pour un club **sur invitation**, désactiver l'inscription libre (« Allow new users to sign up »).
3. Vérifier que les valeurs de `profiles.status` correspondent à `config.js › BLOCKED_STATUSES` (statuts qui refusent l'accès à l'interface) et que `profiles.role` vaut l'un des quatre rôles.

## Tests manuels recommandés (projet réel)

1. Ouvrir `/members/` déconnecté → redirection vers `login.html`.
2. Mauvais mot de passe → message d'erreur, aucun accès.
3. Identifiants du Super Admin → dashboard, rôle « Super admin ».
4. Rafraîchir → la session persiste.
5. Se déconnecter → retour au login ; rouvrir `/members/` → login.
6. Ouvrir `login.html` connecté → redirection vers `/members/`.
7. « Mot de passe oublié ? » → e-mail reçu → nouveau mot de passe.

## Données

Hors authentification et profil (champs connus), les autres tables sont lues en **lecture seule** avec `select('*')` puis converties par les fonctions `map*` de `providers/supabase.js`, qui acceptent plusieurs noms de colonnes courants. Si un nom diffère du schéma réel, ajuster uniquement la section MAPPERS. Une table illisible ne casse jamais le dashboard (section vide) ; sur une page dédiée, un message français s'affiche.

## Différences mock / supabase

| | `mock` | `supabase` |
|---|---|---|
| Authentification | aucune | Supabase Auth (e-mail + mot de passe) |
| Données | `mock-data.js` (fictives) | tables PostgreSQL filtrées par la RLS |
| Garde d'accès | aucune | session obligatoire, profil et statut vérifiés |
| Badge « Maquette » | affiché | masqué |
| Déconnexion | message « non disponible » | `signOut()` |

## Invitations (phase suivante)

Il n'y a volontairement ni inscription ni gestion d'invitations dans cette phase. Le principe prévu : un administrateur invite un membre par e-mail depuis un code **serveur** (Edge Function utilisant l'API d'administration, la clé privée restant côté serveur) ; le membre reçoit un lien, choisit son mot de passe via `reset-password.html`, et son profil (`profiles`) est créé avec le rôle et le statut voulus.
