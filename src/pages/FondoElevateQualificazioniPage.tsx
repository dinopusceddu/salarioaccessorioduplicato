// pages/FondoElevateQualificazioniPage.tsx
import React from 'react';
// FIX: Replaced useAppContext with useAppStore for state management.
import { useAppStore } from '../store.ts';
import { FondoElevateQualificazioniData } from '../types.ts';
import { Card } from '../components/shared/Card.tsx';
import { TEXTS_UI, RIF_DELIBERA_ENTE } from '../constants.ts';
// FIX: Corrected import path for FundingItem to be relative.
// FIX: Removed .tsx extension from import path.
import { FundingItem } from '../components/shared/FundingItem';


const formatCurrency = (value?: number, defaultText = TEXTS_UI.notApplicable) => {
    if (value === undefined || value === null || isNaN(value)) return defaultText;
    return `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const SectionTotal: React.FC<{ label: string; total?: number, className?: string }> = ({ label, total, className = "" }) => {
  return (
    <div className={`mt-4 pt-4 border-t-2 border-[#d1c0c1] ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-base font-bold text-[#1b0e0e]">{label}</span>
        <span className="text-lg font-bold text-[#ea2832]">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
};

export const FondoElevateQualificazioniPage: React.FC = () => {
  // FIX: Switched to useAppStore for state and actions
  const data = useAppStore(state => state.fundData.fondoElevateQualificazioniData) || {} as FondoElevateQualificazioniData;
  const normativeData = useAppStore(state => state.normativeData);
  const updateFondoElevateQualificazioniData = useAppStore(state => state.updateFondoElevateQualificazioniData);

  if (!normativeData) {
    return <div>Caricamento...</div>
  }
  const { riferimenti_normativi: norme } = normativeData;

  const handleChange = (field: keyof FondoElevateQualificazioniData, value?: number) => {
    // FIX: Call action directly
    updateFondoElevateQualificazioniData({ [field]: value });
  };
  
  const sommaRisorseSpecificheEQ = 
    (data.ris_fondoPO2017 || 0) +
    (data.ris_incrementoConRiduzioneFondoDipendenti || 0) +
    (data.ris_incrementoLimiteArt23c2_DL34 || 0) +
    (data.ris_incremento022MonteSalari2018 || 0) -
    (data.fin_art23c2_adeguamentoTetto2016 || 0);

  const totaleRisorseDisponibili = sommaRisorseSpecificheEQ; 


  return (
    <div className="space-y-8 pb-20">
      <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">Fondo delle Elevate Qualificazioni (EQ)</h2>

      <Card title="Risorse per le Elevate Qualificazioni" className="mb-6" isCollapsible={false}>
        <FundingItem<FondoElevateQualificazioniData> id="ris_fondoPO2017" description="Fondo delle Posizioni Organizzative nell'anno 2017 (valore storico di partenza)" riferimentoNormativo="Valore storico Ente / CCNL Precedente" value={data.ris_fondoPO2017} onChange={handleChange} />
        {/* FIX: This field is now user-editable here */}
        <FundingItem<FondoElevateQualificazioniData> id="ris_incrementoConRiduzioneFondoDipendenti" description="Incremento del Fondo Elevate Qualificazioni con contestuale riduzione del fondo del personale dipendente" riferimentoNormativo={RIF_DELIBERA_ENTE} value={data.ris_incrementoConRiduzioneFondoDipendenti} onChange={handleChange} />
        <FundingItem<FondoElevateQualificazioniData> id="ris_incrementoLimiteArt23c2_DL34" description="Incremento del Fondo Elevate Qualificazioni nel limite dell'art. 23 c. 2 del D.Lgs. n. 75/2017 (compreso art. 33 DL 34/2019)" riferimentoNormativo={`${norme.art23_dlgs75_2017} e ${norme.art33_dl34_2019}`} value={data.ris_incrementoLimiteArt23c2_DL34} onChange={handleChange} />
        <FundingItem<FondoElevateQualificazioniData> id="ris_incremento022MonteSalari2018" description="0,22% del monte salari anno 2018 con decorrenza dal 01.01.2022, quota d'incremento del fondo proporzionale (non rileva ai fini del limite)." riferimentoNormativo={norme.art79_ccnl2022 + " c.3"} value={data.ris_incremento022MonteSalari2018} onChange={handleChange} />
        <FundingItem<FondoElevateQualificazioniData> id="fin_art23c2_adeguamentoTetto2016" description="Eventuale decurtazione annuale per il rispetto del tetto complessivo del salario accessorio dell'anno 2016." riferimentoNormativo={norme.art23_dlgs75_2017} value={data.fin_art23c2_adeguamentoTetto2016} onChange={handleChange} isSubtractor={true}/>
        <SectionTotal label="SOMMA RISORSE PER LE ELEVATE QUALIFICAZIONI (Totale Fondo EQ)" total={sommaRisorseSpecificheEQ} />
      </Card>
      
      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-[#fcf8f8]/80 backdrop-blur-sm border-t border-t-[#f3e7e8] shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-[960px] mx-auto flex justify-between items-center">
            <span className="text-lg font-bold text-[#1b0e0e]">TOTALE RISORSE DISPONIBILI:</span>
            <span className="text-2xl font-bold text-[#ea2832]">
                {formatCurrency(totaleRisorseDisponibili)}
            </span>
        </div>
      </div>

    </div>
  );
};