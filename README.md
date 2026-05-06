# Personal Assistant PWA — Scaffolding

Pack spec-kit prêt à l'emploi pour démarrer le projet.

## Contenu

```
scaffold/
├── memory/
│   └── constitution.md          # Constitution du projet (P1-P8)
├── specs/
│   └── 001-personal-assistant/
│       ├── spec.md              # Spec fonctionnelle (US-1 à US-6)
│       └── plan.md              # Plan technique (stack, architecture, TDD)
└── README.md                    # Ce fichier
```

## Comment l'utiliser avec spec-kit

### Étape 1 — Créer le repo et initialiser spec-kit

```bash
mkdir personal-assistant-pwa && cd personal-assistant-pwa
git init
npx specify@latest init  # ou la commande spec-kit que tu utilises
```

### Étape 2 — Importer les fichiers du scaffold

Copie le contenu de ce dossier `scaffold/` dans le repo nouvellement créé.
Tu auras :

```
personal-assistant-pwa/
├── memory/constitution.md       ← copié depuis scaffold/
└── specs/001-personal-assistant/
    ├── spec.md                  ← copié depuis scaffold/
    └── plan.md                  ← copié depuis scaffold/
```

### Étape 3 — Lancer Claude Code et exécuter spec-kit

Dans le dossier du repo :

```bash
claude
```

Puis dans Claude Code, tu peux lancer les commandes spec-kit dans cet ordre :

#### `/speckit.constitution`
La constitution est déjà rédigée dans `memory/constitution.md`. Cette
commande la valide et la fige comme contrat du projet.

```
/speckit.constitution
```

Claude Code va lire `memory/constitution.md`, te demander confirmation,
et l'enregistrer comme référence active.

#### `/speckit.specify`
Pour créer ou raffiner la spec. La spec initiale est dans
`specs/001-personal-assistant/spec.md`. Si tu veux la modifier ou en créer
d'autres :

```
/speckit.specify "ajoute une feature X"
```

Ou pour utiliser la spec existante :

```
/speckit.specify --use-existing specs/001-personal-assistant/spec.md
```

#### `/speckit.plan`
Le plan technique est déjà dans `specs/001-personal-assistant/plan.md`.
Cette commande le valide ou propose des ajustements basés sur la
constitution.

```
/speckit.plan
```

#### `/speckit.tasks`
Génère la liste des tâches concrètes à implémenter, dans l'ordre TDD
défini dans le plan.

```
/speckit.tasks
```

Claude Code va créer `specs/001-personal-assistant/tasks.md` avec une
liste numérotée de tâches type :
- T001 : Setup Vite + React + TS
- T002 : Test crypto round-trip (RED)
- T003 : Implementation crypto (GREEN)
- T004 : Refactor crypto (REFACTOR)
- ...

#### `/speckit.implement`
Lance l'implémentation tâche par tâche, en respectant le TDD strict.

```
/speckit.implement T001
/speckit.implement T002
...
```

#### `/speckit.analyze`
À la fin de chaque phase ou avant un commit critique, valide que
l'implémentation respecte la spec et la constitution.

```
/speckit.analyze
```

## Setup secret manager GitHub Actions

Pour préparer la v1.5 (si LLM API ou Firebase ajoutés) :

```bash
# Sur GitHub, dans le repo personal-assistant-pwa :
# Settings → Secrets and variables → Actions → New repository secret

# Pour usage CI/CD :
GH_PAGES_TOKEN          # Token déploiement (si workflow custom)
LIGHTHOUSE_BUDGET       # Optionnel : seuils performance

# Pour usage tests E2E (si simulation API) :
TEST_GITHUB_TOKEN       # Token avec un repo de test
```

Aucun secret n'est nécessaire pour la v1 actuelle (pas de LLM, pas de
Firebase). Ajout différé.

## Liens utiles

- Octokit docs : https://github.com/octokit/octokit.js
- vite-plugin-pwa : https://vite-pwa-org.netlify.app/
- Headless UI : https://headlessui.com/
- Web Crypto API : https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- React Markdown : https://github.com/remarkjs/react-markdown

## Prochaines étapes

1. Crée le repo GitHub `personal-assistant-pwa` (privé)
2. Copie les fichiers du scaffold
3. `npm create vite@latest . -- --template react-ts` (par dessus, ou pas
   selon préférence — tu peux aussi laisser Claude Code générer le scaffold)
4. Lance Claude Code et exécute `/speckit.constitution` puis
   `/speckit.tasks` pour démarrer l'implémentation
5. Soir 1 = phase 0 (setup), tu dois finir avec un Vite qui sert un "Hello
   World" testé en CI
