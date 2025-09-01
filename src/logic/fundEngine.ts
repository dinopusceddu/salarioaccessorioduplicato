// logic/fundEngine.ts
import { 
    SimulatoreIncrementoInput, 
    SimulatoreIncrementoRisultati, 
    TipologiaEnte,
    FondoAccessorioDipendenteData,
    FundData,
    CalculatedFund,
    FundComponent,
    EmployeeCategory,
    ComplianceCheck,
    FondoElevateQualificazioniData,
    FondoSegretarioComunaleData,
    FondoDirigenzaData,
    DistribuzioneRisorseData,
    RisorsaVariabileDetail,
    NormativeData
} from '../types.ts';

import { getFadFieldDefinitions } from '../pages/FondoAccessorioDipendentePageHelpers.ts';

// --- FROM hooks/useSimulatoreCalculations.ts ---

export const getSogliaSpesaPersonale = (numeroAbitanti?: number, tipologiaEnte?: TipologiaEnte): number => {
  if (numeroAbitanti === undefined || tipologiaEnte === undefined) return 0;

  if (tipologiaEnte === TipologiaEnte.COMUNE) {
    if (numeroAbitanti <= 999) return 29.50;
    if (numeroAbitanti <= 1999) return 28.60;
    if (numeroAbitanti <= 2999) return 27.60;
    if (numeroAbitanti <= 4999) return 27.20;
    if (numeroAbitanti <= 9999) return 26.90;
    if (numeroAbitanti <= 59999) return 27.00;
    if (numeroAbitanti <= 249999) return 27.60;
    if (numeroAbitanti <= 1499999) return 28.80;
    return 25.30; // Oltre 1.500.000
  } else if (tipologiaEnte === TipologiaEnte.PROVINCIA) {
    if (numeroAbitanti <= 250000) return 20.80;
    if (numeroAbitanti <= 349999) return 19.10;
    if (numeroAbitanti <= 449999) return 19.10; 
    if (numeroAbitanti <= 699999) return 19.70;
    return 13.90; // Da 700.000 abitanti in su
  }
  return 0; 
};

export const calculateSimulazione = (
    currentInputs?: SimulatoreIncrementoInput, 
    numAbitanti?: number, 
    tipoEnte?: TipologiaEnte
): SimulatoreIncrementoRisultati | undefined => {
    if (!currentInputs) return undefined;

    const stipendiTabellari2023 = currentInputs.simStipendiTabellari2023 || 0;
    const fondoStabileAnnoApplicazione = currentInputs.simFondoStabileAnnoApplicazione || 0;
    const risorsePOEQAnnoApplicazione = currentInputs.simRisorsePOEQAnnoApplicazione || 0;
    const spesaPersonaleConsuntivo2023 = currentInputs.simSpesaPersonaleConsuntivo2023 || 0;
    const mediaEntrateCorrenti = currentInputs.simMediaEntrateCorrenti2021_2023 || 0;
    const tettoSpesaL296_06 = currentInputs.simTettoSpesaPersonaleL296_06 || 0;
    const costoNuoveAssunzioni = currentInputs.simCostoAnnuoNuoveAssunzioniPIAO || 0;
    const percOneri = currentInputs.simPercentualeOneriIncremento || 0;

    // Fase 1: Incremento Potenziale Massimo (Regola del 48%)
    const fase1_obiettivo48 = stipendiTabellari2023 * 0.48;
    const fase1_fondoAttualeComplessivo = fondoStabileAnnoApplicazione + risorsePOEQAnnoApplicazione;
    const fase1_incrementoPotenzialeLordo = Math.max(0, fase1_obiettivo48 - fase1_fondoAttualeComplessivo);

    // Fase 2: Verifica Limite di Spesa del Personale (DM 17/3/2020)
    const fase2_spesaPersonaleAttualePrevista = spesaPersonaleConsuntivo2023 + costoNuoveAssunzioni;
    const fase2_sogliaPercentualeDM17_03_2020 = getSogliaSpesaPersonale(numAbitanti, tipoEnte);
    const fase2_limiteSostenibileDL34 = mediaEntrateCorrenti * (fase2_sogliaPercentualeDM17_03_2020 / 100);
    const fase2_spazioDisponibileDL34 = Math.max(0, fase2_limiteSostenibileDL34 - fase2_spesaPersonaleAttualePrevista);

    // Fase 3: Verifica Limite del Tetto Storico (L. 296/06)
    const fase3_margineDisponibileL296_06 = Math.max(0, tettoSpesaL296_06 - fase2_spesaPersonaleAttualePrevista);

    // Fase 4: Determinazione dello Spazio Utilizzabile Lordo
    const fase4_spazioUtilizzabileLordo = Math.min(
      fase1_incrementoPotenzialeLordo,
      fase2_spazioDisponibileDL34,
      fase3_margineDisponibileL296_06
    );

    // Fase 5: Calcolo dell'Incremento Netto Effettivo del Fondo
    let fase5_incrementoNettoEffettivoFondo = 0;
    if (percOneri >= 0 && percOneri < 100) { 
        fase5_incrementoNettoEffettivoFondo = fase4_spazioUtilizzabileLordo / (1 + (percOneri / 100));
    } else if (percOneri >=100) { 
        fase5_incrementoNettoEffettivoFondo = 0;
    }


    return {
      fase1_obiettivo48,
      fase1_fondoAttualeComplessivo,
      fase1_incrementoPotenzialeLordo,
      fase2_spesaPersonaleAttualePrevista,
      fase2_sogliaPercentualeDM17_03_2020,
      fase2_limiteSostenibileDL34,
      fase2_spazioDisponibileDL34,
      fase3_margineDisponibileL296_06,
      fase4_spazioUtilizzabileLordo,
      fase5_incrementoNettoEffettivoFondo,
    };
};

