import './App.css';
import {Bar, BarChart, BarStack, Legend, Tooltip, XAxis, YAxis} from 'recharts';

function App() {
    return (
        <>
            <h1>Vite + React 19 + TypeScript + Recharts</h1>
            <BarChart
                width={600}
                height={300}
                data={[
                    { name: 'A', value1: 100, value2: 50 },
                    { name: 'B', value1: 200, value2: 130 },
                ]}
            >
                <XAxis dataKey="name" />
                <YAxis />
                <BarStack>
                    <Bar dataKey="value1" fill="gold" name="Tooltip value 1" />
                    <Bar dataKey="value2" fill="silver" name="Tooltip value 2" />
                </BarStack>
                <Legend />
                <Tooltip />
            </BarChart>
        </>
    );
}

export default App;
