// components/dashboard/FundAllocationChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../../store.ts';
import { Card } from '../shared/Card.tsx';
import { TEXTS_UI } from '../../constants.ts';

const formatCurrency = (value?: number) => {
    if (value === undefined || value === null || isNaN(value)) return TEXTS_UI.notApplicable;
    return `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const FundAllocationChart: React.FC = () => {
  const calculatedFund = useAppStore(state => state.calculatedFund);

  if (!calculatedFund || (calculatedFund.totaleComponenteStabile === 0 && calculatedFund.totaleComponenteVariabile === 0)) {
    return (
      <Card title="Ripartizione del Fondo">
        <div className="flex items-center justify-center h-64 text-[#5f5252]">
          <p>{TEXTS_UI.noDataAvailable} per il grafico.</p>
        </div>
      </Card>
    );
  }

  const data = [
    { name: 'Parte Stabile', value: calculatedFund.totaleComponenteStabile || 0 },
    { name: 'Parte Variabile', value: calculatedFund.totaleComponenteVariabile || 0 },
  ];

  const COLORS = ['#94a3b8', '#ea2832']; // slate-400, primary-red

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent === 0) return null;

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="font-bold text-shadow">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };


  return (
    <Card title="Ripartizione del Fondo">
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={110}
              innerRadius={50}
              fill="#8884d8"
              dataKey="value"
              stroke="#fcf8f8"
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #f3e7e8',
                borderRadius: '0.5rem',
              }}
             />
            <Legend iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};