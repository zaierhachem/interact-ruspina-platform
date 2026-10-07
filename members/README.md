# Espace Membres — ICRM (frontend, phase maquette)

Aucun backend : toutes les données sont fictives. Ouvrir `members/index.html` (ou servir le dépôt avec n'importe quel serveur statique).

```
members/
├─ index.html            coque HTML (landmarks, zones aria-live)
├─ members.css           styles du portail (classes préfixées pt-)
├─ members.js            routeur par hash + navigation + tiroir mobile
└─ js/
   ├─ config.js          rôles, permissions, navigation, point d'intégration BACKEND (vide)
   ├─ mock-data.js       DONNÉES FICTIVES (seule source de données de la maquette)
   ├─ providers/
   │  └─ mock.js         fournisseur « mock » du contrat de données
   ├─ api.js             façade ICRMPortal.api utilisée par toutes les vues
   ├─ ui.js              échappement, icônes, dates FR, puces, toasts
   └─ views/
      ├─ home.js         dashboard, profil, paramètres
      ├─ planning.js     calendrier, réunions, tâches
      └─ club.js         commission, documents, annonces
```

Flux : `Vues → ICRMPortal.api → providers/<BACKEND.provider> → données`.

## Brancher Supabase plus tard (sans réécrire les vues)
1. Créer `js/providers/supabase.js` qui enregistre `ICRMPortal.providers.supabase` avec les mêmes méthodes que `providers/mock.js` (`ICRMPortal.api.contract` les liste).
2. Renseigner `BACKEND.supabase.url` et `anonKey` dans `config.js`, puis `provider: 'supabase'`.
3. Supprimer `mock-data.js` et `providers/mock.js`.

## Sécurité
- Seule la clé **anon** (publique) peut figurer dans le navigateur. Jamais de clé `service_role`, jamais de mot de passe, aucun `.env`.
- `ICRMPortal.can()` et les rôles côté navigateur servent uniquement à l'**affichage**. L'autorisation réelle sera imposée par Row Level Security côté base.
- Aucune authentification, aucune session factice dans cette phase.
