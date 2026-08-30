import { Bar, BarChart, XAxis } from "recharts";

export const chart = (
  <BarChart width={300} height={200} data={[{ name: "A", value: 1 }]}>
    <XAxis dataKey="name" />
    <Bar dataKey="value" />
  </BarChart>
);
