export type TableRecord = {
  id: string
  number: number
  name?: string
  active: boolean
  qrIdentifier: string
  currentSessionId?: string | null
  paymentRequested?: boolean
  paymentMethod?: 'efectivo' | 'tarjeta'
  paymentSplitCount?: number
  paymentNote?: string
  createdAt?: string
  updatedAt?: string
}

export const deduplicateTables = (tables: TableRecord[]) => {
  const byKey = new Map<string, TableRecord>()

  for (const table of tables) {
    const key = Number.isFinite(Number(table.number))
      ? `number-${table.number}`
      : `qr-${table.qrIdentifier}`
    const current = byKey.get(key)

    if (!current) {
      byKey.set(key, table)
      continue
    }

    const currentIsCanonical = current.id === `table-${current.number}`
    const nextIsCanonical = table.id === `table-${table.number}`
    const shouldReplace = nextIsCanonical && !currentIsCanonical

    if (shouldReplace || (!current.currentSessionId && table.currentSessionId)) {
      byKey.set(key, table)
    }
  }

  return [...byKey.values()].sort((left, right) => Number(left.number) - Number(right.number))
}

export const mockTables: TableRecord[] = Array.from({ length: 30 }, (_, index) => {
  const number = index + 1
  const active = false

  return {
    id: `table-${number}`,
    number,
    name: `Mesa ${number}`,
    active,
    qrIdentifier: `mesa-${String(number).padStart(3, '0')}`,
    currentSessionId: active ? `session-${number}` : null,
    paymentRequested: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
})
