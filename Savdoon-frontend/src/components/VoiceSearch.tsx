import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';

interface VoiceSearchProps {
    onResult: (text: string) => void;
    onAction?: (action: any) => void;
    language: string;
}

import { aiApi } from '../services/api';

export function VoiceSearch({ onResult, onAction, language }: VoiceSearchProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');

    const labels = {
        listening: language === 'uz' ? 'Tinglayapman...' : language === 'ru' ? 'Слушаю...' : 'Listening...',
        tapToSpeak: language === 'uz' ? 'Qidirish uchun gapiring' : language === 'ru' ? 'Говорите для поиска' : 'Tap to speak',
    };

    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert(language === 'uz' ? 'Brauzer ovozli qidiruvni qo\'llab-quvvatlamaydi' : 'Speech recognition not supported');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = async (event: any) => {
            const result = event.results[event.results.length - 1];
            const text = result[0].transcript;
            setTranscript(text);
            if (result.isFinal) {
                onResult(text);
                setIsListening(false);

                // AI Parsing
                if (onAction) {
                    try {
                        const response = await aiApi.getVoiceCommandResponse({ text, language });
                        onAction(response.data);
                    } catch (err) {
                        console.error("Voice AI parsing failed", err);
                    }
                }
            }
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    return (
        <div className="relative">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={startListening}
                className={`p-2 rounded-xl transition-all ${isListening
                    ? 'bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                    : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-dim)] hover:text-violet-500'
                    }`}
                title={labels.tapToSpeak}
            >
                {isListening ? (
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                        <Mic className="w-5 h-5" />
                    </motion.div>
                ) : (
                    <Mic className="w-5 h-5" />
                )}
            </motion.button>

            <AnimatePresence>
                {isListening && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full mt-2 right-0 z-50 bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl p-3 shadow-xl min-w-[200px]"
                    >
                        <div className="flex items-center gap-2">
                            <motion.div
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                className="w-3 h-3 rounded-full bg-red-500"
                            />
                            <span className="text-xs font-bold text-red-400">{labels.listening}</span>
                        </div>
                        {transcript && (
                            <p className="text-sm text-[var(--text-main)] mt-2 font-medium">"{transcript}"</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
