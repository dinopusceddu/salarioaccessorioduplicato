// hooks/useFundCalculations.ts
import { 
    FundData, 
    CalculatedFund, 
    FundComponent, 
    EmployeeCategory,
    FondoAccessorioDipendenteData,
    FondoElevateQualificazioniData,
    FondoSegretarioComunaleData,
    FondoDirigenzaData,
    NormativeData
} from '../types.ts';
import {
    calculateFadTotals,
} from '../logic/fundEngine.ts';
import {
  RIF_ART23_DLGS75_2017,
  RIF_ART79_CCNL2022,
  RIF_ART33_DL34_2019,
  RIF_ART14_DL25_2025,
  RIF_ART8_DL13_2023,
  RIF_ART45_DLGS36_2023,
  RIF_ART208_CDS,
} from '../constants.ts';

// FIX: Update signature to accept normativeData and use it for calculations instead of hardcoded constants.
export const calculateFundCompletely = (fundData: FundData, normativeData: NormativeData): CalculatedFund => {
  const { 
    historicalData, 
    annualData, 
    fondoAccessorioDipendenteData,
    fondoElevateQualificazioniData,
    fondoSegretarioComunaleData,
    fondoDirigenzaData 
  } = fundData;

  const { valori_pro_capite, limiti, riferimenti_normativi } = normativeData;

  const fondoBase2016_originale = 
    (historicalData.fondoSalarioAccessorioPersonaleNonDirEQ2016 || 0) +
    (historicalData.fondoElevateQualificazioni2016 || 0) +
    (historicalData.fondoDirigenza2016 || 0) +
    (historicalData.risorseSegretarioComunale2016 || 0);
    
  const fondoPersonaleNonDirEQ2018_Art23 = historicalData.fondoPersonaleNonDirEQ2018_Art23 || 0;
  const fondoEQ2018_Art23 = historicalData.fondoEQ2018_Art23 || 0;
  const fondoBase2018_perArt23 = fondoPersonaleNonDirEQ2018_Art23 + fondoEQ2018_Art23;

  let dipendentiEquivalenti2018_Art23 = 0;
  if (annualData.personale2018PerArt23) {
    dipendentiEquivalenti2018_Art23 = annualData.personale2018PerArt23.reduce((sum, emp) => {
      const ptPerc = (typeof emp.partTimePercentage === 'number' && emp.partTimePercentage >=0 && emp.partTimePercentage <=100) ? emp.partTimePercentage / 100 : 1;
      return sum + ptPerc;
    }, 0);
  }

  let dipendentiEquivalentiAnnoRif_Art23 = 0;
  if (annualData.personaleAnnoRifPerArt23) {
    dipendentiEquivalentiAnnoRif_Art23 = annualData.personaleAnnoRifPerArt23.reduce((sum, emp) => {
      const ptPerc = (typeof emp.partTimePercentage === 'number' && emp.partTimePercentage >=0 && emp.partTimePercentage <=100) ? emp.partTimePercentage / 100 : 1;
      const cedolini = (typeof emp.cedoliniEmessi === 'number' && emp.cedoliniEmessi >=0 && emp.cedoliniEmessi <=12) ? emp.cedoliniEmessi : 12;
      const cedoliniRatio = cedolini > 0 ? cedolini / 12 : 1;
      return sum + (ptPerc * cedoliniRatio);
    }, 0);
  }
  
  let valoreIncrementoLordoArt23C2 = 0;
  if (fondoBase2018_perArt23 > 0 && dipendentiEquivalenti2018_Art23 > 0) {
    const valoreMedioProCapite2018_Art23 = fondoBase2018_perArt23 / dipendentiEquivalenti2018_Art23;
    const differenzaDipendenti_Art23 = dipendentiEquivalentiAnnoRif_Art23 - dipendentiEquivalenti2018_Art23;
    valoreIncrementoLordoArt23C2 = valoreMedioProCapite2018_Art23 * differenzaDipendenti_Art23;
  }
  const importoEffettivoAdeguamentoArt23C2 = Math.max(0, valoreIncrementoLordoArt23C2);

  const incrementoDeterminatoArt23C2: FundComponent | undefined = importoEffettivoAdeguamentoArt23C2 > 0 ? {
    descrizione: `Adeguamento fondo per variazione personale (Art. 23 c.2 D.Lgs. 75/2017, base 2018)`,
    importo: importoEffettivoAdeguamentoArt23C2,
    riferimento: RIF_ART23_DLGS75_2017,
    tipo: 'stabile',
    esclusoDalLimite2016: false, 
  } : undefined;
  
  const limiteArt23C2Modificato = fondoBase2016_originale + (incrementoDeterminatoArt23C2?.importo || 0);

  const dipendenti_soggette = fondoAccessorioDipendenteData?.cl_totaleParzialeRisorsePerConfrontoTetto2016 || 0;
  let eq_soggette = 0;
  if (fondoElevateQualificazioniData) {
    eq_soggette = (fondoElevateQualificazioniData.ris_fondoPO2017 || 0) +
                  (fondoElevateQualificazioniData.ris_incrementoConRiduzioneFondoDipendenti || 0) +
                  (fondoElevateQualificazioniData.ris_incrementoLimiteArt23c2_DL34 || 0);
  }
  const segretario_soggette = fondoSegretarioComunaleData?.fin_totaleRisorseRilevantiLimite || 0;
  const dirigenti_soggette = fondoDirigenzaData?.lim_totaleParzialeRisorseConfrontoTetto2016 || 0;

  const totaleRisorseSoggetteAlLimiteDaFondiSpecifici = 
    dipendenti_soggette + 
    eq_soggette + 
    segretario_soggette + 
    (annualData.hasDirigenza ? dirigenti_soggette : 0);
    
  const superamentoDelLimite2016 = Math.max(0, totaleRisorseSoggetteAlLimiteDaFondiSpecifici - limiteArt23C2Modificato);

  const personale2018_perArt33 = historicalData.personaleServizio2018 || 0;
  const personaleNonDirigenteEQAttuale_perArt33 = annualData.personaleServizioAttuale.filter(p => p.category === EmployeeCategory.DIPENDENTE || p.category === EmployeeCategory.EQ).reduce((sum, p) => sum + (p.count || 0), 0);
  const personaleTotaleAttuale_perArt33 = annualData.personaleServizioAttuale.reduce((sum, p) => sum + (p.count || 0), 0);
  const spesaStipendiTabellari2023_perArt14 = historicalData.spesaStipendiTabellari2023 || 0;
  
  const incrementiStabiliCCNL: FundComponent[] = [];
  if (personale2018_perArt33 > 0) { const importoArt67 = personale2018_perArt33 * valori_pro_capite.art67_ccnl_2018; incrementiStabiliCCNL.push({descrizione: `Incremento stabile CCNL (${valori_pro_capite.art67_ccnl_2018}€ pro-capite su personale 2018 per Art.33)`, importo: importoArt67, riferimento: riferimenti_normativi.art67_ccnl2018, tipo: 'stabile', esclusoDalLimite2016: false, });}
  if (personaleNonDirigenteEQAttuale_perArt33 > 0) { const importoArt79b = personaleNonDirigenteEQAttuale_perArt33 * valori_pro_capite.art79_ccnl_2022_b; incrementiStabiliCCNL.push({descrizione: `Incremento stabile CCNL (${valori_pro_capite.art79_ccnl_2022_b}€ pro-capite personale non Dir/EQ per Art.33)`, importo: importoArt79b, riferimento: `${RIF_ART79_CCNL2022} lett. b)`, tipo: 'stabile', esclusoDalLimite2016: false, });}
  let importoAdeguamentoProCapiteArt33 = 0;
  const valoreMedioProCapite2018_Art33 = (personale2018_perArt33 > 0 && fondoBase2016_originale > 0) ? fondoBase2016_originale / personale2018_perArt33 : 0;
  if (valoreMedioProCapite2018_Art33 > 0) { importoAdeguamentoProCapiteArt33 = (personaleTotaleAttuale_perArt33 - personale2018_perArt33) * valoreMedioProCapite2018_Art33;}
  const adeguamentoProCapite: FundComponent = { descrizione: "Adeguamento invarianza valore medio pro-capite 2018 (Art. 33 DL 34/2019)", importo: importoAdeguamentoProCapiteArt33, riferimento: RIF_ART33_DL34_2019, tipo: 'stabile', esclusoDalLimite2016: false, };
  let incrementoOpzionaleVirtuosi: FundComponent | undefined = undefined;
  if (annualData.condizioniVirtuositaFinanziariaSoddisfatte && spesaStipendiTabellari2023_perArt14 > 0) { const importoMaxIncremento48 = spesaStipendiTabellari2023_perArt14 * limiti.incremento_virtuosi_dl25_2025; incrementoOpzionaleVirtuosi = {descrizione: "Incremento facoltativo enti virtuosi (max 48% stip. tab. non dir. 2023)", importo: importoMaxIncremento48, riferimento: RIF_ART14_DL25_2025, tipo: 'stabile', esclusoDalLimite2016: false, }; }
  const risorseVariabili: FundComponent[] = [];
  const proventiArt45 = annualData.proventiSpecifici.find(p => p.riferimentoNormativo === RIF_ART45_DLGS36_2023); if (proventiArt45 && proventiArt45.importo && proventiArt45.importo > 0) {risorseVariabili.push({descrizione: "Incentivi funzioni tecniche", importo: proventiArt45.importo, riferimento: RIF_ART45_DLGS36_2023, tipo: 'variabile', esclusoDalLimite2016: true, }); }
  const proventiArt208 = annualData.proventiSpecifici.find(p => p.riferimentoNormativo === RIF_ART208_CDS); if (proventiArt208 && proventiArt208.importo && proventiArt208.importo > 0) {risorseVariabili.push({descrizione: "Proventi Codice della Strada (quota destinata)", importo: proventiArt208.importo, riferimento: RIF_ART208_CDS, tipo: 'variabile', esclusoDalLimite2016: false, });}
  annualData.proventiSpecifici.filter(p => p.riferimentoNormativo !== RIF_ART45_DLGS36_2023 && p.riferimentoNormativo !== RIF_ART208_CDS).forEach(p => { if (p.importo && p.importo > 0) {risorseVariabili.push({descrizione: p.descrizione, importo: p.importo, riferimento: p.riferimentoNormativo, tipo: 'variabile', esclusoDalLimite2016: false });}});
  if (annualData.condizioniVirtuositaFinanziariaSoddisfatte && annualData.incentiviPNRROpMisureStraordinarie && annualData.incentiviPNRROpMisureStraordinarie > 0) { const limitePNRR = fondoBase2016_originale * limiti.incremento_pnrr_dl13_2023; const importoEffettivoPNRR = Math.min(annualData.incentiviPNRROpMisureStraordinarie, limitePNRR); risorseVariabili.push({descrizione: "Incremento variabile PNRR/Misure Straordinarie (fino a 5% del fondo stabile 2016 originale)", importo: importoEffettivoPNRR, riferimento: RIF_ART8_DL13_2023, tipo: 'variabile', esclusoDalLimite2016: true, });}
  
  const isEnteInCondizioniSpeciali = !!annualData.isEnteDissestato || !!annualData.isEnteStrutturalmenteDeficitario || !!annualData.isEnteRiequilibrioFinanziario;
  // FIX: Pass normativeData to calculateFadTotals
  const fadTotals = calculateFadTotals(
    fondoAccessorioDipendenteData || {}, 
    annualData.simulatoreRisultati, 
    isEnteInCondizioniSpeciali,
    fondoElevateQualificazioniData?.ris_incrementoConRiduzioneFondoDipendenti,
    normativeData
  );
  const fad_stabile = fadTotals.sommaStabili_Dipendenti;
  const fad_variabile = fadTotals.sommaVariabiliSoggette_Dipendenti 
                      + fadTotals.sommaVariabiliNonSoggette_Dipendenti 
                      - fadTotals.altreRisorseDecurtazioniFinali_Dipendenti 
                      - fadTotals.decurtazioniLimiteSalarioAccessorio_Dipendenti;
  const fad_totale = fad_stabile + fad_variabile;

  const eqData = fondoElevateQualificazioniData || {} as FondoElevateQualificazioniData;
  const eq_stabile = (eqData.ris_fondoPO2017 || 0) + (eqData.ris_incrementoConRiduzioneFondoDipendenti || 0) + (eqData.ris_incrementoLimiteArt23c2_DL34 || 0) - (eqData.fin_art23c2_adeguamentoTetto2016 || 0);
  const eq_variabile = (eqData.ris_incremento022MonteSalari2018 || 0);
  const eq_totale = eq_stabile + eq_variabile;
  
  const segData = fondoSegretarioComunaleData || {} as FondoSegretarioComunaleData;
  const percentualeCoperturaSeg = (segData.fin_percentualeCoperturaPostoSegretario === undefined ? 100 : segData.fin_percentualeCoperturaPostoSegretario) / 100;
  const sommaRisorseStabiliSeg = (segData.st_art3c6_CCNL2011_retribuzionePosizione || 0) + (segData.st_art58c1_CCNL2024_differenzialeAumento || 0) + (segData.st_art60c1_CCNL2024_retribuzionePosizioneClassi || 0) + (segData.st_art60c3_CCNL2024_maggiorazioneComplessita || 0) + (segData.st_art60c5_CCNL2024_allineamentoDirigEQ || 0) + (segData.st_art56c1g_CCNL2024_retribuzioneAggiuntivaConvenzioni || 0) + (segData.st_art56c1h_CCNL2024_indennitaReggenzaSupplenza || 0);
  const sommaRisorseVariabiliSeg = (segData.va_art56c1f_CCNL2024_dirittiSegreteria || 0) + (segData.va_art56c1i_CCNL2024_altriCompensiLegge || 0) + (segData.va_art8c3_DL13_2023_incrementoPNRR || 0) + (segData.va_art61c2_CCNL2024_retribuzioneRisultato10 || 0) + (segData.va_art61c2bis_CCNL2024_retribuzioneRisultato15 || 0) + (segData.va_art61c2ter_CCNL2024_superamentoLimiteMetropolitane || 0) + (segData.va_art61c3_CCNL2024_incremento022MonteSalari2018 || 0);
  const seg_stabile = sommaRisorseStabiliSeg * percentualeCoperturaSeg;
  const seg_variabile = sommaRisorseVariabiliSeg * percentualeCoperturaSeg;
  const seg_totale = seg_stabile + seg_variabile;

  let dir_stabile = 0;
  let dir_variabile = 0;
  let dir_totale = 0;
  if (annualData.hasDirigenza) {
    const dirData = fondoDirigenzaData || {} as FondoDirigenzaData;
    const sommaRisorseStabiliDir = (dirData.st_art57c2a_CCNL2020_unicoImporto2020 || 0) + (dirData.st_art57c2a_CCNL2020_riaPersonaleCessato2020 || 0) + (dirData.st_art56c1_CCNL2020_incremento1_53MonteSalari2015 || 0) + (dirData.st_art57c2c_CCNL2020_riaCessatidallAnnoSuccessivo || 0) + (dirData.st_art57c2e_CCNL2020_risorseAutonomeStabili || 0) + (dirData.st_art39c1_CCNL2024_incremento2_01MonteSalari2018 || 0);
    const sommaRisorseVariabiliDir = (dirData.va_art57c2b_CCNL2020_risorseLeggeSponsor || 0) + (dirData.va_art57c2d_CCNL2020_sommeOnnicomprensivita || 0) + (dirData.va_art57c2e_CCNL2020_risorseAutonomeVariabili || 0) + (dirData.va_art57c3_CCNL2020_residuiAnnoPrecedente || 0) + (dirData.va_dl13_2023_art8c3_incrementoPNRR || 0) + (dirData.va_art39c1_CCNL2024_recupero0_46MonteSalari2018_2020 || 0) + (dirData.va_art39c1_CCNL2024_recupero2_01MonteSalari2018_2021_2023 || 0) + (dirData.va_art39c2_CCNL2024_incremento0_22MonteSalari2018_valorizzazione || 0) + (dirData.va_art33c2_DL34_2019_incrementoDeroga || 0);
    const lim_adjustments = (dirData.lim_art23c2_DLGS75_2017_adeguamentoAnnualeTetto2016 || 0) - (dirData.lim_art4_DL16_2014_misureMancatoRispettoVincoli || 0);
    dir_stabile = sommaRisorseStabiliDir + lim_adjustments;
    dir_variabile = sommaRisorseVariabiliDir;
    dir_totale = dir_stabile + dir_variabile;
  }

  const totaleComponenteStabile = fad_stabile + eq_stabile + seg_stabile + dir_stabile;
  const totaleComponenteVariabile = fad_variabile + eq_variabile + seg_variabile + dir_variabile;
  const totaleFondoRisorseDecentrate = totaleComponenteStabile + totaleComponenteVariabile;
  
  const ammontareSoggettoLimite2016_global = totaleRisorseSoggetteAlLimiteDaFondiSpecifici + (incrementiStabiliCCNL.filter(c => !c.esclusoDalLimite2016).reduce((s,c)=>s+c.importo,0) - (fondoAccessorioDipendenteData?.st_art79c1c_incrementoStabileConsistenzaPers || 0));

  return {
    fondoBase2016: fondoBase2016_originale,
    incrementiStabiliCCNL,
    adeguamentoProCapite, 
    incrementoDeterminatoArt23C2, 
    incrementoOpzionaleVirtuosi,
    risorseVariabili,
    totaleFondoRisorseDecentrate,
    limiteArt23C2Modificato, 
    ammontareSoggettoLimite2016: ammontareSoggettoLimite2016_global,
    superamentoLimite2016: superamentoDelLimite2016 > 0 ? superamentoDelLimite2016 : undefined,
    totaleRisorseSoggetteAlLimiteDaFondiSpecifici,

    totaleFondo: totaleFondoRisorseDecentrate,
    totaleParteStabile: totaleComponenteStabile,
    totaleParteVariabile: totaleComponenteVariabile,
    totaleComponenteStabile: totaleComponenteStabile,
    totaleComponenteVariabile: totaleComponenteVariabile,
    
    dettaglioFondi: {
      dipendente: { stabile: fad_stabile, variabile: fad_variabile, totale: fad_totale },
      eq: { stabile: eq_stabile, variabile: eq_variabile, totale: eq_totale },
      segretario: { stabile: seg_stabile, variabile: seg_variabile, totale: seg_totale },
      dirigenza: { stabile: dir_stabile, variabile: dir_variabile, totale: dir_totale },
    }
  };
};