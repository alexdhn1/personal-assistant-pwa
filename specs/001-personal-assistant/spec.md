# Spec — Personal Assistant PWA

**Feature** : 001-personal-assistant
**Author** : Alex
**Date** : 2026-05-05
**Constitution** : v1.0.0

## Résumé exécutif

Web app progressive (PWA) qui sert de client mobile/desktop pour un repo
GitHub `obsidian-vault` contenant un sous-dossier `assistant/` avec des
`.md` structurés (todo, idées cadeaux, anniversaires, suivi amis, tâches
récurrentes, idées libres). L'app permet de visualiser, éditer, et
sauvegarder ces fichiers, avec une intégration légère de l'agenda Google
pour le croisement avec les tâches.

## User stories

### US-1 : Authentification au démarrage

**En tant qu'** utilisateur,
**Je veux** entrer un mot de passe à l'ouverture de l'app,
**Afin de** déchiffrer mon token GitHub stocké localement et accéder à mon
repo.

**Critères d'acceptation** :
- À la première utilisation, l'app me demande mon Personal Access Token
  GitHub + un mot de passe local pour le chiffrer.
- Aux ouvertures suivantes, seule la saisie du mot de passe est demandée.
- Si je rentre 5 fois un mauvais mot de passe, le blob chiffré est effacé
  pour forcer une re-saisie du token (protection brute-force).
- Le mot de passe peut être réinitialisé en supprimant les données locales.

### US-2 : Vue Todo

**En tant qu'** utilisateur,
**Je veux** voir mon `assistant/todo.md` parsé sous forme de liste de
tâches groupées par section (Cette semaine / Ce mois-ci / En attente /
Someday),
**Afin de** voir d'un coup d'œil ce qui est urgent.

**Critères d'acceptation** :
- Parsing de la syntaxe Markdown : `- [ ]` (à faire) et `- [x]` (fait).
- Tags `#urgent`, `#admin`, `#jenna` extraits et affichés comme badges
  colorés.
- Possibilité de cocher/décocher une tâche → commit immédiat.
- Possibilité d'ajouter une tâche dans une section via un input rapide.
- Possibilité de déplacer une tâche entre sections (drag & drop ou menu).

### US-3 : Vue Inbox (capture rapide)

**En tant qu'** utilisateur en mobilité,
**Je veux** ouvrir un input rapide dès l'ouverture de l'app et taper une
note vrac,
**Afin de** capturer une idée sans réfléchir au rangement.

**Critères d'acceptation** :
- Bouton "+" flottant accessible depuis toutes les vues.
- Au clic : modal avec un textarea, et un dropdown "destination"
  (par défaut : `inbox/YYYY-MM-DD.md`, avec ajout en append).
- Save → commit immédiat.
- Fermeture rapide (touche Escape ou tap en dehors).

### US-4 : Édition d'un .md quelconque

**En tant qu'** utilisateur,
**Je veux** ouvrir n'importe quel `.md` du dossier `assistant/` et
l'éditer,
**Afin de** mettre à jour mes idées cadeaux, mes anniversaires, etc.

**Critères d'acceptation** :
- Liste des fichiers du dossier `assistant/` accessible via un menu latéral.
- Au clic sur un fichier : vue split (preview rendu / source markdown), ou
  toggle entre les deux sur mobile.
- Édition dans un textarea (v1) ou un éditeur Markdown léger (v2).
- Bouton Save → commit avec message auto-généré (`update: gifts.md - via
  PWA`). Possibilité de personnaliser le message en optionnel.
- Indicateur visuel de modifications non sauvegardées.

### US-5 : Vue agenda croisée

**En tant qu'** utilisateur en revue hebdo,
**Je veux** voir côte à côte mes tâches "Cette semaine" et mon agenda
Google des 7 prochains jours,
**Afin de** identifier les conflits et planifier.

**Critères d'acceptation** :
- Connexion Google OAuth 2.0 PKCE pour lire l'agenda (read-only).
- Vue calendrier 7 jours avec les events Google + les tâches sans date
  affichées dans une colonne "non planifiées".
- Possibilité de glisser une tâche sur un créneau → ajoute une mention
  `🗓️ YYYY-MM-DD HH:MM` dans la tâche `.md` (pas de création d'event Google
  en v1, juste annotation).

### US-6 : Notifications de revue hebdomadaire (différé v1.5)

**En tant qu'** utilisateur,
**Je veux** recevoir un rappel chaque lundi matin pour faire ma revue
hebdo,
**Afin de** ne pas oublier.

