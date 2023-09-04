import React, { useEffect, useState, useContext, MouseEvent } from 'react'
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuOptionGroup,
  MenuItemOption,
  useBreakpointValue
} from '@chakra-ui/react'
import { FiFilter } from 'react-icons/fi'
import { useRouter } from 'next/router'
import ProjectContext from '@/src/store/project-context'
import isEmpty from 'lodash.isempty'
import { getUserDisplayName } from '@/util/users'
import { CloseIcon } from '@chakra-ui/icons'
import { useTranslation } from 'next-i18next'

export enum Assignment {
  UNASSIGNED = 'unassigned',
  ASSIGNED = 'assigned',
  ASSIGNED_TO = 'assigned_to'
}

const ASSINGMENT_VALUES = Object.values(Assignment)

export enum DueDate {
  SET = '1',
  NOT_SET = '0'
}

const DUE_DATE_VALUES = Object.values(DueDate)

export enum QueryFilterKeys {
  ASSIGNED_TO = 'assigned_to',
  ASSIGNMENT = 'assignment',
  DUE_DATE = 'due_date',
  CATEGORY = 'category',
  STAGE = 'stage'
}

let timeoutId: any

export const FilterMenu = (props: any): JSX.Element => {
  const { t } = useTranslation()
  const router = useRouter()
  const { nonDeletedUsers = [] } = useContext(ProjectContext)
  const [includedUserIds, setIncludedUserIds] = useState<string[]>([])
  const [assignment, setAssigment] = useState<Assignment | String>('')
  const [dueDate, setDueDate] = useState<DueDate | String>('')
  const [filterCounter, setFilterCounter] = useState(0)

  const isMobile: boolean = useBreakpointValue({
    base: true,
    xs: true,
    sm: true,
    md: false
  }) ?? true

  // initial load!!!
  useEffect(() => {
    let reroute = false
    const query: any = { ...router.query }
    const assignmentVal = query[QueryFilterKeys.ASSIGNMENT]
    if (assignmentVal != null && !ASSINGMENT_VALUES.includes(assignmentVal)) {
      reroute = true
      delete query[QueryFilterKeys.ASSIGNMENT] // eslint-disable-line @typescript-eslint/no-dynamic-delete
    }
    const dueDateVal = query[QueryFilterKeys.DUE_DATE]
    if (dueDateVal != null && !DUE_DATE_VALUES.includes(dueDateVal)) {
      reroute = true
      delete query[QueryFilterKeys.DUE_DATE] // eslint-disable-line @typescript-eslint/no-dynamic-delete
    }
    let userIdsVal = query[QueryFilterKeys.ASSIGNED_TO]
    if (userIdsVal != null && assignmentVal !== Assignment.ASSIGNED_TO) {
      reroute = true
      delete query[QueryFilterKeys.ASSIGNED_TO] // eslint-disable-line @typescript-eslint/no-dynamic-delete
    }
    if (userIdsVal != null && typeof userIdsVal === 'string') {
      userIdsVal = [userIdsVal]
    }
    if (reroute) {
      void router.replace({
        query
      }, undefined, { shallow: true })
    } else {
      setAssigment(assignmentVal ?? '')
      setDueDate(dueDateVal ?? '')
      setIncludedUserIds(userIdsVal ?? [])
    }
  }, [])

  useEffect(() => {
    const query: any = { ...router.query }
    if (isEmpty(assignment)) {
      delete query[QueryFilterKeys.ASSIGNMENT] // eslint-disable-line @typescript-eslint/no-dynamic-delete
      delete query[QueryFilterKeys.ASSIGNED_TO] // eslint-disable-line @typescript-eslint/no-dynamic-delete
    } else {
      query[QueryFilterKeys.ASSIGNMENT] = assignment
      if (assignment === Assignment.ASSIGNED_TO) {
        if (includedUserIds.length > 0) query[QueryFilterKeys.ASSIGNED_TO] = includedUserIds
      } else {
        delete query[QueryFilterKeys.ASSIGNED_TO] // eslint-disable-line @typescript-eslint/no-dynamic-delete
      }
    }
    if (isEmpty(dueDate)) delete query[QueryFilterKeys.DUE_DATE] // eslint-disable-line @typescript-eslint/no-dynamic-delete
    else {
      query[QueryFilterKeys.DUE_DATE] = dueDate
    }
    // timeout needed for when we clear all filters, because we then have concurrent state updates
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      void router.push({
        query
      }, undefined, { shallow: true })
      let counter = 0
      if (query[QueryFilterKeys.ASSIGNMENT] != null) counter++
      if (query[QueryFilterKeys.DUE_DATE] != null) counter++
      setFilterCounter(counter)
    }, 100)
  }, [assignment, dueDate])

  useEffect(() => {
    const query: any = { ...router.query }
    if (assignment === Assignment.ASSIGNED_TO && includedUserIds.length > 0) {
      query[QueryFilterKeys.ASSIGNED_TO] = includedUserIds
    } else {
      delete query[QueryFilterKeys.ASSIGNED_TO] // eslint-disable-line @typescript-eslint/no-dynamic-delete
    }
    void router.push({
      query
    }, undefined, { shallow: true })
  }, [includedUserIds])

  const cleartHandler = (e: MouseEvent, val: any, currentVal: any, setter: any): void => {
    e.stopPropagation()
    e.preventDefault()
    if (val === currentVal) setter('')
  }

  const clearAllFilters = (e: MouseEvent): void => {
    e.stopPropagation()
    e.preventDefault()
    setAssigment('')
    setDueDate('')
    setIncludedUserIds([])
  }

  const ASSIGNMENT_LABELS = {
    [Assignment.UNASSIGNED]: `${t('filter-sort:filter.unassigned')}`,
    [Assignment.ASSIGNED]: `${t('filter-sort:filter.assigned')}`,
    [Assignment.ASSIGNED_TO]: `${t('filter-sort:filter.assigned-to')}`
  }

  const DUE_DATE_LABELS = {
    [DueDate.SET]: `${t('filter-sort:filter.set')}`,
    [DueDate.NOT_SET]: `${t('filter-sort:filter.not-set')}`
  }

  return (
    <Menu key='filter-menu' closeOnSelect={false}>
      <MenuButton {...props} as={Button} rightIcon={<FiFilter />} variant='outline' color='var(--main-blue)' size={['xs', 'sm']}>
        {isMobile ? '' : t('filter-sort:filter.filter')}
        {filterCounter > 0 &&
          <Badge ml='1' size='sm' variant='solid' colorScheme='green' borderRadius='full'>
            {filterCounter}
          </Badge>}
      </MenuButton>
      <MenuList>
        <MenuOptionGroup title={`${t('titles:assignment')}`} type='radio' value={assignment as string} onChange={setAssigment as any}>
          <MenuItemOption value={Assignment.UNASSIGNED} onClick={(e) => cleartHandler(e, Assignment.UNASSIGNED, assignment, setAssigment)}>
            {ASSIGNMENT_LABELS[Assignment.UNASSIGNED]}
          </MenuItemOption>
          <MenuItemOption value={Assignment.ASSIGNED} onClick={(e) => cleartHandler(e, Assignment.ASSIGNED, assignment, setAssigment)}>
            {ASSIGNMENT_LABELS[Assignment.ASSIGNED]}
          </MenuItemOption>
          <MenuItemOption value={Assignment.ASSIGNED_TO} onClick={(e) => cleartHandler(e, Assignment.ASSIGNED_TO, assignment, setAssigment)}>
            {ASSIGNMENT_LABELS[Assignment.ASSIGNED_TO]}
          </MenuItemOption>
          <MenuOptionGroup type='checkbox' value={includedUserIds} onChange={val => setIncludedUserIds(val as string[])}>
            {Array.isArray(nonDeletedUsers) && nonDeletedUsers.map(user => (
              <MenuItemOption key={user._id} value={String(user._id)} pl='6' isDisabled={assignment !== Assignment.ASSIGNED_TO}>
                <Flex justifyContent='flex-start' alignItems='center'>
                  <Avatar size='xs' name={getUserDisplayName(user)} src={user.xsAvatar} mr='1' />
                  <Box>{getUserDisplayName(user)}</Box>
                </Flex>
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        </MenuOptionGroup>
        <MenuDivider />
        <MenuOptionGroup title={`${t('titles:due-date')}`} type='radio' value={dueDate as string} onChange={setDueDate as any}>
          <MenuItemOption value={DueDate.SET} onClick={(e) => cleartHandler(e, DueDate.SET, dueDate, setDueDate)}>
            {DUE_DATE_LABELS[DueDate.SET]}
          </MenuItemOption>
          <MenuItemOption value={DueDate.NOT_SET} onClick={(e) => cleartHandler(e, DueDate.NOT_SET, dueDate, setDueDate)}>
            {DUE_DATE_LABELS[DueDate.NOT_SET]}
          </MenuItemOption>
        </MenuOptionGroup>
        <MenuDivider />
        <MenuItem icon={<CloseIcon />} onClick={clearAllFilters} isDisabled={isEmpty(dueDate) && isEmpty(assignment)}>
          {t('filter-sort:filter.clear-all-filters')}
        </MenuItem>
      </MenuList>
    </Menu>
  )
}
