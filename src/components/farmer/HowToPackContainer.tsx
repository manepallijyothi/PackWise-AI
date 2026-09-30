import React, { useState, useEffect, useRef } from 'react';
import {
  ClipboardList,
  Volume2,
  Play,
  Pause,
  Square,
  FileText,
  Languages,
  HelpCircle,
  Scissors,
  Box,
  Layers,
  Wind,
  Shield,
  Truck,
  Check,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { PackingStep, PackagingAsset, FarmerLanguage, FarmerContext } from '../../types/farmer';
import { AnalysisResult } from '../../types/packaging';
import { generateHowToPackSteps } from '../../engine/farmerPlanGenerator';
import { requestGeminiTTS, explainPackingStepAI } from '../../services/farmerVoiceService';

interface HowToPackContainerProps {
  crop: string;
  farmerContext: FarmerContext;
  asset: PackagingAsset;
  recommendation: AnalysisResult;
  language: FarmerLanguage;
  onChangeLanguage: (lang: FarmerLanguage) => void;
}

export const HowToPackContainer: React.FC<HowToPackContainerProps> = ({
  crop,
  farmerContext,
  asset,
  recommendation,
  language,
  onChangeLanguage
}) => {
  const steps = generateHowToPackSteps(crop, farmerContext, asset, recommendation);

  // Audio state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');

  // Step explanation modal state
  const [explainingStep, setExplainingStep] = useState<PackingStep | null>(null);
  const [explanationText, setExplanationText] = useState<string>('');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const getStepText = (step: PackingStep, lang: FarmerLanguage) => {
    if (lang === 'te') {
      return `దశ ${step.stepNumber}: ${step.teTitle || step.title}. ${step.teInstruction || step.instruction}`;
    }
    return `Step ${step.stepNumber}: ${step.title}. ${step.instruction}`;
  };

  const readAllStepsAloud = async () => {
    stopAudio();
    setIsPlaying(true);
    setIsPaused(false);
    playStepSequence(0);
  };

  const playStepSequence = async (index: number) => {
    if (index >= steps.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentStepIndex(-1);
      return;
    }

    setCurrentStepIndex(index);
    const step = steps[index];
    const textToSpeak = getStepText(step, language);
    setSpokenTranscript(textToSpeak);

    // 1. Try Gemini TTS
    try {
      const audioUrl = await requestGeminiTTS(textToSpeak, language);
      if (audioUrl) {
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          playStepSequence(index + 1);
        };
        audioRef.current.onerror = () => {
          fallbackBrowserSpeech(textToSpeak, index);
        };
        await audioRef.current.play();
        return;
      }
    } catch {
      // Fallback
    }

    fallbackBrowserSpeech(textToSpeak, index);
  };

  const fallbackBrowserSpeech = (text: string, index: number) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'te' ? 'te-IN' : 'en-IN';
      utterance.rate = 0.92;
      synthRef.current = utterance;

      utterance.onend = () => {
        playStepSequence(index + 1);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlaying(false);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    setIsPaused(true);
  };

  const resumeAudio = () => {
    if (audioRef.current && isPaused) {
      audioRef.current.play();
    }
    if ('speechSynthesis' in window && isPaused) {
      window.speechSynthesis.resume();
    }
    setIsPaused(false);
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentStepIndex(-1);
  };

  // Explain Step AI Trigger
  const handleExplainStep = async (step: PackingStep) => {
    setExplainingStep(step);
    setIsLoadingExplanation(true);
    setExplanationText('');

    try {
      const explanation = await explainPackingStepAI(step, crop, asset.name, language);
      setExplanationText(explanation);
    } catch {
      setExplanationText(
        language === 'te'
          ? `${crop} రవాణాలో పాడవకుండా ఉండటానికి ఈ దశ అత్యంత అవసరం.`
          : `This step is critical to prevent post-harvest metabolic decay for ${crop} during transit.`
      );
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case 'scissors':
        return <Scissors className="w-4 h-4 text-emerald-600" />;
      case 'box':
        return <Box className="w-4 h-4 text-emerald-600" />;
      case 'layers':
        return <Layers className="w-4 h-4 text-emerald-600" />;
      case 'wind':
        return <Wind className="w-4 h-4 text-emerald-600" />;
      case 'shield':
        return <Shield className="w-4 h-4 text-emerald-600" />;
      case 'truck':
        return <Truck className="w-4 h-4 text-emerald-600" />;
      default:
        return <Check className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Container Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Container 3 of 5 • Step Protocol
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                {steps.length} Validated Steps
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {language === 'te' ? 'ప్యాకింగ్ చేయు పద్ధతి (దశలవారీగా)' : 'How to Pack: Farmer Field Guide'}
            </h2>
          </div>
        </div>

        {/* Audio Player Control Bar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
          {!isPlaying ? (
            <button
              onClick={readAllStepsAloud}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Read all steps aloud"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{language === 'te' ? '🔊 అన్నీ చదవండి' : 'Read All Aloud'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              {isPaused ? (
                <button
                  onClick={resumeAudio}
                  className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center gap-1 cursor-pointer"
                  title="Play"
                >
                  <Play className="w-4 h-4" />
                  <span className="text-[11px] font-bold pr-1">PLAY</span>
                </button>
              ) : (
                <button
                  onClick={pauseAudio}
                  className="p-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold flex items-center gap-1 cursor-pointer"
                  title="Pause"
                >
                  <Pause className="w-4 h-4" />
                  <span className="text-[11px] font-bold pr-1">PAUSE</span>
                </button>
              )}

              <button
                onClick={stopAudio}
                className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold flex items-center gap-1 cursor-pointer"
                title="Stop"
              >
                <Square className="w-4 h-4" />
                <span className="text-[11px] font-bold pr-1">STOP</span>
              </button>
            </div>
          )}

          {/* Transcript Toggle */}
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              showTranscript ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:text-white'
            }`}
            title="Toggle spoken transcript view"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>TRANSCRIPT</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => onChangeLanguage(language === 'en' ? 'te' : 'en')}
            className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Toggle English / Telugu"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-300" />
            <span>{language === 'te' ? 'English' : 'తెలుగు'}</span>
          </button>
        </div>
      </div>

      {/* Spoken Transcript Overlay */}
      {showTranscript && (
        <div className="p-3 bg-emerald-950 text-emerald-100 text-xs border-b border-emerald-900 animate-in fade-in duration-150 flex items-start gap-2">
          <FileText className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-[10px] uppercase text-emerald-400 block mb-0.5">
              Current Live Spoken Transcript:
            </span>
            <p className="leading-relaxed">
              {spokenTranscript || (language === 'te' ? 'ఆడియో ఇంకా ప్రారంభం కాలేదు. "🔊 అన్నీ చదవండి" నొక్కండి.' : 'Audio has not started yet. Tap "🔊 READ ALL STEPS ALOUD" to listen.')}
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Steps List */}
      <div className="p-5 space-y-4">
        {steps.map((step, idx) => {
          const isCurrentActive = currentStepIndex === idx;

          return (
            <div
              key={step.stepNumber}
              className={`p-4 rounded-2xl border transition-all ${
                isCurrentActive
                  ? 'bg-emerald-50/90 border-emerald-400 shadow-sm scale-[1.01]'
                  : 'bg-white border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isCurrentActive
                        ? 'bg-emerald-600 text-white font-black'
                        : 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                    }`}
                  >
                    {step.stepNumber}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {language === 'te' ? step.teTitle || step.title : step.title}
                      </span>
                      {isCurrentActive && (
                        <span className="px-2 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-bold animate-pulse">
                          Speaking
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">
                      {language === 'te' ? step.teInstruction || step.instruction : step.instruction}
                    </p>

                    {step.criticalNotice && (
                      <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1.5">
                        ⚠️ {step.criticalNotice}
                      </p>
                    )}
                  </div>
                </div>

                {/* "Why should I do this?" Explanation Button */}
                <button
                  onClick={() => handleExplainStep(step)}
                  className="shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Explain this specific step with food science"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Why do this?</span>
                  <span className="sm:hidden">Why?</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Explanation Modal */}
      {explainingStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="p-4 bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <h3 className="text-sm font-extrabold tracking-tight">
                  Step {explainingStep.stepNumber} Rationale: {explainingStep.title}
                </h3>
              </div>
              <button
                onClick={() => setExplainingStep(null)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Step Instruction
                </span>
                <p className="font-semibold text-slate-900">
                  {language === 'te'
                    ? explainingStep.teInstruction || explainingStep.instruction
                    : explainingStep.instruction}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  Food Science & Postharvest Explanation
                </span>
                {isLoadingExplanation ? (
                  <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Analyzing physiological benefit for {crop}...</span>
                  </div>
                ) : (
                  <p className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 font-medium leading-relaxed">
                    {explanationText}
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-100 text-slate-600 text-[11px] leading-relaxed">
                <span className="font-bold text-slate-800 block mb-0.5">Crop Context:</span>
                Evaluated for {crop} transported in {asset.name} under current route conditions.
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setExplainingStep(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
