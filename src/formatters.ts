import type { SearchItemResult, SearchItemsResponse } from './types.js';
import type { FindSectionResponse } from './types.js';
import type { GetItemsResponse } from './types.js';

export function renderFindSections(query: string, response: FindSectionResponse): string {
  if (!response.sections.length) {
    return `No sections found matching "${query}". Try different search terms or browse available lists.`;
  }
  const body = response.sections
    .map((s) => {
      const githubUrl = `https://github.com/${s.githubRepo}`;
      const anchor = s.category.toLowerCase().replace(/\s+/g, '-');
      return `### ${s.listName} - ${s.category}${s.subcategory ? ` > ${s.subcategory}` : ''}

- **Repository**: \`${s.githubRepo}\`
- **GitHub URL**: ${githubUrl}
- **Section URL**: ${githubUrl}#${anchor}
- **Items**: ${s.itemCount}
- **Confidence**: ${(s.confidence * 100).toFixed(1)}%
- **Description**: ${s.description || `Curated ${s.category.toLowerCase()} resources from ${s.listName}`}`;
    })
    .join('\n\n');
  const first = response.sections[0];
  return `# Search Results for "${query}"

Found ${response.sections.length} relevant sections across awesome lists.

${body}

---

## How to retrieve items

Use \`get_awesome_items\` with:
- **githubRepo**: e.g., \`"${first?.githubRepo ?? 'repo/name'}"\`
- **section** (optional): e.g., \`"${first?.category ?? 'Section'}"\`
- **tokens** (optional, default 10000)
- **offset** (optional, default 0)`;
}

export function renderGetItems(response: GetItemsResponse): string {
  if (!response.items.length) {
    return 'No items found for the specified criteria. Try adjusting your filters or use find_awesome_section first.';
  }
  const { metadata, items, tokenUsage } = response;
  const header = `# ${metadata.list.name}` +
    (metadata.section ? ` - ${metadata.section}` : '') +
    (metadata.subcategory ? ` > ${metadata.subcategory}` : '') + '\n\n';
  const desc = metadata.list.description ? `> ${metadata.list.description}\n\n` : '';
  const body = items
    .map((item, i) => {
      let t = `## ${i + 1}. ${item.name}\n\n`;
      if (item.description) t += `${item.description}\n\n`;
      t += `**URL**: ${item.url}\n`;
      if (item.githubRepo) t += `**GitHub**: https://github.com/${item.githubRepo}\n`;
      if (item.githubStars) t += `**Stars**: ${item.githubStars.toLocaleString()}\n`;
      if (item.tags?.length) t += `**Tags**: ${item.tags.join(', ')}\n`;
      return t;
    })
    .join('\n---\n\n');
  const footer = `\n---\n\n## Metadata\n\n` +
    `- **Token usage**: ${tokenUsage.used.toLocaleString()}/${tokenUsage.limit.toLocaleString()}` +
    (tokenUsage.truncated ? ' (truncated)' : '') + '\n' +
    `- **Items displayed**: ${items.length} of ${metadata.totalItems}\n` +
    (metadata.hasMore ? `- **Next page**: Use \`offset: ${metadata.offset + items.length}\` to get more items\n` : '');
  return header + desc + body + footer;
}

export function renderSearchItems(query: string, response: SearchItemsResponse): string {
  if (!response.results.length) {
    return `No items found for "${query}". Try different keywords.`;
  }
  const body = response.results
    .map((r: SearchItemResult, i) => {
      let t = `## ${i + 1}. ${r.name}\n\n`;
      if (r.description) t += `${r.description}\n\n`;
      t += `**URL**: ${r.url}\n`;
      t += `**Source**: \`${r.githubRepo}\``;
      if (r.category) t += ` — ${r.category}`;
      if (r.subcategory) t += ` › ${r.subcategory}`;
      t += '\n';
      if (typeof r.stars === 'number') t += `**Stars**: ${r.stars.toLocaleString()}\n`;
      return t;
    })
    .join('\n---\n\n');
  return `# Search results for "${query}"

Showing ${response.results.length} of ${response.total} total in ${response.took}ms.

${body}`;
}
