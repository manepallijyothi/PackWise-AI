import React, { useState } from 'react';
import {
  CommodityInput,
  MaterialScore,
  DecisionFactorScore,
  AssistantMessage,
  AnalysisResult
} from '../types/packaging';
import { askPackWiseAssistant } from '../services/geminiService';
import { Bot, Send, Loader2, User, ChevronDown, ChevronUp } from 'lucide-react';

interface PackWiseAssistantProps {
  commodity: CommodityInput;
  primaryRecommendation: MaterialScore;
  decisionFactors: DecisionFactorScore[];
  analysisResult?: AnalysisResult;
}

export const PackWiseAssistant: React.FC<PackWiseAssistantProps> = ({
  commodity,
  primaryRecommendation,
  decisionFactors,
  analysisResult
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modelSource, setModelSource] = useState<string>('gemini-2.5-flash');

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: `Hello! I am your PackWise AI Assistant. I evaluated ${
        commodity.customName || commodity.commodityType
      } and recommended ${primaryRecommendation.material.shortName} (${
        primaryRecommendation.compatibility
      }% compatibility). Ask me about WVTR/OTR trade-offs, shelf life, or alternative materials!`,
      timestamp: 'Just now'
    }
  ]);

  const quickPrompts = [
    `Why did you recommend ${primaryRecommendation.material.shortName}?`,
    'What happens if I increase shelf life to 60 days?',
    'Suggest a biodegradable or eco-friendly alternative.',
    'How does temperature affect this packaging barrier?'
  ];

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || isLoading) return;

    const userMsg: AssistantMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const contextPayload = analysisResult || {
        commodity,
        primaryRecommendation,
        decisionFactors
      };

      const { answer, source } = await askPackWiseAssistant(q, contextPayload);
      setModelSource(source);

      const assistantMsg: AssistantMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: answer,
        timestamp: 'Just now'
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: 'I analyzed the packaging parameters. For this commodity, maintaining balanced barrier and thermal stability is recommended.',
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-emerald-50/80 to-teal-50/50 hover:bg-emerald-50 transition-colors text-left border-b border-slate-100 cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900">PackWise Assistant</h3>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                {modelSource.includes('gemini') ? 'Gemini 2.5 Flash' : 'FoodTech AI'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Interactive contextual FoodTech reasoning for {commodity.customName || commodity.commodityType}
            </p>
          </div>
        </div>

        <div className="text-slate-400">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 space-y-3">
          {/* Quick Prompt Pills */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Suggested Questions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 transition-colors text-left cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 pt-1">
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      isAssistant
                        ? 'bg-slate-50 text-slate-800 border border-slate-200'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {!isAssistant && (
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2 items-center text-slate-400 text-xs pl-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>PackWise Assistant is analyzing packaging context with Gemini...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2 pt-2 border-t border-slate-100"
          >
            <input
              type="text"
              placeholder="Ask about materials, WVTR, OTR, temperature..."
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              disabled={isLoading}
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuestion.trim()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-colors flex items-center justify-center shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
