// components/dataInput/EmployeeCountsForm.tsx
import React from 'react';
// FIX: Replaced useAppContext with useAppStore for state management.
import { useAppStore } from '../../store.ts';
import { EmployeeCategory, ALL_EMPLOYEE_CATEGORIES } from '../../types.ts';
import { Input } from '../shared/Input.tsx';

interface EmployeeCountsFormProps {
  title: string;
}

export const EmployeeCountsForm: React.FC<EmployeeCountsFormProps> = ({ title }) => {
  // FIX: Switched to useAppStore for state and actions
  const personaleServizioAttuale = useAppStore(state => state.fundData.annualData.personaleServizioAttuale);
  const updateEmployeeCount = useAppStore(state => state.updateEmployeeCount);

  const handleChange = (category: EmployeeCategory, value: string) => {
    const count = value === '' ? undefined : parseInt(value, 10);
    if (count !== undefined && isNaN(count)) return;

    // FIX: Call action directly
    updateEmployeeCount({ category, count });
  };

  return (
    <>
      <h4 className="text-md font-semibold text-gray-700 mb-3">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-1">
        {ALL_EMPLOYEE_CATEGORIES.map(category => {
          const empData = personaleServizioAttuale.find(emp => emp.category === category);
          return (
            <Input
              key={category}
              label={category}
              type="number"
              id={`emp_count_${category.replace(/\s+/g, '_')}`}
              name={`emp_count_${category.replace(/\s+/g, '_')}`}
              value={empData?.count ?? ''}
              onChange={(e) => handleChange(category, e.target.value)}
              placeholder="N."
              step="1"
              min="0"
              containerClassName="mb-2"
            />
          );
        })}
      </div>
    </>
  );
};