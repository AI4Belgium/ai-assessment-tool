import React from 'react'
import { ChakraProvider, extendTheme, Text } from '@chakra-ui/react'
import { appWithTranslation } from 'next-i18next'
import '@/src/styles/default.scss'
import PropTypes from 'prop-types'
import Head from 'next/head'
import Script from 'next/script'
import NextNprogress from 'nextjs-progressbar'
import { SessionProvider } from 'next-auth/react'
import { ToastContextProvider } from '@/src/store/toast-context'
import { UserContextProvider } from '@/src/store/user-context'
import AppLogo from '@/src/components/app-logo'
import CookieBanner from '@/src/components/cookie-consent/cookie-banner'
import { CookiesProvider } from 'react-cookie'

import 'nprogress/nprogress.css'
import isEmpty from 'lodash.isempty'

export const theme = extendTheme({
  colors: {
    brand: '#0079bf',
    success: '#70b500',
    danger: '#eb5a46',
    info: '#ff9f1a',
    warning: '#f2d600',
    darkblue: '#eae6ff',
    lightblue: '#f2faf9',
    performance: '#0079bf',
    bug: '#eb5a46',
    feature: '#61bd4f',
    information: '#ff9f1a'
  }
})

const trackingCode = process.env.NEXT_PUBLIC_ALTAI_TOOL_TRACKING_CODE

const App = ({ Component, pageProps }: any): JSX.Element => {
  return (
    <>
      {!isEmpty(trackingCode) &&
        <Script id='altai-tool-tracking-code'>
          {trackingCode}
        </Script>}

      <Head>
        <title>AI Assessment Tool</title>
        <link rel='icon' href='/favicon.ico' />
        <link rel='manifest' type='image/x-icon' href='/site.webmanifest' />
        <link rel='apple-touch-icon' sizes='180x180' href='/apple-touch-icon.png' />
        <link rel='icon' type='image/png' sizes='32x32' href='/favicon-32x32.png' />
        <link rel='icon' type='image/png' sizes='16x16' href='/favicon-16x16.png' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      </Head>
      <NextNprogress color='#0079bf' startPosition={0.3} stopDelayMs={200} height={4} />
      <ChakraProvider theme={theme}>
        <ToastContextProvider>
          <SessionProvider session={pageProps.session}>
            <CookiesProvider defaultSetOptions={{ path: '/' }}>
              <UserContextProvider>
                {/* Table for @media print mode so we have the header on every page. With this we could also add a footer on every page */}
                <table width='100%'>
                  <thead>
                    <tr className='hidden print:block'><th><AppLogo /></th></tr>
                  </thead>
                  <tbody>
                    <tr className='hidden print:block'><td><Text decoration='underline' fontSize='4xl'>AI Assessmentool</Text></td></tr>
                    <tr><td><Component {...pageProps} /></td></tr>
                  </tbody>
                </table>
                <CookieBanner />
              </UserContextProvider>
            </CookiesProvider>
          </SessionProvider>
        </ToastContextProvider>
      </ChakraProvider>
    </>
  )
}

App.propTypes = {
  pageProps: PropTypes.object
}

export default appWithTranslation(App)
