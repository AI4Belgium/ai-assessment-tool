import React, { useState, useEffect, useContext, MouseEvent } from 'react'
import {
  Box, Heading, FormControl, Button,
  FormLabel,
  Input,
  Text
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { defaultFetchOptions } from '@/util/api'
import isEmpty from 'lodash.isempty'
import UserContext from '@/src/store/user-context'
import ImgInput from '../img-input'
import { resizeImg } from '@/util/img'
import ToastContext from '@/src/store/toast-context'

const Profile = (): JSX.Element => {
  const { t } = useTranslation()
  const { showToast } = useContext(ToastContext)
  const { user, triggerReloadUser } = useContext(UserContext)
  const [isLoading, setIsLoading] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const [firstNameErr, setFirstNameErr] = useState(false)
  const [lastNameErr, setLastNameErr] = useState(false)
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    organization: false,
    department: false,
    role: false,
    avatar: false
  })
  const [values, setValues] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    organization: user?.organization ?? '',
    department: user?.department ?? '',
    role: user?.role ?? '',
    avatar: user?.avatar ?? ''
  })

  useEffect(() => {
    if (user == null) return
    setValues({
      firstName: user?.firstName,
      lastName: user?.lastName,
      avatar: user?.avatar ?? '',
      organization: user?.organization ?? '',
      department: user?.department ?? '',
      role: user?.role ?? ''
    })
  }, [user])

  useEffect(() => {
    const isDisabled = isEmpty(values.firstName) || isEmpty(values.lastName) || firstNameErr || lastNameErr
    setIsDisabled(isDisabled)
  }, [values.firstName, values.lastName, firstNameErr, lastNameErr])

  useEffect(() => {
    if (!touched.firstName) return
    setFirstNameErr(values.firstName?.length < 2)
  }, [values.firstName, touched.firstName])

  useEffect(() => {
    if (!touched.lastName) return
    setLastNameErr(values.lastName?.length < 2)
  }, [values.lastName, touched.lastName])

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

  const handleTouch = (e: React.FocusEvent<HTMLInputElement>): void => {
    const { name } = e.target
    setTouched({ ...touched, [name]: true })
  }

  const updateProfile = async (e: MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault()
    setIsLoading(true)
    const data: any = {
      ...values
    }
    // avoid heavy request payload
    if (user?.avatar === data.avatar) delete data.avatar
    else if (data.avatar != null && data.avatar !== '') {
      data.xsAvatar = await resizeImg(data.avatar, 100, 100)
    } else if (data.avatar === '') {
      data.xsAvatar = ''
    }
    const url = `/api/users/${String(user?._id)}`
    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: 'PATCH',
      body: JSON.stringify(data)
    })

    if (response.ok) {
      showToast({
        title: t('settings:profile-updated-success-message'),
        status: 'success'
      })
      triggerReloadUser()
    } else {
      showToast({
        title: t('settings:profile-updated-error-message'),
        status: 'error'
      })
    }
    setIsLoading(false)
  }

  return (
    <Box p='2' height='fit-content' minW={300}>
      <Heading size='md'>{t('settings:profile')}</Heading>
      <FormControl my='4' isRequired isInvalid={firstNameErr}>
        <FormLabel fontSize='xs' pl='1' color='var(--text-grey)'>{t('settings:first-name')}</FormLabel>
        <Input
          type='text'
          name='firstName'
          value={values.firstName}
          placeholder={`${t('placeholders:first-name')}`}
          onBlur={handleTouch}
          onChange={handleChange}
        />
        <Text noOfLines={1} fontSize='xs' color='red.500'>
          {firstNameErr && `${t('validations:first-name-required')}`}
        </Text>
      </FormControl>
      <FormControl my='4' isInvalid={lastNameErr} isRequired>
        <FormLabel fontSize='xs' pl='1' color='var(--text-grey)'>{t('settings:last-name')}</FormLabel>
        <Input
          type='text'
          name='lastName'
          value={values.lastName}
          placeholder={`${t('placeholders:last-name')}`}
          onBlur={handleTouch}
          onChange={handleChange}
        />
        <Text noOfLines={1} fontSize='xs' color='red.500'>
          {lastNameErr && `${t('validations:last-name-required')}`}
        </Text>
      </FormControl>
      <FormControl my='4'>
        <FormLabel fontSize='xs' pl='1' color='var(--text-grey)'>{t('settings:company-affiliation-organization')}</FormLabel>
        <Input
          type='text'
          name='organization'
          value={values.organization}
          onBlur={handleTouch}
          onChange={handleChange}
        />
      </FormControl>
      <FormControl my='4'>
        <FormLabel fontSize='xs' pl='1' color='var(--text-grey)'>{t('settings:department-team')}</FormLabel>
        <Input
          type='text'
          name='department'
          value={values.department}
          onBlur={handleTouch}
          onChange={handleChange}
        />
      </FormControl>
      <FormControl my='4' size='xs'>
        <FormLabel fontSize='xs' pl='1' color='var(--text-grey)'>{t('settings:role-title')}</FormLabel>
        <Input
          type='text'
          name='role'
          value={values.role}
          onBlur={handleTouch}
          onChange={handleChange}
        />
      </FormControl>
      <FormControl my='4'>
        <FormLabel fontSize='xs' pl='1' color='var(--text-grey)'>Avatar</FormLabel>
        <ImgInput
          data={values.avatar}
          onChange={(base64Data: string) => setValues({ ...values, avatar: base64Data })}
          placeholder={user != null ? `${String(user.firstName)} ${String(user.lastName)}` : ''}
        />
      </FormControl>
      <Button
        fontWeight='semibold'
        width='full'
        mt={4}
        disabled={isDisabled}
        bg='success'
        color='white'
        onClick={updateProfile} // eslint-disable-line @typescript-eslint/no-misused-promises
        isLoading={isLoading}
        loadingText={`${t('settings:updating')}`}
      >
        {t('buttons:update')}
      </Button>
    </Box>
  )
}

export default Profile
