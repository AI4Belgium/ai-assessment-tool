import checkEnvironment from '@/util/check-environment'
import AppLogo from '@/src/components/app-logo'
import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Spacer, Flex } from '@chakra-ui/react'
import LocaleSwitcher from '@/src/components/locale-switcher'

export const GITHUB_URL = 'https://github.com/AI4Belgium/ai-assessment-tool'

export const AI4BelgiumHeader = (): JSX.Element => {
  const url = `${checkEnvironment()}/login`
  return (
    <Box width='100%'>
      <Flex width='100%' alignItems='center' gap='2' p='2'>
        <AppLogo />
        <Spacer />
        <Flex alignItems='center'>
          <LocaleSwitcher />
        </Flex>
        <Breadcrumb opacity='0.75' px='3' py='5' fontWeight='medium' fontSize='lg'>
          <BreadcrumbItem>
            <BreadcrumbLink href={GITHUB_URL}>Source</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href={url}>Demo</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Flex>
    </Box>
  )
}
