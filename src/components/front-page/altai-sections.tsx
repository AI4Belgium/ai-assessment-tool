
import { Box, BoxProps } from '@chakra-ui/react'
import style from './altai-sections.module.scss'
import { Heading1, Heading2, TextBody } from './content'
import { useTranslation } from 'next-i18next'

export const AltaiSections = (props: BoxProps): JSX.Element => {
  const { t } = useTranslation('front-page')
  const arrPlacer = new Array(8).fill(0)
  return (
    <Box justifyContent='center' color='black' {...props}>
      <div className={style.centralised_container}>
        <Heading1>{t('altai_sections.title1')}</Heading1>
        <TextBody>{t('altai_sections.txt1')}</TextBody>
        <Heading2>{t('altai_sections.title2')}</Heading2>
        <Box position='relative'>
          <div className={style.section_container}>
            <ul className={style['section-list']}>
              {arrPlacer.map((n, i) => (
                <li key={i} className={style['section-list-element']}>
                  <span>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='20'
                      height='20'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      style={{ color: '#FFED75' }}
                    >
                      <line x1='5' y1='12' x2='19' y2='12' />
                      <polyline points='12 5 19 12 12 19' />
                    </svg>
                  </span>
                  <div role='listitem'>
                    <TextBody>
                      <strong>{t(`altai_sections.topics.${i}.title`)}</strong> {t(`altai_sections.topics.${i}.description`)}
                    </TextBody>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className={style.right_gradient} />
        </Box>
        <div className='gradient-fade-section gradient-position-bottom-400' />
        <div className='gradient-fade-section gradient-position-bottom' />
      </div>
    </Box>
  )
}
