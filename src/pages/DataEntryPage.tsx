// pages/DataEntryPage.tsx
import React from 'react';
import { HistoricalDataForm } from '../components/dataInput/HistoricalDataForm.tsx';
import { AnnualDataForm } from '../components/dataInput/AnnualDataForm.tsx'; 
import { EntityGeneralInfoForm } from '../components/dataInput/EntityGeneralInfoForm.tsx';
import { Art23EmployeeAndIncrementForm } from '../components/dataInput/Art23EmployeeAndIncrementForm.tsx';
import { SimulatoreIncrementoForm } from '../components/dataInput/SimulatoreIncrementoForm.tsx';
import { Button } from '../components/shared/Button.tsx';
import { useAppStore } from '../store.ts';
import { TEXTS_UI } from '../constants.ts';
import { TipologiaEnte } from '../types.ts';

export const DataEntryPage: React.FC = () => {
  const isLoading = useAppStore(state => state.isLoading);
  const error = useAppStore(state => state.error);
  const performFundCalculation = useAppStore(state => state.performFundCalculation);
  const tipologiaEnte = useAppStore(state => state.fundData.annualData.tipologiaEnte);
  
  const handleSubmit = async () => {
    await performFundCalculation();
  };

  const showSimulatoreAndArt23Form = tipologiaEnte === TipologiaEnte.COMUNE || tipologiaEnte === TipologiaEnte.PROVINCIA;

  return (
    <div className="space-y-8">
      <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">Inserimento Dati per Costituzione Fondo</h2>
      
      {error && (
        <div className="p-4 bg-[#fdd0d2] border border-[#ea2832] text-[#5c1114] rounded-lg" role="alert"> {/* Adjusted error alert style */}
          <strong className="font-bold">Errore: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <EntityGeneralInfoForm /> 
      <HistoricalDataForm />
      {showSimulatoreAndArt23Form && <Art23EmployeeAndIncrementForm />}
      <AnnualDataForm />
      
      {showSimulatoreAndArt23Form && <SimulatoreIncrementoForm />}

      <div className="mt-10 flex justify-end">
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleSubmit}
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? TEXTS_UI.calculating : "Salva Dati e Calcola Fondo"}
        </Button>
      </div>
    </div>
  );
};