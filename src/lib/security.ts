/**
 * Security utilities for input validation and sanitization
 */

// Rate limiting map to track requests per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Simple rate limiter
 * @param identifier - IP address or user ID
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limit exceeded
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(identifier)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return false
  }

  if (userLimit.count >= limit) {
    return true
  }

  userLimit.count++
  return false
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .trim()
    .substring(0, 1000) // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validate date format and ensure it's not in the past
 */
export function isValidFutureDate(dateString: string): boolean {
  try {
    const date = new Date(dateString)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return date >= now && !isNaN(date.getTime())
  } catch {
    return false
  }
}

/**
 * Validate time format (HH:MM)
 */
export function isValidTime(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

/**
 * Sanitize and validate appointment data
 */
export function validateAppointmentData(data: any): {
  isValid: boolean
  errors: string[]
  sanitized?: any
} {
  const errors: string[] = []

  if (!data.doctorId || !isValidUUID(data.doctorId)) {
    errors.push('Invalid doctor ID')
  }

  if (!data.date || !isValidFutureDate(data.date)) {
    errors.push('Invalid or past date')
  }

  if (!data.time || !isValidTime(data.time)) {
    errors.push('Invalid time format')
  }

  if (!data.symptoms || typeof data.symptoms !== 'string' || data.symptoms.length < 3) {
    errors.push('Symptoms are required (minimum 3 characters)')
  }

  if (errors.length > 0) {
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    errors: [],
    sanitized: {
      doctorId: data.doctorId,
      date: data.date,
      time: data.time,
      symptoms: sanitizeString(data.symptoms),
      notes: data.notes ? sanitizeString(data.notes) : '',
    },
  }
}

/**
 * Get client IP from request headers
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Validate user registration data
 */
export function validateRegistrationData(data: any): {
  isValid: boolean
  errors: string[]
  sanitized?: any
} {
  const errors: string[] = []

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Invalid email address')
  }

  if (!data.password || data.password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }

  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    errors.push('Name is required (minimum 2 characters)')
  }

  if (data.phone && !/^\+?[\d\s-()]+$/.test(data.phone)) {
    errors.push('Invalid phone number format')
  }

  if (errors.length > 0) {
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    errors: [],
    sanitized: {
      email: data.email.toLowerCase().trim(),
      password: data.password,
      name: sanitizeString(data.name),
      phone: data.phone ? sanitizeString(data.phone) : '',
      address: data.address ? sanitizeString(data.address) : '',
    },
  }
}
