<!--
## Sync Impact Report
- Version change: (new) → 1.0.0
- Initial constitution creation from existing project governance document
- Principles: 8 principles defined (P1–P8)
- Added sections: Core Principles, Décisions architecturales, Engagements & Non-objectifs
- Templates requiring updates: ✅ plan-template.md (no changes needed — generic gates)
  ✅ spec-template.md (no changes needed — generic structure)
  ✅ tasks-template.md (no changes needed — generic phases)
- No command files found to check
- Follow-up TODOs: none
-->

# Personal Assistant PWA Constitution

## Objet

Cette constitution gouverne le développement de l'application "Personal
Assistant PWA", une web app progressive permettant à un utilisateur unique
(propriétaire) de lire, éditer et organiser des fichiers Markdown stockés
dans un repo GitHub privé, depuis n'importe quel appareil (mobile et
desktop), de manière agentique et fluide.

Toute décision technique, architecturale ou de scope DOIT être confrontée
à ces principes. En cas de conflit, le principe le plus prioritaire prévaut.

## Core Principles

### P1 — Source de vérité unique : le repo GitHub

Les `.md` du repo GitHub `obsidian-vault` sont la source canonique. L'app
NE DOIT PAS dupliquer, NE DOIT PAS cacher durablement, NE DOIT PAS
synchroniser vers un système tiers (Firestore, IndexedDB persistant, etc.).
Toute écriture = un commit GitHub. Toute lecture = un fetch GitHub (avec
cache mémoire éphémère acceptable pour la performance).

**Implication** : si l'app est perdue, le contenu n'est pas perdu — il est
toujours dans le repo, lisible par Obsidian, Termux, ou n'importe quel
client git.

### P2 — Mobile-first, offline-tolerant

L'app DOIT être utilisable principalement depuis un téléphone. PWA
installable, expérience native (plein écran, icône). Le mode hors-ligne est
toléré pour la lecture (cache du dernier état chargé), mais l'écriture
nécessite une connexion (commit GitHub).

### P3 — Test-Driven Development strict (NON-NÉGOCIABLE)

Aucune fonctionnalité n'est codée avant d'avoir un test qui échoue. Cycle
red → green → refactor non négociable. Couverture cible : 80% sur la logique
métier (parsing markdown, gestion tâches, API GitHub), 60% sur l'UI
(composants critiques).

- **Vitest** : tests unitaires et intégration
- **React Testing Library** : composants
- **Playwright** : E2E sur les workflows critiques (lire, éditer, commit)

### P4 — Sécurité des secrets