**Critères d'acceptation** : reportés à la v1.5 si Firebase est ajouté.
En v1, l'utilisateur configure manuellement un événement récurrent dans
Google Calendar.

## Modèle de données

### Stockage local (IndexedDB)

```typescript
interface LocalStore {
  // Token GitHub chiffré (AES-GCM)
  encryptedToken: ArrayBuffer
  // Sel pour PBKDF2
  passwordSalt: Uint8Array
  // IV pour AES-GCM
  encryptionIv: Uint8Array
  // Compteur d'échecs (reset à chaque succès)
  failedAttempts: number
  // Préférences utilisateur (thème, repo cible, dossier cible)
  preferences: {
    githubOwner: string
    githubRepo: string
    rootFolder: string  // ex: "assistant/"
    defaultBranch: string  // "main"
    theme: "light" | "dark" | "auto"
  }
  // Cache des fichiers (éphémère, peut être purgé)
  filesCache: Record<string, { sha: string, content: string, fetchedAt: number }>
}
```

### Modèle métier

```typescript
interface Todo {
  raw: string                  // ligne markdown originale
  done: boolean
  description: string
  tags: string[]               // ["urgent", "jenna"]
  section: "this-week" | "this-month" | "waiting" | "someday"
  filePath: "assistant/todo.md"
  lineNumber: number
}

interface MarkdownFile {
  path: string                 // ex: "assistant/areas/gifts.md"
  sha: string                  // version GitHub
  content: string              // contenu brut markdown
  lastModified: Date
  isDirty: boolean             // modif non sauvegardée
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  source: "google"
}
```

## API GitHub utilisée

- `GET /repos/{owner}/{repo}/contents/{path}` → lire un fichier
- `PUT /repos/{owner}/{repo}/contents/{path}` → créer ou MAJ un fichier
  (commit auto)
- `GET /repos/{owner}/{repo}/contents/{path}` (pour un dossier) → lister
  les `.md`
- Octokit gère ces appels avec retry et rate limit handling.

## API Google Calendar (différé v1.2)

- OAuth 2.0 PKCE flow (pas de client secret nécessaire)
- Scope : `https://www.googleapis.com/auth/calendar.readonly`
- Endpoint : `GET /calendar/v3/calendars/primary/events`

## Edge cases & erreurs

- **Conflit GitHub** (le SHA local ne match plus → quelqu'un a modifié
  depuis l'ordi) : alerte utilisateur, propose merge manuel ou
  rechargement du fichier.
- **Token expiré ou révoqué** : déconnexion forcée, redirection vers la
  saisie du token.
- **Rate limit GitHub atteint** (5000 req/h pour user-authenticated) :
  affichage du temps avant reset, blocage temporaire des écritures.
- **Hors-ligne** : lecture depuis cache IndexedDB possible, écriture en
  attente (queue), tentative de flush au retour réseau.
- **Fichier supprimé sur GitHub** mais encore en cache : invalidation au
  prochain refresh.

## Non-fonctionnel

- **Performance** : First Contentful Paint < 2s sur 4G.
- **Bundle** : < 300 KB gzip pour la v1.
- **Accessibilité** : WCAG 2.1 niveau A minimum (clavier, contrastes).
- **Compat** : Chrome/Edge/Safari/Firefox récents (2 dernières versions).
  Pas d'IE, pas de Safari < 14.
- **PWA** : score Lighthouse PWA ≥ 90.

## Risques identifiés

| Risque | Impact | Mitigation |
|---|---|---|
| Token GitHub leaké côté client | Élevé | Chiffrement local + scope restreint au repo |
| Conflit edit ordi/PWA | Moyen | Vérif SHA avant push, alerte |
| Rate limit GitHub | Faible | Cache local, debounce des saves |
| OAuth Google instable | Faible | Vue agenda dégradée gracefully |
| Adoption faible (l'utilisateur n'utilise pas l'app) | Élevé | v1 minimaliste, validation par usage réel |

## Out of scope (rappel)

Voir `memory/constitution.md` section "Non-objectifs explicites".

## Critères de "done" pour la v1

- [ ] US-1 à US-4 implémentés et testés (TDD).
- [ ] PWA installable sur Android (testé) et iOS (testé).
- [ ] Déployé sur GitHub Pages via Action.
- [ ] Lighthouse PWA ≥ 90.
- [ ] README clair pour ré-installation depuis zéro.
- [ ] CHANGELOG.md tenu à jour.
