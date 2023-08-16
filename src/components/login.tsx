import React, { KeyboardEvent, MouseEvent, useContext, useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import {
  Flex,
  Box,
  FormControl,
  Input,
  Button,
  Image,
  Link,
  InputGroup,
  InputRightElement,
  IconButton
} from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { AI4BelgiumIcon } from './navbar'
import { isEmailValid } from '@/util/validator'
import { isEmpty } from '@/util/index'
import ToastContext from '@/src/store/toast-context'
import { useTranslation } from 'next-i18next'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

const color = '#057A8B'

const Login = ({ onSubmit }: { onSubmit?: Function }): JSX.Element => {
  const { t } = useTranslation()
  const { showToast } = useContext(ToastContext)
  const [disabled, setDisabled] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const router = useRouter()
  let { email: emailQuery, token, projectId } = router.query

  emailQuery = isEmpty(emailQuery) ? undefined : decodeURIComponent(emailQuery as string)

  const [values, setValues] = useState({
    email: emailQuery ?? '',
    password: ''
  })

  const [showPassword, setShowPassword] = useState(false)

  const handleClick = (e: MouseEvent): void => {
    e.preventDefault()
    setShowPassword(!showPassword)
  }

  useEffect(() => {
    setDisabled(isEmpty(values.email) || isEmpty(values.password))
  }, [values.email, values.password])

  const loginUser = async (e?: MouseEvent): Promise<void> => {
    e?.preventDefault()
    if (!isEmailValid(values.email)) {
      showToast({
        title: t('validations:invalid-email'),
        description: t('validations:enter-valid-email-address'),
        status: 'error'
      })
      return
    }
    setIsFetching(true)

    const signinOptions: any = {
      redirect: false,
      email: values.email,
      password: values.password
    }
    if (token != null) signinOptions.token = token
    if (projectId != null) signinOptions.projectId = projectId
    let result = null
    if (onSubmit != null) result = onSubmit(signinOptions)
    else result = await signIn('credentials', signinOptions)

    setIsFetching(false)
    if (result?.ok === true) {
      await router.push('/home')
    } else {
      if (result?.status === 404 || result?.status === 401) {
        showToast({
          title: t('validations:invalid-credentials'),
          description: t('validations:check-email-and-password'),
          status: 'error'
        })
      } else {
        showToast({
          title: t('exceptions:something-went-wrong'),
          description: t('exceptions:try-again-later'),
          status: 'error'
        })
      }
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const { name, value } = e.target
    setValues({
      ...values,
      [name]: value
    })
  }

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!disabled) void loginUser()
    }
  }

  /* eslint-disable @typescript-eslint/no-misused-promises */
  return (
    <>
      <Box display='flex' justifyContent='center' alignItems='center' my='40px'>
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
          src='/login/left.svg'
          alt=' new user illustration'
          width={[0, '30%']}
        />
        <Image
          position='absolute'
          bottom='5%'
          right='5%'
          src='/login/right.svg'
          alt='task scheduler illustration'
          width={[0, '30%']}
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
            fontSize={['16px', '16px', '20px', '20px']}
            fontWeight='semibold'
            lineHeight='normal'
          >
            <h1>{t('buttons:log-in')}</h1>
          </Box>
          <Box my={4} textAlign='left'>
            <form>
              <FormControl>
                <Input
                  type='email'
                  name='email'
                  value={values.email}
                  placeholder={`${t('placeholders:email')}`}
                  onChange={handleChange}
                  autoComplete='off'
                  data-testid='email'
                  onKeyDown={handleKeyDown}
                />

              </FormControl>
              <FormControl mt={6}>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name='password'
                    value={values.password}
                    placeholder={`${t('placeholders:password')}`}
                    autoComplete='off'
                    onChange={handleChange}
                    data-testid='password'
                    onKeyDown={handleKeyDown}
                  />
                  <InputRightElement>
                    <IconButton
                      size='sm'
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      icon={showPassword ? <ViewIcon /> : <ViewOffIcon />}
                      onClick={handleClick}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <Button
                width='full'
                mt={4}
                bg='success'
                name='login'
                fontWeight='600'
                onClick={loginUser}
                isLoading={isFetching}
                loadingText={`${t('login:logging')}`}
                disabled={disabled}
                color={color}
                borderWidth='0.1875rem'
                borderColor={color}
                borderRadius='0.5rem'
                backgroundColor='white'
                _hover={{
                  backgroundColor: color,
                  color: 'white'
                }}
              >
                {t('buttons:sign-in')}
              </Button>
              <Box m='5' textAlign='center'>
                <Link href='/signup' p='2' display='block'>
                  {t('links:sign-up-caption')}
                </Link>
                <Link href='/reset-password' p='2'>
                  {t('links:forget-password')}
                </Link>
              </Box>
            </form>
          </Box>
        </Box>
      </Flex>
    </>
  )
}

export default Login
