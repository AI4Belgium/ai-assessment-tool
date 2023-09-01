// https://codesandbox.io/s/chakra-ui-datepicker-demo-qmx3c?file=/src/components/Datepicker/Datepicker.tsx:1342-1461
import React, { useRef, useState } from 'react'
import isEmpty from 'lodash.isempty'
import {
  Box,
  Button,
  Divider,
  Heading,
  HStack,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  SimpleGrid,
  Text,
  useOutsideClick,
  VStack
  // ,
  // Input as InputComponent
} from '@chakra-ui/react'
// import { CalendarIcon } from '@chakra-ui/icons'
import {
  // DateObj,
  useDayzed,
  RenderProps,
  GetBackForwardPropsOptions,
  Calendar
} from 'dayzed'
// import { format } from 'date-fns'

const MONTH_NAMES_DEFAULT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]
const DAY_NAMES_DEFAULT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DATE_FORMAT_DEFAULT = 'dd MMM yyyy'

interface SingleDatepickerBackButtonsProps {
  calendars: Calendar[]
  getBackProps: (data: GetBackForwardPropsOptions) => Record<string, any>
}

interface SingleDatepickerForwardButtonsProps {
  calendars: Calendar[]
  getForwardProps: (data: GetBackForwardPropsOptions) => Record<string, any>
}

export interface SingleDatepickerProps {
  disabled?: boolean
  onDateChange: (date: Date) => void
  id?: string
  name?: string
  date: Date | null
  configs?: SingleDatepickerConfigs
}

export interface SingleDatepickerConfigs {
  dateFormat: string
  monthNames: string[]
  dayNames: string[]
}

const SingleDatepickerBackButtons = (props: SingleDatepickerBackButtonsProps): JSX.Element => {
  const { calendars, getBackProps } = props
  return (
    <>
      <Button
        {...getBackProps({
          calendars,
          offset: 12
        })}
        variant='ghost'
        size='sm'
      >
        {'<<'}
      </Button>
      <Button {...getBackProps({ calendars })} variant='ghost' size='sm'>
        {'<'}
      </Button>
    </>
  )
}

const SingleDatepickerForwardButtons = (
  props: SingleDatepickerForwardButtonsProps
): JSX.Element => {
  const { calendars, getForwardProps } = props
  return (
    <>
      <Button {...getForwardProps({ calendars })} variant='ghost' size='sm'>
        {'>'}
      </Button>
      <Button
        {...getForwardProps({
          calendars,
          offset: 12
        })}
        variant='ghost'
        size='sm'
      >
        {'>>'}
      </Button>
    </>
  )
}

const SingleDatepickerCalendar = (
  props: RenderProps & { configs: SingleDatepickerConfigs }
): JSX.Element => {
  const {
    calendars,
    getDateProps,
    getBackProps,
    getForwardProps,
    configs
  } = props

  if (isEmpty(calendars)) {
    return (<></>)
  }

  return (
    <HStack className='datepicker-calendar'>
      {calendars.map((calendar) => (
        <VStack key={`${calendar.month}${calendar.year}`}>
          <HStack>
            <SingleDatepickerBackButtons
              calendars={calendars}
              getBackProps={getBackProps}
            />
            <Heading size='sm' textAlign='center'>
              {configs.monthNames[calendar.month]} {calendar.year}
            </Heading>
            <SingleDatepickerForwardButtons
              calendars={calendars}
              getForwardProps={getForwardProps}
            />
          </HStack>
          <Divider />
          <SimpleGrid columns={7} spacing={1} textAlign='center'>
            {configs.dayNames.map(day => (
              <Box key={`${calendar.month}${calendar.year}${day}`}>
                <Text fontSize='sm' fontWeight='semibold'>
                  {day}
                </Text>
              </Box>
            ))}
            {calendar.weeks.map((week, weekIndex) => {
              return week.map((dateObj: any, index: number) => {
                const {
                  date,
                  today,
                  // prevMonth,
                  // nextMonth,
                  selected
                } = dateObj
                const key = `${calendar.month}${calendar.year}${weekIndex}${index}`

                return (
                  <Button
                    {...getDateProps({
                      dateObj
                      // disabled: isDisabled
                    })}
                    key={key}
                    size='sm'
                    variant='outline'
                    borderColor={today === true ? 'purple.400' : 'transparent'}
                    bg={selected === true ? 'purple.200' : undefined}
                  >
                    {date.getDate()}
                  </Button>
                )
              })
            })}
          </SimpleGrid>
        </VStack>
      )
      )}
    </HStack>
  )
}

export const SingleDatepicker: React.FC<SingleDatepickerProps> = ({
  configs = {
    dateFormat: DATE_FORMAT_DEFAULT,
    monthNames: MONTH_NAMES_DEFAULT,
    dayNames: DAY_NAMES_DEFAULT
  },
  ...props
}): JSX.Element => {
  const {
    date,
    // name, disabled,
    // id,
    onDateChange
  } = props

  const ref = useRef<HTMLElement>(null)
  const initialFocusRef = useRef<HTMLInputElement>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [processClickEvent, setProcessClickEvent] = useState(true)

  const closeHandler = (e?: any, stopEvent = true): void => {
    if (popoverOpen) {
      if (e?.preventDefault != null && stopEvent) {
        e.preventDefault()
        e.stopPropagation()
      }
      setPopoverOpen(false)
      setTimeout(() => setProcessClickEvent(true), 300)
    }
  }

  useOutsideClick({
    ref,
    handler: (e) => closeHandler(e, false)
  })

  const openpopover = (): void => {
    // because useOutsideClick is faster when it's open
    if (!processClickEvent) return
    setPopoverOpen(true)
  }

  const onDateSelected = (options: { selectable: boolean, date: Date }): void => {
    const { selectable, date } = options
    if (!selectable) return
    if (date != null) {
      onDateChange(date)
      closeHandler(null)
    }
  }

  const opts: any = {
    showOutsideDays: true,
    onDateSelected
  }

  if (date != null) opts.selected = date
  const dayzedData = useDayzed(opts)

  const PopoverTrigger2 = PopoverTrigger as any

  return (
    <Popover
      placement='bottom'
      variant='responsive'
      isOpen={popoverOpen}
      onOpen={() => setProcessClickEvent(false)}
      onClose={closeHandler}
      initialFocusRef={initialFocusRef}
      isLazy
    >
      <PopoverTrigger2>
        <Box cursor='pointer' onClick={() => popoverOpen ? null : openpopover()}>
          {(props as any).children}
          <Box display='none'>{date != null ? date.toISOString() : ''}</Box>
        </Box>
      </PopoverTrigger2>
      <PopoverContent ref={ref}>
        <PopoverBody
          padding='10px 5px'
          borderWidth='1'
          borderColor='blue.400'
        >
          <SingleDatepickerCalendar {...dayzedData} configs={configs} />
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}
