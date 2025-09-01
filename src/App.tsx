// src/App.tsx
import React, { useEffect } from 'react';

// Importazioni aggiornate per puntare alle directory corrette e con estensione corretta
import { HomePage } from './pages/HomePage.tsx';
import { DataEntryPage } from './pages/DataEntryPage.tsx';
import { FundDetailsPage } from './pages/FundDetailsPage.tsx';
import { CompliancePage } from './pages/CompliancePage.tsx';
import { ReportsPage } from './pages/ReportsPage.tsx';
import { FondoAccessorioDipendentePage } from './pages/FondoAccessorioDipendentePage.tsx';
import { FondoElevateQualificazioniPage } from './pages/FondoElevateQualificazioniPage.tsx';
import { FondoSegretarioComunalePage } from './pages/FondoSegretarioComunalePage.tsx';
import { FondoDirigenzaPage } from './pages/FondoDirigenzaPage.tsx'; 
import { ChecklistPage } from './pages/ChecklistPage.tsx'; 
import { PersonaleServizioPage } from './pages/PersonaleServizioPage.tsx';
import { DistribuzioneRisorsePage } from './pages/DistribuzioneRisorsePage.tsx';

import { useAppStore } from './store.ts';
import { MainLayout } from './components/layout/MainLayout.tsx';
import { PageModule } from './types.ts';
import { LoadingSpinner } from './components/shared/LoadingSpinner.tsx';


const allPageModules: PageModule[] = [
  { id: 'benvenuto', name: 'Benvenuto!', component: HomePage }, 
  { id: 'dataEntry', name: 'Dati Costituzione Fondo', component: DataEntryPage },
  { id: 'fondoAccessorioDipendente', name: 'Fondo Accessorio Personale', component: FondoAccessorioDipendentePage },
  { id: 'fondoElevateQualificazioni', name: 'Fondo Elevate Qualificazioni', component: FondoElevateQualificazioniPage },
  { id: 'fondoSegretarioComunale', name: 'Risorse Segretario Comunale', component: FondoSegretarioComunalePage },
  { id: 'fondoDirigenza', name: 'Fondo Dirigenza', component: FondoDirigenzaPage },
  { id: 'personaleServizio', name: 'Personale in servizio', component: PersonaleServizioPage },
  { id: 'distribuzioneRisorse', name: 'Distribuzione Risorse', component: DistribuzioneRisorsePage },
  { id: 'fundDetails', name: 'Dettaglio Fondo Calcolato', component: FundDetailsPage },
  { id: 'compliance', name: 'Conformità', component: CompliancePage },
  { id: 'checklist', name: 'Check list Interattiva', component: ChecklistPage },
  { id: 'reports', name: 'Report', component: ReportsPage },
];


const AppContent: React.FC = () => {
    const { 
        activeTab, 
        fundData, 
        isLoading, 
        fetchNormativeData, 
        setActiveTab, 
        isNormativeDataLoading 
    } = useAppStore(state => ({
        activeTab: state.activeTab,
        fundData: state.fundData,
        isLoading: state.isLoading,
        fetchNormativeData: state.fetchNormativeData,
        setActiveTab: state.setActiveTab,
        isNormativeDataLoading: state.isNormativeDataLoading,
    }));

    useEffect(() => {
        fetchNormativeData();
    }, [fetchNormativeData]);
    
    const visibleModules = allPageModules.filter(module => {
        if (module.id === 'fondoDirigenza' && !fundData.annualData.hasDirigenza) {
            return false;
        }
        return true;
    });

    useEffect(() => {
        const activeModuleIsVisible = visibleModules.some(mod => mod.id === activeTab);
        if (!activeModuleIsVisible && activeTab !== 'benvenuto') {
            setActiveTab('benvenuto');
        }
    }, [visibleModules, activeTab, setActiveTab]);

    const ActiveComponent = visibleModules.find(mod => mod.id === activeTab)?.component || HomePage;

    if (isNormativeDataLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <LoadingSpinner text="Caricamento applicazione..." />
            </div>
        );
    }

    return (
        <MainLayout modules={visibleModules}>
            {isLoading ? (
                <div className="flex justify-center items-center h-full">
                    <LoadingSpinner text="Calcolo in corso..." />
                </div>
            ) : (
                <ActiveComponent />
            )}
        </MainLayout>
    );
};


const App: React.FC = () => {
  return (
      <AppContent />
  );
};

export default App;