import { createHash, randomInt, randomUUID, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

type RateLimitEntry = {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return (
    forwardedFor ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

export function rateLimit(
  key: string,
  options: {
    limit: number
    windowMs: number
  }
) {
  const now = Date.now()
  const current = rateLimitStore.get(key)

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs })
    return null
  }

  current.count += 1
  if (current.count <= options.limit) {
    return null
  }

  const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
  return NextResponse.json(
    { error: 'Too many requests. Please try again shortly.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
      },
    }
  )
}

export function enforceSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return null

  const expectedOrigin = new URL(request.url).origin
  if (origin === expectedOrigin) return null

  return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 })
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function isStrongPassword(password: string) {
  return password.length >= 10 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password)
}

export function sanitizeText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength)
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function randomNumericCode(length: number) {
  const min = 10 ** (length - 1)
  const max = 10 ** length
  return randomInt(min, max).toString()
}

export function secureToken() {
  return randomUUID()
}

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

