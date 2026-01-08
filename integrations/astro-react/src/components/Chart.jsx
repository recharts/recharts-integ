import { Bar, BarChart, Legend, Tooltip, XAxis, YAxis } from 'recharts';

export default function Chart() {
  return (
    <article>
        <h1>Astro + Recharts</h1>
        <BarChart
          width={600}
          height={300}
          data={[
            { name: 'A', value: 100 },
            { name: 'B', value: 200 },
          ]}
        >
          <XAxis dataKey="name" />
          <YAxis />
          <Legend />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
    </article>
  );
}