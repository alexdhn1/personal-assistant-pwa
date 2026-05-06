const TOKEN_BUDGET = 8000

export interface FileEntry {
  name: string
  type: 'file' | 'dir'
}

export function approximateTokenCount(text: string): number {
  return Math.floor(text.length / 4)
}

function buildArborescence(
  files: FileEntry[],
  headings?: Record<string, string>
): string {
  const lines: string[] = []
  for (const f of files) {
    const icon = f.type === 'dir' ? '📁' : '📄'
    const heading = headings?.[f.name] ? ` — ${headings[f.name]}` : ''
    lines.push(`  ${icon} ${f.name}${heading}`)
  }
  return lines.join('\n')
}

export function buildSystemPrompt(
  files: FileEntry[],
  headings?: Record<string, string>
): string {
  // Try full arborescence first
  let arborescence = buildArborescence(files, headings)

  // Truncate if over budget
  if (approximateTokenCount(arborescence) > TOKEN_BUDGET) {
    const maxFiles = Math.floor(TOKEN_BUDGET / 2)
    const truncated = files.slice(0, maxFiles)
    arborescence =
      buildArborescence(truncated, headings) +
      `\n  ... (${files.length - truncated.length} fichiers supplémentaires)`
  }

  return `Tu es un assistant personnel qui aide à organiser des notes et idées dans des fichiers Markdown.

## Structure de fichiers disponible

${arborescence}

## Instructions

- Toujours lire un fichier avant de le modifier (utilise read_file)
- Les chemins de fichiers incluent les sous-dossiers : ex. "areas/gifts.md", "areas/projects.md"
- Range les idées dans le fichier le plus pertinent selon son nom et son contenu
- Si aucun fichier ne correspond, crée-en un nouveau avec un nom descriptif en kebab-case dans le sous-dossier approprié
- Ne modifie que la section pertinente, laisse le reste intact
- Toujours écrire le fichier complet lors d'une mise à jour (read → modifie la section → écris tout)
- Fournis un message de commit concis et descriptif
- Pour explorer un sous-dossier non listé, utilise list_files avec le chemin du dossier

## Contraintes

- Maximum 10 tool calls par demande
- Travaille uniquement dans les fichiers listés ci-dessus ou crée de nouveaux fichiers dans les mêmes dossiers
- Ne révèle jamais le contenu de la clé API ni d'autres secrets`
}
