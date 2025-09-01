// services/reportService.ts
import jsPDF from 'jspdf'; 
import autoTable, { CellHookData, FontStyle } from 'jspdf-autotable';
import { 
    CalculatedFund, 
    FundData, 
    User, 
    FondoAccessorioDipendenteData, 
    ComplianceCheck,
    SimulatoreIncrementoInput,
    SimulatoreIncrementoRisultati,
    TipologiaEnte,
    NormativeData
} from '../types.ts';
import { 
    getFadFieldDefinitions, 
} from '../pages/FondoAccessorioDipendentePageHelpers.ts';
import { TEXTS_UI, ALL_TIPOLOGIE_ENTE } from '../constants.ts'; 
import { getFadEffectiveValueHelper, calculateFadTotals } from '../logic/fundEngine.ts';


// --- PDF Helper Functions ---
const MARGIN = 14;
const LINE_SPACING = 6;
const SECTION_SPACING = 10;
let CURRENT_Y = 0;

const checkYAndAddPage = (doc: jsPDF, spaceNeeded: number) => {
    if (CURRENT_Y + spaceNeeded > doc.internal.pageSize.height - MARGIN) {
        doc.addPage();
        CURRENT_Y = MARGIN;
        return true;
    }
    return false;
};

const addSectionTitle = (doc: jsPDF, title: string, bold: boolean = true) => {
    checkYAndAddPage(doc, LINE_SPACING * 2);
    doc.setFontSize(14);
    if (bold) doc.setFont('helvetica', 'bold');
    doc.text(title, MARGIN, CURRENT_Y);
    if (bold) doc.setFont('helvetica', 'normal');
    CURRENT_Y += LINE_SPACING * 1.5;
};

const addSubTitle = (doc: jsPDF, title: string) => {
    checkYAndAddPage(doc, LINE_SPACING * 1.5);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, MARGIN, CURRENT_Y);
    doc.setFont('helvetica', 'normal');
    CURRENT_Y += LINE_SPACING * 1.2;
};

const addKeyValueTable = (doc: jsPDF, data: Array<{ label: string; value: string | undefined }>, title?: string) => {
    if (title) addSubTitle(doc, title);
    const body = data.map(row => [row.label, row.value || TEXTS_UI.notApplicable]);
    
    checkYAndAddPage(doc, body.length * LINE_SPACING * 1.2); 

    autoTable(doc, {
        startY: CURRENT_Y,
        head: [['Campo', 'Valore']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: '#e0e7ff', textColor: '#1e3a8a', fontStyle: 'bold' as FontStyle, fontSize: 9 }, 
        bodyStyles: { fontSize: 8, cellPadding: 1.5 },
        columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 'auto'} },
        didDrawPage: (data) => { CURRENT_Y = data.cursor?.y ? data.cursor.y + LINE_SPACING : MARGIN; }
    });
    CURRENT_Y = (doc as any).lastAutoTable.finalY + SECTION_SPACING * 0.5;
};