// --- FROM pages/FondoAccessorioDipendentePageHelpers.ts ---

// FIX: Update function signature to accept 6 arguments for consistency and handle special cases centrally.
export const getFadEffectiveValueHelper = (
    key: keyof FondoAccessorioDipendenteData, 
    originalValue: number | undefined,
    isDisabledBySourceDefinition: boolean | undefined,
    isEnteInCondizioniSpecialiGlobal: boolean | undefined,
    simulatoreRisultati?: SimulatoreIncrementoRisultati,
    incrementoEQconRiduzioneDipendenti?: number
): number => {
    if (isDisabledBySourceDefinition && isEnteInCondizioniSpecialiGlobal) {
        return 0;
    }
    if (key === 'st_incrementoDecretoPA') {
        const maxIncremento = simulatoreRisultati?.fase5_incrementoNettoEffettivoFondo ?? 0;
        return maxIncremento > 0 ? (originalValue || 0) : 0;
    }
    if (key === 'st_riduzionePerIncrementoEQ') {
        return incrementoEQconRiduzioneDipendenti || 0;
    }
    return originalValue || 0;
};

export const calculateFadTotals = (
    fadData: Partial<FondoAccessorioDipendenteData>,
    simulatoreRisultati: SimulatoreIncrementoRisultati | undefined,
    isEnteInCondizioniSpeciali: boolean,
    incrementoEQconRiduzioneDipendenti: number | undefined,
    normativeData: NormativeData
) => {
    const fadFieldDefinitions = getFadFieldDefinitions(normativeData);
    
    const getValue = (key: keyof FondoAccessorioDipendenteData) => {
        const definition = fadFieldDefinitions.find(def => def.key === key);
        // FIX: Pass all 6 arguments to the helper function for consistent value calculation.
        return getFadEffectiveValueHelper(
            key, 
            fadData[key], 
            definition?.isDisabledByCondizioniSpeciali, 
            isEnteInCondizioniSpeciali,
            simulatoreRisultati,
            incrementoEQconRiduzioneDipendenti
        );
    };
    
    const sommaStabili_Dipendenti =
        getValue('st_art79c1_art67c1_unicoImporto2017') +
        getValue('st_art79c1_art67c1_alteProfessionalitaNonUtil') +
        getValue('st_art79c1_art67c2a_incr8320') +
        getValue('st_art79c1_art67c2b_incrStipendialiDiff') +
        getValue('st_art79c1_art4c2_art67c2c_integrazioneRIA') +
        getValue('st_art79c1_art67c2d_risorseRiassorbite165') +
        getValue('st_art79c1_art15c1l_art67c2e_personaleTrasferito') +
        getValue('st_art79c1_art15c1i_art67c2f_regioniRiduzioneDirig') +
        getValue('st_art79c1_art14c3_art67c2g_riduzioneStraordinario') -
        getValue('st_taglioFondoDL78_2010') -
        getValue('st_riduzioniPersonaleATA_PO_Esternalizzazioni') -
        getValue('st_art67c1_decurtazionePO_AP_EntiDirigenza') +
        getValue('st_art79c1b_euro8450') +
        getValue('st_art79c1c_incrementoStabileConsistenzaPers') +
        getValue('st_art79c1d_differenzialiStipendiali2022') +
        getValue('st_art79c1bis_diffStipendialiB3D3') +
        getValue('st_incrementoDecretoPA') -
        // FIX: Use getValue for consistency instead of handling this case separately.
        getValue('st_riduzionePerIncrementoEQ');


    const sommaVariabiliSoggette_Dipendenti =
        getValue('vs_art4c3_art15c1k_art67c3c_recuperoEvasione') +
        getValue('vs_art4c2_art67c3d_integrazioneRIAMensile') +
        getValue('vs_art67c3g_personaleCaseGioco') +
        getValue('vs_art79c2b_max1_2MonteSalari1997') +
        getValue('vs_art67c3k_integrazioneArt62c2e_personaleTrasferito') +
        getValue('vs_art79c2c_risorseScelteOrganizzative');

    const sommaVariabiliNonSoggette_Dipendenti =
        getValue('vn_art15c1d_art67c3a_sponsorConvenzioni') +
        getValue('vn_art54_art67c3f_rimborsoSpeseNotifica') +
        getValue('vn_art15c1k_art16_dl98_art67c3b_pianiRazionalizzazione') +
        getValue('vn_art15c1k_art67c3c_incentiviTecniciCondoni') +
        getValue('vn_art18h_art67c3c_incentiviSpeseGiudizioCensimenti') +
        getValue('vn_art15c1m_art67c3e_risparmiStraordinario') +
        getValue('vn_art67c3j_regioniCittaMetro_art23c4_incrPercentuale') +
        getValue('vn_art80c1_sommeNonUtilizzateStabiliPrec') +
        getValue('vn_l145_art1c1091_incentiviRiscossioneIMUTARI') +
        getValue('vn_l178_art1c870_risparmiBuoniPasto2020') +
        getValue('vn_dl135_art11c1b_risorseAccessorieAssunzioniDeroga') +
        getValue('vn_art79c3_022MonteSalari2018_da2022Proporzionale') +
        getValue('vn_art79c1b_euro8450_unaTantum2021_2022') +
        getValue('vn_art79c3_022MonteSalari2018_da2022UnaTantum2022') +
        getValue('vn_dl13_art8c3_incrementoPNRR_max5stabile2016');
    
    const altreRisorseDecurtazioniFinali_Dipendenti = getValue('fin_art4_dl16_misureMancatoRispettoVincoli');
    const decurtazioniLimiteSalarioAccessorio_Dipendenti = getValue('cl_art23c2_decurtazioneIncrementoAnnualeTetto2016');

    const totaleRisorseDisponibiliContrattazione_Dipendenti =
        sommaStabili_Dipendenti +
        sommaVariabiliSoggette_Dipendenti +
        sommaVariabiliNonSoggette_Dipendenti -
        altreRisorseDecurtazioniFinali_Dipendenti -
        decurtazioniLimiteSalarioAccessorio_Dipendenti;
    
    const sommaStabiliSoggetteLimite = fadFieldDefinitions
        .filter(def => def.section === 'stabili' && def.isRelevantToArt23Limit)
        .reduce((sum, def) => {
            const value = getValue(def.key);
            return sum + (def.isSubtractor ? -value : value);
        },0);
        
    return {
        sommaStabili_Dipendenti,
        sommaVariabiliSoggette_Dipendenti,
        sommaVariabiliNonSoggette_Dipendenti,
        altreRisorseDecurtazioniFinali_Dipendenti,
        decurtazioniLimiteSalarioAccessorio_Dipendenti,
        totaleRisorseDisponibiliContrattazione_Dipendenti,
        sommaStabiliSoggetteLimite
    };
};

