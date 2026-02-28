const QUERY_TEMPLATES = [
  '{region} walking tour 4K',
  '{region} street walk',
  '{region} hiking trail',
  '{region} city tour',
]

export function buildSearchQuery(regionName: string, templateIndex = 0): string {
  const template = QUERY_TEMPLATES[templateIndex % QUERY_TEMPLATES.length]
  return template.replace('{region}', regionName)
}

export { QUERY_TEMPLATES }
