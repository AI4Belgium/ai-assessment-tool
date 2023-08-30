import React, { useState, ChangeEvent, useEffect } from 'react'
import {
  Select
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import industries from '@/src/data/industries.json'
import { Industry } from '@/src/types/industry'

interface IndustrySelectProps {
  onSelect: (i: Industry | undefined) => any
  initialValue?: Industry | undefined
}

function IndustrySelect (props: IndustrySelectProps): JSX.Element {
  const {
    initialValue,
    onSelect
  } = props
  const { t } = useTranslation()
  const [industry, setIndustry] = useState<Industry | undefined>(initialValue)

  const handleIndustryChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const idx = e.target.selectedIndex
    let industry: Industry | undefined
    // 0 is meaning unsetting it, because first option in select is to choose an industry
    if (idx > 0) {
      industry = industries[idx - 1] // because first option is to choose an industry and in not included in the industries
    }
    setIndustry(industry)
    onSelect(industry)
  }

  useEffect(() => {
    setIndustry(initialValue)
  }, [initialValue])

  return (
    <Select size='xs' placeholder={`${t('placeholders:select-industry')}`} onChange={handleIndustryChange} value={industry?.name}>
      {Array.isArray(industries) && industries?.map((industry, idx) => (<option key={industry._id} value={industry.name}>{industry.name}</option>))}
    </Select>
  )
}

export default IndustrySelect