// --- Main Calculation Engine ---
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
    riferimento: riferimenti_normativi.art23_dlgs75_2017,
    tipo: 'stabile',
    esclusoDalLimite2016: false, 
  } : undefined;
  
  const personale2018_perArt33 = historicalData.personaleServizio2018 || 0;
  const spesaStipendiTabellari2023_perArt14 = historicalData.spesaStipendiTabellari2023 || 0;
  const personaleNonDirigenteEQAttuale_perArt33 = annualData.personaleServizioAttuale.filter(p => p.category === EmployeeCategory.DIPENDENTE || p.category === EmployeeCategory.EQ).reduce((sum, p) => sum + (p.count || 0), 0);
  const personaleTotaleAttuale_perArt33 = annualData.personaleServizioAttuale.reduce((sum, p) => sum + (p.count || 0), 0);
  const incrementiStabiliCCNL: FundComponent[] = [];
  if (personale2018_perArt33 > 0) { const importoArt67 = personale2018_perArt33 * valori_pro_capite.art67_ccnl_2018; incrementiStabiliCCNL.push({descrizione: `Incremento stabile CCNL (${valori_pro_capite.art67_ccnl_2018}€ pro-capite su personale 2018 per Art.33)`, importo: importoArt67, riferimento: riferimenti_normativi.art67_ccnl2018, tipo: 'stabile', esclusoDalLimite2016: false, });}
  if (personaleNonDirigenteEQAttuale_perArt33 > 0) { const importoArt79b = personaleNonDirigenteEQAttuale_perArt33 * valori_pro_capite.art79_ccnl_2022_b; incrementiStabiliCCNL.push({descrizione: `Incremento stabile CCNL (${valori_pro_capite.art79_ccnl_2022_b}€ pro-capite personale non Dir/EQ per Art.33)`, importo: importoArt79b, riferimento: `${riferimenti_normativi.art79_ccnl2022} lett. b)`, tipo: 'stabile', esclusoDalLimite2016: false, });}
  let importoAdeguamentoProCapiteArt33 = 0;
  const valoreMedioProCapite2018_Art33 = (personale2018_perArt33 > 0 && fondoBase2016_originale > 0) ? fondoBase2016_originale / personale2018_perArt33 : 0;
  if (valoreMedioProCapite2018_Art33 > 0) { importoAdeguamentoProCapiteArt33 = (personaleTotaleAttuale_perArt33 - personale2018_perArt33) * valoreMedioProCapite2018_Art33;}
  const adeguamentoProCapite: FundComponent = { descrizione: "Adeguamento invarianza valore medio pro-capite 2018 (Art. 33 DL 34/2019)", importo: importoAdeguamentoProCapiteArt33, riferimento: riferimenti_normativi.art33_dl34_2019, tipo: 'stabile', esclusoDalLimite2016: false, };
  let incrementoOpzionaleVirtuosi: FundComponent | undefined = undefined;
  if (annualData.condizioniVirtuositaFinanziariaSoddisfatte && spesaStipendiTabellari2023_perArt14 > 0) { const importoMaxIncremento48 = spesaStipendiTabellari2023_perArt14 * limiti.incremento_virtuosi_dl25_2025; incrementoOpzionaleVirtuosi = {descrizione: "Incremento facoltativo enti virtuosi (max 48% stip. tab. non dir. 2023)", importo: importoMaxIncremento48, riferimento: riferimenti_normativi.art14_dl25_2025, tipo: 'stabile', esclusoDalLimite2016: false, }; }
  const risorseVariabili: FundComponent[] = [];
  const proventiArt45 = annualData.proventiSpecifici.find(p => p.riferimentoNormativo === riferimenti_normativi.art45_dlgs36_2023); if (proventiArt45 && proventiArt45.importo && proventiArt45.importo > 0) {risorseVariabili.push({descrizione: "Incentivi funzioni tecniche", importo: proventiArt45.importo, riferimento: riferimenti_normativi.art45_dlgs36_2023, tipo: 'variabile', esclusoDalLimite2016: true, }); }
  const proventiArt208 = annualData.proventiSpecifici.find(p => p.riferimentoNormativo === riferimenti_normativi.art208_cds); if (proventiArt208 && proventiArt208.importo && proventiArt208.importo > 0) {risorseVariabili.push({descrizione: "Proventi Codice della Strada (quota destinata)", importo: proventiArt208.importo, riferimento: riferimenti_normativi.art208_cds, tipo: 'variabile', esclusoDalLimite2016: false, });}
  annualData.proventiSpecifici.filter(p => p.riferimentoNormativo !== riferimenti_normativi.art45_dlgs36_2023 && p.riferimentoNormativo !== riferimenti_normativi.art208_cds).forEach(p => { if (p.importo && p.importo > 0) {risorseVariabili.push({descrizione: p.descrizione, importo: p.importo, riferimento: p.riferimentoNormativo, tipo: 'variabile', esclusoDalLimite2016: false });}});
  if (annualData.condizioniVirtuositaFinanziariaSoddisfatte && annualData.incentiviPNRROpMisureStraordinarie && annualData.incentiviPNRROpMisureStraordinarie > 0) { const limitePNRR = fondoBase2016_originale * limiti.incremento_pnrr_dl13_2023; const importoEffettivoPNRR = Math.min(annualData.incentiviPNRROpMisureStraordinarie, limitePNRR); risorseVariabili.push({descrizione: "Incremento variabile PNRR/Misure Straordinarie (fino a 5% del fondo stabile 2016 originale)", importo: importoEffettivoPNRR, riferimento: riferimenti_normativi.art8_dl13_2023, tipo: 'variabile', esclusoDalLimite2016: true, });}
  
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

  const isEnteInCondizioniSpeciali = !!annualData.isEnteDissestato || !!annualData.isEnteStrutturalmenteDeficitario || !!annualData.isEnteRiequilibrioFinanziario;
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
  const eq_stabile = (eqData.ris_fondoPO2017 || 0) +
                     (eqData.ris_incrementoConRiduzioneFondoDipendenti || 0) +
                     (eqData.ris_incrementoLimiteArt23c2_DL34 || 0) -
                     (eqData.fin_art23c2_adeguamentoTetto2016 || 0);
  const eq_variabile = (eqData.ris_incremento022MonteSalari2018 || 0);
  const eq_totale = eq_stabile + eq_variabile;
  
  const segData = fondoSegretarioComunaleData || {} as FondoSegretarioComunaleData;
  const percentualeCoperturaSeg = (segData.fin_percentualeCoperturaPostoSegretario === undefined ? 100 : segData.fin_percentualeCoperturaPostoSegretario) / 100;
  
  const sommaRisorseStabiliSeg = 
    (segData.st_art3c6_CCNL2011_retribuzionePosizione || 0) + (segData.st_art58c1_CCNL2024_differenzialeAumento || 0) + (segData.st_art60c1_CCNL2024_retribuzionePosizioneClassi || 0) + (segData.st_art60c3_CCNL2024_maggiorazioneComplessita || 0) + (segData.st_art60c5_CCNL2024_allineamentoDirigEQ || 0) + (segData.st_art56c1g_CCNL2024_retribuzioneAggiuntivaConvenzioni || 0) + (segData.st_art56c1h_CCNL2024_indennitaReggenzaSupplenza || 0);
  const sommaRisorseVariabiliSeg =
    (segData.va_art56c1f_CCNL2024_dirittiSegreteria || 0) + (segData.va_art56c1i_CCNL2024_altriCompensiLegge || 0) + (segData.va_art8c3_DL13_2023_incrementoPNRR || 0) + (segData.va_art61c2_CCNL2024_retribuzioneRisultato10 || 0) + (segData.va_art61c2bis_CCNL2024_retribuzioneRisultato15 || 0) + (segData.va_art61c2ter_CCNL2024_superamentoLimiteMetropolitane || 0) + (segData.va_art61c3_CCNL2024_incremento022MonteSalari2018 || 0);

  const seg_stabile = sommaRisorseStabiliSeg * percentualeCoperturaSeg;
  const seg_variabile = sommaRisorseVariabiliSeg * percentualeCoperturaSeg;
  const seg_totale = seg_stabile + seg_variabile;

  let dir_stabile = 0;
  let dir_variabile = 0;
  let dir_totale = 0;
  if (annualData.hasDirigenza) {
    const dirData = fondoDirigenzaData || {} as FondoDirigenzaData;
    const sommaRisorseStabiliDir = 
      (dirData.st_art57c2a_CCNL2020_unicoImporto2020 || 0) + (dirData.st_art57c2a_CCNL2020_riaPersonaleCessato2020 || 0) + (dirData.st_art56c1_CCNL2020_incremento1_53MonteSalari2015 || 0) + (dirData.st_art57c2c_CCNL2020_riaCessatidallAnnoSuccessivo || 0) + (dirData.st_art57c2e_CCNL2020_risorseAutonomeStabili || 0) + (dirData.st_art39c1_CCNL2024_incremento2_01MonteSalari2018 || 0);
    const sommaRisorseVariabiliDir =
      (dirData.va_art57c2b_CCNL2020_risorseLeggeSponsor || 0) + (dirData.va_art57c2d_CCNL2020_sommeOnnicomprensivita || 0) + (dirData.va_art57c2e_CCNL2020_risorseAutonomeVariabili || 0) + (dirData.va_art57c3_CCNL2020_residuiAnnoPrecedente || 0) + (dirData.va_dl13_2023_art8c3_incrementoPNRR || 0) + (dirData.va_art39c1_CCNL2024_recupero0_46MonteSalari2018_2020 || 0) + (dirData.va_art39c1_CCNL2024_recupero2_01MonteSalari2018_2021_2023 || 0) + (dirData.va_art39c2_CCNL2024_incremento0_22MonteSalari2018_valorizzazione || 0) + (dirData.va_art33c2_DL34_2019_incrementoDeroga || 0);
    const lim_adjustments = (dirData.lim_art23c2_DLGS75_2017_adeguamentoAnnualeTetto2016 || 0) - (dirData.lim_art4_DL16_2014_misureMancatoRispettoVincoli || 0);
    dir_stabile = sommaRisorseStabiliDir + lim_adjustments;
    dir_variabile = sommaRisorseVariabiliDir;
    dir_totale = dir_stabile + dir_variabile;
  }

  const totaleComponenteStabile = fad_stabile + eq_stabile + seg_stabile + dir_stabile;
  const totaleComponenteVariabile = fad_variabile + eq_variabile + seg_variabile + dir_variabile;
  const totaleFondoRisorseDecentrate = totaleComponenteStabile + totaleComponenteVariabile;

  const ammontareSoggettoLimite2016_legacy_calculation_part = (incrementiStabiliCCNL.filter(c => !c.esclusoDalLimite2016).reduce((s,c)=>s+c.importo,0) - (fondoAccessorioDipendenteData?.st_art79c1c_incrementoStabileConsistenzaPers || 0));

  return {
    fondoBase2016: fondoBase2016_originale,
    incrementiStabiliCCNL,
    adeguamentoProCapite, 
    incrementoDeterminatoArt23C2, 
    incrementoOpzionaleVirtuosi,
    risorseVariabili,
    totaleFondoRisorseDecentrate,
    limiteArt23C2Modificato, 
    ammontareSoggettoLimite2016: totaleRisorseSoggetteAlLimiteDaFondiSpecifici,
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

// --- Compliance Checks ---
export const runAllComplianceChecks = (calculatedFund: CalculatedFund, fundData: FundData, normativeData: NormativeData): ComplianceCheck[] => {
  const checks: ComplianceCheck[] = [];
  const { annualData, fondoAccessorioDipendenteData, fondoElevateQualificazioniData, distribuzioneRisorseData } = fundData;
  const { riferimenti_normativi } = normativeData;

  // 1. Verifica Limite Art. 23, comma 2, D.Lgs. 75/2017
  const limite2016 = calculatedFund.limiteArt23C2Modificato ?? calculatedFund.fondoBase2016;
  const ammontareSoggettoAlLimite = calculatedFund.totaleRisorseSoggetteAlLimiteDaFondiSpecifici;
  const superamento = calculatedFund.superamentoLimite2016;

  if (superamento && superamento > 0) {
    checks.push({
      id: 'limite_art23_c2',
      descrizione: "Superamento limite Art. 23 c.2 D.Lgs. 75/2017 (Fondo 2016)",
      isCompliant: false,
      valoreAttuale: `€ ${ammontareSoggettoAlLimite.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      limite: `€ ${limite2016.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      messaggio: `Rilevato superamento del limite di € ${superamento.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. È necessario applicare una riduzione di pari importo su uno o più fondi per rispettare il vincolo.`,
      riferimentoNormativo: riferimenti_normativi.art23_dlgs75_2017,
      gravita: 'error',
    });
  } else {
    checks.push({
      id: 'limite_art23_c2',
      descrizione: "Rispetto limite Art. 23 c.2 D.Lgs. 75/2017 (Fondo 2016)",
      isCompliant: true,
      valoreAttuale: `€ ${ammontareSoggettoAlLimite.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      limite: `€ ${limite2016.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      messaggio: "Il totale delle risorse soggette al limite dei fondi specifici rispetta il tetto storico del 2016 (come modificato).",
      riferimentoNormativo: riferimenti_normativi.art23_dlgs75_2017,
      gravita: 'info',
    });
  }
  
  // 2. Verifica dell'incremento per consistenza organica
  const { fondoPersonaleNonDirEQ2018_Art23 } = fundData.historicalData;
  const { personale2018PerArt23, personaleAnnoRifPerArt23 } = fundData.annualData;
  
  const dipendentiEquivalenti2018_art79c1c = (personale2018PerArt23 || []).reduce((sum, emp) => sum + ((emp.partTimePercentage || 100) / 100), 0);
  const dipendentiEquivalentiAnnoRif_art79c1c = (personaleAnnoRifPerArt23 || []).reduce((sum, emp) => {
      const ptPerc = (emp.partTimePercentage || 100) / 100;
      const cedoliniRatio = emp.cedoliniEmessi !== undefined && emp.cedoliniEmessi > 0 && emp.cedoliniEmessi <= 12 ? emp.cedoliniEmessi / 12 : 1;
      return sum + (ptPerc * cedoliniRatio);
  }, 0);
  const variazioneDipendenti_art79c1c = dipendentiEquivalentiAnnoRif_art79c1c - dipendentiEquivalenti2018_art79c1c;
  let valoreMedioProCapite_art79c1c = 0;
  if ((fondoPersonaleNonDirEQ2018_Art23 || 0) > 0 && dipendentiEquivalenti2018_art79c1c > 0) {
      valoreMedioProCapite_art79c1c = (fondoPersonaleNonDirEQ2018_Art23 || 0) / dipendentiEquivalenti2018_art79c1c;
  }
  const incrementoCalcolatoPerArt79c1c = Math.max(0, valoreMedioProCapite_art79c1c * variazioneDipendenti_art79c1c);
  const roundedIncremento = Math.round((incrementoCalcolatoPerArt79c1c + Number.EPSILON) * 100) / 100;

  const valoreInserito = fundData.fondoAccessorioDipendenteData?.st_art79c1c_incrementoStabileConsistenzaPers;
  const differenza = valoreInserito !== undefined ? roundedIncremento - valoreInserito : 0;
  
  if (roundedIncremento > 0) {
      if (valoreInserito === undefined || differenza > 0.005) {
          checks.push({
              id: 'verifica_incremento_consistenza',
              descrizione: "Verifica dell'incremento per aumento della consistenza organica del personale",
              isCompliant: false,
              valoreAttuale: `€ ${valoreInserito?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/D'}`,
              limite: `Calcolato: € ${roundedIncremento.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              messaggio: `L'importo inserito è inferiore di € ${differenza.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} rispetto a quanto calcolato. Si potrebbe non utilizzare a pieno le risorse disponibili per l'incremento.`,
              riferimentoNormativo: "Art. 79 c.1c CCNL 16.11.2022",
              gravita: 'warning',
          });
      } else {
          checks.push({
              id: 'verifica_incremento_consistenza',
              descrizione: "Verifica dell'incremento per aumento della consistenza organica del personale",
              isCompliant: true,
              valoreAttuale: `€ ${valoreInserito?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              limite: `Calcolato: € ${roundedIncremento.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              messaggio: "L'importo inserito è conforme a quanto calcolato per l'incremento.",
              riferimentoNormativo: "Art. 79 c.1c CCNL 16.11.2022",
              gravita: 'info',
          });
      }
  }

  // 3. Controlli per la Distribuzione Risorse Dipendenti
  const risorseDaDistribuire = calculatedFund.dettaglioFondi.dipendente.totale;
  if (risorseDaDistribuire > 0) {
      const data = distribuzioneRisorseData || ({} as DistribuzioneRisorseData);
      const utilizziParteStabile = 
            (data.u_diffProgressioniStoriche || 0) +
            (data.u_indennitaComparto || 0) +
            (data.u_incrIndennitaEducatori?.stanziate || 0) +
            (data.u_incrIndennitaScolastico?.stanziate || 0) +
            (data.u_indennitaEx8QF?.stanziate || 0);

      const utilizziParteVariabile = Object.keys(data)
          .filter(key => key.startsWith('p_'))
          .reduce((sum, key) => {
              const value = data[key as keyof DistribuzioneRisorseData] as RisorsaVariabileDetail | undefined;
              return sum + (value?.stanziate || 0);
          }, 0);
      
      const totaleAllocato = utilizziParteStabile + utilizziParteVariabile;
      const importoRimanente = risorseDaDistribuire - totaleAllocato;

      if (utilizziParteStabile > risorseDaDistribuire) {
          checks.push({
              id: 'distribuzione_stabile_supera_totale',
              descrizione: "Costi Parte Stabile superano le Risorse Disponibili",
              isCompliant: false,
              valoreAttuale: `€ ${utilizziParteStabile.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              limite: `€ ${risorseDaDistribuire.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              messaggio: `I costi fissi della Parte Stabile superano il totale da distribuire. Impossibile procedere con l'allocazione della parte variabile.`,
              riferimentoNormativo: "Principi di corretta gestione finanziaria",
              gravita: 'error',
          });
      }

      if (importoRimanente < -0.005) { // Tolleranza per errori di arrotondamento
          checks.push({
              id: 'distribuzione_superamento_budget',
              descrizione: "Superamento del budget nella Distribuzione Risorse Dipendenti",
              isCompliant: false,
              valoreAttuale: `€ ${totaleAllocato.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              limite: `€ ${risorseDaDistribuire.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              messaggio: `L'importo totale allocato per il personale dipendente supera le risorse disponibili di € ${Math.abs(importoRimanente).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
              riferimentoNormativo: "Art. 80 CCNL 16.11.2022",
              gravita: 'error',
          });
      } else {
          checks.push({
              id: 'distribuzione_rispetto_budget',
              descrizione: "Rispetto del budget nella Distribuzione Risorse Dipendenti",
              isCompliant: true,
              valoreAttuale: `€ ${totaleAllocato.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              limite: `€ ${risorseDaDistribuire.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              messaggio: `L'allocazione delle risorse per il personale dipendente rispetta il budget. Rimanenza: € ${importoRimanente.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
              riferimentoNormativo: "Art. 80 CCNL 16.11.2022",
              gravita: 'info',
          });
      }
  }
  
  // 4. Controlli per la Distribuzione Risorse EQ
  const totaleFondoEQ = calculatedFund.dettaglioFondi.eq.totale;
  if (totaleFondoEQ > 0) {
      const eqData = fondoElevateQualificazioniData || ({} as FondoElevateQualificazioniData);
      const sommaDistribuzioneFondoEQ = 
          (eqData.st_art17c2_retribuzionePosizione || 0) +
          (eqData.st_art17c3_retribuzionePosizioneArt16c4 || 0) +
          (eqData.st_art17c5_interimEQ || 0) +
          (eqData.st_art23c5_maggiorazioneSedi || 0) +
          (eqData.va_art17c4_retribuzioneRisultato || 0);

      if (sommaDistribuzioneFondoEQ > totaleFondoEQ) {
          checks.push({
              id: 'distribuzione_eq_superamento_budget',
              descrizione: "Superamento budget nella Distribuzione Risorse EQ",
              isCompliant: false,
              valoreAttuale: `€ ${sommaDistribuzioneFondoEQ.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              limite: `€ ${totaleFondoEQ.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              messaggio: `La somma delle retribuzioni di posizione e risultato per le EQ supera il fondo disponibile di € ${(sommaDistribuzioneFondoEQ - totaleFondoEQ).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
              riferimentoNormativo: "Principi di corretta gestione finanziaria",
              gravita: 'error',
          });
      } else {
          checks.push({
              id: 'distribuzione_eq_rispetto_budget',
              descrizione: "Rispetto del budget nella Distribuzione Risorse EQ",
              isCompliant: true,
              valoreAttuale: `€ ${sommaDistribuzioneFondoEQ.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              limite: `€ ${totaleFondoEQ.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              messaggio: "L'allocazione delle risorse per le EQ rispetta il budget.",
              riferimentoNormativo: "Principi di corretta gestione finanziaria",
              gravita: 'info',
          });
      }
      
      const minimoRisultatoEQ = totaleFondoEQ * 0.15;
      const risultatoStanziatoEQ = eqData.va_art17c4_retribuzioneRisultato || 0;
      if (risultatoStanziatoEQ < minimoRisultatoEQ) {
          checks.push({
              id: 'verifica_quota_minima_risultato_eq',
              descrizione: "Verifica quota minima Retribuzione di Risultato EQ",
              isCompliant: false,
              valoreAttuale: `€ ${risultatoStanziatoEQ.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              limite: `≥ € ${minimoRisultatoEQ.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              messaggio: "La quota destinata alla retribuzione di risultato è inferiore al 15% minimo previsto dal CCNL.",
              riferimentoNormativo: `${riferimenti_normativi.art17_ccnl2022} c.4`,
              gravita: 'warning',
          });
      }
  }

  // 5. Coerenza Simulatore vs. Incremento Decreto PA
  const maxIncrementoSimulatore = annualData.simulatoreRisultati?.fase5_incrementoNettoEffettivoFondo;
  if (maxIncrementoSimulatore !== undefined && maxIncrementoSimulatore > 0) {
      const incrementoInserito = fondoAccessorioDipendenteData?.st_incrementoDecretoPA || 0;
      if (incrementoInserito > maxIncrementoSimulatore) {
          checks.push({
              id: 'coerenza_simulatore_decreto_pa',
              descrizione: "Incoerenza tra Simulatore e Incremento Decreto PA",
              isCompliant: false,
              valoreAttuale: `€ ${incrementoInserito.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              limite: `€ ${maxIncrementoSimulatore.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              messaggio: "L'incremento Decreto PA inserito nel fondo dipendenti supera il valore massimo calcolato dal simulatore.",
              riferimentoNormativo: riferimenti_normativi.art14_dl25_2025,
              gravita: 'warning',
          });
      }
  }
  
  return checks;
};
