import { Select } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { useCookies } from 'react-cookie'

const lngs = [
  { key: 'en', name: 'English' },
  { key: 'fr', name: 'Français' },
  { key: 'nl', name: 'Nederlands' }
]

const COOKIE_NAME = 'NEXT_LOCALE'

export default function LocaleSwitcher (): JSX.Element {
  const router = useRouter()
  const [,setCookie] = useCookies([COOKIE_NAME])

  const handleOnChange = (locale: string): void => {
    // push new locale into a cookie so it can be overwritten and used on middleware
    setCookieWrapper(locale)
    void router.push(router.asPath, router.asPath, { locale })
  }

  const setCookieWrapper = (lang: string): void => {
    setCookie(COOKIE_NAME, lang, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365 * 10 // 10 years
    })
  }

  return (
    <span>
      <Select size='xs' onChange={(e) => handleOnChange(e.target.value)} value={router.locale}>
        {lngs?.map((locale) => (
          <option key={locale.key} value={locale.key}>
            {locale.name}
          </option>
        ))}
      </Select>
    </span>
  )
}
