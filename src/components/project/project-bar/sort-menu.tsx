import React, { useEffect, useState, MouseEvent } from 'react'
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useBreakpointValue
} from '@chakra-ui/react'
import { BiSortUp, BiSortDown } from 'react-icons/bi'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

interface SortMenuProps {
  [key: string]: any
}

export enum Sort {
  DUE_DATA = 'dd',
  NUMBER = 'n'
}

export enum Order {
  ASC = 'asc',
  DESC = 'desc'
}

export const SortMenu = (props: SortMenuProps): JSX.Element => {
  const { t } = useTranslation()
  const router = useRouter()
  const { sort = Sort.NUMBER, ord = Order.ASC } = router.query
  const [sortIcon, setSortIcon] = useState<JSX.Element>(<BiSortDown />)
  const [oppositeSortIcon, setOpositeSortIcon] = useState<JSX.Element>(<BiSortUp />)
  const [selectedSort, setSelectedSort] = useState<Sort>(Sort.NUMBER)

  const isMobile: boolean = useBreakpointValue({
    base: true,
    xs: true,
    sm: true,
    md: false
  }) ?? true

  const SortLabelMapping = {
    [Sort.DUE_DATA]: `${t('filter-sort:sort.due-date')}`,
    [Sort.NUMBER]: `${t('filter-sort:sort.number')}`
  }

  useEffect(() => {
    setSortIcon(ord === Order.ASC ? <BiSortDown /> : <BiSortUp />)
    setOpositeSortIcon(ord === Order.ASC ? <BiSortUp /> : <BiSortDown />)
    setSelectedSort(sort === Sort.DUE_DATA ? Sort.DUE_DATA : Sort.NUMBER)
  }, [sort, ord])

  const clickHandler = (e: MouseEvent, sort: Sort): void => {
    e.stopPropagation()
    const query: any = {
      ...router.query,
      sort,
      ord: sort === selectedSort && ord === Order.ASC ? Order.DESC : Order.ASC
    }
    if (sort === Sort.NUMBER) {
      delete query.sort
      if (query.ord === Order.ASC) delete query.ord
    }
    void router.push({ query })
  }

  return (
    <Menu>
      <MenuButton {...props} as={Button} rightIcon={sortIcon} variant='outline' color='var(--primary-color)' size={['xs', 'sm']}>
        {isMobile ? '' : SortLabelMapping[selectedSort]}
      </MenuButton>
      <MenuList>
        <MenuItem icon={selectedSort === Sort.NUMBER ? oppositeSortIcon : <BiSortDown />} onClick={(e) => clickHandler(e, Sort.NUMBER)}>
          {SortLabelMapping[Sort.NUMBER]}
        </MenuItem>
        <MenuItem icon={selectedSort === Sort.DUE_DATA ? oppositeSortIcon : <BiSortDown />} onClick={(e) => clickHandler(e, Sort.DUE_DATA)}>
          {SortLabelMapping[Sort.DUE_DATA]}
        </MenuItem>
      </MenuList>
    </Menu>
  )
}
