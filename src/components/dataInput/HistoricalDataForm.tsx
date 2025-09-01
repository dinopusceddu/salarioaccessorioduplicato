// components/dataInput/HistoricalDataForm.tsx
import React from 'react';
import { useAppStore } from '../../store.ts';
import { HistoricalData } from '../../types.ts';
import { Input } from '../shared/Input.tsx';
import { Card } from '../shared/Card.tsx';
import { TEXTS_UI } from '../../constants.ts';

export const HistoricalDataForm: React.FC = () => {
  const historicalData = useAppStore(state => state.fundData.historicalData);
  const annoRiferimento = useAppStore(state => state.fundData.annualData.annoRiferimento);
  const updateHistoricalData = useAppStore(state => state.updateHistoricalData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean | undefined = value; 

    if (type === 'number') {
      processedValue = value === '' ? undefined : parseFloat(value);
    } else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }
    
    updateHistoricalData({ [name]: processedValue } as Partial<HistoricalData>);
  };

  const {
    fondoSalarioAccessorioPersonaleNonDirEQ2016,
    fondoElevateQualificazioni2016,
    fondoDirigenza2016,
    risorseSegretarioComunale2016,
  } = historicalData;

  const limiteComplessivo2016 = 
    (fondoSalarioAccessorioPersonaleNonDirEQ2016 || 0) +
    (fondoElevateQualificazioni2016 || 0) +
    (fondoDirigenza2016 || 0) +
    (risorseSegretarioComunale2016 || 0);

  const formatCurrencyForDisplay = (value?: number) => {
    if (value === undefined || value === null || isNaN(value)) return TEXTS_UI.notApplicable;
    return `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card title="Dati Storici Consolidati" className="mb-8">
      <h4 className="text-base font-semibold text-[#1b0e0e] mb-1">Dettaglio Fondi Anno 2016 (Limite Art. 23 c.2 D.Lgs. 75/2017)</h4>
      <p className="text-sm text-[#5f5252] mb-4">Inserire i valori certificati per l'anno 2016. Questi valori costituiscono il limite storico del fondo.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
        <Input
          label="Fondo Salario Accessorio Personale (non Dirigente/non EQ) 2016 (€)"
          type="number"
          id="fondoSalarioAccessorioPersonaleNonDirEQ2016"
          name="fondoSalarioAccessorioPersonaleNonDirEQ2016"
          value={historicalData.fondoSalarioAccessorioPersonaleNonDirEQ2016 ?? ''}
          onChange={handleChange}
          placeholder="Es. 120000.00"
          step="0.01"
          aria-required="true"
          containerClassName="mb-3"
        />
        <Input
          label="Fondo Elevate Qualificazioni (EQ) 2016 (€)"
          type="number"
          id="fondoElevateQualificazioni2016"
          name="fondoElevateQualificazioni2016"
          value={historicalData.fondoElevateQualificazioni2016 ?? ''}
          onChange={handleChange}
          placeholder="Es. 15000.00"
          step="0.01"
          containerClassName="mb-3"
        />
        <Input
          label="Fondo Dirigenza 2016 (€)"
          type="number"
          id="fondoDirigenza2016"
          name="fondoDirigenza2016"
          value={historicalData.fondoDirigenza2016 ?? ''}
          onChange={handleChange}
          placeholder="Es. 25000.00"
          step="0.01"
          containerClassName="mb-3"
        />
        <Input
          label="Risorse Segretario Comunale 2016 (€)"
          type="number"
          id="risorseSegretarioComunale2016"
          name="risorseSegretarioComunale2016"
          value={historicalData.risorseSegretarioComunale2016 ?? ''}
          onChange={handleChange}
          placeholder="Es. 10000.00"
          step="0.01"
          containerClassName="mb-3"
        />
      </div>
      <div className="mt-4 p-4 bg-[#f3e7e8] border border-[#f3e7e8] rounded-lg">
        <label className="block text-base font-medium text-[#1b0e0e]">Limite Complessivo Art. 23 c.2 D.Lgs. 75/2017 (originario 2016):</label>
        <p className="text-xl font-bold text-[#ea2832] mt-1">
          {formatCurrencyForDisplay(limiteComplessivo2016)}
        </p>
      </div>

      <hr className="my-6 border-t border-[#d1c0c1]" />

      <h4 className="text-base font-semibold text-[#1b0e0e] mb-1">Dati Anno Precedente per Confronto Dashboard</h4>
      <p className="text-sm text-[#5f5252] mb-4">Inserire i valori dell'anno precedente per visualizzare i trend nella dashboard.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
        <Input
          label={`Totale Fondo Anno Precedente (${annoRiferimento - 1}) (€)`}
          type="number"
          id="totaleFondoAnnoPrecedente"
          name="totaleFondoAnnoPrecedente"
          value={historicalData.totaleFondoAnnoPrecedente ?? ''}
          onChange={handleChange}
          placeholder="Es. 350000.00"
          step="0.01"
          containerClassName="mb-3"
        />
      </div>
    </Card>
  );
};