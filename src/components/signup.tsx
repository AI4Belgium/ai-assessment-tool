import React, { useEffect, useState, useMemo, useContext, MouseEvent } from 'react'
import {
  Flex,
  Box,
  FormControl,
  Input,
  Button,
  Image,
  Link,
  Text,
  InputGroup,
  InputRightElement,
  IconButton
} from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { AI4BelgiumIcon } from '@/src/components/navbar'
import { defaultFetchOptions, getResponseHandler } from '@/util/api'
import { isEmpty, debounce } from '@/util/index'
import { isEmailValid, isPasswordValid } from '@/util/validator'
import ToastContext from '@/src/store/toast-context'
import { useTranslation } from 'next-i18next'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

const SignUp = (): JSX.Element => {
  const { t } = useTranslation()
  const router = useRouter()
  const { showToast } = useContext(ToastContext)
  let email: string | null = router.query.email as string
  email = isEmpty(email) ? null : decodeURIComponent(email)
  const token = router.query.token as string
  const [values, setValues] = useState({
    email: email ?? '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  })

  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false
  })

  const [touched, setTouched] = useState({
    email: false,
    password: false,
    firstName: false,
    lastName: false,
    confirmPassword: false
  })
  const [isCreating, setIsCreatingStatus] = useState(false)
  const [emailErr, setEmailErr] = useState(false)
  const [passwordLengthErr, setPasswordLengthErr] = useState(false)
  const [passwordCharErr, setPasswordCharErr] = useState(false)
  const [confirmPasswordErr, setConfirmPasswordErr] = useState(false)
  const [isButtonDisabled, setButtonState] = useState(true)

  const responseHandler = getResponseHandler(showToast, t)
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
    const hasErrors = emailErr || passwordLengthErr || passwordCharErr || confirmPasswordErr ||
      isEmpty(values.email) || isEmpty(values.password) || isEmpty(values.confirmPassword) ||
      isEmpty(values.firstName) || isEmpty(values.lastName)
    setButtonState(hasErrors)
  }, [values.password, values.confirmPassword, values.firstName, values.lastName, values.email, emailErr, passwordLengthErr, passwordCharErr, confirmPasswordErr])

  const _showToast = (): void => {
    showToast({
      position: 'top',
      title: t('signup:account-created-title'),
      description: t('signup:account-created-description'),
      status: 'success',
      duration: 2500,
      isClosable: true
    })
  }

  const registerUser = async (e: MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault()
    setIsCreatingStatus(true)
    const { email, password, confirmPassword, firstName, lastName } = values
    const data: any = {
      email,
      password,
      confirmPassword,
      firstName,
      lastName
    }
    if (token != null) data.token = token

    const url = '/api/auth/signup'

    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: 'POST',
      body: JSON.stringify(data)
    })

    if (response.ok) {
      const result = await response.json()
      if (result.code === 9005) {
        return await redirectToLoginPage()
      }
    }
    await responseHandler(response)
    setIsCreatingStatus(false)
  }

  const redirectToLoginPage = async (path = '/login'): Promise<void> => {
    _showToast()
    await new Promise((resolve) => setTimeout(resolve, 3000))
    await router.push({
      pathname: path,
      query: {
        email: encodeURIComponent(values.email)
      }
    })
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

  // eslint-disable @typescript-eslint/no-misused-promises
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
          width={['80%', '60%', '400px', '400px']}
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
            <h1>{t('buttons:sign-up')}</h1>
          </Box>
          <Box my={4} textAlign='left'>
            <FormControl isRequired isInvalid={emailErr}>
              <Input
                type='email'
                name='email'
                value={values.email}
                placeholder={`${t('placeholders:email')}`}
                onChange={(e) => { void handleChange(e) }}
                onBlur={() => setTouched({ ...touched, email: true })}
                autoComplete='off'
              />
              {emailErr && <Text size='xs' color='red'>{t('validations:invalid-email')}</Text>}
            </FormControl>
            <FormControl my='4' isRequired>
              <Input
                type='text'
                name='firstName'
                value={values.firstName}
                placeholder={`${t('placeholders:first-name')}`}
                onChange={(e) => { void handleChange(e) }}
                onBlur={() => setTouched({ ...touched, firstName: true })}
                autoComplete='off'
              />
            </FormControl>
            <FormControl my='4' isRequired>
              <Input
                type='text'
                name='lastName'
                value={values.lastName}
                placeholder={`${t('placeholders:last-name')}`}
                onChange={(e) => { void handleChange(e) }}
                onBlur={() => setTouched({ ...touched, lastName: true })}
                autoComplete='off'
              />
            </FormControl>
            <FormControl my='4' isInvalid={passwordLengthErr || passwordCharErr} isRequired>
              <InputGroup>
                <Input
                  type={showPasswords.password ? 'text' : 'password'}
                  name='password'
                  value={values.password}
                  placeholder={`${t('placeholders:create-password')}`}
                  onBlur={() => setTouched({ ...touched, password: true })}
                  onChange={(e) => { void handleChange(e) }}
                />
                <InputRightElement>
                  <IconButton
                    size='sm'
                    aria-label={showPasswords.password ? 'Hide password' : 'Show password'}
                    icon={showPasswords.password ? <ViewIcon /> : <ViewOffIcon />}
                    onClick={() => setShowPasswords({ ...showPasswords, password: !showPasswords.password })}
                  />
                </InputRightElement>
              </InputGroup>
              {passwordLengthErr && <Text size='xs' color='red'>{t('validations:password-too-short')}</Text>}
              {passwordCharErr && <Text size='xs' color='red'>{t('validations:include-special-character-and-number')}</Text>}
            </FormControl>
            <FormControl my='4' isInvalid={confirmPasswordErr} isRequired>
              <InputGroup>
                <Input
                  type={showPasswords.confirmPassword ? 'text' : 'password'}
                  name='confirmPassword'
                  value={values.confirmPassword}
                  placeholder={`${t('placeholders:confirm-password')}`}
                  onChange={(e) => { void handleChange(e) }}
                  onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                />
                <InputRightElement>
                  <IconButton
                    size='sm'
                    aria-label={showPasswords.password ? 'Hide confirm password' : 'Show confirm password'}
                    icon={showPasswords.confirmPassword ? <ViewIcon /> : <ViewOffIcon />}
                    onClick={() => setShowPasswords({ ...showPasswords, confirmPassword: !showPasswords.confirmPassword })}
                  />
                </InputRightElement>
              </InputGroup>
              {confirmPasswordErr && <Text size='xs' color='red'>{t('validations:passwords-unmatch')}</Text>}
            </FormControl>
            <Button
              width='full'
              mt={4}
              variant='bosa'
              colorScheme='gray'
              disabled={isButtonDisabled}
              onClick={(e) => { void registerUser(e) }}
              isLoading={isCreating}
              loadingText={`${t('signup:registering')}`}
            >
              {t('buttons:sign-up')}
            </Button>
            <Box m='5' textAlign='center'>
              <Link href='/login' color='brand' p='2'>
                {t('links:already-have-account-log-in')}
              </Link>
            </Box>
          </Box>
        </Box>
      </Flex>
    </>
  )
}

export default SignUp
