# Feature Specification: AI Agent Chat

**Feature Branch**: `002-ai-agent-chat`  
**Created**: 2026-05-06  
**Status**: Draft  
**Input**: User description: "Module conversationnel agentique intégré à la Personal Assistant PWA. L'utilisateur dialogue en langage naturel avec un LLM qui peut lire, créer, modifier et organiser les fichiers .md du dossier assistant/ via les outils GitHub déjà implémentés."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agent File Organization via Chat (Priority: P1)

L'utilisateur tape en langage naturel une demande d'organisation ou d'action sur ses fichiers (ex : "Range mon idée de suspendre des plantes dans la cuisine dans le bon fichier"), et l'agent identifie le fichier cible, le lit, le modifie, et commit automatiquement.

**Why this priority**: C'est la raison d'être de la feature — sans la boucle agent + tool use, le chat n'est qu'un gadget. C'est le cœur de la valeur ajoutée.

**Independent Test**: Peut être testé en envoyant un message dans le chat et en vérifiant qu'un commit est créé sur le repo GitHub avec le contenu correct dans le bon fichier.

**Acceptance Scenarios**:

1. **Given** le chat est ouvert et l'agent a accès au repo, **When** l'utilisateur écrit "Ajoute 'acheter des plantes' dans ma todo section Cette semaine", **Then** l'agent appelle read_file sur todo.md, modifie le contenu, appelle update_file, et affiche un résumé "✓ Ajouté dans todo.md".
2. **Given** l'utilisateur demande de ranger une idée mais aucun fichier ne correspond, **When** l'agent analyse l'arborescence, **Then** il crée un nouveau .md avec un nom descriptif et y écrit le contenu.
3. **Given** l'agent doit modifier un fichier, **When** il appelle update_file, **Then** il a d'abord lu le fichier via read_file, ne modifie que la section pertinente en mémoire, et soumet le contenu complet mis à jour avec un commit descriptif.

---

### User Story 2 - LLM API Key Setup (Priority: P1)

L'utilisateur configure sa clé API LLM (OpenAI ou Anthropic) de manière sécurisée lors du premier accès au chat. La clé est chiffrée et stockée localement.

**Why this priority**: Sans clé API, rien ne fonctionne. C'est un prérequis bloquant pour toutes les autres stories.

**Independent Test**: Peut être testé en saisissant une clé, en fermant/rouvrant l'app, en déverrouillant avec le mot de passe, et en vérifiant que le chat fonctionne.

**Acceptance Scenarios**:

1. **Given** aucune clé API n'est configurée, **When** l'utilisateur ouvre le chat pour la première fois, **Then** un formulaire demande le provider (OpenAI/Anthropic) + la clé API.
2. **Given** l'utilisateur saisit une clé valide, **When** il confirme, **Then** la clé est chiffrée avec le même mot de passe que le token GitHub (PBKDF2 + AES-GCM) et stockée dans IndexedDB.
3. **Given** la clé est déjà configurée, **When** l'utilisateur ouvre le chat, **Then** la clé est déchiffrée automatiquement (le mot de passe a déjà été saisi à l'auth) et le chat est opérationnel.

---

### User Story 3 - Chat Interface (Priority: P2)

L'utilisateur dispose d'une interface conversationnelle (bulles, input, streaming) accessible depuis la navigation principale de l'app.

**Why this priority**: L'interface est le canal d'interaction — essentielle mais pas aussi critique que la mécanique agent sous-jacente.

**Independent Test**: Peut être testé en envoyant un message et en vérifiant que la réponse s'affiche progressivement (streaming) avec les bulles correctement formatées.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est authentifié et la clé LLM est configurée, **When** il navigue vers /chat, **Then** une interface chat s'affiche avec un input et un historique vide.
2. **Given** le chat est ouvert, **When** l'utilisateur envoie un message, **Then** un indicateur "thinking…" s'affiche puis la réponse streame progressivement en markdown rendu.
3. **Given** une conversation est en cours, **When** l'utilisateur clique "Nouvelle conversation", **Then** l'historique est effacé et un nouveau system prompt est envoyé.

---

### User Story 4 - Intelligent Context (Priority: P2)

L'agent connaît automatiquement la structure des fichiers et peut décider seul où ranger les informations sans que l'utilisateur explique l'organisation.

**Why this priority**: Réduit la friction — l'utilisateur ne devrait pas avoir à dire "dans tel fichier" à chaque fois.

**Independent Test**: Peut être testé en demandant à l'agent de ranger une idée sans préciser le fichier cible, et en vérifiant qu'il choisit le bon fichier.

**Acceptance Scenarios**:

1. **Given** une nouvelle conversation démarre, **When** le system prompt est construit, **Then** il contient l'arborescence de assistant/ et les titres (heading #) de chaque fichier.
2. **Given** l'utilisateur demande "Range cette idée cadeau pour Jenna", **When** l'agent analyse le contexte, **Then** il identifie un fichier pertinent (ex: gifts.md) sans demander où ranger.
3. **Given** l'arborescence dépasse 8000 tokens, **When** le system prompt est construit, **Then** il est résumé pour rester sous la limite.

---

### User Story 5 - Multi-Provider Support (Priority: P3)

L'utilisateur peut choisir entre OpenAI et Anthropic comme fournisseur LLM et changer de provider dans les réglages.

