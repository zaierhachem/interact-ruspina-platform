/* =========================================================================
   ICRM — ESPACE MEMBRES · DONNÉES FICTIVES (MAQUETTE)
   ⚠ Toutes les données ci-dessous sont des PLACEHOLDERS pour le design.
   Aucun nom, chiffre ou document n'est réel (sauf le prénom/nom de démonstration).
   Ce fichier sera supprimé quand ICRMPortal.api lira Supabase.
   Les noms de champs reflètent déjà le futur schéma (profiles, commissions,
   meetings, tasks, documents, announcements, events).
   ========================================================================= */
(function () {
  'use strict';
  var P = window.ICRMPortal = window.ICRMPortal || { views: {} };

  P.mock = {
    /* Date « du jour » figée pour que la maquette reste cohérente. Remplacée par new Date() plus tard. */
    today: '2026-10-06',

    user: {
      id: 'mock-user-01', firstName: 'Hachem', lastName: 'Zaier',
      role: 'member', position: 'Membre', commissionId: 'communication',
      email: 'prenom.nom@exemple.tn',          // placeholder
      phone: '+216 •• ••• •••',                // placeholder
      joinedAt: '2025-09-15', mandate: '2026–2027', status: 'active'
    },

    stats: { activity: 87, attendance: { present: 8, total: 10 }, tasks: { done: 4, total: 5 } },

    commission: {
      id: 'communication', name: 'Communication', headName: 'Ahmed Ben X', status: 'active',
      memberCount: 8, upcomingProjects: 3, openTasks: 7, meetings: 5
    },

    commissionMembers: [
      { name: 'Hachem Zaier', status: 'active',   attendance: 90,  tasks: [4, 4] },
      { name: 'Sarra M.',     status: 'active',   attendance: 95,  tasks: [3, 3] },
      { name: 'Yassine B.',   status: 'active',   attendance: 80,  tasks: [2, 3] },
      { name: 'Ines T.',      status: 'watch',    attendance: 55,  tasks: [1, 3] },
      { name: 'Omar K.',      status: 'active',   attendance: 85,  tasks: [3, 4] },
      { name: 'Nour H.',      status: 'active',   attendance: 100, tasks: [2, 2] },
      { name: 'Amine R.',     status: 'inactive', attendance: 30,  tasks: [0, 2] },
      { name: 'Rim S.',       status: 'active',   attendance: 70,  tasks: [1, 2] }
    ],

    meetings: [
      { id: 'm1', title: 'Réunion Communication', date: '2026-10-08', start: '18:30', end: '20:00', location: 'Local du club', commission: 'Communication', status: 'upcoming',
        participants: [['Hachem Zaier', 'expected'], ['Sarra M.', 'expected'], ['Yassine B.', 'expected'], ['Ines T.', 'expected'], ['Omar K.', 'expected'], ['Nour H.', 'expected'], ['Rim S.', 'expected']],
        agenda: ['Bilan de la semaine', 'Plan de communication — Novembre Bleu', 'Répartition des publications Instagram', 'Divers'],
        notes: '', decisions: [], tasks: [] },
      { id: 'm2', title: 'Réunion générale du club', date: '2026-10-15', start: '17:00', end: '18:30', location: 'Local du club', commission: 'Toutes les commissions', status: 'upcoming',
        participants: [], agenda: ['Point du bureau', 'Retour des commissions', 'Calendrier du mois'], notes: '', decisions: [], tasks: [] },
      { id: 'm3', title: 'Réunion Communication', date: '2026-10-01', start: '18:30', end: '19:45', location: 'Local du club', commission: 'Communication', status: 'past',
        participants: [['Hachem Zaier', 'present'], ['Sarra M.', 'present'], ['Yassine B.', 'present'], ['Ines T.', 'absent'], ['Omar K.', 'present'], ['Nour H.', 'present'], ['Amine R.', 'absent'], ['Rim S.', 'present']],
        agenda: ['Retour sur la dernière publication', 'Charte éditoriale', 'Organisation des tournages'],
        notes: 'Les membres ont validé le principe d’une charte éditoriale commune. Les tournages seront regroupés en une seule session mensuelle.',
        decisions: ['Adopter une charte éditoriale commune', 'Une session de tournage mensuelle', 'Validation des visuels 48 h avant publication'],
        tasks: ['Affiche événement', 'Préparer présentation'] },
      { id: 'm4', title: 'Réunion Bureau × Commissions', date: '2026-09-24', start: '17:30', end: '19:00', location: 'Local du club', commission: 'Toutes les commissions', status: 'past',
        participants: [['Hachem Zaier', 'present']], agenda: ['Objectifs du mandat', 'Calendrier des actions'],
        notes: 'Présentation du calendrier du mandat et des attentes de chaque commission.', decisions: ['Calendrier du mandat validé'], tasks: [] },
      { id: 'm5', title: 'Préparation Leaders’ Act', date: '2026-09-17', start: '18:00', end: '19:30', location: 'En ligne', commission: 'Événements', status: 'past',
        participants: [['Hachem Zaier', 'absent']], agenda: ['Programme', 'Intervenants', 'Logistique'],
        notes: '', decisions: [], tasks: [] }
    ],

    events: [
      { id: 'e1',  date: '2026-10-01', title: 'Réunion Communication',               type: 'commission-meeting', time: '18:30', location: 'Local du club' },
      { id: 'e2',  date: '2026-10-08', title: 'Réunion Communication',               type: 'commission-meeting', time: '18:30', location: 'Local du club' },
      { id: 'e3',  date: '2026-10-10', title: 'Échéance — visuels Novembre Bleu',    type: 'deadline',           time: '23:59', location: '' },
      { id: 'e4',  date: '2026-10-12', title: 'Formation — prise de parole',         type: 'training',           time: '17:30', location: 'Local du club' },
      { id: 'e5',  date: '2026-10-15', title: 'Réunion générale du club',            type: 'club-meeting',       time: '17:00', location: 'Local du club' },
      { id: 'e6',  date: '2026-10-17', title: 'Atelier de préparation Novembre Bleu', type: 'event',             time: '15:00', location: 'Local du club' },
      { id: 'e7',  date: '2026-10-24', title: 'Sortie du club',                      type: 'other',              time: '10:00', location: 'À confirmer' },
      { id: 'e8',  date: '2026-10-28', title: 'Échéance — rapport mensuel',          type: 'deadline',           time: '23:59', location: '' },
      { id: 'e9',  date: '2026-10-28', title: 'Réunion Communication',               type: 'commission-meeting', time: '18:30', location: 'Local du club' },
      { id: 'e10', date: '2026-11-02', title: 'Lancement Novembre Bleu',             type: 'event',              time: '09:00', location: 'À confirmer' },
      { id: 'e11', date: '2026-11-05', title: 'Réunion Communication',               type: 'commission-meeting', time: '18:30', location: 'Local du club' }
    ],

    tasks: [
      { id: 't1', title: 'Affiche événement',        description: 'Finaliser l’affiche et l’exporter pour les réseaux et l’impression.', assignee: 'Hachem Zaier', commission: 'Communication', priority: 'high',   deadline: '2026-10-05', status: 'completed' },
      { id: 't2', title: 'Préparer présentation',    description: 'Slides de présentation du plan de communication pour la réunion générale.', assignee: 'Hachem Zaier', commission: 'Communication', priority: 'medium', deadline: '2026-10-14', status: 'in_progress' },
      { id: 't3', title: 'Publication Instagram',    description: 'Rédiger la légende et programmer la publication de la semaine.', assignee: 'Hachem Zaier', commission: 'Communication', priority: 'medium', deadline: '2026-10-09', status: 'pending' },
      { id: 't4', title: 'Visuels Novembre Bleu',    description: 'Trois visuels pour la campagne : feed, story et bannière.', assignee: 'Sarra M.',   commission: 'Communication', priority: 'high',   deadline: '2026-10-10', status: 'in_progress' },
      { id: 't5', title: 'Montage vidéo — rétrospective', description: 'Montage de 60 secondes à partir des rushes de la dernière action.', assignee: 'Yassine B.', commission: 'Communication', priority: 'medium', deadline: '2026-10-20', status: 'in_progress' },
      { id: 't6', title: 'Calendrier éditorial',     description: 'Planning des publications d’octobre et novembre.', assignee: 'Omar K.',    commission: 'Communication', priority: 'high',   deadline: '2026-10-07', status: 'pending' },
      { id: 't7', title: 'Mise à jour de la bio',    description: 'Mettre à jour les informations de contact sur les réseaux.', assignee: 'Rim S.',     commission: 'Communication', priority: 'low',    deadline: '2026-10-25', status: 'pending' },
      { id: 't8', title: 'Photos de la réunion',     description: 'Sélectionner et classer les photos de la dernière réunion.', assignee: 'Nour H.',    commission: 'Communication', priority: 'low',    deadline: '2026-10-30', status: 'pending' },
      { id: 't9', title: 'Rapport mensuel',          description: 'Rapport d’activité de la commission pour le bureau.', assignee: 'Ines T.',    commission: 'Communication', priority: 'medium', deadline: '2026-10-28', status: 'completed' }
    ],

    documents: [
      { id: 'd1',  name: 'Charte graphique ICRM',            type: 'pdf',  folder: 'communication', date: '2026-09-20', uploadedBy: 'Bureau',          access: 'all' },
      { id: 'd2',  name: 'Planning publications — Octobre',  type: 'xlsx', folder: 'communication', date: '2026-10-02', uploadedBy: 'Ahmed Ben X',     access: 'commission' },
      { id: 'd3',  name: 'Calendrier du mandat 2026–2027',   type: 'pdf',  folder: 'bureau',        date: '2026-09-24', uploadedBy: 'Bureau',          access: 'all' },
      { id: 'd4',  name: 'Règlement intérieur',              type: 'pdf',  folder: 'bureau',        date: '2026-09-10', uploadedBy: 'Bureau',          access: 'all' },
      { id: 'd5',  name: 'Dossier Leaders’ Act',             type: 'pptx', folder: 'events',        date: '2026-09-18', uploadedBy: 'Commission Événements', access: 'all' },
      { id: 'd6',  name: 'Budget prévisionnel',              type: 'xlsx', folder: 'finance',       date: '2026-09-28', uploadedBy: 'Bureau',          access: 'bureau' },
      { id: 'd7',  name: 'Modèle de compte rendu',           type: 'docx', folder: 'forms',         date: '2026-09-12', uploadedBy: 'Bureau',          access: 'all' },
      { id: 'd8',  name: 'Fiche d’inscription membre',       type: 'pdf',  folder: 'forms',         date: '2026-09-12', uploadedBy: 'Bureau',          access: 'all' },
      { id: 'd9',  name: 'Bilan Hadra — édition précédente', type: 'pdf',  folder: 'archives',      date: '2026-06-30', uploadedBy: 'Bureau',          access: 'all' },
      { id: 'd10', name: 'Photos — Festival Jazz',           type: 'img',  folder: 'archives',      date: '2026-05-04', uploadedBy: 'Ahmed Ben X',     access: 'commission' },
      { id: 'd11', name: 'Procès-verbal — assemblée',        type: 'pdf',  folder: 'archives',      date: '2026-07-02', uploadedBy: 'Bureau',          access: 'admin' }
    ],

    announcements: [
      { id: 'a1', title: 'Reprise des réunions de commission', priority: 'important', date: '2026-10-05', author: 'Bureau exécutif', audience: 'Tous les membres',
        body: ['Les réunions de commission reprennent cette semaine. Chaque commission se réunit une fois par semaine, au local du club, selon le calendrier partagé.',
               'Merci de confirmer ta présence à l’avance et de préparer les points à aborder avec ta commission. Une réunion bien préparée est une réunion plus courte.'],
        attachments: ['Calendrier du mandat 2026–2027.pdf'] },
      { id: 'a2', title: 'Préparation de Novembre Bleu', priority: 'normal', date: '2026-10-03', author: 'Commission Communication', audience: 'Commission Communication',
        body: ['La préparation de la campagne Novembre Bleu démarre. La commission Communication coordonne les visuels, le calendrier de publication et la mobilisation des membres.',
               'Les échéances intermédiaires sont indiquées dans le calendrier et dans la liste des tâches.'],
        attachments: [] },
      { id: 'a3', title: 'Mise à jour des fiches membres', priority: 'info', date: '2026-09-29', author: 'Bureau exécutif', audience: 'Tous les membres',
        body: ['Merci de vérifier que les informations de ta fiche sont à jour (coordonnées, commission, disponibilités). Ces informations facilitent l’organisation des actions du club.'],
        attachments: ['Fiche d’inscription membre.pdf'] },
      { id: 'a4', title: 'Nouveau dossier partagé : charte graphique', priority: 'normal', date: '2026-09-20', author: 'Commission Communication', audience: 'Tous les membres',
        body: ['La charte graphique du club est désormais disponible dans l’espace Documents. Elle rassemble les logos, les couleurs et les règles d’usage à respecter pour toute communication officielle.'],
        attachments: ['Charte graphique ICRM.pdf'] }
    ],

    /* Préférences de l'utilisateur (page Paramètres). */
    settings: {
      language: 'fr', languages: [['fr', 'Français']],
      notifications: [
        { id: 'n-ann',  label: 'Annonces du club',     hint: 'Être prévenu des nouvelles annonces.',               enabled: true },
        { id: 'n-meet', label: 'Rappels de réunion',   hint: 'Un rappel avant chaque réunion de ta commission.',   enabled: true },
        { id: 'n-task', label: 'Échéances de tâches',  hint: 'Un rappel avant la date limite de tes tâches.',      enabled: false }
      ]
    },

    activity: [
      { id: 'x1', kind: 'meeting',      text: 'Réunion ajoutée',  detail: 'Réunion Communication — jeudi 8 octobre', when: 'Il y a 2 h' },
      { id: 'x2', kind: 'task',         text: 'Tâche terminée',   detail: 'Affiche événement',                       when: 'Hier' },
      { id: 'x3', kind: 'document',     text: 'Document ajouté',  detail: 'Planning publications — Octobre',         when: 'Il y a 4 jours' },
      { id: 'x4', kind: 'announcement', text: 'Annonce publiée',  detail: 'Reprise des réunions de commission',      when: 'Il y a 1 jour' }
    ]
  };
})();
