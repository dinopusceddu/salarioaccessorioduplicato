// pages/DistribuzioneRisorsePage.tsx
import React, { useMemo, useEffect, useState } from 'react';
import { useAppStore } from '../store.ts';
import { Card } from '../components/shared/Card.tsx';
import { TEXTS_UI } from '../constants.ts';
import { DistribuzioneRisorseData, RisorsaVariabileDetail, FondoElevateQualificazioniData, NormativeData } from '../types.ts';
import { Button } from '../components/shared/Button.tsx';
import { Input } from '../components/shared/Input.tsx';
import { calculateFadTotals } from '../logic/fundEngine.ts';
import { getDistribuzioneFieldDefinitions } from './FondoAccessorioDipendentePageHelpers.ts';
// FIX: Corrected import path for FundingItem to be relative.
// FIX: Removed .tsx extension from import path.
import { FundingItem } from '../components/shared/FundingItem';

const formatCurrency = (value?: number, defaultText = TEXTS_UI.notApplicable) => {
  if (value === undefined || value === null || isNaN(value)) return defaultText;
  return `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

type RisorsaVariabileKey = {
  [K in keyof DistribuzioneRisorseData]: DistribuzioneRisorseData[K] extends RisorsaVariabileDetail | undefined ? K : never
}[keyof DistribuzioneRisorseData];

const DisplayField: React.FC<{ label: string; value: string | number; info?: string }> = ({ label, value, info }) => (
  <div className="mb-0">
    <label className="block text-xs font-medium text-[#1b0e0e] pb-2">{label}</label>
    <div className="flex w-full min-w-0 flex-1 items-center rounded-lg text-[#1b0e0e] border border-transparent bg-[#fcf8f8] h-10 p-2 text-sm font-semibold">
      {value}
    </div>
    {info && <p className="mt-1 text-xs text-[#5f5252]">{info}</p>}
  </div>
);

const VariableFundingItem: React.FC<{
  id: keyof DistribuzioneRisorseData;
  description: string | React.ReactNode;
  value?: RisorsaVariabileDetail;
  onChange: (field: keyof DistribuzioneRisorseData, subField: keyof RisorsaVariabileDetail, value?: number) => void;
  riferimentoNormativo?: string;
  disabled?: boolean;
  inputInfo?: string | React.ReactNode;
  showABilancio?: boolean;
  showPercentage?: boolean;
  budgetBaseForPercentage?: number;
  disableSavingsAndBudgetFields?: boolean;
}> = ({ id, description, value, onChange, riferimentoNormativo, disabled, inputInfo, showABilancio = true, showPercentage = false, budgetBaseForPercentage = 0, disableSavingsAndBudgetFields = false }) => {
  
  const handleInputChange = (subField: keyof RisorsaVariabileDetail) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
    onChange(id, subField, val);
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percValue = e.target.value === '' ? undefined : parseFloat(e.target.value);
    if (percValue === undefined || isNaN(percValue) || budgetBaseForPercentage <= 0) {
        onChange(id, 'stanziate', undefined);
        return;
    }
    const newStanziate = (percValue / 100) * budgetBaseForPercentage;
    const roundedStanziate = Math.round((newStanziate + Number.EPSILON) * 100) / 100;
    onChange(id, 'stanziate', roundedStanziate);
  };

  const percentage = (value?.stanziate && budgetBaseForPercentage && budgetBaseForPercentage > 0) 
    ? (value.stanziate / budgetBaseForPercentage) * 100 
    : 0;
  
  const gridColsClass = showPercentage ? (showABilancio ? 'grid-cols-4' : 'grid-cols-3') : (showABilancio ? 'grid-cols-3' : 'grid-cols-2');
  const descriptionColSpan = showPercentage ? 'md:col-span-4' : 'md:col-span-5';
  const inputsColSpan = showPercentage ? 'md:col-span-8' : 'md:col-span-7';

  return (
    <div className={`py-4 border-b border-[#f3e7e8] last:border-b-0 transition-colors hover:bg-[#fcf8f8] ${disabled ? 'opacity-60 bg-gray-50' : ''}`}>
      <div className="grid grid-cols-12 gap-x-4 gap-y-2 items-start">
        <div className={`col-span-12 ${descriptionColSpan} flex flex-col justify-center h-full`}>
          <p className={`block text-sm text-[#1b0e0e] ${disabled ? 'cursor-not-allowed' : ''}`}>
            {description}
          </p>
          {riferimentoNormativo && <p className="text-xs text-[#5f5252] mt-0.5">{riferimentoNormativo}</p>}
        </div>
        <div className={`col-span-12 ${inputsColSpan} grid ${gridColsClass} gap-x-2`}>
            <Input
              label="Stanziate"
              type="number"
              id={`${String(id)}_stanziate`}
              value={value?.stanziate ?? ''}
              onChange={handleInputChange('stanziate')}
              disabled={disabled}
              placeholder="0.00"
              step="0.01"
              containerClassName="mb-0"
              inputClassName="text-right h-10 p-2"
              labelClassName="text-xs"
            />
            {showPercentage && (
                <Input
                    label="%"
                    type="number"
                    id={`${String(id)}_percentage`}
                    value={percentage === 0 ? '' : percentage.toFixed(2)}
                    onChange={handlePercentageChange}
                    disabled={disabled || budgetBaseForPercentage <= 0}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    containerClassName="mb-0"
                    inputClassName="text-right h-10 p-2"
                    labelClassName="text-xs"
                    inputInfo={disabled || budgetBaseForPercentage <= 0 ? "Budget non definito" : undefined}
                />
            )}
            <Input
              label="Risparmi"
              type="number"
              id={`${String(id)}_risparmi`}
              value={value?.risparmi ?? ''}
              onChange={handleInputChange('risparmi')}
              disabled={disabled || disableSavingsAndBudgetFields}
              placeholder="0.00"
              step="0.01"
              containerClassName="mb-0"
              inputClassName="text-right h-10 p-2"
              labelClassName="text-xs"
            />
            {showABilancio && (
              <Input
                label="A Bilancio"
                type="number"
                id={`${String(id)}_aBilancio`}
                value={value?.aBilancio ?? ''}
                onChange={handleInputChange('aBilancio')}
                disabled={disabled || disableSavingsAndBudgetFields}
                placeholder="0.00"
                step="0.01"
                containerClassName="mb-0"
                inputClassName="text-right h-10 p-2"
                labelClassName="text-xs"
              />
            )}
        </div>
      </div>
      {inputInfo && <div className="text-xs text-[#5f5252] mt-1 pl-2">{inputInfo}</div>}
    </div>
  );
};

