import React, { useState, useEffect, useContext, MouseEvent } from 'react'
import {
  Box, Heading, FormControl, Button,
  Input,
  Text,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { defaultFetchOptions } from '@/util/api'
import isEmpty from 'lodash.isempty'
import { isPasswordValid } from '@/util/validator'
import UserContext from '../../store/user-context'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

const ORIGINAL_STATE = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
}

const ORIGINAL_TOUCHED_AND_SHOW = {
  currentPassword: false,
  newPassword: false,
  confirmPassword: false
}

const PasswordSettings = (): JSX.Element => {
  const { t } = useTranslation()
  const toast = useToast()
  const { user } = useContext(UserContext)
  const [isLoading, setIsLoading] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const [passwordLengthErr, setPasswordLengthErr] = useState(false)
  const [passwordCharErr, setPasswordCharErr] = useState(false)
  const [confirmPasswordErr, setConfirmPasswordErr] = useState(false)
  const [touched, setTouched] = useState({ ...ORIGINAL_TOUCHED_AND_SHOW })
  const [values, setValues] = useState({ ...ORIGINAL_STATE })
  const [showPasswords, setShowPasswords] = useState({ ...ORIGINAL_TOUCHED_AND_SHOW })

  useEffect(() => {
    if (!touched.newPassword) return
    setPasswordLengthErr(values.newPassword?.length < 8)
    setPasswordCharErr(!isPasswordValid(values.newPassword))
  }, [values.newPassword, touched.newPassword])

  useEffect(() => {
    if (!touched.newPassword || !touched.confirmPassword) return
    setConfirmPasswordErr(values.newPassword?.length > 0 && values.confirmPassword?.length > 0 && values.confirmPassword !== values.newPassword)
  }, [values.newPassword, touched.newPassword, values.confirmPassword, touched.confirmPassword])

  useEffect(() => {
    const isDisabled = isEmpty(values.confirmPassword) || isEmpty(values.currentPassword) || isEmpty(values.newPassword) ||
      passwordLengthErr || passwordCharErr || confirmPasswordErr
    setIsDisabled(isDisabled)
  }, [values.confirmPassword, values.currentPassword, values.newPassword, passwordLengthErr, passwordCharErr, confirmPasswordErr])

  const setTouchedWrapper = (field: string, waitTimeMS = 0): void => {
    if ((touched as any)[field] !== true) {
      waitTimeMS > 0
        ? setTimeout(() => setTouchedWrapper(field, 0), waitTimeMS)
        : setTouched({ ...touched, [field]: true })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setValues({ ...values, [name]: value })
    setTouchedWrapper(name, 800)
  }

  const changePassword = async (e: MouseEvent): Promise<void> => {
    e.preventDefault()
    setIsLoading(true)
    const { currentPassword, confirmPassword, newPassword } = values
    const data: any = {
      currentPassword,
      confirmPassword,
      newPassword
    }
    const url = `/api/users/${String(user?._id)}/password`
    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: 'PATCH',
      body: JSON.stringify(data)
    })
    const toastDefaultOptions: any = {
      position: 'top',
      duration: 2500,
      isClosable: true
    }

    if (response.ok) {
      toast({
        ...toastDefaultOptions,
        title: t('settings:password-change-success-message'),
        status: 'success'
      })
      setValues({ ...ORIGINAL_STATE })
      setTouched({ ...ORIGINAL_TOUCHED_AND_SHOW })
    } else {
      toast({
        ...toastDefaultOptions,
        title: t('settings:password-change-error-message'),
        status: 'error'
      })
    }
    setIsLoading(false)
  }

  return (
    <Box p='2' height='fit-content' minW={300}>
      <Heading size='md'>{t('settings:change-password')}</Heading>
      <FormControl my='4' isRequired>
        <InputGroup>
          <Input
            type={showPasswords.currentPassword ? 'text' : 'password'}
            name='currentPassword'
            value={values.currentPassword}
            placeholder={`${t('placeholders:current-password')}`}
            onBlur={() => setTouched({ ...touched, currentPassword: true })}
            onChange={handleChange}
          />
          <InputRightElement>
            <IconButton
              size='sm'
              aria-label={showPasswords.currentPassword ? 'Hide password' : 'Show password'}
              icon={showPasswords.currentPassword ? <ViewIcon /> : <ViewOffIcon />}
              onClick={() => setShowPasswords({ ...showPasswords, currentPassword: !showPasswords.currentPassword })}
            />
          </InputRightElement>
        </InputGroup>
      </FormControl>
      <FormControl my='4' isInvalid={passwordLengthErr || passwordCharErr} isRequired>
        <InputGroup>
          <Input
            type={showPasswords.newPassword ? 'text' : 'password'}
            name='newPassword'
            value={values.newPassword}
            placeholder={`${t('placeholders:new-password')}`}
            onBlur={() => setTouched({ ...touched, newPassword: true })}
            onChange={handleChange}
          />
          <InputRightElement>
            <IconButton
              size='sm'
              aria-label={showPasswords.newPassword ? 'Hide password' : 'Show password'}
              icon={showPasswords.newPassword ? <ViewIcon /> : <ViewOffIcon />}
              onClick={() => setShowPasswords({ ...showPasswords, newPassword: !showPasswords.newPassword })}
            />
          </InputRightElement>
        </InputGroup>
        <Text noOfLines={3} fontSize='xs' color='red.500'>
          {passwordLengthErr && t('validations:password-length')}
          <br />
          {passwordCharErr && t('validations:password-must-contain-number-and-special')}
        </Text>
      </FormControl>
      <FormControl my='4' isInvalid={confirmPasswordErr} isRequired>
        <InputGroup>
          <Input
            type={showPasswords.confirmPassword ? 'text' : 'password'}
            name='confirmPassword'
            value={values.confirmPassword}
            placeholder={`${t('placeholders:confirm-password')}`}
            onChange={handleChange}
            onBlur={() => setTouchedWrapper('confirmPassword', 0)}
          />
          <InputRightElement>
            <IconButton
              size='sm'
              aria-label={showPasswords.confirmPassword ? 'Hide password' : 'Show password'}
              icon={showPasswords.confirmPassword ? <ViewIcon /> : <ViewOffIcon />}
              onClick={() => setShowPasswords({ ...showPasswords, confirmPassword: !showPasswords.confirmPassword })}
            />
          </InputRightElement>
        </InputGroup>
        <Text noOfLines={1} fontSize='xs' color='red.500'>
          {confirmPasswordErr && t('validations:passwords-unmatch')}
        </Text>
      </FormControl>
      <Button
        fontWeight='semibold'
        width='full'
        mt={4}
        disabled={isDisabled}
        bg='success'
        color='white'
        onClick={changePassword} // eslint-disable-line @typescript-eslint/no-misused-promises
        isLoading={isLoading}
        loadingText={`${t('settings:updating')}`}
      >
        {t('buttons:update')}
      </Button>
    </Box>
  )
}

export default PasswordSettings
