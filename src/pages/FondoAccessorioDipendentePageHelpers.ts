// pages/FondoAccessorioDipendentePageHelpers.ts
import { FondoAccessorioDipendenteData, NormativeData, DistribuzioneRisorseData } from '../types.ts';

export const getFadFieldDefinitions = (norme: NormativeData): Array<{
  key: keyof FondoAccessorioDipendenteData;
  description: string;
  riferimento: string;
  isRelevantToArt23Limit?: boolean;
  isSubtractor?: boolean;
  section: 'stabili' | 'vs_soggette' | 'vn_non_soggette' | 'fin_decurtazioni' | 'cl_limiti';
  isDisabledByCondizioniSpeciali?: boolean; 
}> => [
  // Stabili
  { key: 'st_art79c1_art67c1_unicoImporto2017', description: "Unico importo consolidato 2017", riferimento: `Art. 79 c.1 (rif. ${norme.riferimenti_normativi.art67_ccnl2018})`, isRelevantToArt23Limit: true, section: 'stabili' },
  { key: 'st_art79c1_art67c1_alteProfessionalitaNonUtil', description: "Alte professionalità non utilizzate (se non in unico importo)", riferimento: `Art. 79 c.1 (rif. ${norme.riferimenti_normativi.art67_ccnl2018})`, isRelevantToArt23Limit: true, section: 'stabili' },
  { key: 'st_art79c1_art67c2a_incr8320', description: "Incremento €83,20/unità (personale 31.12.2015)", riferimento: `Art. 79 c.1 (rif. Art. 67 c.2a CCNL 2018)`, isRelevantToArt23Limit: false, section: 'stabili' },
  { key: 'st_art79c1_art67c2b_incrStipendialiDiff', description: "Incrementi stipendiali differenziali (Art. 64 CCNL 2018)", riferimento: `Art. 79 c.1 (rif. Art. 67 c.2b CCNL 2018)`, isRelevantToArt23Limit: false, section: 'stabili' },
  { key: 'st_art79c1_art4c2_art67c2c_integrazioneRIA', description: "Integrazione RIA personale cessato anno precedente", riferimento: `Art. 79 c.1 (rif. Art. 67 c.2c CCNL 2018)`, isRelevantToArt23Limit: true, section: 'stabili' },
  { key: 'st_art79c1_art67c2d_risorseRiassorbite165', description: "Risorse riassorbite (Art. 2 c.3 D.Lgs 165/01)", riferimento: `Art. 79 c.1 (rif. Art. 67 c.2d CCNL 2018)`, isRelevantToArt23Limit: true, section: 'stabili' },
  { key: 'st_art79c1_art15c1l_art67c2e_personaleTrasferito', description: "Risorse personale trasferito (decentramento)", riferimento: `Art. 79 c.1 (rif. Art. 67 c.2e CCNL 2018)`, isRelevantToArt23Limit: true, section: 'stabili' },
  { key: 'st_art79c1_art15c1i_art67c2f_regioniRiduzioneDirig', description: "Regioni: riduzione stabile posti dirig. (fino a 0,2% MS Dir.)", riferimento: `Art. 79 c.1 (rif. Art. 67 c.2f CCNL 2018)`, isRelevantToArt23Limit: true, section: 'stabili' },
  { key: 'st_art79c1_art14c3_art67c2g_riduzioneStraordinario', description: "Riduzione stabile straordinario", riferimento: `Art. 79 c.1 (rif. Art. 67 c.2g CCNL 2018)`, isRelevantToArt23Limit: true, section: 'stabili' },
  { key: 'st_taglioFondoDL78_2010', description: "Taglio fondo DL 78/2010 (se non già in unico importo)", riferimento: "Art. 9 c.2bis DL 78/2010", isRelevantToArt23Limit: true, isSubtractor: true, section: 'stabili' },
  { key: 'st_riduzioniPersonaleATA_PO_Esternalizzazioni', description: "Riduzioni per pers. ATA, PO, esternalizzazioni, trasferimenti", riferimento: "Disposizioni specifiche", isRelevantToArt23Limit: true, isSubtractor: true, section: 'stabili' },
  { key: 'st_art67c1_decurtazionePO_AP_EntiDirigenza', description: `Decurtazione PO/AP enti con dirigenza (${norme.riferimenti_normativi.art67_ccnl2018})`, riferimento: `Art. 67 c.1 CCNL 2018`, isRelevantToArt23Limit: true, isSubtractor: true, section: 'stabili' },
  { key: 'st_art79c1b_euro8450', description: "Incremento €84,50/unità (personale 31.12.2018, da 01.01.2021)", riferimento: `Art. 79 c.1b ${norme.riferimenti_normativi.art79_ccnl2022}`, isRelevantToArt23Limit: false, section: 'stabili' },
  { key: 'st_art79c1c_incrementoStabileConsistenzaPers', description: "Incremento stabile per consistenza personale (Art. 23c2)", riferimento: `Art. 79 c.1c ${norme.riferimenti_normativi.art79_ccnl2022}`, isRelevantToArt23Limit: true, section: 'stabili' },
  { key: 'st_art79c1d_differenzialiStipendiali2022', description: "Differenziali stipendiali personale in servizio 2022", riferimento: `Art. 79 c.1d ${norme.riferimenti_normativi.art79_ccnl2022}`, isRelevantToArt23Limit: false, section: 'stabili' },
  { key: 'st_art79c1bis_diffStipendialiB3D3', description: "Differenze stipendiali personale B3 e D3", riferimento: `Art. 79 c.1-bis ${norme.riferimenti_normativi.art79_ccnl2022}`, isRelevantToArt23Limit: false, section: 'stabili' },
  { key: 'st_incrementoDecretoPA', description: "Incremento Decreto PA (da simulatore)", riferimento: norme.riferimenti_normativi.incremento_decreto_pa, isRelevantToArt23Limit: true, section: 'stabili' },
  { key: 'st_riduzionePerIncrementoEQ', description: "Riduzione per incremento risorse EQ", riferimento: norme.riferimenti_normativi.art7_c4_u_ccnl2022, isRelevantToArt23Limit: true, isSubtractor: true, section: 'stabili' },
  // Variabili Soggette
  { key: 'vs_art4c3_art15c1k_art67c3c_recuperoEvasione', description: "Recupero evasione ICI, ecc.", riferimento: `Art. 67 c.3c ${norme.riferimenti_normativi.art67_ccnl2018}`, isRelevantToArt23Limit: true, section: 'vs_soggette' },
  { key: 'vs_art4c2_art67c3d_integrazioneRIAMensile', description: "Integrazione RIA mensile personale cessato in anno", riferimento: `Art. 67 c.3d ${norme.riferimenti_normativi.art67_ccnl2018}`, isRelevantToArt23Limit: true, section: 'vs_soggette' },
  { key: 'vs_art67c3g_personaleCaseGioco', description: "Risorse personale case da gioco", riferimento: `Art. 67 c.3g ${norme.riferimenti_normativi.art67_ccnl2018}`, isRelevantToArt23Limit: true, section: 'vs_soggette', isDisabledByCondizioniSpeciali: true },
  { key: 'vs_art79c2b_max1_2MonteSalari1997', description: "Max 1,2% monte salari 1997", riferimento: `Art. 79 c.2b ${norme.riferimenti_normativi.art79_ccnl2022}`, isRelevantToArt23Limit: true, section: 'vs_soggette', isDisabledByCondizioniSpeciali: true },
  { key: 'vs_art67c3k_integrazioneArt62c2e_personaleTrasferito', description: "Integrazione per personale trasferito (variabile)", riferimento: `Art. 67 c.3k ${norme.riferimenti_normativi.art67_ccnl2018}`, isRelevantToArt23Limit: true, section: 'vs_soggette', isDisabledByCondizioniSpeciali: true },
  { key: 'vs_art79c2c_risorseScelteOrganizzative', description: "Risorse per scelte organizzative (anche TD)", riferimento: `Art. 79 c.2c ${norme.riferimenti_normativi.art79_ccnl2022}`, isRelevantToArt23Limit: true, section: 'vs_soggette', isDisabledByCondizioniSpeciali: true },
  // Variabili Non Soggette
  { key: 'vn_art15c1d_art67c3a_sponsorConvenzioni', description: "Sponsorizzazioni, convenzioni, servizi non essenziali", riferimento: `Art. 67 c.3a ${norme.riferimenti_normativi.art67_ccnl2018}`, isRelevantToArt23Limit: false, section: 'vn_non_soggette', isDisabledByCondizioniSpeciali: true },
  { key: 'vn_art54_art67c3f_rimborsoSpeseNotifica', description: "Quota rimborso spese notifica (messi)", riferimento: `Art. 67 c.3f ${norme.riferimenti_normativi.art67_ccnl2018}`, isRelevantToArt23Limit: false, section: 'vn_non_soggette', isDisabledByCondizioniSpeciali: true },
  { key: 'vn_art15c1k_art16_dl98_art67c3b_pianiRazionalizzazione', description: "Piani di razionalizzazione (Art. 16 DL 98/11)", riferimento: `Art. 67 c.3b ${norme.riferimenti_normativi.art67_ccnl2018}`, isRelevantToArt23Limit: false, section: 'vn_non_soggette', isDisabledByCondizioniSpeciali: true },
  { key: 'vn_art15c1k_art67c3c_incentiviTecniciCondoni', description: "Incentivi funzioni tecniche, condoni, ecc.", riferimento: `Art. 67 c.3c ${norme.riferimenti_normativi.art67_ccnl2018}`, isRelevantToArt23Limit: false, section: 'vn_non_soggette' },
  { key: 'vn_art18h_art67c3c_incentiviSpeseGiudizioCensimenti', description: "Incentivi spese giudizio, compensi censimento/ISTAT", riferimento: `Art. 67 c.3c ${norme.riferimenti_normativi.art67_ccnl2018}`, isRelevantToArt23Limit: false, section: 'vn_non_soggette' },
  { key: 'vn_art15c1m_art67c3e_risparmiStraordinario', description: "Risparmi da disciplina straordinario (Art. 14 CCNL)", riferimento: `Art. 67 c.3e ${norme.riferimenti_normativi.art67_ccnl2018}`, isRelevantToArt23Limit: false, section: 'vn_non_soggette' },
  { key: 'vn_art67c3j_regioniCittaMetro_art23c4_incrPercentuale', description: `Regioni/Città Metro: Incremento % (${norme.riferimenti_normativi.art23_dlgs75_2017})`, riferimento: `Art. 67 c.3j ${norme.riferimenti_normativi.art67_ccnl2018}`, isRelevantToArt23Limit: false, section: 'vn_non_soggette', isDisabledByCondizioniSpeciali: true },
  { key: 'vn_art80c1_sommeNonUtilizzateStabiliPrec', description: "Somme non utilizzate esercizi precedenti (stabili)", riferimento: `Art. 80 c.1 ${norme.riferimenti_normativi.art80_ccnl2022}`, isRelevantToArt23Limit: false, section: 'vn_non_soggette' },
  { key: 'vn_l145_art1c1091_incentiviRiscossioneIMUTARI', description: "Incentivi riscossione IMU/TARI (L. 145/18)", riferimento: "L. 145/2018 Art.1 c.1091", isRelevantToArt23Limit: false, section: 'vn_non_soggette' },
  { key: 'vn_l178_art1c870_risparmiBuoniPasto2020', description: "Risparmi buoni pasto 2020 (L. 178/20)", riferimento: "L. 178/2020 Art.1 c.870", isRelevantToArt23Limit: false, section: 'vn_non_soggette', isDisabledByCondizioniSpeciali: true },
  { key: 'vn_dl135_art11c1b_risorseAccessorieAssunzioniDeroga', description: "Risorse accessorie per assunzioni in deroga", riferimento: "DL 135/2018 Art.11 c.1b", isRelevantToArt23Limit: false, section: 'vn_non_soggette', isDisabledByCondizioniSpeciali: true },
  { key: 'vn_art79c3_022MonteSalari2018_da2022Proporzionale', description: "0,22% MS 2018 (da 01.01.2022, quota proporzionale)", riferimento: `Art. 79 c.3 ${norme.riferimenti_normativi.art79_ccnl2022}`, isRelevantToArt23Limit: false, section: 'vn_non_soggette', isDisabledByCondizioniSpeciali: true },
  { key: 'vn_art79c1b_euro8450_unaTantum2021_2022', description: "€84,50/unità (pers. 31.12.18, una tantum 2021-22)", riferimento: `Art. 79 c.1b ${norme.riferimenti_normativi.art79_ccnl2022}`, isRelevantToArt23Limit: false, section: 'vn_non_soggette', isDisabledByCondizioniSpeciali: true },
  { key: 'vn_art79c3_022MonteSalari2018_da2022UnaTantum2022', description: "0,22% MS 2018 (da 01.01.2022, una tantum 2022)", riferimento: `Art. 79 c.3 ${norme.riferimenti_normativi.art79_ccnl2022}`, isRelevantToArt23Limit: false, section: 'vn_non_soggette', isDisabledByCondizioniSpeciali: true },
  { key: 'vn_dl13_art8c3_incrementoPNRR_max5stabile2016', description: "Incremento PNRR (max 5% fondo stabile 2016)", riferimento: norme.riferimenti_normativi.art8_dl13_2023, isRelevantToArt23Limit: false, section: 'vn_non_soggette', isDisabledByCondizioniSpeciali: true },
  // Finali e Limiti
  { key: 'fin_art4_dl16_misureMancatoRispettoVincoli', description: "Misure per mancato rispetto vincoli (Art. 4 DL 16/14)", riferimento: norme.riferimenti_normativi.dl16_2014_art4, isRelevantToArt23Limit: false, isSubtractor: true, section: 'fin_decurtazioni' },
  { key: 'cl_art23c2_decurtazioneIncrementoAnnualeTetto2016', description: "Decurtazione annuale per rispetto tetto 2016", riferimento: norme.riferimenti_normativi.art23_dlgs75_2017, isRelevantToArt23Limit: true, isSubtractor: true, section: 'cl_limiti' },
];

