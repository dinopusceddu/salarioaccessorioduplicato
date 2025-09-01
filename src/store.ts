// store.ts
import { create } from 'zustand';
import { AppState, AppAction, FundData, CalculatedFund, ComplianceCheck, ProventoSpecifico, EmployeeCategory, Art23EmployeeDetail, SimulatoreIncrementoInput, FondoAccessorioDipendenteData, FondoElevateQualificazioniData, FondoSegretarioComunaleData, FondoDirigenzaData, SimulatoreIncrementoRisultati, PersonaleServizioDettaglio, TipologiaEnte, DistribuzioneRisorseData, NormativeData, HistoricalData, AnnualData } from './types.ts';
import { DEFAULT_CURRENT_YEAR, INITIAL_HISTORICAL_DATA, INITIAL_ANNUAL_DATA, DEFAULT_USER, INITIAL_FONDO_ACCESSORIO_DIPENDENTE_DATA, INITIAL_FONDO_ELEVATE_QUALIFICAZIONI_DATA, INITIAL_FONDO_SEGRETARIO_COMUNALE_DATA, INITIAL_FONDO_DIRIGENZA_DATA, INITIAL_DISTRIBUZIONE_RISORSE_DATA } from './constants.ts';
import { calculateFundCompletely, runAllComplianceChecks, calculateSimulazione } from './logic/fundEngine.ts';

const LOCAL_STORAGE_KEY = 'salario-accessorio-app-state';

// FIX: Added all missing action methods to the store interface
interface AppStore extends AppState {
  dispatch: (action: AppAction) => void;
  setActiveTab: (tabId: string) => void;
  setCurrentYear: (year: number) => void;
  updateHistoricalData: (payload: Partial<HistoricalData>) => void;
  updateAnnualData: (payload: Partial<AnnualData>) => void;
  updateEmployeeCount: (payload: { category: EmployeeCategory; count?: number }) => void;
  addProventoSpecifico: (payload: ProventoSpecifico) => void;
  removeProventoSpecifico: (index: number) => void;
  updateProventoSpecifico: (payload: { index: number; provento: ProventoSpecifico }) => void;
  addArt23EmployeeDetail: (payload: { yearType: '2018' | 'annoRif'; detail: Art23EmployeeDetail }) => void;
  updateArt23EmployeeDetail: (payload: { yearType: '2018' | 'annoRif'; detail: Art23EmployeeDetail }) => void;
  removeArt23EmployeeDetail: (payload: { yearType: '2018' | 'annoRif'; id: string }) => void;
  setPersonaleServizioDettagli: (payload: PersonaleServizioDettaglio[]) => void;
  addPersonaleServizioDettaglio: (payload: PersonaleServizioDettaglio) => void;
  updatePersonaleServizioDettaglio: (payload: { id: string; changes: Partial<PersonaleServizioDettaglio> }) => void;
  removePersonaleServizioDettaglio: (payload: { id: string }) => void;
  updateSimulatoreInput: (payload: Partial<SimulatoreIncrementoInput>) => void;
  updateSimulatoreRisultati: (payload: SimulatoreIncrementoRisultati | undefined) => void;
  updateCalcolatoIncrementoPNRR3: (payload: number | undefined) => void;
  updateFondoAccessorioDipendenteData: (payload: Partial<FondoAccessorioDipendenteData>) => void;
  updateFondoElevateQualificazioniData: (payload: Partial<FondoElevateQualificazioniData>) => void;
  updateFondoSegretarioComunaleData: (payload: Partial<FondoSegretarioComunaleData>) => void;
  updateFondoDirigenzaData: (payload: Partial<FondoDirigenzaData>) => void;
  updateDistribuzioneRisorseData: (payload: Partial<DistribuzioneRisorseData>) => void;
  performFundCalculation: () => Promise<void>;
  saveState: () => void;
  fetchNormativeData: () => Promise<void>; 
}

