import style from '@/src/components/front-page/waves.module.scss'

export const Waves = (): JSX.Element => {
  return (
    <div className={style.waves}>
      <svg className={style.waves} xmlns='http://www.w3.org/2000/svg' xmlnsXlink='http://www.w3.org/1999/xlink' viewBox='0 25 150 30' preserveAspectRatio='none' shapeRendering='auto'>
        <defs>
          <path id='gentle-wave' d='M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z' />
          <linearGradient id='linear-gradient' x1='3675.66' y1='24.41' x2='3675.66' y2='24' gradientTransform='translate(5881855.72 4816) rotate(180) scale(1600 198)' gradientUnits='userSpaceOnUse'>
            <stop offset='0' stopColor='#6cc9f0' />
            <stop offset='1' stopColor='#fff' stopOpacity='0' />
          </linearGradient>
        </defs>
        <g className={`${style.parallax} ${style['cls-1']}`}>
          <use xlinkHref='#gentle-wave' className={`${style['cls-2']} ${style.stroke_color1}`} x='48' y='0' opacity='70%' />
          <use xlinkHref='#gentle-wave' className={`${style['cls-2']} ${style.stroke_color2}`} x='48' y='3' opacity='50%' />
          <use xlinkHref='#gentle-wave' className={`${style['cls-2']} ${style.stroke_color3}`} x='48' y='5' opacity='30%' />
          {/* <use xlinkHref='#gentle-wave' className={style['cls-2']} x='48' y='7' /> */}
        </g>
      </svg>
    </div>
  )
}
