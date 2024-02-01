import { useEffect, useState, useRef, useMemo, RefObject } from 'react'
import { useRouter } from 'next/router'
import { useCookies } from 'react-cookie'
import { Card } from '../types/card'

export const useOnScreen = (ref: RefObject<HTMLElement>, rootMargin: string = '0px'): boolean => {
  const [isIntersecting, setIntersecting] = useState(false)

  const observer = useMemo(() => new IntersectionObserver(
    ([entry]) => setIntersecting(entry.isIntersecting),
    { rootMargin, threshold: 1.0 }
  ), [ref])

  useEffect(() => {
    if (ref.current != null) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return isIntersecting
}

interface UseQueryCardIdReturnType {
  card: Card | null
  setCardQuery: (cardId: string, questionId?: string, commentId?: string) => Promise<void>
  unSetCardQuery: () => Promise<void>
}

export const useQueryCardId = (cards: Card[], cardSetCb?: Function, cardUnsetCb?: Function): UseQueryCardIdReturnType => {
  const router = useRouter()
  const [card, setCard] = useState<Card | null>(null)
  const { card: cardId } = router.query

  const setCardQuery = async (cardId: string, questionId?: string, commentId?: string): Promise<void> => {
    const query: any = { ...router.query }
    query.card = cardId
    if (questionId != null) query.question = questionId
    if (commentId != null) query.comment = commentId
    await router.push({ query }, undefined, { shallow: true })
  }

  const unSetCardQuery = async (): Promise<void> => {
    const query: any = { ...router.query }
    delete query.card
    delete query.question
    delete query.comment
    void router.push({ query }, undefined, { shallow: true })
  }

  useEffect(() => {
    if (cardId != null && Array.isArray(cards)) {
      const card = cards.find((card) => card._id === cardId)
      if (card != null) setCard(card)
      else void unSetCardQuery()
    } else if (cardId == null && card != null) setCard(null)
  }, [cardId, cards])

  useEffect(() => {
    if (card == null) {
      cardUnsetCb?.()
    } else {
      cardSetCb?.(card)
    }
  }, [card])

  return { card, setCardQuery, unSetCardQuery }
}

/**
 * Helps tracking the props changes made in a react functional component.
 *
 * Prints the name of the properties/states variables causing a render (or re-render).
 * For debugging purposes only.
 *
 * @usage You can simply track the props of the components like this:
 *  useRenderingTrace('MyComponent', props);
 *
 * @usage You can also track additional state like this:
 *  const [someState] = useState(null);
 *  useRenderingTrace('MyComponent', { ...props, someState });
 *
 * @param componentName Name of the component to display
 * @param propsAndStates
 * @param level
 *
 * @see https://stackoverflow.com/a/51082563/2391795
 */
export const useRenderingTrace = (componentName: string, propsAndStates: any, level: 'debug' | 'info' | 'log' = 'debug'): void => {
  const prev = useRef(propsAndStates)

  useEffect(() => {
    const changedProps: { [key: string]: { old: any, new: any } } = Object.entries(propsAndStates).reduce((property: any, [key, value]: [string, any]) => {
      if (prev.current[key] !== value) {
        property[key] = {
          old: prev.current[key],
          new: value
        }
      }
      return property
    }, {})

    if (Object.keys(changedProps).length > 0) {
      console[level](`[${componentName}] Changed props:`, changedProps)
    }

    prev.current = propsAndStates
  })
}

export const COOKIE_NAME = 'fedconsent'

export interface CookieConfig {
  id: string
  isDisabled: boolean
  isDefaultChecked: boolean
  isOptional?: boolean
}

export const COOKIE_CONFIG: CookieConfig[] = [
  {
    id: 'essential',
    isDisabled: true,
    isDefaultChecked: true
  },
  {
    id: 'functional',
    isDisabled: true,
    isDefaultChecked: true
  },
  {
    id: 'analytical',
    isDisabled: false,
    isDefaultChecked: false,
    isOptional: true
  }
]

export const useFedconsentCookie = (): any => {
  const defaultCookieValue: any = COOKIE_CONFIG.reduce((acc: any, curr) => {
    acc[curr.id] = curr.isDefaultChecked
    return acc
  }, {})

  const [cookies, setCookie, removeCookie] = useCookies([COOKIE_NAME])
  let { fedconsent }: { fedconsent?: any } = cookies
  const [cookieMemoryValue, setCookieMemoryValue] = useState(defaultCookieValue)

  function setOptionalCookies (allow = false): void {
    const newCookieValue: any = {
      ...cookieMemoryValue
    }

    for (const cookieConf of COOKIE_CONFIG) {
      if (cookieConf.isOptional === true) {
        newCookieValue[cookieConf.id] = allow
      }
    }
    setCookieMemoryValue(newCookieValue)
  }

  function allowOptionalCookies (): void {
    setOptionalCookies(true)
  }

  function denyOptionalCookies (): void {
    setOptionalCookies(false)
  }

  function setConsentValue (id: string, value: boolean): void {
    const newCookieValue: any = {
      ...cookieMemoryValue,
      [id]: value
    }
    setCookieMemoryValue(newCookieValue)
  }

  useEffect(() => {
    if (typeof fedconsent === 'string') {
      try {
        fedconsent = JSON.parse(fedconsent)
        for (const cookieConf of COOKIE_CONFIG) {
          if (fedconsent[cookieConf.id] == null) {
            throw new Error('Cookie value is not valid')
          }
        }
        setCookieMemoryValue(fedconsent)
      } catch (e) {
        removeCookie(COOKIE_NAME)
      }
    }
  }, [fedconsent])

  function saveFedconsentCookie (): void {
    setCookie(COOKIE_NAME, cookieMemoryValue, {
      path: '/',
      maxAge: 60 * 60 * 24 * 90 // 90 days
    })
  }

  return {
    saveFedconsentCookie,
    setOptionalCookies,
    allowOptionalCookies,
    denyOptionalCookies,
    setConsentValue,
    COOKIE_CONFIG,
    cookieMemoryValue,
    fedconsentCookieBrowserValue: fedconsent
  }
}