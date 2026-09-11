/**
 * Security service for enhanced validation and protection
 */

class SecurityService {
  private readonly MAX_REQUESTS_PER_MINUTE = 60
  private readonly RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

  private requestLog: Map<string, number[]> = new Map()

  /**
   * Validate session expiration
   */
  isSessionExpired(expiresAt: number | string): boolean {
    const expireTime = typeof expiresAt === 'string' ? new Date(expiresAt).getTime() : expiresAt
    return Date.now() > expireTime
  }

  /**
   * Validate session is active and not closed
   */
  isSessionActive(session: any): boolean {
    if (!session) return false
    if (session.active === false) return false
    if (session.closedAt) return false
    return !this.isSessionExpired(session.expiresAt)
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    const randomValues = new Uint8Array(length)
    crypto.getRandomValues(randomValues)
    for (let i = 0; i < length; i++) {
      token += chars[randomValues[i] % chars.length]
    }
    return token
  }

  /**
   * Rate limiting check
   */
  checkRateLimit(identifier: string): boolean {
    const now = Date.now()
    const requests = this.requestLog.get(identifier) || []

    // Remove old requests outside the window
    const recentRequests = requests.filter((time) => now - time < this.RATE_LIMIT_WINDOW)

    // Check if exceeded limit
    if (recentRequests.length >= this.MAX_REQUESTS_PER_MINUTE) {
      return false
    }

    // Add current request
    recentRequests.push(now)
    this.requestLog.set(identifier, recentRequests)

    return true
  }

  /**
   * Validate table access
   */
  validateTableAccess(
    tableId: string,
    sessionId: string,
    currentTableId: string,
    currentSessionId: string
  ): boolean {
    // Check if accessing own table/session
    if (tableId !== currentTableId || sessionId !== currentSessionId) {
      console.warn('Unauthorized table access attempt')
      return false
    }
    return true
  }

  /**
   * Validate order belongs to session
   */
  validateOrderBelongsToSession(
    orderId: string,
    order: any,
    currentTableId: string,
    currentSessionId: string
  ): boolean {
    if (!order) {
      console.warn(`Order ${orderId} not found`)
      return false
    }

    if (order.tableId !== currentTableId) {
      console.warn(`Order ${orderId} does not belong to table ${currentTableId}`)
      return false
    }

    if (order.sessionId !== currentSessionId) {
      console.warn(`Order ${orderId} does not belong to session ${currentSessionId}`)
      return false
    }

    return true
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input: string, maxLength: number = 500): string {
    if (!input) return ''
    let sanitized = input.substring(0, maxLength)
    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[<>\"'&]/g, '')
    return sanitized.trim()
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate product quantity
   */
  isValidQuantity(quantity: any): boolean {
    const num = Number(quantity)
    return Number.isInteger(num) && num > 0 && num <= 100
  }

  /**
   * Validate price
   */
  isValidPrice(price: any): boolean {
    const num = Number(price)
    return !isNaN(num) && num >= 0 && num <= 1000
  }

  /**
   * Create security audit log entry
   */
  logSecurityEvent(eventType: string, details: Record<string, any>): void {
    const entry = {
      timestamp: new Date().toISOString(),
      type: eventType,
      details,
      userAgent: navigator.userAgent,
    }
    console.log('[SECURITY EVENT]', entry)
    // In production, send to server
  }

  /**
   * Detect suspicious activity patterns
   */
  detectSuspiciousActivity(identifier: string, threshold: number = 20): boolean {
    const now = Date.now()
    const window = 5 * 60 * 1000 // 5 minutes
    const requests = this.requestLog.get(identifier) || []
    const recentCount = requests.filter((time) => now - time < window).length

    if (recentCount > threshold) {
      this.logSecurityEvent('SUSPICIOUS_ACTIVITY_DETECTED', {
        identifier,
        requestCount: recentCount,
        window: '5 minutes',
      })
      return true
    }

    return false
  }

  /**
   * Validate session token format
   */
  isValidTokenFormat(token: string): boolean {
    // Token should be alphanumeric, 32+ characters
    return /^[a-zA-Z0-9]{32,}$/.test(token)
  }

  /**
   * Clear old request logs (cleanup)
   */
  clearOldLogs(maxAge: number = 3600000): void {
    const now = Date.now()
    this.requestLog.forEach((requests, key) => {
      const recent = requests.filter((time) => now - time < maxAge)
      if (recent.length === 0) {
        this.requestLog.delete(key)
      } else {
        this.requestLog.set(key, recent)
      }
    })
  }
}

export const securityService = new SecurityService()
