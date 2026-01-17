/** @jsxImportSource react */
import {Bar, BarChart, Legend, Rectangle, Tooltip, XAxis, YAxis, ZIndexLayer} from 'recharts';

const data = [
    { name: 'A', value: 100 },
    { name: 'B', value: 200 },
]

export default function Chart() {
  return (
    <article>
        <h1>Astro + Recharts</h1>
        <BarChart
          width={600}
          height={300}
          data={data}
        >
            <Rectangle radius={50} fill={'red'} x={10} y={10} width={60} height={30} />
            <ZIndexLayer zIndex={10}>
                <Rectangle radius={50} fill={'blue'} x={100} y={100} width={60} height={30} />
            </ZIndexLayer>
        </BarChart>
    </article>
  );
}