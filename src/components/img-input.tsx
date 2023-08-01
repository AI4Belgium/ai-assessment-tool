import React, { useEffect, useState } from 'react'
import {
  Box,
  Heading,
  Input,
  Stack,
  Text,
  Avatar,
  Flex
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { RiDeleteBin6Line } from 'react-icons/ri'
import { resizeImg } from '@/util/img'

export default function ImgInput ({ onChange, data, placeholder }: { onChange?: Function, data?: string, placeholder: string }): JSX.Element {
  const { t } = useTranslation()
  const [opacityImg, setOpacityImg] = useState<number>(1)
  const [dataBase64, setDataBase64] = useState<string>(data ?? '')
  const [disabled, setDisabled] = useState<boolean>(false)

  useEffect(() => {
    if (typeof onChange === 'function' && dataBase64?.length > 0 && data !== dataBase64) onChange(dataBase64)
    setDisabled(dataBase64 == null || dataBase64.length === 0)
  }, [dataBase64, onChange])

  useEffect(() => {
    setDataBase64((preval) => {
      if (data != null && data !== preval) return data
      return preval
    })
  }, [data])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e?.target?.files?.length != null) {
      const imageFile = e.target.files[0]
      const reader = new FileReader()
      reader.onload = function () {
        void resizeImg(reader.result as string, 300, 300)
          .then((resizedImg) => setDataBase64(resizedImg))
      }
      reader.readAsDataURL(imageFile)
    }
  }

  const deleteAvatar = (): void => {
    if (disabled) return
    setDataBase64('')
    if (typeof onChange === 'function') {
      onChange('')
    }
  }

  const Box2 = Box as any

  return (
    <Flex display='flex' justifyContent='center'>
      <Box position='relative' height='100px' width='100px' overflow='hidden'>
        <Box2
          display='flex'
          flexDirection='column'
          cursor='pointer'
          borderColor='gray.300'
          borderStyle='dashed'
          borderWidth='2px'
          borderRadius='50%'
          height='100%'
          width='100%'
          shadow='sm'
          role='group'
          transition='all 150ms ease-in-out'
          _hover={{
            shadow: 'md'
          }}
          initial='rest'
          animate='rest'
          overflow='hidden'
        >
          <Stack p='1' textAlign='center' spacing='1' alignItems='center' overflow='hidden' height='100%' width='100%'>
            <Heading fontSize='15' color='gray.700' fontWeight='bold'>
              {t('img-input:drop-images-caption')}
            </Heading>
            <Text fontWeight='light' fontSize='10'>{t('img-input:drop-images-caption2')}</Text>
          </Stack>
        </Box2>
        <Avatar src={dataBase64} name={placeholder} position='absolute' bottom='0' left='0' height='100%' width='100%' opacity={opacityImg} />
        <Input
          type='file'
          height='100%'
          width='100%'
          position='absolute'
          p='0'
          top='0'
          left='0'
          opacity='0'
          aria-hidden='true'
          accept='image/*'
          cursor='pointer'
          overflow='hidden'
          onPointerEnter={() => setOpacityImg(0.2)}
          onPointerLeave={() => setOpacityImg(1)}
          onChange={handleFile}
          borderRadius='full'
        />
      </Box>
      <Box alignSelf='flex-end'>
        <RiDeleteBin6Line color='var(--primary-color)' opacity={disabled ? 0.2 : 1} cursor={!disabled ? 'pointer' : ''} onClick={deleteAvatar} />
      </Box>
    </Flex>
  )
}
