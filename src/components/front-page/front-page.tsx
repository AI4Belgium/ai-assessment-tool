import { Flex, Box } from '@chakra-ui/react'
import React from 'react'
import { Content } from './content'
import { Footer } from './footer'
import { AI4BelgiumHeader } from './header'
import { Waves } from './waves'

/* TODO frontpage
Test page using different dimension. I've used iPhone SE resolution for mobile test.
For mobile, text must be wide.
For web, text must be have a great padding.

Improve fontSize mainly for the following sessions:
  - Meet our team
  - Tool description
  - Footer
Make buttons "try it here" and "install it here" responsive (also change re-visit the 'install it here' label)
Make screenshots responsive or at least more defined
Create CSS classes to handle duplicated code, on Text for example
Change CSS class names on default.scss file to something comprehensible
Replace team placeholders with our team pictures, quotes, names and so on.
Use links to redirect to the correct pages. E.g.: Docs, source, Demo, Try it here, Install it here.
Work on accessibility.

In case you need to clone Josh website for reference, use: https://saveweb2zip.com/en

*/
const FrontPage = (): JSX.Element => {
  const css = `body {
    background-color: white;
    font-size: 16px;
  }
  a {
    color: #057A8B;
    text-decoration: underline;
  }
  `
  return (
    <>
      <style>
        {css}
      </style>
      <Box maxWidth='1200px' margin='0 auto' width='100%'>
        <AI4BelgiumHeader />
        <Flex flexDirection='column' alignItems='center' justifyContent='center'>
          <Content />
          <Footer />
        </Flex>
        <Waves />
      </Box>
    </>
  )
}

export default FrontPage
