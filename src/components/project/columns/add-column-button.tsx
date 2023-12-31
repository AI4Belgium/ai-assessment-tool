import React, { FC, useState } from 'react'
import { Box, Button } from '@chakra-ui/react'
import PropTypes from 'prop-types'

interface Props {
  addColumn: any
}

const AddColumnButton: FC<Props> = ({ addColumn }) => {
  const [isLoading, setIsLoading] = useState(false)

  /* eslint-disable @typescript-eslint/no-misused-promises */
  return (
    <Box
      rounded='lg'
      height='auto'
      width='272px'
      display='flex'
      flexDirection='column'
      mt='10px'
      mx='10px'
    >
      <Button
        size='xs'
        my='10px'
        mx='5px'
        backgroundColor='primary'
        color='black'
        onClick={async () => {
          try {
            setIsLoading(true)
            await addColumn()
          } finally {
            setIsLoading(false)
          }
        }}
        isLoading={isLoading}
        disabled={isLoading}
        loadingText='Adding column'
      >
        + Add a Column
      </Button>
    </Box>
  )
}

AddColumnButton.propTypes = {
  addColumn: PropTypes.func
}

export default AddColumnButton
