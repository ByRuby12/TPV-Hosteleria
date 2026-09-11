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
  write(`Ventas totales: ${formatPrice(totalSales)}`)
  write(`Ventas en efectivo: ${formatPrice(cashSales)}`)
  write(`Ventas con tarjeta: ${formatPrice(cardSales)}`)
  write(`Cierres de caja: ${data.cashClosures.length}`)
  write(`Movimientos de caja: ${data.cashMovements.length}`)

  section('Pedidos y pagos')
  if (!data.paidOrders.length) {
    write('No hay pedidos cobrados en este periodo.')
  } else {
    data.paidOrders.forEach((order) => {
      const table = order.tableId || '-'
      const method = order.paymentMethod || 'efectivo'
      write(`Mesa ${table} | ${formatDate(order.paidAt ?? order.updatedAt)} | ${method} | ${formatPrice(order.total)}`, 10, true)
      order.items?.forEach((item: any) => {
        write(`  ${item.quantity} x ${item.name} - ${formatPrice(item.subtotal)}`, 9)
      })
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
