// pages/FundDetailsPage.tsx
import React from 'react';
// FIX: Replaced useAppContext with useAppStore for state management.
import { useAppStore } from '../store.ts';
import { Card } from '../components/shared/Card.tsx';
import { FondoAccessorioDipendenteData } from '../types.ts';
import { TEXTS_UI } from '../constants.ts';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.tsx';
// FIX: Corrected import path for FundingItem to be relative.
// FIX: Removed .tsx extension from import path.
import { FundingItem } from '../components/shared/FundingItem';
import { getFadFieldDefinitions } from './FondoAccessorioDipendentePageHelpers.ts';

const formatCurrency = (value?: number, defaultText = TEXTS_UI.notApplicable) => {
  if (value === undefined || value === null || isNaN(value)) return defaultText;
  return `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const SummaryRow: React.FC<{ label: string; value?: number; isGrandTotal?: boolean; className?: string }> = ({ label, value, isGrandTotal = false, className ="" }) => (
  <div className={`flex justify-between items-center py-2 px-3 rounded-md ${isGrandTotal ? 'bg-[#d1c0c1]' : 'bg-white border border-[#f3e7e8]'} ${className}`}>
    <span className={`text-sm font-medium ${isGrandTotal ? 'text-[#1b0e0e] font-bold' : 'text-[#1b0e0e]'}`}>{label}</span>
    <span className={`text-lg font-bold ${isGrandTotal ? 'text-[#ea2832]' : 'text-[#ea2832]'}`}>{formatCurrency(value)}</span>
  </div>
);


export const FundDetailsPage: React.FC = () => {
  // FIX: Switched to useAppStore for state management.
  const { calculatedFund, fundData, isLoading, normativeData } = useAppStore(state => ({
      calculatedFund: state.calculatedFund,
      fundData: state.fundData,
      isLoading: state.isLoading,
      normativeData: state.normativeData,
  }));

  if (isLoading && !calculatedFund) { 
    return <LoadingSpinner text="Caricamento dettagli fondo..." />;
  }

  if (!calculatedFund || !normativeData) {
    return (
      <Card title="Dettaglio Calcolo Fondo">
        <p className="text-[#1b0e0e]">{TEXTS_UI.noDataAvailable} Effettuare prima il calcolo del fondo dalla sezione "Dati Costituzione Fondo".</p>
      </Card>
    );
  }
  
  const { dettaglioFondi } = calculatedFund;
  const fadData = fundData.fondoAccessorioDipendenteData || {} as FondoAccessorioDipendenteData;
  const fadFieldDefinitions = getFadFieldDefinitions(normativeData);

  return (
    <div className="space-y-8">
      <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">Dettaglio Calcolo Fondo Risorse Decentrate {fundData.annualData.annoRiferimento}</h2>
      
      <Card title={`Riepilogo Risorse Disponibili per Fondo (Anno ${fundData.annualData.annoRiferimento})`} className="mb-8 bg-[#fcf8f8]">
        <div className="space-y-3 p-1">
          <SummaryRow label="Totale Risorse - Fondo Personale Dipendente" value={dettaglioFondi.dipendente.totale} />
          <SummaryRow label="Totale Risorse - Fondo Elevate Qualificazioni" value={dettaglioFondi.eq.totale} />
          <SummaryRow label="Totale Risorse - Risorse Segretario Comunale" value={dettaglioFondi.segretario.totale} />
          {fundData.annualData.hasDirigenza && (
            <SummaryRow label="Totale Risorse - Fondo Dirigenza" value={dettaglioFondi.dirigenza.totale} />
          )}
          <div className="pt-3 mt-3 border-t-2 border-[#d1c0c1]">
            <SummaryRow label="TOTALE COMPLESSIVO RISORSE DISPONIBILI (DA TUTTI I FONDI)" value={calculatedFund.totaleFondoRisorseDecentrate} isGrandTotal />
          </div>
        </div>
      </Card>
      
      <Card title="Verifica Limite Art. 23 D.Lgs. 75/2017 (Fondo 2016)" className="mt-6">
        <div className="space-y-2 text-sm text-[#1b0e0e]">
            <p><strong>Fondo Base Storico (originale 2016):</strong> {formatCurrency(calculatedFund.fondoBase2016)}</p>
            {calculatedFund.incrementoDeterminatoArt23C2 && (
                <p><strong>(+) Adeguamento per Variazione Personale (Art. 23 c.2, base 2018):</strong> {formatCurrency(calculatedFund.incrementoDeterminatoArt23C2.importo)}</p>
            )}
            <p><strong>(=) Limite Effettivo Fondo 2016 (modificato):</strong> 
                <strong className="ml-1 text-base">{formatCurrency(calculatedFund.limiteArt23C2Modificato)}</strong>
            </p>
            <hr className="my-3 border-[#f3e7e8]"/>
            <p><strong>Somma Risorse Soggette al Limite dai Fondi Specifici:</strong> {formatCurrency(calculatedFund.totaleRisorseSoggetteAlLimiteDaFondiSpecifici)}</p>
            
            {calculatedFund.superamentoLimite2016 && calculatedFund.superamentoLimite2016 > 0 ? (
              <div className="p-4 mt-4 bg-[#fef2f2] border border-[#fecaca] rounded-lg">
                <div className="flex justify-between items-center text-[#c02128]">
                    <strong className="text-base">Superamento Limite 2016:</strong>
                    <strong className="text-base">
                        {formatCurrency(calculatedFund.superamentoLimite2016)}
                    </strong>
                </div>
                <p className="text-sm text-[#991b1b] mt-2">
                    È necessario applicare una riduzione di pari importo su uno o più fondi per rispettare il vincolo (es. tramite i campi "Eventuale decurtazione annuale...").
                </p>
              </div>
            ) : (
              <div className="p-3 mt-4 bg-green-50 border border-green-200 rounded-lg text-green-800 font-semibold text-center">
                Nessun superamento del limite 2016 rilevato.
              </div>
            )}

            <p className="text-xs text-[#5f5252] mt-2">
              Nota: L'adeguamento per variazione personale modifica il tetto di spesa. La somma delle risorse soggette al limite viene calcolata prima di applicare le decurtazioni manuali nei singoli fondi.
            </p>
        </div>
      </Card>

      <Card 
        title={`Dettaglio Input Fondo Accessorio Personale Dipendente (Anno ${fundData.annualData.annoRiferimento})`} 
        className="bg-[#fcf8f8] border-[#e0e0e0]" 
        isCollapsible={true} 
        defaultCollapsed={true}
      >
        <p className="text-sm text-[#5f5252] mb-4">Questo è un riepilogo dei valori inseriti per il Fondo del Personale Dipendente, non include i totali calcolati.</p>
        {fadFieldDefinitions.filter(def => def.section === 'stabili').map(def => (
            <FundingItem<FondoAccessorioDipendenteData>
                key={String(def.key)} 
                id={def.key} 
                description={def.description}
                value={fadData[def.key]} 
                onChange={()=>{}} 
                riferimentoNormativo={def.riferimento}
                isSubtractor={def.isSubtractor}
                disabled={true}
            />
        ))}
      </Card>

    </div>
  );
};