// --- Formatting Helpers ---
const formatCurrency = (value?: number, notApplicableText = TEXTS_UI.notApplicable): string => {
  if (value === undefined || value === null || isNaN(value)) return notApplicableText;
  return `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatNumber = (value?: number, digits = 2, notApplicableText = TEXTS_UI.notApplicable): string => {
    if (value === undefined || value === null || isNaN(value)) return notApplicableText;
    return value.toLocaleString('it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

const formatBoolean = (value?: boolean, notApplicableText = TEXTS_UI.notApplicable): string => {
    if (value === undefined || value === null) return notApplicableText;
    return value ? TEXTS_UI.trueText : TEXTS_UI.falseText;
};

const formatPercentage = (value?: number): string => {
  if (value === undefined || value === null || isNaN(value)) return TEXTS_UI.notApplicable;
  return `${formatNumber(value)}%`;
};

const formatDate = (date: Date): string => {
    return date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
};

// --- Main PDF Generation Functions ---

export const generateFullSummaryPDF = (
    calculatedFund: CalculatedFund,
    fundData: FundData,
    currentUser: User,
    complianceChecks: ComplianceCheck[]
): void => {
    const doc = new jsPDF();
    CURRENT_Y = MARGIN;
    const { annualData, historicalData } = fundData;

    // Report Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Riepilogo Generale Calcoli e Risultanze', doc.internal.pageSize.width / 2, CURRENT_Y, { align: 'center' });
    CURRENT_Y += LINE_SPACING * 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Ente: ${annualData.denominazioneEnte || 'Non specificato'}`, MARGIN, CURRENT_Y);
    doc.text(`Anno Riferimento: ${annualData.annoRiferimento}`, doc.internal.pageSize.width - MARGIN, CURRENT_Y, { align: 'right' });
    CURRENT_Y += LINE_SPACING;
    doc.text(`Generato da: ${currentUser.name} (${currentUser.role})`, MARGIN, CURRENT_Y);
    doc.text(`Data Generazione: ${formatDate(new Date())}`, doc.internal.pageSize.width - MARGIN, CURRENT_Y, { align: 'right' });
    CURRENT_Y += SECTION_SPACING;

    // --- 1. DATI DI INPUT ---
    addSectionTitle(doc, '1. Dati di Input Riepilogati');

    const tipologiaEnteLabel = ALL_TIPOLOGIE_ENTE.find(t => t.value === annualData.tipologiaEnte)?.label || annualData.tipologiaEnte || TEXTS_UI.notApplicable;
    const infoGeneraliData = [
        { label: 'Denominazione Ente', value: annualData.denominazioneEnte },
        { label: 'Tipologia Ente', value: tipologiaEnteLabel },
        { label: 'Numero Abitanti (31.12 anno prec.)', value: formatNumber(annualData.numeroAbitanti, 0) },
        { label: 'Ente in Dissesto Finanziario?', value: formatBoolean(annualData.isEnteDissestato) },
        { label: 'Ente con Personale Dirigente?', value: formatBoolean(annualData.hasDirigenza) },
    ];
    addKeyValueTable(doc, infoGeneraliData, '1.1 Informazioni Generali Ente');
    
    const datiStorici2016Data = [
        { label: 'Limite Complessivo Originale 2016', value: formatCurrency(calculatedFund.fondoBase2016) },
    ];
    addKeyValueTable(doc, datiStorici2016Data, '1.2 Dati Storici per Limite Fondo 2016 (Art. 23 c.2)');

    const si = annualData.simulatoreInput || {} as SimulatoreIncrementoInput;
    const inputSimulatoreData = [
        { label: 'Stipendi tabellari personale 31.12.2023', value: formatCurrency(si.simStipendiTabellari2023) },
        { label: 'Spesa di personale (Consuntivo 2023)', value: formatCurrency(si.simSpesaPersonaleConsuntivo2023) },
        { label: 'Media Entrate Correnti 2021-23', value: formatCurrency(si.simMediaEntrateCorrenti2021_2023) },
    ];
    addKeyValueTable(doc, inputSimulatoreData, '1.3 Dati Chiave per Simulatore Incremento Potenziale');

    // --- 2. RISULTATI ---
    addSectionTitle(doc, '2. Risultati Calcolo Fondo');
    const { dettaglioFondi } = calculatedFund;
    const summaryBody = [
        ['Fondo Personale Dipendente', formatCurrency(dettaglioFondi.dipendente.stabile), formatCurrency(dettaglioFondi.dipendente.variabile), formatCurrency(dettaglioFondi.dipendente.totale)],
        ['Fondo Elevate Qualificazioni', formatCurrency(dettaglioFondi.eq.stabile), formatCurrency(dettaglioFondi.eq.variabile), formatCurrency(dettaglioFondi.eq.totale)],
        ['Risorse Segretario Comunale', formatCurrency(dettaglioFondi.segretario.stabile), formatCurrency(dettaglioFondi.segretario.variabile), formatCurrency(dettaglioFondi.segretario.totale)],
    ];
    if(annualData.hasDirigenza) {
        summaryBody.push(['Fondo Dirigenza', formatCurrency(dettaglioFondi.dirigenza.stabile), formatCurrency(dettaglioFondi.dirigenza.variabile), formatCurrency(dettaglioFondi.dirigenza.totale)]);
    }
     autoTable(doc, {
        startY: CURRENT_Y,
        head: [['Fondo', 'Parte Stabile (€)', 'Parte Variabile (€)', 'Totale (€)']],
        body: summaryBody,
        foot: [['TOTALE GENERALE', formatCurrency(calculatedFund.totaleComponenteStabile), formatCurrency(calculatedFund.totaleComponenteVariabile), formatCurrency(calculatedFund.totaleFondoRisorseDecentrate)]],
        theme: 'grid', 
        headStyles: { fillColor: '#994d51', textColor: '#fcf8f8', fontStyle: 'bold' as FontStyle }, 
        footStyles: { fillColor: '#d1c0c1', textColor: '#1b0e0e', fontStyle: 'bold' as FontStyle, fontSize: 10},
        didDrawPage: (data) => { CURRENT_Y = data.cursor?.y ? data.cursor.y + LINE_SPACING : MARGIN; }
    });
    CURRENT_Y = (doc as any).lastAutoTable.finalY + SECTION_SPACING;
    
    if (annualData.simulatoreRisultati) {
        addSubTitle(doc, '2.1 Risultati Simulatore Incremento');
        const sr = annualData.simulatoreRisultati;
        const risultatiSimulatoreData = [
            { label: 'Fase 1: Incremento Potenziale Lordo (Target 48%)', value: formatCurrency(sr.fase1_incrementoPotenzialeLordo) },
            { label: 'Fase 4: Spazio Utilizzabile Lordo (minore dei 3 limiti)', value: formatCurrency(sr.fase4_spazioUtilizzabileLordo) },
            { label: 'Fase 5: Incremento Netto Effettivo del Fondo', value: formatCurrency(sr.fase5_incrementoNettoEffettivoFondo) },
        ];
        addKeyValueTable(doc, risultatiSimulatoreData);
    }

    // --- 3. CONTROLLI DI CONFORMITÀ ---
    addSectionTitle(doc, '3. Controlli di Conformità');
    const complianceBody = complianceChecks.map(c => [
        c.descrizione,
        c.isCompliant ? 'Conforme' : 'NON Conforme',
        c.valoreAttuale || '-',
        c.limite || '-',
        c.messaggio
    ]);
     autoTable(doc, {
        startY: CURRENT_Y,
        head: [['Controllo', 'Stato', 'Valore', 'Limite', 'Messaggio']],
        body: complianceBody,
        theme: 'striped',
        headStyles: { fillColor: '#e0e7ff', textColor: '#1e3a8a', fontSize: 9, fontStyle: 'bold' as FontStyle }, 
        bodyStyles: { fontSize: 8 },
        columnStyles: { 4: { cellWidth: 60 } },
        didDrawPage: (data) => { CURRENT_Y = data.cursor?.y ? data.cursor.y + LINE_SPACING : MARGIN; }
    });
    CURRENT_Y = (doc as any).lastAutoTable.finalY + SECTION_SPACING;

    // Save the PDF
    doc.save(`Riepilogo_Generale_${annualData.denominazioneEnte || 'Ente'}_${annualData.annoRiferimento}.pdf`);
};


