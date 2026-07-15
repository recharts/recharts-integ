import './App.css';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'A', value: 10 },
    { name: 'B', value: 20 },
    { name: 'C', value: 30 },
];

function App() {
    return (
        <>
            <h1>Vite 8 + React 19 + TypeScript + Recharts</h1>
            <ResponsiveContainer width={600} height={300}>
                <LineChart data={data}>
                    <Line type="monotone" dataKey="value" stroke="#8884d8" />
                </LineChart>
            </ResponsiveContainer>
        </>
    );
}

export default App;
