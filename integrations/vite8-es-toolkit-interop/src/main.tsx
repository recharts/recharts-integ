import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Line, LineChart } from 'recharts'

const data = [
  { name: 'A', value: 10 },
  { name: 'B', value: 20 },
  { name: 'C', value: 30 },
]

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LineChart width={600} height={300} data={data}>
      <Line type="monotone" dataKey="value" stroke="#8884d8" />
    </LineChart>
  </StrictMode>,
)
