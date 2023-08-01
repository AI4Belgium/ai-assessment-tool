import React, { useContext } from 'react'
import {
  Box, Button
} from '@chakra-ui/react'
//  import { ChevronRightIcon } from '@chakra-ui/icons'
import ProjectContext from '@/src/store/project-context'
import { useRouter } from 'next/router'
import { QueryFilterKeys } from '@/src/components/project/project-bar/filter-menu'
import { Category } from '@/src/types/project'

interface Props {
  categories: Category[]
}

const ChecklistTopBar = (props: Props): JSX.Element => {
  const router = useRouter()
  const { [QueryFilterKeys.CATEGORY]: selectedCategoryId } = router.query ?? {}
  const context = useContext(ProjectContext)

  const content = Array.isArray(props.categories)
    ? props.categories.map(cat => (
      <Button
        display='flex'
        flexDirection='column'
        justifyContent='space-between'
        boxSizing='border-box'
        key={cat.key}
        mt='5px'
        mb='5px'
        height='4rem'
        padding='0'
        paddingTop='0.5rem'
        lineHeight={['12px', '12px', '12px', '12px', '16px']}
        fontSize={['10px', '10px', '10px', '10px', '12px']}
        borderRadius='0'
        borderWidth='0'
        maxW={['100px', '100px', 'unset']}
        className='capitalize whitespace-normal'
        bgColor={cat._id === selectedCategoryId ? 'var(--secondary-color)' : 'white'}
        color={cat._id === selectedCategoryId ? 'var(--primary-color)' : 'var(--text-secondary)'}
        // border='4px solid transparent'
        whiteSpace='normal'
        _hover={{ bg: 'var(--secondary-color)' }}
        _focus={{ boxShadow: 'none' }}
        onClick={() => context.categoryClickHandler(cat)}
      >
        {/* <Box display='block' height='4px' width='100%' backgroundColor='transparent' /> */}
        <Box paddingX='0.5rem' display='block' boxSizing='border-box'>{cat.name}</Box>
        <Box display='block' height='4px' width='100%' backgroundColor={cat._id === selectedCategoryId ? 'var(--primary-color)' : 'transparent'} />
      </Button>
    ))
    : null

  return (
    <Box display='flex' flexWrap={['wrap', 'wrap', 'initial']} mt={['0.5rem', '0.5rem', '1rem']} className='print:hidden'>
      {content}
    </Box>
  )
}

export default ChecklistTopBar