export const getDistribuzioneFieldDefinitions = (norme: NormativeData): Array<{
  key: keyof DistribuzioneRisorseData;
  description: string;
  riferimento: string;
  section: 'Utilizzi Parte Stabile (Art. 80 c.1)' | 'Utilizzi Parte Variabile (Art. 80 c.2)';
}> => [
  // Utilizzi Parte Stabile
  { key: 'u_diffProgressioniStoriche', description: "Differenziali progressioni orizzontali storiche", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.1`, section: 'Utilizzi Parte Stabile (Art. 80 c.1)' },
  { key: 'u_indennitaComparto', description: "Indennità di comparto", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.1`, section: 'Utilizzi Parte Stabile (Art. 80 c.1)' },
  { key: 'u_incrIndennitaEducatori', description: "Incremento indennità personale educativo asili nido", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.1`, section: 'Utilizzi Parte Stabile (Art. 80 c.1)' },
  { key: 'u_incrIndennitaScolastico', description: "Incremento indennità personale scolastico", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.1`, section: 'Utilizzi Parte Stabile (Art. 80 c.1)' },
  { key: 'u_indennitaEx8QF', description: "Indennità personale ex 8^ q.f. non titolare di PO", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.1`, section: 'Utilizzi Parte Stabile (Art. 80 c.1)' },

  // Utilizzi Parte Variabile
  { key: 'p_performanceOrganizzativa', description: "Premi correlati alla performance organizzativa", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. a)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_performanceIndividuale', description: "Premi correlati alla performance individuale", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. b)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_maggiorazionePerformanceIndividuale', description: "Premi per la maggiorazione della performance individuale", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. b)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_indennitaCondizioniLavoro', description: "Indennità condizioni di lavoro", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. c)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_indennitaTurno', description: "Indennità di turno", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. d)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_indennitaReperibilita', description: "Indennità di reperibilità", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. d)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_indennitaLavoroGiornoRiposo', description: "Indennità per lavoro nella giornata di riposo", riferimento: norme.riferimenti_normativi.ccnl_14092000_art24c1, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_compensiSpecificheResponsabilita', description: "Compensi per specifiche responsabilità", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. e)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_indennitaFunzione', description: "Indennità di funzione", riferimento: norme.riferimenti_normativi.art97_ccnl2022, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_indennitaServizioEsterno', description: "Indennità di servizio esterno", riferimento: norme.riferimenti_normativi.art100_ccnl2022, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_obiettiviPoliziaLocale', description: "Obiettivi di potenziamento dei servizi di Polizia Locale", riferimento: norme.riferimenti_normativi.art98_ccnl2022, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_incentiviContoTerzi', description: "Incentivi da entrate conto terzi o utenza (es. ISTAT)", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. g)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_compensiAvvocatura', description: "Compensi avvocatura interna per sentenze favorevoli", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. g)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_incentiviCondonoFunzioniTecnichePre2018', description: "Incentivi (condono, funzioni tecniche pre-2018)", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. g)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_incentiviFunzioniTecnichePost2018', description: "Incentivi per funzioni tecniche (post 2018)", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. g)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_incentiviIMUTARI', description: "Incentivi per accertamenti IMU e TARI", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. g)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_compensiMessiNotificatori', description: "Compensi ai messi notificatori", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. h)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_compensiCaseGioco', description: "Compensi personale case da gioco", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. i)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_compensiCaseGiocoNonCoperti', description: "Compensi case da gioco (parte non coperta da stabili)", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. i)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_diffStipendialiAnniPrec', description: "Differenziali stipendiali attribuiti in anni precedenti", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. j)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_diffStipendialiAnnoCorrente', description: "Differenziali stipendiali da attribuire nell'anno corrente", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. j)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
  { key: 'p_pianiWelfare', description: "Risorse per piani welfare", riferimento: `${norme.riferimenti_normativi.art80_ccnl2022}, c.2, lett. k)`, section: 'Utilizzi Parte Variabile (Art. 80 c.2)' },
];