import { Link } from '@chakra-ui/react'

const color = '#057A8B'

export const LinkButton = ({ link, label }: { link: string, label: string }): JSX.Element => {
  return (
    <Link
      href={link}
      fontSize={['1.25rem', '1.5625rem']}
      fontWeight='600'
      color={color}
      target='blank'
      padding='0.625rem 2.1875rem'
      className='button nav-link'
      borderWidth='0.1875rem'
      borderColor={color}
      borderRadius='0.5rem'
      _hover={{
        backgroundColor: color,
        color: 'white'
      }}
    >
      {label}
    </Link>
  )
}
