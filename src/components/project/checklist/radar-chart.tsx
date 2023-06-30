
import React, { useEffect, useRef, useState } from 'react'
import {
  Box
} from '@chakra-ui/react'
import Chart from 'chart.js/auto'
import { Category } from '@/src/types/project'

const lineTension = 0.2

const defaultConfig = {
  type: 'radar',
  data: {},
  options: {
    responsive: true,
    plugins: {
      title: {
        display: false
      },
      legend: {
        display: false
      }
    },
    scales: {
      r: {
        pointLabels: {
          color: '#00566B',
          font: {
            size: '14px'
            // weight: 'bold'
          }
        },
        angleLines: {
          lineWidth: 5
        },
        grid: {
          circular: true,
          lineWidth: 5,
          drawTicks: false,
          color: ({ tick }: any): string => {
            if (tick.value > 100) return 'transparent'
            return '#E3E3E3'
          }
        },
        ticks: {
          display: false,
          stepSize: 25
        },
        suggestedMin: 0,
        max: 125
      }
    }
  }
}

const radarChartCtxObj: any = {
  chart: null
}

const listenerFn = (e: any): void => {
  if (radarChartCtxObj?.chart?.canvas != null) {
    const size = e?.type === 'beforeprint' ? 512 : 700
    radarChartCtxObj.chart.canvas.parentNode.style.width = `${size}px`
    radarChartCtxObj.chart.canvas.parentNode.style.height = `${size}px`
    radarChartCtxObj.chart.canvas.style.width = `${size}px`
    radarChartCtxObj.chart.canvas.style.height = `${size}px`
    radarChartCtxObj.chart.render()
  }
}

const RadarChart = ({ categories, scoresPerCatId }: { categories: Category[], scoresPerCatId: { [key: string]: number } }): JSX.Element => {
  const el = useRef<HTMLCanvasElement>(null)

  const [config, setConfig] = React.useState<any>(defaultConfig)
  const [labels, setLabels] = useState<string[]>([])
  const [datasets, setDatasets] = useState<any[]>([{
    label: 'req-questions',
    data: [],
    borderColor: 'rgb(255, 99, 132)',
    backgroundColor: 'rgba(255, 99, 132, 0.2)',
    lineTension
  }
  // , {
  //   label: 'blue-questions',
  //   data: [],
  //   borderColor: 'rgb(54, 162, 235)',
  //   backgroundColor: 'rgba(54, 162, 235, 0.2)',
  //   lineTension
  // }
  ])

  useEffect(() => {
    let localLabels: any[] = []
    const localDatasets: any[] = [...datasets]
    if (Array.isArray(categories)) {
      localLabels = categories.map((cat) => cat.name.split(' '))
      localDatasets[0].data = categories.map((c) => (scoresPerCatId?.[c._id] ?? 0) * 100)
      // localDatasets[1].data = categories.map(() => Math.round(Math.random() * 100))
      setLabels(localLabels)
      setDatasets(localDatasets)
    }
  }, [categories, scoresPerCatId])

  useEffect(() => {
    const data = {
      labels,
      datasets
    }
    setConfig({ ...defaultConfig, data })
  }, [labels, datasets])

  useEffect(() => {
    if (el.current != null) {
      const chart = new Chart(el.current, config)
      radarChartCtxObj.chart = chart
      return () => {
        chart.destroy()
        radarChartCtxObj.chart = null
      }
    }
  }, [el, config])

  useEffect(() => {
    window.addEventListener('beforeprint', listenerFn)
    window.addEventListener('afterprint', listenerFn)
    return () => {
      window.removeEventListener('beforeprint', listenerFn)
      window.removeEventListener('afterprint', listenerFn)
    }
  }, [])

  return (
    <Box position='relative' width='80vw' maxWidth='700px' margin='auto' className='print:max-w-lg'>
      <canvas ref={el} style={{ margin: 'auto', width: '100%' }} />
    </Box>
  )
}

export default RadarChart
