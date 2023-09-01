import React, { useEffect, useState, useMemo, useContext, MouseEvent } from 'react'
import {
  Flex,
  Box,
  FormControl,
  Input,
  Button,
  Image,
  Link,
  Text
} from '@chakra-ui/react'
import isEmpty from 'lodash.isempty'
import { useRouter } from 'next/router'
import { AI4BelgiumIcon } from './navbar'
import { defaultFetchOptions } from '@/util/api'
import { debounce } from '@/util/index'
import { isPasswordValid, isEmailValid } from '@/util/validator'
import { signOut, useSession } from 'next-auth/react'
import ToastContext from '../store/toast-context'
import { useTranslation } from 'next-i18next'

const ResetPassword = (props: any): JSX.Element => {
  const { t } = useTranslation()
  const { showToast } = useContext(ToastContext)
  const router = useRouter()
  const session = useSession()
  const [values, setValues] = useState({
    password: '',
    confirmPassword: '',
    email: ''
  })
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
    email: false
  })
  const [isCreating, setIsCreatingStatus] = useState(false)
  // const [hasError, setErrorState] = useState(false)
  const [emailErr, setEmailErr] = useState(false)
  const [passwordLengthErr, setPasswordLengthErr] = useState(false)
  const [passwordCharErr, setPasswordCharErr] = useState(false)
  const [confirmPasswordErr, setConfirmPasswordErr] = useState(false)
  const [isButtonDisabled, setButtonState] = useState(true)

  useEffect(() => {
    if (!touched.email) return
    setEmailErr(!isEmailValid(values.email))
  }, [values.email, touched.email])

  useEffect(() => {
    if (!touched.password || !touched.confirmPassword) return
    if (values.password?.length > 0 && values.confirmPassword?.length > 0 && values.confirmPassword !== values.password) {
      setConfirmPasswordErr(true)
    } else {
      setConfirmPasswordErr(false)
    }
  }, [values.password, values.confirmPassword, touched.password, touched.confirmPassword])

  useEffect(() => {
    if (!touched.password) return
    const isTooShort = values.password?.length < 8
    setPasswordLengthErr(isTooShort)
    setPasswordCharErr(!isPasswordValid(values.password))
  }, [values.password, touched.password])

  useEffect(() => {
    let hasErrors = false
    if (props.token != null) {
      hasErrors = passwordLengthErr || passwordCharErr || confirmPasswordErr ||
        isEmpty(values.password) || isEmpty(values.confirmPassword)
    } else {
      hasErrors = emailErr || isEmpty(values.email)
    }
    setButtonState(hasErrors)
  }, [values.password, values.confirmPassword, passwordLengthErr, passwordCharErr, confirmPasswordErr, props.token, values.email, emailErr])

  useEffect(() => {
    if (session?.data?.user != null) void signOut()
  }, [session?.data?.user])

  useEffect(() => {
    if (props.message != null && props.message.length > 0) {
      showToast({
        title: props.message,
        status: 'error',
        duration: null
      })
    }
  }, [props.message])

  const resetPassword = async (e: MouseEvent): Promise<void> => {
    e.preventDefault()
    setIsCreatingStatus(true)
    const token = props.token
    const { password, email } = values
    let data: any = { email }
    if (props.token != null) {
      data = {
        password,
        token
      }
    }

    const url = '/api/auth/reset-password'

    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: 'POST',
      body: JSON.stringify(data)
    })

    if (response.ok) {
      const result = await response.json()
      const msg = t([`api-messages:${String(result.code)}`, 'code'])
      showToast({
        title: msg,
        status: 'success',
        duration: 5000,
        onCloseComplete: async () => await router.push('/login')
      })
    } else {
      try {
        const result = await response.json()
        const msg = t([`api-messages:${String(result.code)}`, 'code'])
        showToast({
          title: msg,
          status: 'error',
          duration: null
        })
      } catch (e: any) {
        showToast({
          title: t('exceptions:something-went-wrong'),
          status: 'error',
          duration: null
        })
      }
    }
    setIsCreatingStatus(false)
  }

  const setPropTouched = (prop: string): void => {
    setTouched({
      ...touched,
      [prop]: true
    })
  }
  const setPropTouchedDebounced = useMemo(() => debounce(setPropTouched, 1000), [touched])

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const { name, value } = e.target
    setValues({
      ...values,
      [name]: value
    })
    setPropTouchedDebounced(name)
  }

  const startResetPasswordContent = (
    <Box my={4} textAlign='left'>
      <FormControl my='4' isInvalid={emailErr} isRequired>
        <Input
          type='text'
          name='email'
          value={values.email}
          placeholder={`${t('placeholders:email')}`}
          onBlur={() => setTouched({ ...touched, password: true })}
          onChange={(e) => { void handleChange(e) }}
        />
        {emailErr && <Text size='xs' color='red'>{t('validations:invalid-email')}</Text>}
      </FormControl>
      <Button
        fontWeight='semibold'
        width='full'
        mt={4}
        disabled={isButtonDisabled}
        bg='success'
        color='white'
        onClick={(e) => { void resetPassword(e) }}
        isLoading={isCreating}
        loadingText={`${t('reset-password:submitting')}`}
      >
        {t('buttons:submit')}
      </Button>
    </Box>
  )

  const resetPasswordContent = (
    <Box my={4} textAlign='left'>
      <FormControl my='4' isInvalid={passwordLengthErr || passwordCharErr} isRequired>
        <Input
          type='password'
          name='password'
          value={values.password}
          placeholder={`${t('placeholders:new-password')}`}
          onBlur={() => setTouched({ ...touched, password: true })}
          onChange={(e) => { void handleChange(e) }}
        />
        {passwordLengthErr && <Text size='xs' color='red'>{t('validations:password-too-short')}</Text>}
        {passwordCharErr && <Text size='xs' color='red'>{t('validations:include-special-character-and-number')}</Text>}
      </FormControl>
      <FormControl my='4' isInvalid={confirmPasswordErr} isRequired>
        <Input
          type='password'
          name='confirmPassword'
          value={values.confirmPassword}
          placeholder={`${t('placeholders:confirm-password')}`}
          onChange={(e) => { void handleChange(e) }}
          onBlur={() => setTouched({ ...touched, confirmPassword: true })}
        />
        {confirmPasswordErr && <Text size='xs' color='red'>{t('validations:passwords-unmatch')}</Text>}
      </FormControl>
      <Button
        fontWeight='semibold'
        width='full'
        mt={4}
        disabled={isButtonDisabled}
        bg='success'
        color='white'
        onClick={(e) => { void resetPassword(e) }}
        isLoading={isCreating}
        loadingText={`${t('reset-password:resetting')}`}
      >
        {t('reset-password:reset-password')}
      </Button>
    </Box>
  )

  return (
    <>
      <Box display='flex' alignItems='center' justifyContent='center'>
        <Link href='/'><AI4BelgiumIcon /></Link>
      </Box>
      <Flex
        alignItems='center'
        flexDirection={['column', 'column', 'row', 'row']}
        justifyContent='center'
      >
        <Image
          position='absolute'
          bottom='5%'
          left='5%'
          src='/signup/sign-up-left.svg'
          alt=' team work illustration'
          width={[0, '25%']}
        />
        <Image
          position='absolute'
          bottom='5%'
          right='5%'
          src='/signup/sign-up-right.svg'
          alt='work together illustration'
          width={[0, '25%']}
          borderRadius='3px'
        />
        <Box
          p='25px 40px'
          width={['80%', '60%', '45%', '25%']}
          borderRadius='3px'
          bg='white'
          boxShadow='rgb(0 0 0 / 10%) 0 0 10px'
        >
          <Box
            textAlign='center'
            color='#5E6C84'
            mt='5'
            mb='25'
            fontSize={['10px', '10px', '15px', '15px']}
            fontWeight='semibold'
            lineHeight='normal'
          >
            <h1>{t('reset-password:reset-password')}</h1>
          </Box>
          {props.token == null ? startResetPasswordContent : resetPasswordContent}
        </Box>
      </Flex>
    </>
  )
}

export default ResetPassword
