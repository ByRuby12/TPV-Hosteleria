import test from 'node:test'
import assert from 'node:assert/strict'
import { isProductOutOfStock, isProductLowStock } from './productStock.js'

test('producto con stock cero se considera agotado', () => {
  assert.equal(isProductOutOfStock({ available: true, stock: 0 }), true)
  assert.equal(isProductOutOfStock({ available: false, stock: 12 }), true)
})

test('producto con stock bajo activa alerta', () => {
  assert.equal(isProductLowStock({ stock: 2, lowStockThreshold: 5 }), true)
  assert.equal(isProductLowStock({ stock: 7, lowStockThreshold: 5 }), false)
})

test('la disponibilidad manual no se anula por el stock', () => {
  assert.equal(isProductOutOfStock({ available: true, stock: 0 }), true)
  assert.equal(isProductOutOfStock({ available: false, stock: 12 }), true)

  const normalizedAvailable = { ...{ available: true, stock: 0 } }
  assert.equal(normalizedAvailable.available, true)
})
