import checkEnvironment from '@/util/check-environment'
import { AI4BelgiumIcon } from '@/src/components/navbar'
import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Spacer, Flex } from '@chakra-ui/react'
import LocaleSwitcher from '@/src/components/locale-switcher'

export const AI4BelgiumHeader = (): JSX.Element => {
  const url = `${checkEnvironment()}/login`
  return (
    <Box width='100%'>
      <Flex width='100%' alignItems='center' gap='2' p='2'>
        <AI4BelgiumIcon />
        <Spacer />
        <Flex alignItems='center'>
          <LocaleSwitcher />
        </Flex>
        <Breadcrumb opacity='0.75' px='3' py='5' fontWeight='medium' fontSize='lg'>
          <BreadcrumbItem>
            <BreadcrumbLink href='https://github.com/AI4Belgium/AI-Assessment-Tool'>Source</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href={url}>Demo</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Flex>
    </Box>
  )
}