**Why this priority**: Flexibilité utile mais pas bloquante — on peut lancer avec un seul provider.

**Independent Test**: Peut être testé en configurant successivement chaque provider et en vérifiant que le chat fonctionne avec les deux.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est dans les réglages, **When** il change le provider de OpenAI à Anthropic, **Then** la prochaine conversation utilise le nouveau provider.
2. **Given** le provider est Anthropic, **When** l'agent fait du tool use, **Then** le format tool_use natif Anthropic est utilisé (pas le function calling OpenAI).

---

### Edge Cases

- Que se passe-t-il si la clé API est invalide ou expirée ? → Message d'erreur clair + possibilité de resaisir la clé.
- Que se passe-t-il si le LLM entre en boucle infinie de tool calls ? → Limite stricte de 10 tool calls par tour, erreur affichée après.
- Que se passe-t-il si l'API retourne 429 (rate limit) ? → Exponential backoff + message "Veuillez patienter" à l'utilisateur.
- Que se passe-t-il si un write échoue (conflit SHA) ? → Re-fetch le fichier, réappliquer la modification, retry une fois.
- Que se passe-t-il si le fichier cible n'existe pas lors d'un update_file ? → L'agent bascule sur create_file.
- Que se passe-t-il si l'utilisateur ferme le navigateur pendant un streaming ? → La conversation en cours est perdue (pas de persistance v1).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT permettre à l'utilisateur de saisir et stocker une clé API LLM de manière chiffrée (PBKDF2 + AES-GCM dans IndexedDB).
- **FR-002**: Le système DOIT supporter deux providers : OpenAI (function calling) et Anthropic (tool use natif).
- **FR-003**: Le système DOIT afficher une interface chat avec bulles (user/assistant), input texte, et rendu markdown des réponses.
- **FR-004**: Le système DOIT streamer les réponses du LLM en temps réel (SSE/streaming).
- **FR-005**: L'agent DOIT disposer de 4 outils : list_files, read_file, update_file (patch partiel par section), create_file.
- **FR-006**: L'agent DOIT exécuter une boucle tool use complète : LLM → tool call → exécution → résultat → LLM → réponse finale.
- **FR-007**: Le système DOIT limiter à 10 le nombre de tool calls par tour de conversation.
- **FR-008**: Le system prompt DOIT inclure automatiquement l'arborescence de assistant/ et les headings des fichiers.
- **FR-009**: Chaque modification de fichier DOIT générer un commit GitHub avec un message descriptif.
- **FR-010**: Le système DOIT afficher un résumé des actions effectuées (fichiers lus, modifiés, créés).
- **FR-011**: Le système DOIT gérer les erreurs 429 avec exponential backoff et message utilisateur.
- **FR-012**: Le système DOIT afficher un compteur approximatif de tokens consommés par session.
- **FR-013**: L'outil update_file DOIT lire le fichier existant avant modification. Le LLM ne modifie que la section pertinente dans le contenu qu'il fournit, puis soumet le fichier complet mis à jour (l'API GitHub n'a pas d'endpoint patch).
- **FR-014**: La clé API NE DOIT JAMAIS être stockée en clair côté client (DOM, localStorage, console). La transmission chiffrée HTTPS vers l'API du provider est acceptable.

### Key Entities

- **Conversation**: Session de dialogue entre l'utilisateur et l'agent. Contient un historique de messages et un system prompt contextuel. Non persistée en v1.
- **Message**: Unité d'échange — type user, assistant, ou tool_result. Contient du texte et optionnellement des tool calls/results.
- **Tool Call**: Requête de l'agent vers un outil (list_files, read_file, update_file, create_file). Contient le nom de l'outil et ses paramètres.
- **LLM Provider Config**: Provider choisi (openai/anthropic), clé API chiffrée, modèle par défaut.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: L'utilisateur peut organiser une idée en langage naturel en moins de 15 secondes (temps entre envoi du message et confirmation du commit).
- **SC-002**: L'agent range correctement une idée dans le bon fichier dans 80% des cas sans que l'utilisateur précise le fichier cible.
- **SC-003**: La réponse de l'agent commence à streamer dans les 2 secondes suivant l'envoi du message.
- **SC-004**: L'agent complète une demande nécessitant plusieurs tool calls (lecture + modification) en moins de 30 secondes.
- **SC-005**: Zéro fuite de clé API — la clé n'apparaît jamais en clair dans le DOM, localStorage, logs console, ou network requests non-HTTPS.
- **SC-006**: L'interface chat est utilisable sur mobile (responsive, input accessible, bulles lisibles).

## Assumptions

- L'utilisateur dispose d'une clé API valide pour OpenAI ou Anthropic avec un crédit suffisant.
- Les APIs OpenAI et Anthropic sont accessibles directement depuis le navigateur (CORS permis pour les appels directs).
- L'arborescence de assistant/ contient moins de 50 fichiers (au-delà, le system prompt sera résumé).
- Le mot de passe local est déjà saisi lors de l'auth GitHub — la clé LLM est déchiffrée dans la foulée.
- Les fichiers .md font en moyenne moins de 10 Ko — permettant un patch sans dépasser les limites de contexte.
- L'utilisateur accepte que l'historique des conversations soit perdu au rechargement (persistance différée à v2).
