import { jsPDF } from 'jspdf'
import { getPaymentCardAmount, getPaymentCashAmount } from './orderItemStatus'

type ExportPeriod = 'week' | 'month' | 'year'

type ExportData = {
  period: ExportPeriod
  periodStart: string
  paidOrders: any[]
  cashClosures: any[]
  cashMovements: any[]
  tables: any[]
  products: any[]
  categories: any[]
  company: {
    legalName?: string
    restaurantName?: string
    taxId?: string
    fiscalAddress?: string
    city?: string
    country?: string
  }
}

const periodLabels: Record<ExportPeriod, string> = {
  week: 'Semana',
  month: 'Mes',
  year: 'Ano',
}

const formatPrice = (value: number) => `${Number(value || 0).toFixed(2)} EUR`
const formatDate = (value?: string) => value ? new Date(value).toLocaleString('es-ES') : '-'

export const downloadDataExportPdf = (data: ExportData) => {
  const document = new jsPDF()
  let y = 22
  const periodLabel = periodLabels[data.period]
  const totalSales = data.paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)
  const cashSales = data.paidOrders.reduce((sum, order) => sum + getPaymentCashAmount(order), 0)
  const cardSales = data.paidOrders.reduce((sum, order) => sum + getPaymentCardAmount(order), 0)
  const totalItems = data.paidOrders.reduce((sum, order) =>
    sum + (order.items ?? []).reduce((itemSum: number, item: any) => itemSum + Number(item.quantity || 0), 0), 0)
  const paymentGroups = new Map<string, {
    tableId: string
    sessionId: string
    orderCount: number
    itemCount: number
    entryAt: string
    paidAt: string
    total: number
    cash: number
    card: number
  }>()
  const productDemand = new Map<string, {
    name: string
    quantity: number
    orderCount: number
    rejectedQuantity: number
    revenue: number
  }>()

  data.paidOrders.forEach((order) => {
    const key = `${order.tableId ?? '-'}-${order.sessionId ?? '-'}-${order.paidAt ?? order.updatedAt ?? ''}`
    const itemCount = (order.items ?? []).reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0)
    const productsInOrder = new Set<string>()
    ;(order.items ?? []).forEach((item: any) => {
      const key = item.productId || item.name || 'producto'
      const quantity = Number(item.quantity || 0)
      const currentProduct = productDemand.get(key)
      if (currentProduct) {
        currentProduct.quantity += quantity
        currentProduct.rejectedQuantity += item.status === 'REJECTED' ? quantity : 0
        currentProduct.revenue += item.status === 'REJECTED' ? 0 : Number(item.subtotal || 0)
        if (!productsInOrder.has(key)) currentProduct.orderCount += 1
      } else {
        productDemand.set(key, {
          name: item.name || 'Producto sin nombre',
          quantity,
          orderCount: 1,
          rejectedQuantity: item.status === 'REJECTED' ? quantity : 0,
          revenue: item.status === 'REJECTED' ? 0 : Number(item.subtotal || 0),
        })
      }
      productsInOrder.add(key)
    })
    const current = paymentGroups.get(key)
    if (current) {
      current.orderCount += 1
      current.itemCount += itemCount
      current.entryAt = new Date(order.createdAt).getTime() < new Date(current.entryAt).getTime() ? order.createdAt : current.entryAt
      current.total += Number(order.total || 0)
      current.cash += getPaymentCashAmount(order)
      current.card += getPaymentCardAmount(order)
    } else {
      paymentGroups.set(key, {
        tableId: order.tableId ?? '-',
        sessionId: order.sessionId ?? '-',
        orderCount: 1,
        itemCount,
        entryAt: order.createdAt,
        paidAt: order.paidAt ?? order.updatedAt,
        total: Number(order.total || 0),
        cash: getPaymentCashAmount(order),
        card: getPaymentCardAmount(order),
      })
    }
  })

  const ensureSpace = (height = 8) => {
    if (y + height > 278) {
      document.addPage()
      y = 20
    }
  }

  const write = (text: string, size = 10, bold = false) => {
    const lines = document.splitTextToSize(text, 170)
    ensureSpace(lines.length * 5 + 3)
    document.setFontSize(size)
    document.setFont('helvetica', bold ? 'bold' : 'normal')
    document.text(lines, 20, y)
    y += lines.length * 5 + 3
  }

  const section = (title: string) => {
    y += 4
    ensureSpace(12)
    document.setFontSize(13)
    document.setFont('helvetica', 'bold')
    document.text(title, 20, y)
    y += 8
  }

  document.setFontSize(20)
  document.setFont('helvetica', 'bold')
  document.text('Informe de resultados', 20, y)
  y += 10
  write(`${periodLabel} desde ${formatDate(data.periodStart)}`, 10)
  write(`Generado: ${formatDate(new Date().toISOString())}`, 10)

  section('Empresa')
  write(data.company.legalName || data.company.restaurantName || 'Empresa sin configurar', 10, true)
  write(`NIF/CIF: ${data.company.taxId || 'Pendiente de configurar'}`)
  write(`Domicilio: ${data.company.fiscalAddress || '-'}, ${data.company.city || ''}, ${data.company.country || ''}`)

  section('Resumen economico')
  write(`Pedidos cobrados: ${data.paidOrders.length}`)
  write(`Mesas cobradas: ${paymentGroups.size}`)
  write(`Articulos servidos: ${totalItems}`)
  write(`Ventas totales: ${formatPrice(totalSales)}`)
  write(`Ventas en efectivo: ${formatPrice(cashSales)}`)
  write(`Ventas con tarjeta: ${formatPrice(cardSales)}`)
  write(`Cierres de caja: ${data.cashClosures.length}`)
  write(`Movimientos de caja: ${data.cashMovements.length}`)

  section('Resumen de pagos por mesa')
  if (!paymentGroups.size) {
    write('No hay pagos registrados en este periodo.')
  } else {
    ;[...paymentGroups.values()]
      .sort((left, right) => new Date(right.paidAt).getTime() - new Date(left.paidAt).getTime())
      .forEach((payment) => {
        write(`Mesa ${payment.tableId} | ${payment.orderCount} ${payment.orderCount === 1 ? 'comanda' : 'comandas'} | ${payment.itemCount} articulos`, 10, true)
        write(`Entrada: ${formatDate(payment.entryAt)} | Salida: ${formatDate(payment.paidAt)}`, 9)
        write(`Total: ${formatPrice(payment.total)} | Efectivo: ${formatPrice(payment.cash)} | Tarjeta: ${formatPrice(payment.card)}`, 9)
      })
  }

  section('Productos mas solicitados')
  if (!productDemand.size) {
    write('No hay productos pedidos en este periodo.')
  } else {
    ;[...productDemand.values()]
      .sort((left, right) => right.quantity - left.quantity || right.revenue - left.revenue)
      .slice(0, 20)
      .forEach((product, index) => {
        const rejectedNote = product.rejectedQuantity > 0
          ? ` | Rechazadas: ${product.rejectedQuantity}`
          : ''
        write(`${index + 1}. ${product.name} | Pedidas: ${product.quantity} | Comandas: ${product.orderCount}${rejectedNote} | Ventas: ${formatPrice(product.revenue)}`, 9)
      })
  }

  section('Caja')
  if (!data.cashClosures.length) {
    write('No hay cierres de caja en este periodo.')
  } else {
    data.cashClosures.forEach((closure) => {
      write(`Cierre ${formatDate(closure.closedAt)} | Ventas ${formatPrice(closure.totalSales)} | Diferencia ${formatPrice(closure.difference)}`)
    })
  }

  section('Datos maestros')
  write(`Mesas: ${data.tables.length}`)
  write(`Productos: ${data.products.length}`)
  write(`Categorias: ${data.categories.length}`)
  write('Los datos maestros se incluyen en la exportacion del sistema y se conservan durante la limpieza operativa.')

  const filename = `resultados-${data.period}-${new Date().toISOString().slice(0, 10)}.pdf`
  document.save(filename)
}
