// components/dataInput/SimulatoreIncrementoForm.tsx
import React, { useEffect, useCallback } from 'react';
import { useAppStore } from '../../store.ts';
import { SimulatoreIncrementoInput, TipologiaEnte } from '../../types.ts';
import { Input } from '../shared/Input.tsx';
import { Card } from '../shared/Card.tsx';
import { TEXTS_UI } from '../../constants.ts';
import { calculateSimulazione } from '../../logic/fundEngine.ts';

const formatCurrencyForDisplay = (value?: number) => {
  if (value === undefined || value === null || isNaN(value)) return TEXTS_UI.notApplicable;
  return `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPercentageForDisplay = (value?: number) => {
  if (value === undefined || value === null || isNaN(value)) return TEXTS_UI.notApplicable;
  return `${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
};

export const SimulatoreIncrementoForm: React.FC = () => {
  const simulatoreInput = useAppStore(state => state.fundData.annualData.simulatoreInput);
  const numeroAbitanti = useAppStore(state => state.fundData.annualData.numeroAbitanti);
  const tipologiaEnte = useAppStore(state => state.fundData.annualData.tipologiaEnte);
  const simulatoreRisultati = useAppStore(state => state.fundData.annualData.simulatoreRisultati);
  const normativeData = useAppStore(state => state.normativeData);
  const updateSimulatoreRisultati = useAppStore(state => state.updateSimulatoreRisultati);
  const updateSimulatoreInput = useAppStore(state => state.updateSimulatoreInput);

  const runAndDispatchSimulazione = useCallback(() => {
    const results = calculateSimulazione(simulatoreInput, numeroAbitanti, tipologiaEnte);
    updateSimulatoreRisultati(results);
  }, [simulatoreInput, numeroAbitanti, tipologiaEnte, updateSimulatoreRisultati]);
  
  useEffect(() => {
    runAndDispatchSimulazione();
  }, [runAndDispatchSimulazione]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const processedValue = value === '' ? undefined : parseFloat(value);
    updateSimulatoreInput({ [name]: processedValue } as Partial<SimulatoreIncrementoInput>);
  };
  
  if (!normativeData) {
    return <Card title="Simulatore Incremento Potenziale"><p>Caricamento dati normativi...</p></Card>;
  }
  const { riferimenti_normativi } = normativeData;

  const si = simulatoreInput || {};
  const risultati = simulatoreRisultati;

  const tabellaSoglieUsata = tipologiaEnte === TipologiaEnte.PROVINCIA ? "Province" : "Comuni";

  return (
    <Card title="Simulatore Incremento Potenziale Fondo Salario Accessorio" className="mt-8 mb-8" isCollapsible={true} defaultCollapsed={true}>
      <p className="text-sm text-[#5f5252] mb-4">
        Questo strumento permette di simulare l'incremento potenziale del fondo del salario accessorio basandosi sulle normative (DL 25/2025 per il 48%, DM 17/03/2020 per la sostenibilità, L. 296/06 per il tetto storico).
        L'ente è attualmente identificato come: <strong className="text-[#1b0e0e]">{tipologiaEnte || "Non specificato"}</strong>.
        Il "Numero Abitanti" utilizzato per la fascia DM 17/03/2020 è: <strong className="text-[#1b0e0e]">{numeroAbitanti || TEXTS_UI.notApplicable}</strong>.
        La tabella delle soglie DM 17/03/2020 applicata è quella per: <strong className="text-[#1b0e0e]">{tabellaSoglieUsata}</strong>.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
            <Input label="Stipendi tabellari personale 2023" type="number" name="simStipendiTabellari2023" value={si.simStipendiTabellari2023 ?? ''} onChange={handleChange} step="0.01" placeholder="Es. 1500000.00" containerClassName="mb-1"/>
            <p className="text-xs text-[#5f5252] px-1">Come da Circ. RGS 175706/2025: valore complessivo lordo dipendente, inclusa 13a mensilità. Escludere l'Indennità di Vacanza Contrattuale (IVC).</p>
        </div>
        <div>
            <Input label="Ammontare componente stabile del Fondo per l'anno di applicazione:" type="number" name="simFondoStabileAnnoApplicazione" value={si.simFondoStabileAnnoApplicazione ?? ''} onChange={handleChange} step="0.01" placeholder="Es. 200000.00" containerClassName="mb-1"/>
            <p className="text-xs text-[#5f5252] px-1">Valore prima del potenziale incremento (Circ. RGS par. 2.3, lett. a).</p>
        </div>
        <div>
            <Input label="Ammontare remunerazione incarichi di Elevata Qualificazione (EQ) per l'anno di applicazione:" type="number" name="simRisorsePOEQAnnoApplicazione" value={si.simRisorsePOEQAnnoApplicazione ?? ''} onChange={handleChange} step="0.01" placeholder="Es. 50000.00" containerClassName="mb-1"/>
            <p className="text-xs text-[#5f5252] px-1">Valore relativo all'anno di applicazione (Circ. RGS par. 2.3, lett. b).</p>
        </div>
        <div>
            <Input label="Spesa di personale (ultimo consuntivo approvato, €)" type="number" name="simSpesaPersonaleConsuntivo2023" value={si.simSpesaPersonaleConsuntivo2023 ?? ''} onChange={handleChange} step="0.01" placeholder="Es. 2000000.00" containerClassName="mb-1"/>
            <p className="text-xs text-[#5f5252] px-1">Spesa risultante dal macroaggregato BDAP U.1.01.00.00.000, nonché nei codici spesa: U1.03.02.12.001; U1.03.02.12.002; U1.03.02.12.003; U1.03.02.12.999</p>
        </div>
        <div>
            <Input label="Media Entrate Correnti 2021-23 (netto FCDE 2023, €)" type="number" name="simMediaEntrateCorrenti2021_2023" value={si.simMediaEntrateCorrenti2021_2023 ?? ''} onChange={handleChange} step="0.01" placeholder="Es. 8000000.00" containerClassName="mb-3"/>
        </div>
        <div>
            <Input label="Tetto di spesa personale art. 1 c. 557 o c. 562 L. 296/06 (media 2011-13 o 2008):" type="number" name="simTettoSpesaPersonaleL296_06" value={si.simTettoSpesaPersonaleL296_06 ?? ''} onChange={handleChange} step="0.01" placeholder="Es. 1800000.00" containerClassName="mb-1"/>
            <p className="text-xs text-[#5f5252] px-1">Spesa di personale complessiva, al netto delle voci sterilizzate per il calcolo</p>
        </div>
        <div>
            <Input label="Costo annuo nuove assunzioni PIAO (a regime, €)" type="number" name="simCostoAnnuoNuoveAssunzioniPIAO" value={si.simCostoAnnuoNuoveAssunzioniPIAO ?? ''} onChange={handleChange} step="0.01" placeholder="Es. 70000.00" containerClassName="mb-3"/>
        </div>
        <div>
            <Input label="Percentuale oneri riflessi al netto dell'IRAP e maggiorato con i contributi INAIL sull'incremento del fondo:" type="number" name="simPercentualeOneriIncremento" value={si.simPercentualeOneriIncremento ?? ''} onChange={handleChange} step="0.01" placeholder="Es. 27.40" containerClassName="mb-1"/>
            <p className="text-xs text-[#5f5252] px-1">La Circ. RGS indica convenzionalmente il 27,4% + INAIL.</p>
        </div>
      </div>

      {risultati && (
        <div className="mt-6 space-y-4">
          <PhaseCard title={`Fase 1: Incremento Potenziale Massimo (Target 48% - ${riferimenti_normativi.art14_dl25_2025})`} highlightValue={formatCurrencyForDisplay(risultati.fase1_incrementoPotenzialeLordo) + " (Limite 1)"}>
            <p>Obiettivo 48% degli stipendi tabellari 2023: {formatCurrencyForDisplay(risultati.fase1_obiettivo48)}</p>
            <p>Fondo Anno di Applicazione (Stabile + EQ): {formatCurrencyForDisplay(risultati.fase1_fondoAttualeComplessivo)}</p>
            <p>Incremento Potenziale Lordo (Obiettivo - Attuale): {formatCurrencyForDisplay(risultati.fase1_incrementoPotenzialeLordo)}</p>
          </PhaseCard>

          <PhaseCard title={`Fase 2: Verifica Limite Spesa Personale (${riferimenti_normativi.dm_17_03_2020} - Tabella ${tabellaSoglieUsata})`} highlightValue={formatCurrencyForDisplay(risultati.fase2_spazioDisponibileDL34) + " (Limite 2)"}>
            <p>Spesa di Personale Futura Prevista (Consuntivo 2023 + Assunzioni PIAO): {formatCurrencyForDisplay(risultati.fase2_spesaPersonaleAttualePrevista)}</p>
            <p>Soglia % Spesa Personale / Entrate Correnti (per {numeroAbitanti || 'N/D'} abitanti - Tab. {tabellaSoglieUsata}): {formatPercentageForDisplay(risultati.fase2_sogliaPercentualeDM17_03_2020)}</p>
            <p>Limite di Spesa Sostenibile (Entrate Correnti * Soglia %): {formatCurrencyForDisplay(risultati.fase2_limiteSostenibileDL34)}</p>
            <p>Spazio Disponibile rispetto al Limite Sostenibile: {formatCurrencyForDisplay(risultati.fase2_spazioDisponibileDL34)}</p>
          </PhaseCard>

          <PhaseCard title={`Fase 3: Verifica Limite Tetto Storico (${riferimenti_normativi.l296_06_c557})`} highlightValue={formatCurrencyForDisplay(risultati.fase3_margineDisponibileL296_06) + " (Limite 3)"}>
            <p>Tetto di Spesa Personale (Art. 1 c.557 L. 296/06): {formatCurrencyForDisplay(si.simTettoSpesaPersonaleL296_06)}</p>
            <p>Spesa di Personale Futura Prevista: {formatCurrencyForDisplay(risultati.fase2_spesaPersonaleAttualePrevista)}</p>
            <p>Margine Disponibile rispetto al Tetto Storico: {formatCurrencyForDisplay(risultati.fase3_margineDisponibileL296_06)}</p>
          </PhaseCard>

          <PhaseCard title="Fase 4: Determinazione Spazio Utilizzabile Lordo" highlightValue={formatCurrencyForDisplay(risultati.fase4_spazioUtilizzabileLordo)}>
            <p>Lo Spazio Utilizzabile Lordo è il MINORE tra i tre limiti calcolati nelle fasi precedenti.</p>
            <ul className="list-disc list-inside text-sm ml-4">
                <li>Limite 1 (Target 48%): {formatCurrencyForDisplay(risultati.fase1_incrementoPotenzialeLordo)}</li>
                <li>Limite 2 (Sostenibilità DM 17/03/2020): {formatCurrencyForDisplay(risultati.fase2_spazioDisponibileDL34)}</li>
                <li>Limite 3 (Tetto Storico L. 296/06): {formatCurrencyForDisplay(risultati.fase3_margineDisponibileL296_06)}</li>
            </ul>
          </PhaseCard>

          <PhaseCard title="Fase 5: Calcolo Incremento Netto Effettivo del Fondo" isFinalResult={true} highlightValue={formatCurrencyForDisplay(risultati.fase5_incrementoNettoEffettivoFondo)}>
            <p>Spazio Utilizzabile Lordo (dalla Fase 4): {formatCurrencyForDisplay(risultati.fase4_spazioUtilizzabileLordo)}</p>
            <p>Percentuale Oneri su Incremento (IRAP e Contributi): {formatPercentageForDisplay(si.simPercentualeOneriIncremento)}</p>
            <p className="font-semibold text-[#1b0e0e]">Questo valore rappresenta l'importo massimo che l'ente, sulla base dei dati forniti, può decidere di aggiungere alla parte stabile del fondo del salario accessorio per l'anno.</p>
          </PhaseCard>
        </div>
      )}
    </Card>
  );
};

interface PhaseCardProps {
    title: string;
    children: React.ReactNode;
    highlightValue: string;
    isFinalResult?: boolean;
}

const PhaseCard: React.FC<PhaseCardProps> = ({ title, children, highlightValue, isFinalResult = false }) => {
    return (
        <div className={`p-4 border rounded-lg shadow-sm ${isFinalResult ? 'bg-[#f0fff4] border-[#c6f6d5]' : 'bg-[#f0f9ff] border-[#e0f2fe]'}`}> {/* Light green / Light blue */}
            <h5 className={`text-md font-bold mb-2 ${isFinalResult ? 'text-[#2f855a]' : 'text-[#2b6cb0]'}`}>{title}</h5> {/* Darker green / Darker blue */}
            <div className="text-sm text-[#1b0e0e] space-y-1 mb-3">{children}</div>
            <div className={`mt-2 pt-2 border-t ${isFinalResult ? 'border-green-200' : 'border-sky-200'}`}>
                <p className={`text-sm font-medium ${isFinalResult ? 'text-[#2f855a]' : 'text-[#2b6cb0]'}`}>
                    Risultato Fase: <strong className={`text-lg font-bold ${isFinalResult ? 'text-[#ea2832]' : 'text-[#ea2832]'}`}>{highlightValue}</strong>
                </p>
            </div>
        </div>
    );
};