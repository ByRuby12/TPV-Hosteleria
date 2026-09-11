import { jsPDF } from 'jspdf'

export type InvoiceItem = {
  name: string
  quantity: number
  subtotal: number
  rejected?: boolean
  rejectionReason?: string
}

export type InvoiceCompany = {
  restaurantName?: string
  legalName?: string
  taxId?: string
  address?: string
  fiscalAddress?: string
  postalCode?: string
  city?: string
  country?: string
  phone?: string
  email?: string
  taxRate?: number
  socials?: Record<string, string | undefined>
}

export type InvoiceData = {
  tableNumber: string
  items: InvoiceItem[]
  total: number
  paymentMethod: 'efectivo' | 'tarjeta'
  splitCount?: number
  paidAt?: string
  company?: InvoiceCompany
}

const formatPrice = (value: number) => `${value.toFixed(2)} EUR`

export const downloadInvoicePdf = ({
  tableNumber,
  items,
  total,
  paymentMethod,
  splitCount = 1,
  paidAt = new Date().toISOString(),
  company = {},
}: InvoiceData) => {
  const document = new jsPDF()
  const invoiceNumber = `FACT-${Date.now()}`
  const date = new Date(paidAt).toLocaleString('es-ES')
  const paymentLabel = paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efectivo'
  const safeSplitCount = Math.max(1, Math.trunc(Number(splitCount) || 1))
  const perPerson = total / safeSplitCount
  const companyName = company.legalName || company.restaurantName || 'Empresa'
  const taxRate = Number(company.taxRate ?? 0)
  const taxBase = taxRate > 0 ? total / (1 + taxRate) : total
  const taxAmount = total - taxBase

  document.setFontSize(20)
  document.text('Factura', 20, 25)
  document.setFontSize(10)
  let y = 34
  const writeHeaderLine = (text: string, bold = false) => {
    if (!text) return
    document.setFont('helvetica', bold ? 'bold' : 'normal')
    const lines = document.splitTextToSize(text, 170)
    document.text(lines, 20, y)
    y += lines.length * 5 + 2
  }

  writeHeaderLine(companyName, true)
  writeHeaderLine(`NIF/CIF: ${company.taxId || 'Pendiente de configurar'}`)
  writeHeaderLine(`Domicilio fiscal: ${company.fiscalAddress || company.address || 'Pendiente de configurar'}`)
  writeHeaderLine(`${company.postalCode || ''} ${company.city || ''} ${company.country || ''}`.trim())
  writeHeaderLine(`Contacto: ${company.phone || ''}${company.email ? ` · ${company.email}` : ''}`)
  y += 3
  document.line(20, y, 190, y)
  y += 7
  writeHeaderLine(`Numero: ${invoiceNumber}`)
  writeHeaderLine(`Mesa: ${tableNumber}`)
  writeHeaderLine(`Fecha: ${date}`)
  writeHeaderLine(`Metodo de pago: ${paymentLabel}`)
  writeHeaderLine(`Cuenta dividida entre: ${safeSplitCount} ${safeSplitCount === 1 ? 'persona' : 'personas'}`)
  y += 5

  document.setFontSize(11)
  document.text('Producto', 20, y)
  document.text('Cantidad', 125, y)
  document.text('Importe', 165, y)
  document.line(20, y + 3, 190, y + 3)
  y += 12

  document.setFontSize(10)
  items.forEach((item) => {
    if (y > 270) {
      document.addPage()
      y = 20
    }

    const productName = document.splitTextToSize(item.name, 95)[0]
    document.setTextColor(item.rejected ? 185 : 0, item.rejected ? 28 : 0, item.rejected ? 28 : 0)
    document.text(productName, 20, y)
    document.text(String(item.quantity), 130, y)
    document.text(item.rejected ? 'NO COBRADO' : formatPrice(item.subtotal), 165, y)
    if (item.rejected) {
      document.setFontSize(8)
      document.text(item.rejectionReason ? `Rechazado: ${item.rejectionReason}` : 'Rechazado', 20, y + 4)
      document.setFontSize(10)
      y += 4
    }
    document.setTextColor(0, 0, 0)
    y += 8
  })

  document.line(20, y + 2, 190, y + 2)
  document.setFontSize(13)
  document.setFontSize(10)
  document.text('Base imponible', 120, y + 14)
  document.text(formatPrice(taxBase), 165, y + 14)
  document.text(`IVA (${(taxRate * 100).toFixed(2)}%)`, 120, y + 22)
  document.text(formatPrice(taxAmount), 165, y + 22)
  if (safeSplitCount > 1) {
    document.text('Importe por persona', 120, y + 30)
    document.text(formatPrice(perPerson), 165, y + 30)
  }
  document.setFontSize(13)
  const totalOffset = safeSplitCount > 1 ? 42 : 34
  document.text('TOTAL', 120, y + totalOffset)
  document.text(formatPrice(total), 165, y + totalOffset)
  document.setFontSize(10)
  document.text('Gracias por su visita', 20, y + totalOffset + 16)

  const socialLabels: Record<string, string> = {
    instagram: 'Instagram',
    youtube: 'YouTube',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    whatsapp: 'WhatsApp',
    googleReviews: 'Google',
  }
  const socialLinks = Object.entries(company.socials ?? {})
    .filter(([, url]) => Boolean(url))
    .map(([key, url]) => `${socialLabels[key] || key}: ${url}`)

  if (socialLinks.length) {
    let socialY = y + totalOffset + 28
    if (socialY > 260) {
      document.addPage()
      socialY = 24
    }
    document.setFont('helvetica', 'bold')
    document.text('Redes y contacto', 20, socialY)
    document.setFont('helvetica', 'normal')
    socialY += 7
    socialLinks.forEach((link) => {
      const lines = document.splitTextToSize(link, 170)
      document.text(lines, 20, socialY)
      socialY += lines.length * 5 + 2
    })
  }

  document.save(`${invoiceNumber}-mesa-${tableNumber}.pdf`)
}
