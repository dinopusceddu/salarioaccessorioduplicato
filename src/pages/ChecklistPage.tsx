// pages/ChecklistPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { useAppStore } from '../store.ts';
import { Card } from '../components/shared/Card.tsx';
import { Button } from '../components/shared/Button.tsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.tsx';
import { FundData, CalculatedFund } from '../types.ts';
import { TEXTS_UI } from '../constants.ts';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string | React.ReactNode;
  timestamp: Date;
}

const formatCurrencyForContext = (value?: number, defaultValue = "non specificato"): string => {
  if (value === undefined || value === null || isNaN(value)) return defaultValue;
  return `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const generateContextFromState = (fundData: FundData, calculatedFund?: CalculatedFund): string => {
  let context = `CONTESTO DATI FONDO ATTUALMENTE INSERITI (Anno ${fundData.annualData.annoRiferimento}):\n`;
  context += `Ente: ${fundData.annualData.denominazioneEnte || 'Non specificato'}\n`;
  context += `Tipologia Ente: ${fundData.annualData.tipologiaEnte || 'Non specificato'}\n`;
  context += `Numero Abitanti: ${fundData.annualData.numeroAbitanti || 'Non specificato'}\n`;
  context += `Ente con Dirigenza: ${fundData.annualData.hasDirigenza ? 'Sì' : 'No'}\n\n`;

  const hd = fundData.historicalData;
  context += "DATI STORICI:\n";
  context += `- Limite Complessivo Originale 2016: ${formatCurrencyForContext(calculatedFund?.fondoBase2016)}\n`;
  context += `- Fondo Personale (non Dir/EQ) 2018 (per Art. 23c2): ${formatCurrencyForContext(hd.fondoPersonaleNonDirEQ2018_Art23)}\n`;
  context += `- Fondo EQ 2018 (per Art. 23c2): ${formatCurrencyForContext(hd.fondoEQ2018_Art23)}\n\n`;

  if (calculatedFund) {
    const { dettaglioFondi } = calculatedFund;
    context += "SINTESI FONDI CALCOLATI:\n";
    context += `  - Totale Fondo Personale Dipendente: ${formatCurrencyForContext(dettaglioFondi.dipendente.totale)}\n`;
    context += `    - di cui parte stabile: ${formatCurrencyForContext(dettaglioFondi.dipendente.stabile)}\n`;
    context += `    - di cui parte variabile: ${formatCurrencyForContext(dettaglioFondi.dipendente.variabile)}\n`;
    context += `  - Totale Fondo Elevate Qualificazioni: ${formatCurrencyForContext(dettaglioFondi.eq.totale)}\n`;
    context += `  - Totale Risorse Segretario Comunale: ${formatCurrencyForContext(dettaglioFondi.segretario.totale)}\n`;
    if(fundData.annualData.hasDirigenza) {
      context += `  - Totale Fondo Dirigenza: ${formatCurrencyForContext(dettaglioFondi.dirigenza.totale)}\n`;
    }
    context += `\n`;

    context += "CALCOLO GLOBALE FONDO (SINTESI):\n";
    context += `- Totale Generale Risorse Decentrate: ${formatCurrencyForContext(calculatedFund.totaleFondoRisorseDecentrate)}\n`;
    context += `- Limite Art. 23 c.2 Modificato (se applicabile): ${formatCurrencyForContext(calculatedFund.limiteArt23C2Modificato)}\n`;
    context += `- Somma Risorse Soggette al Limite dai Fondi Specifici: ${formatCurrencyForContext(calculatedFund.totaleRisorseSoggetteAlLimiteDaFondiSpecifici)}\n`;
    context += `- Superamento Limite 2016 (Globale): ${calculatedFund.superamentoLimite2016 ? formatCurrencyForContext(calculatedFund.superamentoLimite2016) : 'Nessuno'}\n\n`;
  } else {
    context += "RISULTATI CALCOLO FONDO NON DISPONIBILI. Eseguire prima il calcolo.\n\n";
  }


  context += "FINE CONTESTO DATI.\n";
  return context;
};

export const ChecklistPage: React.FC = () => {
  const fundData = useAppStore(state => state.fundData);
  const calculatedFund = useAppStore(state => state.calculatedFund);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userInput,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      const context = generateContextFromState(fundData, calculatedFund);
      const prompt = `Sei un assistente esperto specializzato nel Fondo delle Risorse Decentrate per gli Enti Locali italiani.
Il tuo compito è rispondere alle domande dell'utente basandoti ESCLUSIVAMENTE sui dati forniti nel seguente contesto.
Rispondi in italiano, in modo chiaro e conciso. Se l'informazione richiesta non è presente nei dati, indicalo esplicitamente.
Non fare riferimento a conoscenze esterne o normative non menzionate nei dati. Non inventare informazioni.

${context}

Domanda dell'utente: "${userMessage.text}"

Risposta dell'assistente:`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 0 } 
        }
      });
      
      const botText = response.text;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botText || "Non ho ricevuto una risposta valida.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (e) {
      console.error("Errore chiamata Gemini API:", e);
      const errorMessage = e instanceof Error ? e.message : "Errore sconosciuto durante la comunicazione con l'assistente.";
      setError(`Si è verificato un errore: ${errorMessage}`);
      const botErrorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "Mi dispiace, non sono riuscito a elaborare la tua richiesta in questo momento.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">Check list Interattiva del Fondo</h2>
      
      <Card title="Chat con Assistente Virtuale" className="flex flex-col h-[calc(100vh-200px)] max-h-[700px]">
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#fcf8f8]">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-xl shadow ${
                msg.sender === 'user' 
                ? 'bg-[#ea2832] text-white' 
                : 'bg-white text-[#1b0e0e] border border-[#f3e7e8]'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-gray-200' : 'text-[#5f5252]'} text-opacity-80`}>
                  {msg.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[70%] p-3 rounded-lg shadow bg-white text-[#1b0e0e] border border-[#f3e7e8]">
                <LoadingSpinner size="sm" text="L'assistente sta pensando..." textColor="text-[#5f5252]" />
              </div>
            </div>
          )}
          {error && (
             <div className="flex justify-start">
              <div className="max-w-[70%] p-3 rounded-lg shadow bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]">
                <p className="text-sm font-semibold">Errore:</p>
                <p className="text-sm whitespace-pre-wrap">{error}</p>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="p-4 border-t border-[#f3e7e8] bg-white">
          <div className="flex items-center space-x-3">
            <textarea
              rows={2}
              className="form-textarea flex-grow resize-none rounded-lg text-[#1b0e0e] border-none bg-[#f3e7e8] placeholder:text-[#994d51] p-3 focus:ring-2 focus:ring-[#ea2832]/50 focus:outline-none"
              placeholder="Scrivi la tua domanda qui..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !userInput.trim()} variant="primary" size="md">
              {isLoading ? TEXTS_UI.calculating.substring(0, TEXTS_UI.calculating.length-3) + "..." : "Invia"} {/* Shortened loading text */}
            </Button>
          </div>
        </div>
      </Card>
      <Card title="Suggerimenti per le domande" className="mt-4" isCollapsible defaultCollapsed={true}>
        <ul className="list-disc list-inside text-sm text-[#5f5252] space-y-1 p-2">
            <li>"Qual è il totale del fondo per il personale dipendente?"</li>
            <li>"Qual è la composizione del fondo per le Elevate Qualificazioni?"</li>
            <li>"Il fondo supera il limite del 2016?"</li>
            <li>"A quanto ammonta il totale generale del fondo?"</li>
            <li>"Quali sono le risorse per il Segretario Comunale?"</li>
            <li>"Fornisci un riepilogo delle risorse stabili per la dirigenza."</li>
        </ul>
        <p className="text-xs text-[#5f5252] mt-2 p-2">
            L'assistente risponderà basandosi <strong className="text-[#1b0e0e]">esclusivamente</strong> sui dati che hai inserito e calcolato nelle altre sezioni dell'applicazione.
        </p>
      </Card>
    </div>
  );
};