const SimpleFundingItem = <T extends Record<string, any>>({
  id,
  description,
  value,
  onChange,
  riferimentoNormativo,
  disabled,
  inputInfo,
}: {
  id: keyof T;
  description: string | React.ReactNode;
  value?: number;
  onChange: (field: keyof T, value?: number) => void;
  riferimentoNormativo?: string;
  disabled?: boolean;
  inputInfo?: string | React.ReactNode;
}) => (
    <div className={`grid grid-cols-12 gap-x-4 gap-y-2 py-4 border-b border-[#f3e7e8] last:border-b-0 items-start transition-colors hover:bg-[#fcf8f8] ${disabled ? 'opacity-60 bg-gray-50' : ''}`}>
      <div className="col-span-12 md:col-span-8 flex flex-col justify-center h-full">
        <label htmlFor={id as string} className={`block text-sm text-[#1b0e0e] ${disabled ? 'cursor-not-allowed' : ''}`}>
          {description}
        </label>
        {riferimentoNormativo && <p className="text-xs text-[#5f5252] mt-0.5">{riferimentoNormativo}</p>}
      </div>
      <div className="col-span-12 md:col-span-4">
        <Input
          type="number"
          id={id as string}
          value={value ?? ''}
          onChange={(e) => onChange(id, e.target.value === '' ? undefined : parseFloat(e.target.value))}
          placeholder="0.00"
          step="0.01"
          inputClassName={`text-right w-full h-11 p-2.5 ${disabled ? 'bg-white' : 'bg-[#f3e7e8]'}`}
          containerClassName="mb-0"
          disabled={disabled}
        />
        {inputInfo && <div className="text-xs text-[#5f5252] mt-1">{inputInfo}</div>}
      </div>
    </div>
);

const CalculatedDisplayItem: React.FC<{ label: string; value?: number; infoText?: string | React.ReactNode; isWarning?: boolean; isBold?: boolean }> = ({ label, value, infoText, isWarning = false, isBold = false }) => (
    <div className={`grid grid-cols-12 gap-x-4 gap-y-1 py-3 items-center ${isBold ? 'bg-[#f3e7e8]' : 'bg-white'}`}>
      <div className="col-span-12 md:col-span-8">
        <p className={`block text-sm ${isBold ? 'font-bold' : 'font-medium'} text-[#1b0e0e]`}>{label}</p>
        {infoText && <div className={`text-xs ${isWarning ? 'text-[#c02128]' : 'text-[#5f5252]'}`}>{infoText}</div>}
      </div>
      <div className="col-span-12 md:col-span-4 text-right">
        <p className={`text-sm ${isBold ? 'font-bold' : 'font-semibold'} ${isWarning ? 'text-[#c02128]' : 'text-[#1b0e0e]'}`}>
          {formatCurrency(value)}
        </p>
      </div>
    </div>
  );

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


