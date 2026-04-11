export const TRADITIONS = [
  { id: 'balanced',       label: 'Balanced',              desc: 'All traditions considered' },
  { id: 'catholic',       label: 'Catholic',              desc: 'Roman Catholic tradition' },
  { id: 'orthodox',       label: 'Eastern Orthodox',      desc: 'Orthodox tradition' },
  { id: 'lutheran',       label: 'Lutheran',              desc: 'Lutheran tradition' },
  { id: 'reformed',       label: 'Reformed',              desc: 'Calvinist / Reformed tradition' },
  { id: 'anglican',       label: 'Anglican',              desc: 'Anglican / Episcopal tradition' },
  { id: 'baptist',        label: 'Baptist',               desc: 'Baptist tradition' },
  { id: 'methodist',      label: 'Methodist',             desc: 'Wesleyan / Methodist tradition' },
  { id: 'pentecostal',    label: 'Pentecostal',           desc: 'Pentecostal / Charismatic tradition' },
  { id: 'anabaptist',     label: 'Anabaptist',            desc: 'Anabaptist / Mennonite tradition' },
] as const

export type TraditionId = typeof TRADITIONS[number]['id']

export const TRADITION_STORAGE_KEY = 'bv_tradition'

export function getTraditionPrompt(traditionId: TraditionId): string {
  if (traditionId === 'balanced') return ''
  const t = TRADITIONS.find((t) => t.id === traditionId)
  if (!t) return ''
  return `\n\nImportant: Frame your explanation from a ${t.label} theological perspective. Emphasize interpretations, emphases, and theological concerns characteristic of the ${t.label} tradition.`
}