Le Personal Access Token GitHub est le seul secret. Stockage : chiffré dans
le navigateur (Web Crypto API + clé dérivée d'un mot de passe utilisateur),
**jamais** en clair dans localStorage. À l'ouverture de l'app, l'utilisateur
saisit son mot de passe pour déchiffrer le token.

- Aucun secret NE DOIT être embarqué dans le bundle JS
- Aucun secret NE DOIT être commité dans le repo de l'app
- Les secrets CI/CD utilisent `secrets.*` et ne sont jamais exposés côté
  client

### P5 — Pas de backend serveur custom

L'app est 100% client-side, déployée sur GitHub Pages. Pas de Node.js,
Express, ou serveur custom. Toutes les opérations passent par :

- API GitHub (lecture/écriture du repo) via Octokit
- API Google Calendar (lecture agenda) via OAuth 2.0 PKCE flow direct
  depuis le navigateur
- API d'un LLM (optionnel, pour suggestions intelligentes) via fetch direct

**Justification** : zéro coût d'infra, zéro maintenance serveur, zéro
vendor lock-in au-delà de GitHub.

### P6 — Simplicité avant fonctionnalités

Chaque fonctionnalité ajoutée DOIT justifier son coût en complexité. La v1
fait peu de choses bien : lire, éditer, sauvegarder des `.md`, croiser avec
l'agenda. Les "nice to have" attendent.

**Règle** : avant d'ajouter une feature, l'auteur DOIT pouvoir l'expliquer
en une phrase et démontrer qu'elle est utilisée au moins 1×/semaine.

### P7 — Stack stable et connue

On privilégie les outils déjà maîtrisés par le mainteneur (cohérence avec
zoo-flashcards : Vite + React + Tailwind). Pas de nouveauté gratuite. Toute
nouvelle dépendance DOIT avoir > 10k stars, maintenance active < 3 mois,
licence MIT/Apache/BSD.

### P8 — Versioning et observabilité

Chaque modification de fichier passe par un commit GitHub avec un message
clair (`feat`, `fix`, `chore`, ou pour les écritures user :
`update: <file> - <résumé>`). L'historique git devient le journal d'activité
de l'utilisateur. Pas de système de log centralisé pour la v1.

## Décisions architecturales

### ADR-001 : Pas de Firebase pour la v1

**Status** : accepté.
**Contexte** : Tentation d'utiliser Firestore pour les tâches structurées,
FCM pour les notifications.
**Décision** : refusé en v1. Tout passe par les `.md` GitHub.
**Conséquence** : pas de notifications push natives. Acceptable car l'usage
quotidien est de consulter l'app, pas de la recevoir.
**Réévaluation** : si après 1 mois d'usage, le besoin de notifications push
devient critique, on ajoute Firebase Cloud Messaging dans une v1.5
strictement scoped à FCM, sans toucher au stockage.

### ADR-002 : Token GitHub chiffré localement

**Status** : accepté.
**Alternative considérée** : stocker le token en clair en localStorage.
**Rejetée parce que** : risque trop élevé en cas de partage de l'appareil
ou de XSS.
**Décision** : Web Crypto API + PBKDF2 sur un mot de passe utilisateur,
clé AES-GCM pour chiffrer le token. Stockage du blob chiffré en IndexedDB.

### ADR-003 : Pas de framework UI lourd

**Status** : accepté.
**Décision** : React + Tailwind CSS, pas de Material UI / Mantine /
shadcn-ui complet. Quelques composants Headless UI si besoin
d'accessibilité sur les modals/dropdowns.
**Justification** : bundle léger, contrôle total du look, cohérent avec
zoo-flashcards.

## Engagements & Non-objectifs

### Engagements

- **Tests avant code** : aucune PR fusionnée sans tests verts
- **Pas de breaking change** sans bump majeur de version
- **Revue par soi-même** : checklist en fin de spec avant merge
- **Constitution vivante** : amendement possible, tracé dans CHANGELOG.md

### Non-objectifs explicites (v1)

Ce que l'app ne fait **pas**, et ne fera pas en v1 :

- Multi-utilisateur, collaboration temps réel
- Édition WYSIWYG (l'éditeur est en plain markdown, simple textarea ou
  CodeMirror)
- Synchronisation avec Notion, Trello, etc.
- Chat IA intégré (l'IA reste accessible via claude.ai mobile à part)
- Application native iOS/Android (PWA seulement)
- Stockage de fichiers binaires (images, PDF) au-delà des liens externes

## Governance

Cette constitution est la référence suprême pour toute décision technique
ou de scope. En cas de doute, les principes P1–P8 tranchent.

- **Amendement** : toute modification de cette constitution DOIT être
  documentée dans CHANGELOG.md avec justification
- **Versioning** : MAJOR (principe supprimé/redéfini), MINOR (principe
  ajouté/étendu), PATCH (clarification, typo)
- **Revue de conformité** : chaque spec et plan DOIT inclure un
  "Constitution Check" vérifiant l'alignement avec les principes
- **Complexité justifiée** : toute déviation d'un principe DOIT être
  explicitement justifiée dans la spec concernée

**Version**: 1.0.0 | **Ratified**: 2026-05-05 | **Last Amended**: 2026-05-06