export const DistribuzioneRisorsePage: React.FC = () => {
  const { 
    distribuzioneRisorseData,
    fondoAccessorioDipendenteData,
    annualData,
    fondoElevateQualificazioniData,
    calculatedFund,
    normativeData,
    employees,
    saveState,
    updateDistribuzioneRisorseData,
    setActiveTab,
    updateFondoElevateQualificazioniData
  } = useAppStore(state => ({
    distribuzioneRisorseData: state.fundData.distribuzioneRisorseData,
    fondoAccessorioDipendenteData: state.fundData.fondoAccessorioDipendenteData,
    annualData: state.fundData.annualData,
    fondoElevateQualificazioniData: state.fundData.fondoElevateQualificazioniData,
    calculatedFund: state.calculatedFund,
    normativeData: state.normativeData,
    employees: state.personaleServizio.dettagli,
    saveState: state.saveState,
    updateDistribuzioneRisorseData: state.updateDistribuzioneRisorseData,
    setActiveTab: state.setActiveTab,
    updateFondoElevateQualificazioniData: state.updateFondoElevateQualificazioniData,
  }));

  const [isMaggiorazioneUserEdited, setIsMaggiorazioneUserEdited] = useState(false);
  const [isOrganizzativaUserEdited, setIsOrganizzativaUserEdited] = useState(false);
  const [isIndividualeUserEdited, setIsIndividualeUserEdited] = useState(false);


  if (!calculatedFund || !calculatedFund.dettaglioFondi || !normativeData) {
    return (
      <div className="space-y-8">
        <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">Distribuzione delle Risorse</h2>
        <Card title="Dati non disponibili">
          <p className="text-lg text-[#5f5252] mb-4">
            Per poter distribuire le risorse, è necessario prima eseguire il calcolo generale del fondo.
          </p>
          <p className="text-sm text-[#5f5252] mb-4">
            Vai alla pagina <strong className="text-[#1b0e0e]">"Dati Costituzione Fondo"</strong> e clicca sul pulsante <strong className="text-[#ea2832]">"Salva Dati e Calcola Fondo"</strong>.
          </p>
          <Button 
            variant="primary" 
            onClick={() => setActiveTab('dataEntry')}
          >
            Vai a Dati Costituzione Fondo
          </Button>
        </Card>
      </div>
    );
  }
  
  const { 
    simulatoreRisultati, 
    isEnteDissestato,
    isEnteStrutturalmenteDeficitario,
    isEnteRiequilibrioFinanziario,
  } = annualData;
  
  const isEnteInCondizioniSpeciali = !!isEnteDissestato || !!isEnteStrutturalmenteDeficitario || !!isEnteRiequilibrioFinanziario;
  const incrementoEQconRiduzioneDipendenti = fondoElevateQualificazioniData?.ris_incrementoConRiduzioneFondoDipendenti;

  const fadTotals = useMemo(() => calculateFadTotals(
    fondoAccessorioDipendenteData, 
    simulatoreRisultati, 
    isEnteInCondizioniSpeciali, 
    incrementoEQconRiduzioneDipendenti,
    normativeData
  ), [fondoAccessorioDipendenteData, simulatoreRisultati, isEnteInCondizioniSpeciali, incrementoEQconRiduzioneDipendenti, normativeData]);

  const totaleDaDistribuire = fadTotals.totaleRisorseDisponibiliContrattazione_Dipendenti;


  const handleChange = (field: keyof DistribuzioneRisorseData, value?: number | boolean) => {
    updateDistribuzioneRisorseData({ [field]: value });
  };
  
  const handleVariableChange = (
    field: keyof DistribuzioneRisorseData, 
    subField: keyof RisorsaVariabileDetail, 
    value?: number
  ) => {
    if (field === 'p_maggiorazionePerformanceIndividuale' && subField === 'stanziate') {
      setIsMaggiorazioneUserEdited(true);
    }
    if (field === 'p_performanceOrganizzativa' && subField === 'stanziate') {
      setIsOrganizzativaUserEdited(true);
    }
    if (field === 'p_performanceIndividuale' && subField === 'stanziate') {
      setIsIndividualeUserEdited(true);
    }
    const currentItem = distribuzioneRisorseData[field] as RisorsaVariabileDetail | undefined;
    const newItem = {
      ...currentItem,
      [subField]: value
    };
    updateDistribuzioneRisorseData({ [field]: newItem });
  };

  const handlePerfPercChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercStr = e.target.value;
    const newPerc = newPercStr === '' ? undefined : parseFloat(newPercStr);
    
    // Unlock automatic calculation when user changes the percentage
    setIsIndividualeUserEdited(false);
    setIsOrganizzativaUserEdited(false);

    updateDistribuzioneRisorseData({ criteri_percPerfIndividuale: newPerc });
  };
  
  const utilizziParteStabile = useMemo(() => {
    const data = distribuzioneRisorseData || {};
    return (data.u_diffProgressioniStoriche || 0) +
           (data.u_indennitaComparto || 0) +
           (data.u_incrIndennitaEducatori?.stanziate || 0) +
           (data.u_incrIndennitaScolastico?.stanziate || 0) +
           (data.u_indennitaEx8QF?.stanziate || 0);
  }, [distribuzioneRisorseData]);
  
  const utilizziParteVariabile = useMemo(() => {
    const data = distribuzioneRisorseData || {};
    return Object.keys(data)
      .filter(key => key.startsWith('p_'))
      .reduce((sum, key) => {
          const value = data[key as keyof DistribuzioneRisorseData] as RisorsaVariabileDetail | undefined;
          return sum + (value?.stanziate || 0);
      }, 0);
  }, [distribuzioneRisorseData]);

  const totaleAllocato = useMemo(() => {
    return utilizziParteStabile + utilizziParteVariabile;
  }, [utilizziParteStabile, utilizziParteVariabile]);

  const importoRimanente = totaleDaDistribuire - totaleAllocato;

  const importoDisponibileContrattazione = useMemo(() => {
    return totaleDaDistribuire - utilizziParteStabile;
  }, [totaleDaDistribuire, utilizziParteStabile]);
  
  const otherVariableUtilizations = useMemo(() => {
    const data = distribuzioneRisorseData || {};
    return Object.keys(data)
      .filter(key => 
          key.startsWith('p_') && 
          key !== 'p_performanceOrganizzativa' && 
          key !== 'p_performanceIndividuale' &&
          key !== 'p_maggiorazionePerformanceIndividuale'
      )
      .reduce((sum, key) => {
          const value = data[key as keyof DistribuzioneRisorseData] as RisorsaVariabileDetail | undefined;
          return sum + (value?.stanziate || 0);
      }, 0);
  }, [distribuzioneRisorseData]);

  useEffect(() => {
    const data = distribuzioneRisorseData;
    const budgetDisponibilePerformance = Math.max(0, importoDisponibileContrattazione - otherVariableUtilizations);

    const percIndividuale = data.criteri_percPerfIndividuale ?? 0;
    const percOrganizzativa = 100 - percIndividuale;
    
    const updates: Partial<DistribuzioneRisorseData> = {};

    const budgetEffettivoPerformance = budgetDisponibilePerformance - (data.p_maggiorazionePerformanceIndividuale?.stanziate || 0);

    if (!isIndividualeUserEdited) {
        const calculatedIndividuale = budgetEffettivoPerformance * (percIndividuale / 100);
        const roundedIndividuale = Math.round((calculatedIndividuale + Number.EPSILON) * 100) / 100;
        const currentIndividuale = data.p_performanceIndividuale?.stanziate;
        
        if (currentIndividuale !== roundedIndividuale && isFinite(roundedIndividuale)) {
            updates.p_performanceIndividuale = { ...data.p_performanceIndividuale, stanziate: roundedIndividuale };
        }
    }

    if (!isOrganizzativaUserEdited) {
        const calculatedOrganizzativa = budgetEffettivoPerformance * (percOrganizzativa / 100);
        const roundedOrganizzativa = Math.round((calculatedOrganizzativa + Number.EPSILON) * 100) / 100;
        const currentOrganizzativa = data.p_performanceOrganizzativa?.stanziate;

        if (currentOrganizzativa !== roundedOrganizzativa && isFinite(roundedOrganizzativa)) {
            updates.p_performanceOrganizzativa = { ...data.p_performanceOrganizzativa, stanziate: roundedOrganizzativa };
        }
    }
    
    if (Object.keys(updates).length > 0) {
        updateDistribuzioneRisorseData(updates);
    }
  }, [
      importoDisponibileContrattazione, 
      otherVariableUtilizations,
      distribuzioneRisorseData.criteri_percPerfIndividuale,
      distribuzioneRisorseData.p_performanceIndividuale,
      distribuzioneRisorseData.p_performanceOrganizzativa,
      distribuzioneRisorseData.p_maggiorazionePerformanceIndividuale,
      isIndividualeUserEdited, 
      isOrganizzativaUserEdited, 
      updateDistribuzioneRisorseData
  ]);

  const distribuzioneFieldDefinitions = useMemo(() => getDistribuzioneFieldDefinitions(normativeData), [normativeData]);

  const sections = useMemo(() => 
    distribuzioneFieldDefinitions.reduce((acc, field) => {
      (acc[field.section] = acc[field.section] || []).push(field);
      return acc;
    }, {} as Record<string, typeof distribuzioneFieldDefinitions>)
  , [distribuzioneFieldDefinitions]);

  const numeroDipendenti = employees?.length || 0;
  const percDipendentiBonus = distribuzioneRisorseData.criteri_percDipendentiBonus || 0;
  const numDipendentiBonus = Math.ceil(numeroDipendenti * (percDipendentiBonus / 100));

  const maggiorazioneProCapite = useMemo(() => {
    const percInd = distribuzioneRisorseData.criteri_percPerfIndividuale || 0;
    const percMagg = distribuzioneRisorseData.criteri_percMaggiorazionePremio || 0;

    if (numeroDipendenti === 0) return 0;

    const budgetIndividualeTeorico = importoDisponibileContrattazione * (percInd / 100);
    const premioMedioTeorico = budgetIndividualeTeorico / numeroDipendenti;
    return premioMedioTeorico * (percMagg / 100);

  }, [importoDisponibileContrattazione, distribuzioneRisorseData.criteri_percPerfIndividuale, distribuzioneRisorseData.criteri_percMaggiorazionePremio, numeroDipendenti]);
  
  useEffect(() => {
    const calculatedValue = maggiorazioneProCapite * numDipendentiBonus;
    if (isFinite(calculatedValue)) {
        const roundedValue = Math.round((calculatedValue + Number.EPSILON) * 100) / 100;
        
        if (!isMaggiorazioneUserEdited) {
            const currentValue = distribuzioneRisorseData.p_maggiorazionePerformanceIndividuale?.stanziate;
            if (currentValue !== roundedValue) {
                const currentItem = distribuzioneRisorseData.p_maggiorazionePerformanceIndividuale as RisorsaVariabileDetail | undefined;
                const newItem = {
                    ...currentItem,
                    stanziate: roundedValue
                };
                updateDistribuzioneRisorseData({ p_maggiorazionePerformanceIndividuale: newItem });
            }
        }
    }
  }, [maggiorazioneProCapite, numDipendentiBonus, isMaggiorazioneUserEdited, updateDistribuzioneRisorseData, distribuzioneRisorseData.p_maggiorazionePerformanceIndividuale]);

  // EQ Card Logic
  const eqData = fondoElevateQualificazioniData || {} as FondoElevateQualificazioniData;
  const handleEQChange = (field: keyof FondoElevateQualificazioniData, value?: number) => {
      updateFondoElevateQualificazioniData({ [field]: value });
  };
  const sommaRisorseSpecificheEQ = 
    (eqData.ris_fondoPO2017 || 0) +
    (eqData.ris_incrementoConRiduzioneFondoDipendenti || 0) +
    (eqData.ris_incrementoLimiteArt23c2_DL34 || 0) +
    (eqData.ris_incremento022MonteSalari2018 || 0) -
    (eqData.fin_art23c2_adeguamentoTetto2016 || 0);

  const sommaDistribuzioneFondoEQ = 
    (eqData.st_art17c2_retribuzionePosizione || 0) +
    (eqData.st_art17c3_retribuzionePosizioneArt16c4 || 0) +
    (eqData.st_art17c5_interimEQ || 0) +
    (eqData.st_art23c5_maggiorazioneSedi || 0) +
    (eqData.va_art17c4_retribuzioneRisultato || 0);
    
  const sommeNonUtilizzateEQ = sommaRisorseSpecificheEQ - sommaDistribuzioneFondoEQ;
  const minRetribuzioneRisultatoEQ = sommaRisorseSpecificheEQ * 0.15;
  
  let retribuzioneRisultatoInfoEQ: string | React.ReactNode = `Minimo atteso: ${formatCurrency(minRetribuzioneRisultatoEQ)}.`;
  if (eqData.va_art17c4_retribuzioneRisultato !== undefined && eqData.va_art17c4_retribuzioneRisultato < minRetribuzioneRisultatoEQ && minRetribuzioneRisultatoEQ > 0) {
      retribuzioneRisultatoInfoEQ = (
          <>
              Minimo atteso: {formatCurrency(minRetribuzioneRisultatoEQ)}.<br/>
              <strong className="text-[#c02128]">Attenzione: l'importo è inferiore al 15% delle Risorse Specifiche EQ.</strong>
          </>
      );
  } else if (minRetribuzioneRisultatoEQ <= 0 && sommaRisorseSpecificheEQ > 0) {
      retribuzioneRisultatoInfoEQ = "Calcolare prima le Risorse per le Elevate Qualificazioni per determinare il minimo.";
  } else if (sommaRisorseSpecificheEQ <= 0) {
      retribuzioneRisultatoInfoEQ = "Nessuna risorsa specifica EQ definita.";
  }
  
  const multiInputStableKeys: Array<keyof DistribuzioneRisorseData> = [
    'u_incrIndennitaEducatori',
    'u_incrIndennitaScolastico',
    'u_indennitaEx8QF'
  ];

  const { criteri_isConsuntivoMode } = distribuzioneRisorseData;
  const isPreventivoMode = !criteri_isConsuntivoMode;

  useEffect(() => {
    if (criteri_isConsuntivoMode === false) {
      // When switching to preventivo mode, clear risparmi and aBilancio
      const allVariableFields = distribuzioneFieldDefinitions
        .filter(def => {
            const val = distribuzioneRisorseData[def.key];
            return typeof val === 'object' && val !== null;
        })
        .map(def => def.key) as RisorsaVariabileKey[];

      const updates: Partial<DistribuzioneRisorseData> = {};
      let needsUpdate = false;

      allVariableFields.forEach(key => {
        const currentItem = distribuzioneRisorseData[key];
        if (currentItem && (currentItem.risparmi !== undefined || currentItem.aBilancio !== undefined)) {
          updates[key] = {
            ...currentItem,
            risparmi: undefined,
            aBilancio: undefined,
          };
          needsUpdate = true;
        }
      });
      
      if (needsUpdate) {
        updateDistribuzioneRisorseData(updates);
      }
    }
  }, [criteri_isConsuntivoMode, updateDistribuzioneRisorseData, distribuzioneRisorseData, distribuzioneFieldDefinitions]);

  const { riferimenti_normativi: norme } = normativeData;

  return (
    <div className="space-y-8 pb-24">
      <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">Distribuzione delle Risorse del Fondo</h2>
      
      <Card title="Riepilogo Risorse e Allocazione" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#fcf8f8] rounded-lg text-center">
            <h4 className="text-sm font-medium text-[#5f5252]">Totale da Distribuire</h4>
            <p className="text-2xl font-bold text-[#1b0e0e]">{formatCurrency(totaleDaDistribuire)}</p>
            <p className="text-xs text-[#5f5252] mt-1">(Dal Fondo Personale Dipendente)</p>
          </div>
          <div className="p-4 bg-sky-50 rounded-lg text-center border border-sky-200">
            <h4 className="text-sm font-medium text-sky-800">Importo disponibile alla contrattazione</h4>
            <p className="text-2xl font-bold text-sky-700">{formatCurrency(importoDisponibileContrattazione)}</p>
            <p className="text-xs text-sky-600 mt-1">(Totale da Distribuire - Utilizzi Parte Stabile)</p>
          </div>
          <div className="p-4 bg-[#fcf8f8] rounded-lg text-center">
            <h4 className="text-sm font-medium text-[#5f5252]">Totale Allocato</h4>
            <p className={`text-2xl font-bold ${importoRimanente < 0 ? 'text-[#c02128]' : 'text-green-600'}`}>
              {formatCurrency(totaleAllocato)}
            </p>
            <p className="text-xs text-[#5f5252] mt-1">(Somma di tutti gli utilizzi)</p>
          </div>
          <div className={`p-4 rounded-lg text-center transition-colors ${importoRimanente < 0 ? 'bg-[#fef2f2]' : 'bg-[#f0fdf4]'}`}>
            <h4 className="text-sm font-medium text-[#5f5252]">Importo Rimanente</h4>
            <p className={`text-2xl font-bold ${importoRimanente < 0 ? 'text-[#c02128]' : 'text-green-700'}`}>
              {formatCurrency(importoRimanente)}
            </p>
            <p className="text-xs text-[#5f5252] mt-1">(Totale da Distribuire - Totale Allocato)</p>
          </div>
        </div>
        {importoRimanente < 0 && (
          <p className="text-center text-sm text-red-600 font-semibold mt-3 p-2 bg-red-50 rounded-md">
            Attenzione: l'importo allocato supera le risorse disponibili.
          </p>
        )}
      </Card>

      <Card title="Criteri di Distribuzione Performance" isCollapsible defaultCollapsed={false} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="md:col-span-2 flex items-center mb-4">
                  <input
                      type="checkbox"
                      id="isConsuntivoMode"
                      checked={distribuzioneRisorseData.criteri_isConsuntivoMode || false}
                      onChange={(e) => handleChange('criteri_isConsuntivoMode', e.target.checked)}
                      className="h-5 w-5 text-[#ea2832] border-[#d1c0c1] rounded focus:ring-[#ea2832]/50"
                  />
                  <label htmlFor="isConsuntivoMode" className="ml-3 block text-base font-medium text-[#1b0e0e]">
                      Modalità consuntivo?
                  </label>
              </div>
              <Input
                label="% Performance Individuale"
                type="number"
                id="criteri_percPerfIndividuale"
                value={distribuzioneRisorseData.criteri_percPerfIndividuale ?? ''}
                onChange={handlePerfPercChange}
                inputInfo={`% Performance Organizzativa: ${100 - (distribuzioneRisorseData.criteri_percPerfIndividuale || 0)}%`}
                min="0" max="100" step="1"
              />
              <DisplayField
                label="Budget Base Performance (calcolato)"
                value={formatCurrency(Math.max(0, importoDisponibileContrattazione - otherVariableUtilizations))}
                info="Disponibile per Contrattazione - Altri utilizzi variabili"
              />
              <Input
                label="% Maggiorazione Premio"
                type="number"
                id="criteri_percMaggiorazionePremio"
                value={distribuzioneRisorseData.criteri_percMaggiorazionePremio ?? ''}
                onChange={(e) => {
                  setIsMaggiorazioneUserEdited(false);
                  handleChange('criteri_percMaggiorazionePremio', e.target.value === '' ? undefined : parseFloat(e.target.value));
                }}
                min="0" max="100" step="1"
              />
              <Input
                label="% Dipendenti con Bonus Maggiorazione"
                type="number"
                id="criteri_percDipendentiBonus"
                value={distribuzioneRisorseData.criteri_percDipendentiBonus ?? ''}
                onChange={(e) => {
                  setIsMaggiorazioneUserEdited(false);
                  handleChange('criteri_percDipendentiBonus', e.target.value === '' ? undefined : parseFloat(e.target.value));
                }}
                min="0" max="100" step="1"
                inputInfo={`${numDipendentiBonus} su ${numeroDipendenti} dipendenti`}
              />
              <div className="md:col-span-2 mt-2">
                <DisplayField
                    label="Maggiorazione pro-capite premio individuale (calcolato)"
                    value={formatCurrency(maggiorazioneProCapite)}
                    info="((Disponibile contrattazione * % Perf. Ind.) / N° Dipendenti) * % Maggiorazione"
                />
              </div>
          </div>
      </Card>
      
      {Object.entries(sections).map(([sectionName, fields]) => (
        <Card key={sectionName} title={sectionName} isCollapsible defaultCollapsed={sectionName.startsWith('Utilizzi Parte Variabile')}>
          {fields.map(def => {
            const isAutoCalculated = def.key === 'u_diffProgressioniStoriche' || def.key === 'u_indennitaComparto';
            const value = distribuzioneRisorseData[def.key];
            
            if (def.key.startsWith('u_')) {
              if (multiInputStableKeys.includes(def.key as any)) {
                return (
                    <VariableFundingItem
                      key={String(def.key)}
                      id={def.key}
                      description={def.description}
                      value={value as RisorsaVariabileDetail | undefined}
                      onChange={handleVariableChange}
                      riferimentoNormativo={def.riferimento}
                      showABilancio={false}
                      disableSavingsAndBudgetFields={isPreventivoMode}
                    />
                );
              } else {
                 return (
                    <SimpleFundingItem<DistribuzioneRisorseData>
                      key={String(def.key)}
                      id={def.key}
                      description={def.description}
                      value={value as number | undefined}
                      onChange={(field, val) => handleChange(field, val as number)}
                      riferimentoNormativo={def.riferimento}
                      disabled={isAutoCalculated}
                      inputInfo={isAutoCalculated ? "Valore calcolato automaticamente dalla pagina Personale in Servizio" : undefined}
                    />
                );
              }
            } else if (def.key.startsWith('p_')) {
              return (
                <VariableFundingItem
                  key={String(def.key)}
                  id={def.key}
                  description={def.description}
                  value={value as RisorsaVariabileDetail | undefined}
                  onChange={handleVariableChange}
                  riferimentoNormativo={def.riferimento}
                  showPercentage={true}
                  budgetBaseForPercentage={importoDisponibileContrattazione}
                  disableSavingsAndBudgetFields={isPreventivoMode}
                />
              );
            }
            return null;
          })}
        </Card>
      ))}

      <Card title="Distribuzione del fondo EQ" className="mb-6" isCollapsible={true} defaultCollapsed={true}>
        <h4 className="text-base font-bold text-[#1b0e0e] mb-2 py-3 border-b border-[#f3e7e8]">Retribuzione di Posizione (Art. 17 CCNL)</h4>
        <SimpleFundingItem<FondoElevateQualificazioniData> id="st_art17c2_retribuzionePosizione" description="L’importo della retribuzione di posizione varia da un minimo di € 5.000 ad un massimo di € 18.000 lordi per tredici mensilità, sulla base della graduazione di ciascuna posizione..." riferimentoNormativo={norme.art17_ccnl2022 + " c.2"} value={eqData.st_art17c2_retribuzionePosizione} onChange={handleEQChange} />
        <SimpleFundingItem<FondoElevateQualificazioniData> id="st_art17c3_retribuzionePosizioneArt16c4" description="Nelle ipotesi considerate nell’art. 16, comma 4, l’importo della retribuzione di posizione varia da un minimo di € 3.000 ad un massimo di € 9.500 annui lordi per tredici mensilità." riferimentoNormativo={norme.art17_ccnl2022 + " c.3"} value={eqData.st_art17c3_retribuzionePosizioneArt16c4} onChange={handleEQChange} />
        <SimpleFundingItem<FondoElevateQualificazioniData> id="st_art17c5_interimEQ" description="Nell’ipotesi di conferimento ad interim... ulteriore importo la cui misura può variare dal 15% al 25% del valore economico della retribuzione di posizione..." riferimentoNormativo={norme.art17_ccnl2022 + " c.5"} value={eqData.st_art17c5_interimEQ} onChange={handleEQChange} />
        <SimpleFundingItem<FondoElevateQualificazioniData> id="st_art23c5_maggiorazioneSedi" description="Maggiorazione della retribuzione di posizione per servizio in diverse sedi (fino al 30%)..." riferimentoNormativo={norme.art23_c5_ccnl2022} value={eqData.st_art23c5_maggiorazioneSedi} onChange={handleEQChange} />
        <h4 className="text-base font-bold text-[#1b0e0e] mb-2 mt-6 py-3 border-b border-t border-[#f3e7e8]">Retribuzione di Risultato (Art. 17 CCNL)</h4>
        <SimpleFundingItem<FondoElevateQualificazioniData> id="va_art17c4_retribuzioneRisultato" description="Gli enti definiscono i criteri per la determinazione e per l’erogazione annuale della retribuzione di risultato degli incarichi di EQ, destinando a tale particolare voce retributiva una quota non inferiore al 15% delle risorse complessivamente finalizzate alla erogazione della retribuzione di posizione e di risultato di tutti gli incarichi previsti dal proprio ordinamento." riferimentoNormativo={norme.art17_ccnl2022 + " c.4"} value={eqData.va_art17c4_retribuzioneRisultato} onChange={handleEQChange} inputInfo={retribuzioneRisultatoInfoEQ} />
        <SectionTotal label="SOMMA DISTRIBUZIONE FONDO EQ" total={sommaDistribuzioneFondoEQ} className="border-t-2 border-[#d1c0c1]" />
        <CalculatedDisplayItem label="Somme non utilizzate" value={sommeNonUtilizzateEQ} infoText="Calcolato come: (Somma Risorse per le Elevate Qualificazioni) - (Somma Distribuzione Fondo EQ)" isWarning={sommeNonUtilizzateEQ < 0} isBold={true}/>
      </Card>


      <div className="mt-10 flex justify-end">
        <Button 
          variant="primary" 
          size="lg" 
          onClick={saveState}
        >
          Salva Distribuzione
        </Button>
      </div>
    </div>
  );
};