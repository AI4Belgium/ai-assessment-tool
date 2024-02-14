import { NextRequest, NextResponse } from 'next/server'
import { i18n } from './next-i18next.config'

const PUBLIC_FILE = /\.(.*)$/

// /**
//  * https?:\/\/ - matches http// and https//
//  * [^/]+ - matches anything but a /
//  * (?::[0-9]+)?
//  *    (:? ) - non-caputring group
//  *    :[0-9]+ - matches : followed by numbers
//  *    ? -  makes it optional
//  */
// const URL_BASE_RE = /(https?:\/\/[^/]+(?::[0-9]+)?)/

export async function middleware (req: NextRequest): Promise<undefined | NextResponse> {
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.includes('/api/') ||
    PUBLIC_FILE.test(req.nextUrl.pathname)
  ) {
    return
  }

  const usersLocale = req.cookies.get('NEXT_LOCALE')?.value
  const defaultLocale = i18n.defaultLocale

  if (req.nextUrl.locale === 'default' || (usersLocale != null && usersLocale !== req.nextUrl.locale)) {
    const locale = usersLocale ?? defaultLocale
    return NextResponse.redirect(
      new URL(`/${locale}${req.nextUrl.pathname}${req.nextUrl.search}`, req.url)
    )
  }
}
