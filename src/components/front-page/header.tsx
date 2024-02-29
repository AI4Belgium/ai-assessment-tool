import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Spacer, Flex } from '@chakra-ui/react'
import LocaleSwitcher from '@/src/components/locale-switcher'
import AppLogo from '@/src/components/app-logo'

export const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL

export const Header = (): JSX.Element => {
  return (
    <Box width='100%'>
      <Flex width='100%' alignItems='center' gap='2' p='2'>
        <AppLogo />
        <Spacer />
        <Flex alignItems='center'>
          <LocaleSwitcher />
        </Flex>
        <Breadcrumb opacity='0.75' px='3' py='5' fontWeight='medium' fontSize='lg'>
          {GITHUB_URL != null &&
            <BreadcrumbItem>
              <BreadcrumbLink href={GITHUB_URL}>Source</BreadcrumbLink>
            </BreadcrumbItem>}
          <BreadcrumbItem>
            <BreadcrumbLink href='/login'>Demo</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Flex>
    </Box>
  )
}
