import { Line, LineChart } from 'recharts';

export default function Page() {
  return (
    <LineChart
      style={{ width: '100%', aspectRatio: '1.618', maxWidth: 600 }}
      responsive
      data={[{ value: 2 }, { value: 1 }, { value: 3 }]}
    >
      <Line dataKey="value" />
    </LineChart>
  );
};

export function getServerSideProps() {
  return {
    props: {},
  };
}
