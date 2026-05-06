# Constitution — Personal Assistant PWA

**Version** : 1.0.0
**Date** : 2026-05-05

## Objet

Cette constitution gouverne le développement de l'application "Personal
Assistant PWA", une web app progressive permettant à un utilisateur unique
(propriétaire) de lire, éditer et organiser des fichiers Markdown stockés
dans un repo GitHub privé, depuis n'importe quel appareil (mobile et
desktop), de manière agentique et fluide.

Toute décision technique, architecturale ou de scope doit être confrontée à
ces principes. En cas de conflit, le principe le plus prioritaire prévaut.

## Principes (par ordre de priorité)

### P1 — Source de vérité unique : le repo GitHub

Les `.md` du repo GitHub `obsidian-vault` sont la source canonique. L'app ne
duplique pas, ne caches pas durablement, ne synchronise pas vers un système
tiers (Firestore, IndexedDB persistant, etc.). Toute écriture = un commit
GitHub. Toute lecture = un fetch GitHub (avec cache mémoire éphémère
acceptable pour la perf).

**Implication** : si l'app est perdue, le contenu n'est pas perdu — il est
toujours dans le repo, lisible par Obsidian, Termux, ou n'importe quel
client git.

### P2 — Mobile-first, offline-tolerant

L'app doit être utilisable principalement depuis un téléphone. PWA
installable, expérience native (plein écran, icône). Le mode hors-ligne est
toléré pour la lecture (cache du dernier état chargé), mais l'écriture
nécessite une connexion (commit GitHub).

### P3 — Test-Driven Development strict

Aucune fonctionnalité n'est codée avant d'avoir un test qui échoue. Cycle
red → green → refactor non négociable. Couverture cible : 80% sur la logique
métier (parsing markdown, gestion tâches, API GitHub), 60% sur l'UI
(composants critiques).

Frameworks : Vitest pour les tests unitaires/intégration, React Testing
Library pour les composants, Playwright pour l'E2E sur les workflows
critiques (lire un fichier, l'éditer, le commit).

### P4 — Sécurité des secrets

Le Personal Access Token GitHub et la clé API LLM sont les secrets de l'app.
Stockage : chiffrés dans le navigateur (Web Crypto API + clé dérivée d'un
mot de passe utilisateur), **jamais** en clair dans localStorage. À
l'ouverture de l'app, l'utilisateur saisit son mot de passe pour déchiffrer
les secrets.

Aucun secret n'est embarqué dans le bundle JS. Aucun secret n'est commité
dans le repo de l'app. Si un secret manager GitHub Actions est nécessaire
(pour CI/CD ou tests E2E), il est utilisé via `secrets.*` et jamais exposé
côté client.

### P5 — Pas de backend serveur custom

L'app est 100% client-side, déployée sur GitHub Pages. Pas de Node.js,
Express, ou serveur custom. Toutes les opérations passent par :
- API GitHub (lecture/écriture du repo) via Octokit
- API Google Calendar (lecture agenda) via OAuth 2.0 PKCE flow direct depuis
  le navigateur
- API d'un LLM (optionnel, pour suggestions intelligentes) via fetch direct

**Justification** : zéro coût d'infra, zéro maintenance serveur, zéro vendor
lock-in au-delà de GitHub.

### P6 — Simplicité avant fonctionnalités

Chaque fonctionnalité ajoutée doit justifier son coût en complexité. La v1
fait peu de choses bien : lire, éditer, sauvegarder des `.md`, croiser avec
l'agenda. Les "nice to have" (dashboards, IA, multi-utilisateur, partage)
attendent.

**Règle** : avant d'ajouter une feature, l'auteur doit pouvoir l'expliquer
en une phrase et démontrer qu'elle est utilisée au moins 1×/semaine.

### P7 — Stack stable et connue

On privilégie les outils déjà maîtrisés par le mainteneur (cohérence avec
zoo-flashcards : Vite + React + Tailwind). Pas de nouveauté gratuite. Toute
nouvelle dépendance doit avoir > 10k stars, maintenance active < 3 mois,
licence MIT/Apache/BSD.

### P8 — Versioning et observabilité

Chaque modification de fichier passe par un commit GitHub avec un message
clair (`feat`, `fix`, `chore`, ou pour les écritures user : `update: <file>
- <résumé>`). L'historique git devient le journal d'activité de
l'utilisateur. Pas de système de log centralisé pour la v1.

## Décisions architecturales (ADR-style, courtes)

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
**Décision** : Web Crypto API + PBKDF2 sur un mot de passe utilisateur, clé
AES-GCM pour chiffrer le token. Stockage du blob chiffré en IndexedDB.

### ADR-003 : Pas de framework UI lourd

**Status** : accepté.
**Décision** : React + Tailwind CSS, pas de Material UI / Mantine /
shadcn-ui complet. Quelques composants Headless UI si besoin
d'accessibilité sur les modals/dropdowns.
**Justification** : bundle léger, contrôle total du look, cohérent avec
zoo-flashcards.

## Engagements

- **Tests avant code** : aucune PR fusionnée sans tests verts.
- **Pas de breaking change** sans bump majeur de version.
- **Revue par soi-même** : checklist en fin de spec avant merge.
- **Constitution vivante** : amendement possible, traçé dans CHANGELOG.md.

## Non-objectifs explicites

Ce que l'app ne fait **pas**, et ne fera pas en v1 :

- Multi-utilisateur, collaboration temps réel
- Édition WYSIWYG (l'éditeur est en plain markdown, simple textarea ou
  CodeMirror)
- Synchronisation avec Notion, Trello, etc.
- Chat IA intégré (l'IA reste accessible via claude.ai mobile à part)
- Application native iOS/Android (PWA seulement)
- Stockage de fichiers binaires (images, PDF) au-delà des liens externes