export const generateDeterminazioneTXT = (
    calculatedFund: CalculatedFund,
    fundData: FundData,
    currentUser: User
): void => {
    const { annualData, historicalData, fondoAccessorioDipendenteData } = fundData;
    const annoRiferimento = annualData.annoRiferimento;
    
    const formatNumberOnly = (value?: number, defaultValue = '………………') => 
        value !== undefined && !isNaN(value) ? value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : defaultValue;
    
    const formatVariationNumber = (value?: number, defaultValue = '...') => 
        value !== undefined && !isNaN(value) ? value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : defaultValue;

    const numberToItalianWords = (n: number): string => {
        if (n === 0) return 'zero';

        const units = ["", "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove"];
        const teens = ["dieci", "undici", "dodici", "tredici", "quattordici", "quindici", "sedici", "diciassette", "diciotto", "diciannove"];
        const tens = ["", "", "venti", "trenta", "quaranta", "cinquanta", "sessanta", "settanta", "ottanta", "novanta"];
        
        function toWords(num: number): string {
            if (num === 0) return "";
            if (num < 10) return units[num];
            if (num < 20) return teens[num - 10];
            if (num < 100) {
                const ten = Math.floor(num / 10);
                const unit = num % 10;
                let word = tens[ten];
                if ((unit === 1 || unit === 8) && ten > 1) {
                    word = word.slice(0, -1);
                }
                return word + toWords(unit);
            }
            if (num < 1000) {
                const hundred = Math.floor(num / 100);
                const remainder = num % 100;
                let word = (hundred === 1 ? "cento" : units[hundred] + "cento");
                return word + toWords(remainder);
            }
            if (num < 1000000) {
                const thousand = Math.floor(num / 1000);
                const remainder = num % 1000;
                let word = (thousand === 1 ? "mille" : toWords(thousand) + "mila");
                return word + toWords(remainder);
            }
            if (num < 1000000000) {
                const million = Math.floor(num / 1000000);
                const remainder = num % 1000000;
                let word = (million === 1 ? "unmilione" : toWords(million) + "milioni");
                return word + toWords(remainder);
            }
            return ""; 
        }
        return toWords(n);
    };

    const fullNumberToWords = (num?: number): string => {
        if (num === undefined || num === null || isNaN(num)) {
            return '…………………………/00';
        }
        
        const integerPart = Math.floor(num);
        const decimalPart = Math.round((num - integerPart) * 100);
        
        const integerWords = numberToItalianWords(integerPart) || 'zero';

        return `${integerWords}/${decimalPart.toString().padStart(2, '0')}`;
    };

    const enteHeader = () => {
        switch (annualData.tipologiaEnte) {
            case TipologiaEnte.COMUNE:
                return `Comune di ${annualData.denominazioneEnte || '……………'}\nProvincia di ……………`;
            case TipologiaEnte.PROVINCIA:
                return `Provincia di ${annualData.denominazioneEnte || '……………'}`;
            default:
                return `${annualData.denominazioneEnte || '……………'}`;
        }
    };
    
    // --- Calculations for the conditional text ---
    const dipendentiEquivalenti2018 = (annualData.personale2018PerArt23 || []).reduce((sum, emp) => {
        return sum + ((emp.partTimePercentage ?? 100) / 100);
    }, 0);
    
    const dipendentiEquivalentiAnnoRif = (annualData.personaleAnnoRifPerArt23 || []).reduce((sum, emp) => {
        const ptPerc = (emp.partTimePercentage ?? 100) / 100;
        const cedolini = emp.cedoliniEmessi ?? 12;
        const cedoliniRatio = cedolini > 0 && cedolini <= 12 ? cedolini / 12 : 1;
        return sum + (ptPerc * cedoliniRatio);
    }, 0);

    const variazioneDipendenti = dipendentiEquivalentiAnnoRif - dipendentiEquivalenti2018;

    const isArt23Compiled = 
        (historicalData.fondoPersonaleNonDirEQ2018_Art23 !== undefined && historicalData.fondoPersonaleNonDirEQ2018_Art23 !== null) || 
        (historicalData.fondoEQ2018_Art23 !== undefined && historicalData.fondoEQ2018_Art23 !== null);

    const showDatoAttoVariazionePersonale = isArt23Compiled && dipendentiEquivalentiAnnoRif > 0 && (annualData.personale2018PerArt23 || []).length > 0;
    // --- End of calculations ---

    const taglioFondoDL78 = fondoAccessorioDipendenteData?.st_taglioFondoDL78_2010;
    const incrementoDecretoPA = fondoAccessorioDipendenteData?.st_incrementoDecretoPA;

    let content = `${enteHeader()}\n\n`;
    content += `Determinazione del Dirigente/Responsabile del Servizio …………………….\n`;
    content += `N. __ del _______\n\n`;

    content += `OGGETTO: COSTITUZIONE DEL FONDO PER LE RISORSE DECENTRATE DEL PERSONALE NON DIRIGENTE PER L'ANNO ${annoRiferimento} AI SENSI DELL'ART. 79 DEL CCNL FUNZIONI LOCALI 16.11.2022 E ADEGUAMENTO PER INCREMENTO DEL PERSONALE.\n\n`;

    content += `IL DIRIGENTE/RESPONSABILE\n\n`;

    content += `PREMESSO CHE:\n\n`;

    content += `L'articolo 79 del Contratto Collettivo Nazionale di Lavoro (CCNL) del comparto Funzioni Locali, sottoscritto il 16 novembre 2022, disciplina le fonti e le modalità di costituzione del "Fondo risorse decentrate" per il personale non dirigente, distinguendo tra risorse di parte stabile e di parte variabile.\n\n`;

    content += `La Giunta Comunale, con propria deliberazione n. …… del ……………, ha definito gli indirizzi per la contrattazione integrativa per l'annualità in corso, stanziando le risorse variabili e aggiuntive da destinare al predetto fondo in applicazione delle facoltà previste dal CCNL.\n\n`;

    if (incrementoDecretoPA && incrementoDecretoPA > 0) {
        content += `Con il medesimo atto, la Giunta ha esercitato la facoltà strategica prevista dall'art. 14 del D.L. n. 25/2025, autorizzando, in coerenza con le indicazioni operative della Circolare RGS n. 175706/2025, un incremento stabile delle risorse per il salario accessorio. Attestata la relativa copertura finanziaria e sostenibilità a regime nonché il rispetto dei vincoli alla spesa di personale vigenti, tale incremento è di € ${formatNumberOnly(incrementoDecretoPA)}.\n\n`;
    }

    if (showDatoAttoVariazionePersonale) {
        content += `DATO ATTO che, nel Piano Integrato di Attività e Organizzazione (PIAO) per il triennio ${annoRiferimento}/${annoRiferimento + 2}, questo Ente ha previsto una variazione di dipendenti rispetto al 31.12.2018 pari a ${formatVariationNumber(variazioneDipendenti)} ai fini del calcolo del limite dell'art. 23 c. 2 del D.Lgs. n. 75/2017 e che tale incremento sarà verificato in sede di erogazione;\n\n`;
    }
    
    content += `RICHIAMATI i seguenti vincoli e disposizioni normative in materia di trattamento accessorio:\n\n`;

    content += `L’art. 23, comma 2, del D.Lgs. n. 75/2017, il quale stabilisce che l'ammontare complessivo delle risorse destinate annualmente al trattamento accessorio del personale non può superare il corrispondente importo determinato per l'anno 2016.\n\n`;
    
    content += `L’art. 33, comma 2, del D.L. n. 34/2019, convertito con modificazioni dalla L. n. 58/2019, che prevede un meccanismo di adeguamento del suddetto limite per garantire l'invarianza del valore medio pro-capite del fondo riferito al personale in servizio al 31 dicembre 2018.\n\n`;

    content += `L’art. 1, comma 456, della L. n. 147/2013, che ha reso permanente la riduzione dei fondi per la contrattazione integrativa applicata per effetto dell'art. 9, comma 2-bis, del D.L. n. 78/2010.\n\n`;

    content += `CONSIDERATO CHE:\n\n`;

    content += `L'incremento delle risorse derivante dall'applicazione dell'art. 14 del D.L. n. 25/2025, come chiarito in modo inequivocabile dalla citata Circolare RGS, opera in esplicita deroga al limite di cui all’art. 23, comma 2, del D.Lgs. n. 75/2017, fornendo uno strumento per rendere il fondo più dinamico e genuinamente legato ai risultati, senza impattare sul tetto di spesa storico.\n\n`;

    content += `L'art. 79, comma 1, lett. c) del CCNL 16.11.2022 prevede la possibilità di incrementare la parte stabile del fondo con "risorse stanziate dagli enti in caso di incremento stabile della consistenza di personale, in coerenza con il piano dei fabbisogni, al fine di sostenere gli oneri dei maggiori trattamenti economici del personale".\n\n`;

    content += `L'incremento del fondo derivante dall'aumento del personale deve essere calcolato nel rispetto del meccanismo di adeguamento del limite di spesa previsto dal citato art. 33, comma 2, del D.L. n. 34/2019. Tale adeguamento si ottiene moltiplicando il valore medio pro-capite del trattamento accessorio dell'anno 2018 per il numero di unità di personale aggiuntive, garantendo così l'invarianza della spesa media per dipendente e la sostenibilità finanziaria dell'operazione.\n\n`;

    content += `Questo Ente ha rispettato gli obiettivi di finanza pubblica e il vincolo di contenimento della spesa di personale per l'esercizio precedente (art. 1, commi 557 o 562, L. 296/2006).\n\n`;

    content += `Il Collegio dei Revisori dei Conti ha rilasciato, in data …………, la certificazione attestante la corretta quantificazione della riduzione permanente del fondo ai sensi della L. n. 147/2013, per un importo pari a Euro ${formatNumberOnly(taglioFondoDL78, '……………….')}.\n\n`;
    
    content += `La quantificazione del fondo per l'anno in corso, dettagliata nell'Allegato A, e la verifica del rispetto dei limiti di spesa, dettagliata nell'Allegato B, sono state effettuate nel rigoroso rispetto delle clausole contrattuali e delle disposizioni di legge richiamate.\n\n`;

    content += `VISTI:\n\n`;
    content += `Il D.Lgs. n. 165/2001 e s.m.i.\n`;
    content += `Il D.Lgs. n. 118/2011 in materia di armonizzazione dei sistemi contabili.\n`;
    content += `Lo Statuto dell'Ente e il vigente Regolamento di Contabilità.\n`;
    content += `Il bilancio di previsione per l'esercizio finanziario in corso.\n\n`;
    
    content += `D E T E R M I N A\n\n`;

    content += `1. DI COSTITUIRE, per le motivazioni analiticamente esposte in premessa, il fondo per le risorse decentrate del personale non dirigente per l’anno ${annoRiferimento}, ai sensi e per gli effetti dell’art. 79 del CCNL 16/11/2022, quantificato nell’importo complessivo di Euro ${formatNumberOnly(calculatedFund.totaleFondoRisorseDecentrate)} (Euro ${fullNumberToWords(calculatedFund.totaleFondoRisorseDecentrate)}), come risulta dall’Allegato A), che costituisce parte integrante e sostanziale del presente atto.\n\n`;

    content += `2. DI ATTESTARE che la costituzione del fondo, come analiticamente dimostrato nell'Allegato B), avviene nel pieno rispetto del limite di cui all'art. 23, comma 2, del D.Lgs. n. 75/2017, tenuto conto dei meccanismi di adeguamento per l'incremento del personale (art. 33, co. 2, D.L. 34/2019) e delle specifiche deroghe (art. 14, D.L. 25/2025) applicabili.\n\n`;

    content += `3. DI DARE ATTO che le risorse complessive del fondo, come sopra determinate, saranno destinate agli utilizzi previsti dall’art. 80 del CCNL 16/11/2022, secondo i criteri che verranno definiti in sede di contrattazione collettiva integrativa.\n\n`;

    content += `4. DI IMPEGNARE la spesa complessiva risultante dagli allegati sui pertinenti capitoli del bilancio di previsione per l'esercizio in corso, attestandone la relativa copertura finanziaria nel rispetto dei principi contabili e dei vincoli di contenimento della spesa di personale.\n\n`;
    
    content += `5. DI DARE ATTO che, in ossequio al principio della competenza finanziaria potenziata, si procederà a fine esercizio alla verifica definitiva dell'ammontare del fondo e del relativo limite, sulla base delle movimentazioni di personale (cessazioni e assunzioni) effettivamente intervenute nel corso dell'anno.\n\n`;

    content += `6. DI DISPORRE la trasmissione del presente provvedimento, comprensivo dei relativi allegati, alla Rappresentanza Sindacale Unitaria (RSU) e alla delegazione trattante di parte datoriale, per opportuna conoscenza.\n\n`;

    content += `IL DIRIGENTE/RESPONSABILE\n(${currentUser.name || '…………………………'})\n`;


    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Determinazione_Fondo_${annoRiferimento}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const generateFADXLS = (
    fadData: FondoAccessorioDipendenteData,
    annoRiferimento: number,
    simulatoreRisultati: SimulatoreIncrementoRisultati | undefined,
    isEnteInCondizioniSpeciali: boolean,
    incrementoEQconRiduzioneDipendenti: number | undefined,
    normativeData: NormativeData
): void => {
    // 1. Calculate totals first
    const fadTotals = calculateFadTotals(
        fadData,
        simulatoreRisultati,
        isEnteInCondizioniSpeciali,
        incrementoEQconRiduzioneDipendenti,
        normativeData
    );

    const fadFieldDefinitions = getFadFieldDefinitions(normativeData);

    // 2. Start building the HTML string
    let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta charset="UTF-8">
        <title>Dettaglio Fondo Personale Dipendente ${annoRiferimento}</title>
        <!--[if gte mso 9]>
        <xml>
            <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                    <x:ExcelWorksheet>
                        <x:Name>Fondo Dipendente</x:Name>
                        <x:WorksheetOptions>
                            <x:Print>
                                <x:ValidPrinterInfo/>
                                <x:PaperSizeIndex>9</x:PaperSizeIndex>
                                <x:HorizontalResolution>600</x:HorizontalResolution>
                                <x:VerticalResolution>600</x:VerticalResolution>
                            </x:Print>
                            <x:PageSetup>
                                <x:Layout x:Orientation="Landscape"/>
                                <x:Header x:Data="&C&B${'Dettaglio Fondo Personale Dipendente ' + annoRiferimento}"/>
                                <x:Footer x:Data="&L&D &R&P di &N"/>
                            </x:PageSetup>
                        </x:WorksheetOptions>
                    </x:ExcelWorksheet>
                </x:ExcelWorksheets>
            </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; vertical-align: middle;}
            .header { background-color: #994d51; color: white; font-size: 1.2em; text-align: center; font-weight: bold; }
            .section-header { background-color: #f3e7e8; font-weight: bold; page-break-before: always; }
            .table-header { background-color: #d1c0c1; font-weight: bold; text-align: center; }
            .subtractor { color: #c02128; }
            .total-row td { background-color: #f3e7e8; font-weight: bold; }
            .grand-total-row td { background-color: #d1c0c1; font-weight: bold; font-size: 1.1em;}
            .currency { text-align: right; mso-number-format:'"€"\\ #,##0.00'; }
            .text { mso-number-format:'@'; }
            @media print {
                .section-header { page-break-before: always; }
            }
        </style>
    </head>
    <body>
        <table>
            <tr>
                <td colspan="4" class="header">Dettaglio Completo Fondo Accessorio Personale Dipendente ${annoRiferimento}</td>
            </tr>
            <tr>
                <th class="table-header">Descrizione</th>
                <th class="table-header">Riferimento Normativo</th>
                <th class="table-header">Importo (€)</th>
                <th class="table-header">Rileva per Limite Art. 23?</th>
            </tr>
    `;

    // Helper to format currency and handle subtractors
    const formatCellCurrency = (value: number, isSubtractor: boolean = false) => {
        const numValue = isSubtractor ? -Math.abs(value) : value;
        return `<td class="currency ${isSubtractor ? 'subtractor' : ''}">${numValue.toFixed(2)}</td>`;
    };

    const sections: Array<{
        title: string;
        sectionKey: (typeof fadFieldDefinitions)[number]['section'];
        total: number;
        totalLabel: string;
    }> = [
        { title: "Fonti di Finanziamento Stabili", sectionKey: 'stabili', total: fadTotals.sommaStabili_Dipendenti, totalLabel: "SOMMA RISORSE STABILI" },
        { title: "Fonti di Finanziamento Variabili Soggette al Limite", sectionKey: 'vs_soggette', total: fadTotals.sommaVariabiliSoggette_Dipendenti, totalLabel: "SOMMA RISORSE VARIABILI SOGGETTE AL LIMITE" },
        { title: "Fonti di Finanziamento Variabili Non Soggette al Limite", sectionKey: 'vn_non_soggette', total: fadTotals.sommaVariabiliNonSoggette_Dipendenti, totalLabel: "SOMMA RISORSE VARIABILI NON SOGGETTE AL LIMITE" },
        { title: "Altre Risorse e Decurtazioni Finali", sectionKey: 'fin_decurtazioni', total: fadTotals.altreRisorseDecurtazioniFinali_Dipendenti, totalLabel: "SOMMA ALTRE DECURTAZIONI" },
        { title: "Calcolo del rispetto dei limiti", sectionKey: 'cl_limiti', total: fadTotals.decurtazioniLimiteSalarioAccessorio_Dipendenti, totalLabel: "DECURTAZIONI TOTALI PER RISPETTO LIMITE" },
    ];
    
    sections.forEach(section => {
        const sectionFields = fadFieldDefinitions.filter(def => def.section === section.sectionKey);
        if (sectionFields.length > 0) {
            html += `<tr><td colspan="4" class="section-header">${section.title.toUpperCase()}</td></tr>`;
            sectionFields.forEach(def => {
                const effectiveValue = getFadEffectiveValueHelper(
                    def.key,
                    fadData[def.key as keyof FondoAccessorioDipendenteData],
                    def.isDisabledByCondizioniSpeciali,
                    isEnteInCondizioniSpeciali,
                    simulatoreRisultati,
                    incrementoEQconRiduzioneDipendenti
                );

                html += `
                    <tr>
                        <td class="text">${typeof def.description === 'string' ? def.description : String(def.key)}</td>
                        <td class="text">${def.riferimento}</td>
                        ${formatCellCurrency(effectiveValue, def.isSubtractor)}
                        <td class="text" style="text-align: center;">${def.isRelevantToArt23Limit ? 'Sì' : 'No'}</td>
                    </tr>
                `;
            });
            // Section total
            html += `
                <tr class="total-row">
                    <td colspan="3" style="text-align: right;">${section.totalLabel}</td>
                    ${formatCellCurrency(section.total)}
                </tr>
            `;
        }
    });

    // Grand Total
    html += `
        <tr class="grand-total-row">
            <td colspan="3" style="text-align: right;">TOTALE RISORSE DISPONIBILI (FONDO PERSONALE DIPENDENTE)</td>
            ${formatCellCurrency(fadTotals.totaleRisorseDisponibiliContrattazione_Dipendenti)}
        </tr>
    `;

    // Close HTML
    html += `
        </table>
    </body>
    </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Dettaglio_Fondo_Dipendente_${annoRiferimento}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};