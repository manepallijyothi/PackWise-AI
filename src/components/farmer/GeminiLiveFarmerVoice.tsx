import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  MessageSquare,
  Radio,
  Send,
  Loader2
} from 'lucide-react';
import { FarmerContext, FarmerLanguage, FarmerVoiceMessage } from '../../types/farmer';
import { sendFarmerVoiceTurn, requestGeminiTTS } from '../../services/farmerVoiceService';

interface GeminiLiveFarmerVoiceProps {
  farmerContext: FarmerContext;
  onUpdateFarmerContext: (newContext: FarmerContext) => void;
  language: FarmerLanguage;
  onChangeLanguage: (lang: FarmerLanguage) => void;
}

export const GeminiLiveFarmerVoice: React.FC<GeminiLiveFarmerVoiceProps> = ({
  farmerContext,
  onUpdateFarmerContext,
  language,
  onChangeLanguage
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');

  const [messages, setMessages] = useState<FarmerVoiceMessage[]>([
    {
      id: 'm-init',
      sender: 'assistant',
      text:
        language === 'te'
          ? 'నమస్కారం! నేను మీ ప్యాక్‌వైజ్ రైతు ప్యాకేజింగ్ సహాయకుడిని. మీ పంట ఏమిటి, ఎంత పరిమాణం ఉంది, ఎక్కడికి రవాణా చేయాలి? మాట్లాడండి.'
          : 'Namaste! I am your PackWise Farmer Packaging Assistant. What crop do you have, how many kilograms, and where will you transport it? Speak freely.',
      timestamp: 'Just now'
    }
  ]);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Suggested prompt pills
  const samplePrompts = [
    {
      en: 'I have 70 kilos of fresh tomatoes and I need to transport them for 8 hours without refrigeration.',
      te: 'నా దగ్గర 70 కేజీల తాజా టమాటాలు ఉన్నాయి, శీతలీకరణ లేకుండా 8 గంటలు రవాణా చేయాలి.'
    },
    {
      en: 'Actually transport will take 12 hours on a bumpy rural road.',
      te: 'వాస్తవానికి గ్రామీణ రోడ్డుపై రవాణాకు 12 గంటలు పడుతుంది.'
    },
    {
      en: 'Why should I not stack crates more than 6 high?',
      te: 'క్రేట్లను 6 కంటే ఎక్కువ ఎత్తు ఎందుకు పేర్చకూడదు?'
    },
    {
      en: 'Can I use normal plastic sacks instead of plastic crates?',
      te: 'ప్లాస్టిక్ క్రేట్లకు బదులుగా గోనె సంచులు లేదా ప్లాస్టిక్ సంచులు వాడవచ్చా?'
    }
  ];

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setLiveTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            handleFarmerUtterance(transcript);
          } else {
            interim += transcript;
          }
        }
        setLiveTranscript(interim);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition status:', e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language, farmerContext]);

  // Play audio response using Gemini TTS or Web Speech Synthesis
  const playSpokenAudio = async (text: string) => {
    try {
      setIsPlayingAudio(true);
      // 1. Try real Gemini TTS audio
      const audioUrl = await requestGeminiTTS(text, language);
      if (audioUrl) {
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => setIsPlayingAudio(false);
        audioRef.current.onerror = () => {
          fallbackSpeechSynthesis(text);
        };
        await audioRef.current.play();
        return;
      }
    } catch {
      // Fallback
    }
    fallbackSpeechSynthesis(text);
  };

  const fallbackSpeechSynthesis = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'te' ? 'te-IN' : 'en-IN';
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      stopAudio();
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = language === 'te' ? 'te-IN' : 'en-IN';
          recognitionRef.current.start();
        } else {
          alert('Microphone access supported via webkitSpeechRecognition in modern browsers.');
        }
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const handleFarmerUtterance = async (spokenText: string) => {
    const text = spokenText.trim();
    if (!text) return;

    // Add farmer message
    const farmerMsg: FarmerVoiceMessage = {
      id: `f-${Date.now()}`,
      sender: 'farmer',
      text,
      timestamp: 'Just now'
    };
    setMessages((prev) => [...prev, farmerMsg]);
    setIsProcessing(true);
    setLiveTranscript('');

    try {
      // Process voice turn with Gemini
      const result = await sendFarmerVoiceTurn(text, farmerContext, language);

      // Add assistant message
      const assistantMsg: FarmerVoiceMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: result.spokenReply,
        teText: result.teSpokenReply,
        timestamp: 'Just now'
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Automatically update persistent shared FarmerContext -> triggers Containers 2-5
      onUpdateFarmerContext(result.updatedContext);

      // Play audio response
      playSpokenAudio(result.spokenReply);
    } catch (e) {
      console.error('Error handling voice turn:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    const input = textInput;
    setTextInput('');
    handleFarmerUtterance(input);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Container Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            {isListening && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Container 1 of 5 • Live Voice AI
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                Gemini Live Voice
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {language === 'te' ? 'రైతు వాయిస్ అసిస్టెంట్ (తెలుగు)' : 'Farmer Post-Harvest Voice Assistant'}
            </h2>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <Languages className="w-3.5 h-3.5 text-slate-500 ml-1" />
          <button
            onClick={() => onChangeLanguage('en')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              language === 'en'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            English
          </button>
          <button
            onClick={() => onChangeLanguage('te')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              language === 'te'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            తెలుగు
          </button>
        </div>
      </div>

      {/* Structured Farmer Profile - Clean & Minimal */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Structured Farmer Profile (Auto-Updated by AI)
          </span>
          {farmerContext.unknownFields && farmerContext.unknownFields.length > 0 ? (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              <span>Missing: {farmerContext.unknownFields.join(', ')}</span>
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Profile Complete • Solution Generated</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold block">Crop</span>
            <p className="font-bold text-slate-800 truncate">
              {farmerContext.crop || 'Waiting for answer...'}
            </p>
          </div>

          <div className="p-2 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold block">Quantity</span>
            <p className="font-bold text-slate-800">
              {farmerContext.quantity ? `${farmerContext.quantity} kg` : 'Waiting for answer...'}
            </p>
          </div>

          <div className="p-2 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold block">Transportation</span>
            <p className="font-bold text-slate-800 truncate">
              {farmerContext.transportDistance
                ? `${farmerContext.transportDistance} km (${farmerContext.transportDuration || 2}h)`
                : farmerContext.transportDuration
                ? `${farmerContext.transportDuration} hours`
                : 'Waiting for answer...'}
            </p>
          </div>

          <div className="p-2 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold block">Expected Storage</span>
            <p className="font-bold text-slate-800">
              {farmerContext.storageDuration
                ? `${farmerContext.storageDuration} days`
                : '2 days (fresh market)'}
            </p>
          </div>

          <div className="p-2 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold block">Product Condition</span>
            <p className="font-bold text-emerald-700">
              {farmerContext.freshness === 'stored' ? 'Stored Produce' : 'Fresh Harvest'}
            </p>
          </div>

          <div className="p-2 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold block">Packaging Requirement</span>
            <p className="font-bold text-slate-800 truncate" title="Ventilated, shock-absorbing food-grade produce container">
              Derived by AI ✨
            </p>
          </div>
        </div>
      </div>

      {/* Conversation Messages */}
      <div className="p-4 max-h-64 overflow-y-auto space-y-3 text-xs bg-white">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'farmer' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                msg.sender === 'farmer'
                  ? 'bg-emerald-600 text-white font-medium rounded-tr-xs'
                  : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/70'
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 mb-1">
                <span>{msg.sender === 'farmer' ? '👨‍🌾 Farmer' : '🎙️ PackWise AI'}</span>
                <span>{msg.timestamp}</span>
              </div>
              <p className="text-xs leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}

        {isListening && (
          <div className="flex justify-end">
            <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl px-3.5 py-2 max-w-[85%] animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <p className="text-xs italic">
                {liveTranscript || (language === 'te' ? 'వినబడుతోంది... మాట్లాడండి' : 'Listening... speak now')}
              </p>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl px-3.5 py-2 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span className="text-xs">
                {language === 'te' ? 'పరిశీలిస్తోంది...' : 'Processing with Gemini Live...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Farmer Prompts matching user brief flow */}
      <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
          {language === 'te' ? 'ఉదాహరణ సమాధానాలు (సంభాషణ కొనసాగించండి):' : 'Example Conversation Answers (Tap to Send):'}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { en: 'Tomatoes', te: 'టమాటాలు' },
            { en: 'About 100 kg', te: 'సుమారు 100 కేజీలు' },
            { en: 'About 50 kilometres', te: 'సుమారు 50 కిలోమీటర్లు' },
            { en: 'Fresh, but they may stay for two days', te: 'తాజా పంట, కానీ రెండు రోజులు నిల్వ ఉండవచ్చు' },
            { en: 'Actually, transport is in an uncooled open truck', te: 'శీతలీకరణ లేని సాధారణ వాహనంలో రవాణా' }
          ].map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleFarmerUtterance(language === 'te' ? p.te : p.en)}
              disabled={isProcessing}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 transition-colors text-left cursor-pointer font-medium"
            >
              {language === 'te' ? p.te : p.en}
            </button>
          ))}
        </div>
      </div>

      {/* Main Large Clear CTA: "Talk to FoodPack AI" */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-3">
        {/* Large Clear Primary CTA */}
        <button
          onClick={toggleListening}
          className={`flex-1 py-3.5 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer ${
            isListening
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-red-500/20'
              : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-600/20'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5 text-white" />
              <span>{language === 'te' ? 'వినడం ఆపండి (మైక్ ఆఫ్)' : 'Listening... (Tap to Finish)'}</span>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="tracking-wide">
                {language === 'te' ? 'ఫుడ్‌ప్యాక్ AI తో మాట్లాడండి' : 'Talk to FoodPack AI'}
              </span>
            </>
          )}
        </button>

        {/* Audio Mute/Stop button */}
        {isPlayingAudio && (
          <button
            onClick={stopAudio}
            className="p-3 rounded-2xl bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors border border-amber-300 cursor-pointer"
            title="Stop audio playback"
          >
            <VolumeX className="w-5 h-5" />
          </button>
        )}

        {/* Reset button */}
        <button
          onClick={() => {
            onUpdateFarmerContext({
              crop: '',
              confirmedFields: [],
              unknownFields: ['crop', 'quantity', 'transportDuration'],
              assumptions: []
            });
            setMessages([
              {
                id: `reset-${Date.now()}`,
                sender: 'assistant',
                text:
                  language === 'te'
                    ? 'సరేనండి, కొత్త సంభాషణ ప్రారంభించబడింది. మీ పంట ఏమిటి?'
                    : 'Session reset. What crop are you preparing to harvest and transport today?',
                timestamp: 'Just now'
              }
            ]);
          }}
          className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Reset conversation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Fallback Text Input for Silent/Noisy Mandi Environments */}
      <form onSubmit={handleTextSubmit} className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={
            language === 'te'
              ? 'లేదా టైప్ చేయండి: "నా దగ్గర 70 కేజీల టమాటాలు ఉన్నాయి..."'
              : 'Or type here: "I have 70 kg tomatoes, 8 hours uncooled transport..."'
          }
          className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
        />
        <button
          type="submit"
          disabled={!textInput.trim() || isProcessing}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
