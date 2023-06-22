import { NextRequest, NextResponse } from 'next/server'
import i18n from './i18.config'

const PUBLIC_FILE = /\.(.*)$/

export async function middleware (req: NextRequest): Promise<undefined | NextResponse> {
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.includes('/api/') ||
    PUBLIC_FILE.test(req.nextUrl.pathname)
  ) {
    return
  }

  let locale = String(req.cookies.get('NEXT_LOCALE')?.value ?? i18n.defaultLocale)
  if (!i18n.locales.includes(locale)) locale = i18n.defaultLocale
  if (req.nextUrl.locale !== locale) {
    return NextResponse.redirect(
      new URL(`/${locale}${req.nextUrl.pathname}${req.nextUrl.search}`, req.url)
    )
  }
}
