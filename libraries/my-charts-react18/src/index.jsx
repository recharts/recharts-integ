import React from 'react';
import {BarChart, XAxis, YAxis, Bar, Legend, Tooltip} from 'recharts';

/**
 * MyChart Component
 *
 * A wrapper around the Recharts BarChart component.
 * It accepts all props that BarChart accepts and passes them through.
 *
 * @param {object} props - The props to pass to the BarChart component.
 * @param {React.ReactNode} props.children - The children elements for the chart (e.g., XAxis, YAxis, Bar).
 * @returns {JSX.Element} The BarChart component with the provided props and children.
 */
export const MyChart = (props) => {
    // Destructure children and other props
    const {children, ...rest} = props;

    // Render the Recharts BarChart with all passed props and children
    return (
        <BarChart
            width={600}
            height={300}
            data={[
                {name: 'A', value: 100},
                {name: 'B', value: 200},
            ]}{...rest}
        >
            <XAxis dataKey="name"/>
            <YAxis/>
            <Bar dataKey="value" fill="gold" name="Tooltip value"/>
            <Legend/>
            <Tooltip/>
            {children}
        </BarChart>
    );
};