const defaultInitialState: AppState = {
  currentUser: DEFAULT_USER,
  currentYear: DEFAULT_CURRENT_YEAR,
  fundData: {
    historicalData: INITIAL_HISTORICAL_DATA,
    annualData: INITIAL_ANNUAL_DATA,
    fondoAccessorioDipendenteData: INITIAL_FONDO_ACCESSORIO_DIPENDENTE_DATA,
    fondoElevateQualificazioniData: INITIAL_FONDO_ELEVATE_QUALIFICAZIONI_DATA,
    fondoSegretarioComunaleData: INITIAL_FONDO_SEGRETARIO_COMUNALE_DATA,
    fondoDirigenzaData: INITIAL_FONDO_DIRIGENZA_DATA,
    distribuzioneRisorseData: INITIAL_DISTRIBUZIONE_RISORSE_DATA,
  },
  personaleServizio: {
    dettagli: [],
  },
  calculatedFund: undefined,
  complianceChecks: [],
  isLoading: false,
  error: undefined,
  activeTab: 'benvenuto',
  isNormativeDataLoading: true, 
  // FIX: Changed initial state of normativeData from null to undefined to match type.
  normativeData: undefined,
};


const loadState = (): AppState => {
    try {
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedState) {
            const parsed = JSON.parse(savedState);
            return {
                ...defaultInitialState,
                ...parsed,
                isLoading: false, 
            };
        }
    } catch (e) {
        console.error("Could not load state from local storage", e);
    }
    return defaultInitialState;
};

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_CURRENT_YEAR':
      return { ...state, currentYear: action.payload, fundData: {...state.fundData, annualData: {...state.fundData.annualData, annoRiferimento: action.payload}} };
    case 'UPDATE_HISTORICAL_DATA':
      return { ...state, fundData: { ...state.fundData, historicalData: { ...state.fundData.historicalData, ...action.payload } } };
    case 'UPDATE_ANNUAL_DATA':
      return { ...state, fundData: { ...state.fundData, annualData: { ...state.fundData.annualData, ...action.payload } } };
    case 'UPDATE_EMPLOYEE_COUNT': 
      {
        const newCounts = state.fundData.annualData.personaleServizioAttuale.map(emp =>
          emp.category === action.payload.category ? { ...emp, count: action.payload.count } : emp
        );
        return { ...state, fundData: { ...state.fundData, annualData: { ...state.fundData.annualData, personaleServizioAttuale: newCounts }}};
      }
    case 'UPDATE_SIMULATORE_INPUT':
      return { 
        ...state, 
        fundData: { 
          ...state.fundData, 
          annualData: { 
            ...state.fundData.annualData, 
            simulatoreInput: {
              ...state.fundData.annualData.simulatoreInput,
              ...action.payload,
            } as SimulatoreIncrementoInput 
          } 
        } 
      };
    case 'UPDATE_SIMULATORE_RISULTATI': 
      return {
        ...state,
        fundData: {
          ...state.fundData,
          annualData: {
            ...state.fundData.annualData,
            simulatoreRisultati: action.payload,
          }
        }
      };
    case 'UPDATE_CALCOLATO_INCREMENTO_PNRR3': 
      return {
        ...state,
        fundData: {
          ...state.fundData,
          annualData: {
            ...state.fundData.annualData,
            calcolatoIncrementoPNRR3: action.payload,
          }
        }
      };
    case 'UPDATE_FONDO_ACCESSORIO_DIPENDENTE_DATA': 
      return {
        ...state,
        fundData: {
          ...state.fundData,
          fondoAccessorioDipendenteData: {
            ...state.fundData.fondoAccessorioDipendenteData,
            ...action.payload,
          } as FondoAccessorioDipendenteData
        }
      };
    case 'UPDATE_FONDO_ELEVATE_QUALIFICAZIONI_DATA':
      return {
        ...state,
        fundData: {
          ...state.fundData,
          fondoElevateQualificazioniData: {
            ...state.fundData.fondoElevateQualificazioniData,
            ...action.payload,
          } as FondoElevateQualificazioniData
        }
      };
    case 'UPDATE_FONDO_SEGRETARIO_COMUNALE_DATA':
      return {
        ...state,
        fundData: {
          ...state.fundData,
          fondoSegretarioComunaleData: {
            ...state.fundData.fondoSegretarioComunaleData,
            ...action.payload,
          } as FondoSegretarioComunaleData
        }
      };
    case 'UPDATE_FONDO_DIRIGENZA_DATA':
      return {
        ...state,
        fundData: {
          ...state.fundData,
          fondoDirigenzaData: {
            ...state.fundData.fondoDirigenzaData,
            ...action.payload,
          } as FondoDirigenzaData
        }
      };
    case 'UPDATE_DISTRIBUZIONE_RISORSE_DATA':
      return {
        ...state,
        fundData: {
          ...state.fundData,
          distribuzioneRisorseData: {
            ...state.fundData.distribuzioneRisorseData,
            ...action.payload,
          } as DistribuzioneRisorseData
        }
      };
    case 'ADD_PROVENTO_SPECIFICO':
      return { ...state, fundData: { ...state.fundData, annualData: { ...state.fundData.annualData, proventiSpecifici: [...state.fundData.annualData.proventiSpecifici, action.payload] }}};
    case 'UPDATE_PROVENTO_SPECIFICO':
      {
        const updatedProventi = [...state.fundData.annualData.proventiSpecifici];
        updatedProventi[action.payload.index] = action.payload.provento;
        return { ...state, fundData: { ...state.fundData, annualData: { ...state.fundData.annualData, proventiSpecifici: updatedProventi }}};
      }
    case 'REMOVE_PROVENTO_SPECIFICO':
      {
        const filteredProventi = state.fundData.annualData.proventiSpecifici.filter((_, index) => index !== action.payload);
        return { ...state, fundData: { ...state.fundData, annualData: { ...state.fundData.annualData, proventiSpecifici: filteredProventi }}};
      }
    case 'ADD_ART23_EMPLOYEE_DETAIL':
      {
        const { yearType, detail } = action.payload;
        const key = yearType === '2018' ? 'personale2018PerArt23' : 'personaleAnnoRifPerArt23';
        const currentList = state.fundData.annualData[key] || [];
        return { 
            ...state, 
            fundData: { 
                ...state.fundData, 
                annualData: { 
                    ...state.fundData.annualData, 
                    [key]: [...currentList, detail] 
                }
            }
        };
      }
    case 'UPDATE_ART23_EMPLOYEE_DETAIL':
      {
        const { yearType, detail } = action.payload;
        const key = yearType === '2018' ? 'personale2018PerArt23' : 'personaleAnnoRifPerArt23';
        const currentList = [...(state.fundData.annualData[key] || [])];
        const index = currentList.findIndex(emp => emp.id === detail.id);
        if (index !== -1) {
            currentList[index] = detail;
        }
        return { 
            ...state, 
            fundData: { 
                ...state.fundData, 
                annualData: { 
                    ...state.fundData.annualData, 
                    [key]: currentList 
                }
            }
        };
      }
    case 'REMOVE_ART23_EMPLOYEE_DETAIL':
      {
        const { yearType, id } = action.payload;
        const key = yearType === '2018' ? 'personale2018PerArt23' : 'personaleAnnoRifPerArt23';
        const currentList = state.fundData.annualData[key] || [];
        const filteredList = currentList.filter((emp) => emp.id !== id);
        return { 
            ...state, 
            fundData: { 
                ...state.fundData, 
                annualData: { 
                    ...state.fundData.annualData, 
                    [key]: filteredList 
                }
            }
        };
      }
    case 'SET_PERSONALE_SERVIZIO_DETTAGLI':
      return {
        ...state,
        personaleServizio: {
          ...state.personaleServizio,
          dettagli: action.payload,
        },
      };
    case 'ADD_PERSONALE_SERVIZIO_DETTAGLIO': {
        return { ...state, personaleServizio: { ...state.personaleServizio, dettagli: [...(state.personaleServizio.dettagli || []), action.payload] }};
    }
    case 'UPDATE_PERSONALE_SERVIZIO_DETTAGLIO': {
        const updatedList = (state.personaleServizio.dettagli || []).map(d => d.id === action.payload.id ? { ...d, ...action.payload.changes } : d);
        return { ...state, personaleServizio: { ...state.personaleServizio, dettagli: updatedList } };
    }
    case 'REMOVE_PERSONALE_SERVIZIO_DETTAGLIO': {
        const filteredList = (state.personaleServizio.dettagli || []).filter(d => d.id !== action.payload.id);
        return { ...state, personaleServizio: { ...state.personaleServizio, dettagli: filteredList } };
    }
    case 'CALCULATE_FUND_START':
      return { ...state, isLoading: true, error: undefined };
    case 'CALCULATE_FUND_SUCCESS':
      return { ...state, isLoading: false, calculatedFund: action.payload.fund, complianceChecks: action.payload.checks };
    case 'CALCULATE_FUND_ERROR':
      return { ...state, isLoading: false, error: action.payload, calculatedFund: undefined, complianceChecks: [] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_NORMATIVE_DATA_LOADING':
      return { ...state, isNormativeDataLoading: action.payload };
    case 'SET_NORMATIVE_DATA':
      return { ...state, normativeData: action.payload, isNormativeDataLoading: false };
    // FIX: Added missing reducer case for normative data errors.
    case 'SET_NORMATIVE_DATA_ERROR':
      return { ...state, error: action.payload, isNormativeDataLoading: false };
    default:
      return state;
  }
};


