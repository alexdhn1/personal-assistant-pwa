# Plan technique — Personal Assistant PWA

**Spec** : 001-personal-assistant v1.0
**Constitution** : v1.0.0
**Date** : 2026-05-05

## Stack

### Cœur

| Brique | Choix | Justification |
|---|---|---|
| Build tool | Vite 5 | Cohérent zoo-flashcards, HMR rapide |
| Framework UI | React 18 | Stack maîtrisée |
| Langage | TypeScript 5 strict | Sûreté, complétion |
| Styling | Tailwind CSS 3 + Headless UI | Léger, cohérent zoo-flashcards |
| Routing | React Router 6 | Stable, SPA classique |
| State | Zustand | Plus simple que Redux, suffisant |
| Persistance locale | Dexie.js (IndexedDB) | Wrapper propre IndexedDB, types |
| API GitHub | @octokit/rest | SDK officiel, batteries included |
| Markdown rendu | react-markdown + remark-gfm | Standard, supporte tasks/tables |
| Markdown édition (v1) | Textarea natif | Simplicité, refacto vers Monaco/CodeMirror plus tard |
| PWA | vite-plugin-pwa | Standard de fait |
| Crypto | Web Crypto API native | Pas de lib tierce nécessaire |

### Tests

| Type | Outil |
|---|---|
| Unit / intégration | Vitest |
| Composants React | @testing-library/react |
| E2E | Playwright |
| Coverage | @vitest/coverage-v8 |

### CI/CD

- GitHub Actions :
  - `ci.yml` : lint + typecheck + tests sur chaque PR
  - `deploy.yml` : build + deploy sur GitHub Pages sur push main
- Secrets GitHub Actions : aucun nécessaire pour la v1 (pas d'API key
  embarquée).

### Hébergement

- GitHub Pages (`username.github.io/personal-assistant`).
- Branche `gh-pages` ou déploiement via Actions vers Pages.
- Custom domain (optionnel) pour plus tard.

## Architecture

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Layout + routes
├── pages/
│   ├── Auth.tsx                # US-1 : saisie token + password
│   ├── Todo.tsx                # US-2 : vue todo
│   ├── Inbox.tsx               # US-3 : capture rapide (modal global)
│   ├── Editor.tsx              # US-4 : édition .md
│   └── Calendar.tsx            # US-5 : agenda croisé (v1.2)
├── components/
│   ├── FileTree.tsx
│   ├── MarkdownPreview.tsx
│   ├── TodoItem.tsx
│   ├── TaskInput.tsx
│   └── ...
├── hooks/
│   ├── useGitHub.ts            # wrapper Octokit
│   ├── useAuth.ts              # gestion token + déchiffrement
│   ├── useFile.ts              # CRUD sur un .md
│   └── useTodos.ts             # parsing todo.md
├── lib/
│   ├── crypto.ts               # AES-GCM + PBKDF2
│   ├── markdown-parser.ts      # parser tâches/tags
│   ├── github-client.ts        # init Octokit
│   └── storage.ts              # Dexie schema + queries
├── stores/
│   ├── auth.ts                 # Zustand : état d'auth
│   ├── files.ts                # Zustand : cache fichiers ouverts
│   └── settings.ts             # Zustand : préférences user
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

## Stratégie TDD

### Ordre de développement (red → green → refactor)

**Phase 0 — Setup (pas de TDD pur, mais tests dès phase 1)**
1. Scaffold Vite + React + TS + Tailwind
2. Config Vitest + RTL + Playwright
3. Config vite-plugin-pwa + manifest + icônes
4. CI GitHub Actions (lint + test)

**Phase 1 — Auth + Storage (cœur sécurité)**
1. **Test** : `crypto.test.ts` — encrypt/decrypt round-trip avec password
2. **Code** : `lib/crypto.ts` (PBKDF2 + AES-GCM)
3. **Test** : `storage.test.ts` — write/read encrypted token via Dexie
4. **Code** : `lib/storage.ts`
5. **Test** : `useAuth.test.ts` — happy path + 5 tentatives ratées
6. **Code** : `hooks/useAuth.ts`
7. **Test** : `pages/Auth.test.tsx` — flow complet UI
8. **Code** : `pages/Auth.tsx`

**Phase 2 — GitHub client**
1. **Test** : `github-client.test.ts` (mock Octokit) — read file, list dir
2. **Code** : `lib/github-client.ts`
3. **Test** : write file (création + maj avec SHA correct)
4. **Code** : extension du client

**Phase 3 — Todo (US-2)**
1. **Test** : `markdown-parser.test.ts` — parser fixtures variées
2. **Code** : `lib/markdown-parser.ts`
3. **Test** : `useTodos.test.ts` — read/toggle/add via mock GitHub
4. **Code** : `hooks/useTodos.ts`
5. **Test** : `pages/Todo.test.tsx`
6. **Code** : `pages/Todo.tsx`

