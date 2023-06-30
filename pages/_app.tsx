import React from 'react'
import { ChakraProvider, extendTheme, Text } from '@chakra-ui/react'
import { appWithTranslation } from 'next-i18next'
import '@/src/styles/default.scss'
import PropTypes from 'prop-types'
import Head from 'next/head'
import NextNprogress from 'nextjs-progressbar'
import { SessionProvider } from 'next-auth/react'
import { ToastContextProvider } from '@/src/store/toast-context'
import { UserContextProvider } from '@/src/store/user-context'
import AppLogo from '@/src/components/app-logo'

import 'nprogress/nprogress.css'

const MAIN_COLOR = '#057A8B'

export const theme = extendTheme({
  // the code below matches BOSA style guide
  // edit to match your own style template
  components: {
    Button: {
      variants: {
        bosa: {
          color: MAIN_COLOR,
          borderWidth: '0.1875rem',
          borderColor: MAIN_COLOR,
          borderRadius: '0.5rem',
          backgroundColor: 'white',
          _hover: {
            backgroundColor: MAIN_COLOR,
            color: 'white'
          }
        }
      },
      defaultProps: {
        variant: 'bosa'
      }
    }
  },
  styles: {
    global: {
      body: {
        color: '#057A8B',
        fontSize: '16px'
      },
      a: {
        color: '#057A8B'
      }
    }
  }
})

const App = ({ Component, pageProps }: any): JSX.Element => {
  return (
    <>
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
            </UserContextProvider>
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