export const useAppStore = create<AppStore>((set, get) => ({
  ...loadState(),
  
  dispatch: (action: AppAction) => set(state => appReducer(state, action)),

  // FIX: Implemented all missing action methods to dispatch corresponding actions.
  setActiveTab: (tabId: string) => get().dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId }),
  setCurrentYear: (year: number) => get().dispatch({ type: 'SET_CURRENT_YEAR', payload: year }),
  
  updateHistoricalData: (payload: Partial<HistoricalData>) => get().dispatch({ type: 'UPDATE_HISTORICAL_DATA', payload }),
  updateAnnualData: (payload: Partial<AnnualData>) => get().dispatch({ type: 'UPDATE_ANNUAL_DATA', payload }),
  updateEmployeeCount: (payload: { category: EmployeeCategory; count?: number }) => get().dispatch({ type: 'UPDATE_EMPLOYEE_COUNT', payload }),
  updateSimulatoreInput: (payload: Partial<SimulatoreIncrementoInput>) => get().dispatch({ type: 'UPDATE_SIMULATORE_INPUT', payload }),
  updateSimulatoreRisultati: (payload: SimulatoreIncrementoRisultati | undefined) => get().dispatch({ type: 'UPDATE_SIMULATORE_RISULTATI', payload }),
  updateCalcolatoIncrementoPNRR3: (payload: number | undefined) => get().dispatch({ type: 'UPDATE_CALCOLATO_INCREMENTO_PNRR3', payload }),
  addProventoSpecifico: (payload: ProventoSpecifico) => get().dispatch({ type: 'ADD_PROVENTO_SPECIFICO', payload }),
  updateProventoSpecifico: (payload: { index: number; provento: ProventoSpecifico }) => get().dispatch({ type: 'UPDATE_PROVENTO_SPECIFICO', payload }),
  removeProventoSpecifico: (index: number) => get().dispatch({ type: 'REMOVE_PROVENTO_SPECIFICO', payload: index }),
  addArt23EmployeeDetail: (payload: { yearType: '2018' | 'annoRif'; detail: Art23EmployeeDetail }) => get().dispatch({ type: 'ADD_ART23_EMPLOYEE_DETAIL', payload }),
  updateArt23EmployeeDetail: (payload: { yearType: '2018' | 'annoRif'; detail: Art23EmployeeDetail }) => get().dispatch({ type: 'UPDATE_ART23_EMPLOYEE_DETAIL', payload }),
  removeArt23EmployeeDetail: (payload: { yearType: '2018' | 'annoRif'; id: string }) => get().dispatch({ type: 'REMOVE_ART23_EMPLOYEE_DETAIL', payload }),
  setPersonaleServizioDettagli: (payload: PersonaleServizioDettaglio[]) => get().dispatch({ type: 'SET_PERSONALE_SERVIZIO_DETTAGLI', payload }),
  addPersonaleServizioDettaglio: (payload: PersonaleServizioDettaglio) => get().dispatch({ type: 'ADD_PERSONALE_SERVIZIO_DETTAGLIO', payload }),
  updatePersonaleServizioDettaglio: (payload: { id: string; changes: Partial<PersonaleServizioDettaglio> }) => get().dispatch({ type: 'UPDATE_PERSONALE_SERVIZIO_DETTAGLIO', payload }),
  removePersonaleServizioDettaglio: (payload: { id: string }) => get().dispatch({ type: 'REMOVE_PERSONALE_SERVIZIO_DETTAGLIO', payload }),
  updateFondoAccessorioDipendenteData: (payload: Partial<FondoAccessorioDipendenteData>) => get().dispatch({ type: 'UPDATE_FONDO_ACCESSORIO_DIPENDENTE_DATA', payload }),
  updateFondoElevateQualificazioniData: (payload: Partial<FondoElevateQualificazioniData>) => get().dispatch({ type: 'UPDATE_FONDO_ELEVATE_QUALIFICAZIONI_DATA', payload }),
  updateFondoSegretarioComunaleData: (payload: Partial<FondoSegretarioComunaleData>) => get().dispatch({ type: 'UPDATE_FONDO_SEGRETARIO_COMUNALE_DATA', payload }),
  updateFondoDirigenzaData: (payload: Partial<FondoDirigenzaData>) => get().dispatch({ type: 'UPDATE_FONDO_DIRIGENZA_DATA', payload }),
  updateDistribuzioneRisorseData: (payload: Partial<DistribuzioneRisorseData>) => get().dispatch({ type: 'UPDATE_DISTRIBUZIONE_RISORSE_DATA', payload }),


  saveState: () => {
    try {
      const stateToSave = { ...get(), isLoading: undefined, error: undefined };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Could not save state to localStorage.", error);
    }
  },

  performFundCalculation: async () => {
    const { fundData, normativeData } = get();
    if (!normativeData) {
        console.error("Dati normativi non caricati, calcolo annullato.");
        get().dispatch({ type: 'CALCULATE_FUND_ERROR', payload: "Dati normativi non disponibili. Impossibile calcolare."});
        return;
    }
    get().dispatch({ type: 'CALCULATE_FUND_START' });
    try {
      const calculatedFund = calculateFundCompletely(fundData, normativeData);
      const complianceChecks = runAllComplianceChecks(calculatedFund, fundData, normativeData);
      get().dispatch({ type: 'CALCULATE_FUND_SUCCESS', payload: { fund: calculatedFund, checks: complianceChecks } });
      get().saveState();
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      get().dispatch({ type: 'CALCULATE_FUND_ERROR', payload: `Errore nel calcolo: ${error}` });
      console.error("Calculation error:", e);
    }
  },
  
  fetchNormativeData: async () => {
    const { dispatch } = get();
    dispatch({ type: 'SET_NORMATIVE_DATA_LOADING', payload: true });
    try {
      const response = await fetch('/normativa.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: NormativeData = await response.json();
      dispatch({ type: 'SET_NORMATIVE_DATA', payload: data });
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      dispatch({ type: 'SET_NORMATIVE_DATA_ERROR', payload: `Errore nel caricamento dei dati normativi: ${error}` });
      console.error("Fetch normative data error:", e);
    }
  },

}));