**Phase 4 — Inbox (US-3)**
1. **Test** : append-mode write to `inbox/YYYY-MM-DD.md`
2. **Code** : `pages/Inbox.tsx`

**Phase 5 — Editor (US-4)**
1. **Test** : useFile.test.ts (CRUD + dirty state)
2. **Code** : `hooks/useFile.ts`
3. **Test** : Editor.test.tsx
4. **Code** : `pages/Editor.tsx`

**Phase 6 — PWA hardening**
1. Tests Playwright : install prompt, offline read
2. Audit Lighthouse, viser ≥ 90 PWA
3. Icônes (Maskable + Apple)

**Phase 7 — Calendar (différé v1.2)**

## Modèle de chiffrement (détail)

```typescript
// Au premier setup
async function encryptToken(token: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password),
    "PBKDF2", false, ["deriveKey"]
  )
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false, ["encrypt"]
  )
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(token)
  )
  return { ciphertext, salt, iv }
}
```

Au déchiffrement, mêmes paramètres, on retente jusqu'à succès. Compteur
d'échecs incrémenté à chaque mauvais déchiffrement, reset à 0 sur succès.
À 5 échecs, on supprime `encryptedToken` et l'utilisateur doit re-saisir
son token GitHub.

## Décisions sur les "à clarifier"

Quelques zones où j'ai pris une décision par défaut, à valider par le
mainteneur :

1. **Mot de passe local séparé du token GitHub ?** — Oui, c'est l'utilité
   du chiffrement. Sinon autant stocker en clair.
2. **Possibilité d'utiliser le navigateur pour conserver le token déchiffré
   pendant la session ?** — Oui, en mémoire (Zustand store, pas
   localStorage). Effacé au refresh ou fermeture d'onglet. Re-saisie du
   password à chaque session.
3. **Authentification biométrique** (Face ID, empreinte) ? — Différé. Trop
   spécifique aux plateformes pour la v1. Possible v2 via Web Authentication
   API.
4. **Multiples repos** (ex: vault perso + autre projet) ? — Non, v1 = 1 repo
   configuré dans les préférences. Le mainteneur peut éditer manuellement
   les préférences en Dexie pour switcher.

## Tests E2E critiques (Playwright)

- E2E-1 : First-time setup (saisie token → password → home)
- E2E-2 : Re-ouverture (saisie password seule → home)
- E2E-3 : Lire et éditer un fichier, vérifier le commit GitHub via mock
- E2E-4 : Toggle d'une checkbox dans todo.md → commit
- E2E-5 : Capture inbox → fichier `inbox/YYYY-MM-DD.md` créé

## Métriques de succès

- Bundle size < 300 KB gzip
- Lighthouse PWA ≥ 90, Performance ≥ 80, A11y ≥ 90
- Tests : 80% coverage logique métier, 60% UI
- Time to interactive < 3s sur 4G simulée

## Échéancier réaliste

| Phase | Effort | Calendrier |
|---|---|---|
| Phase 0 (setup) | 2h | Soir 1 |
| Phase 1 (auth + crypto + storage) | 4h | Soirs 2-3 |
| Phase 2 (GitHub client) | 2h | Soir 4 |
| Phase 3 (Todo) | 3h | Soirs 5-6 |
| Phase 4 (Inbox) | 1h | Soir 7 |
| Phase 5 (Editor) | 3h | Soirs 8-9 |
| Phase 6 (PWA hardening) | 2h | Soir 10 |
| **v1 livrable** | **~17h** | **~2 semaines** |

Phase 7 (Calendar) : à part, +4h.

## Setup secret manager (anticipation v1.5)

Si Firebase ou un LLM API key sont ajoutés plus tard :
- Stockage des secrets : GitHub Secrets pour les Actions (CI/CD)
- Pour les API keys client (LLM par ex), même mécanisme que le token
  GitHub : chiffrement local par mot de passe.
- Aucun secret en variables d'environnement build-time (`VITE_*`) car
  exposé dans le bundle.

## Risques techniques majeurs

| Risque | Probabilité | Mitigation |
|---|---|---|
| API GitHub change comportement | Faible | Octokit géré par GitHub eux-mêmes |
| PWA installation Safari iOS limitée | Moyenne | Test précoce, fallback "ajouter à l'écran" |
| OAuth Google flow PKCE non standard | Faible | Lib éprouvée (oauth4webapi) |
| Conflit branche par éditions concurrentes | Moyenne | Vérif SHA, alerte utilisateur |
| Performance parsing gros fichiers | Faible | Limite affichée à 100 KB par fichier en v1 |

## Définition de "Done" par phase

Chaque phase est "done" quand :
1. Tous les tests verts (unit + integration concernés)
2. Lint + typecheck OK
3. PR mergée sur main
4. CHANGELOG.md mis à jour
5. Démonstration manuelle du critère d'acceptation correspondant
