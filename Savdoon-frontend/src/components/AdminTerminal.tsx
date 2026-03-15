import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal as TerminalIcon, X, ChevronRight, CornerDownLeft, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { terminalService, TerminalLine } from '../services/terminalService';
import { useApp } from '../context/AppContext';

interface AdminTerminalProps {
    onClose: () => void;
}

export function AdminTerminal({ onClose }: AdminTerminalProps) {
    const { t } = useApp();
    const [input, setInput] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [history, setHistory] = useState<TerminalLine[]>([
        { type: 'output', content: 'Savdoon OS v4.0.2 (LTS)' },
        { type: 'output', content: t('terminal_welcome') || 'Welcome back, Root. Type "help" for a list of commands.' }
    ]);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isProcessing, setIsProcessing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const handleCommand = async (e: React.FormEvent) => {
        e.preventDefault();
        const cmd = input.trim();
        if (!cmd || isProcessing) return;

        const newHistory: TerminalLine[] = [...history, { type: 'input', content: input }];
        setCommandHistory(prev => [cmd, ...prev.filter(h => h !== cmd)].slice(0, 50));
        setHistoryIndex(-1);
        setInput('');

        if (cmd.toLowerCase() === 'clear') {
            setHistory([]);
        } else {
            setIsProcessing(true);
            try {
                const result = await terminalService.parseCommand(cmd, t);
                setHistory([...newHistory, ...result]);
            } catch (error) {
                setHistory([...newHistory, { type: 'error', content: 'Execution error. Check server logs.' }]);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                const nextIndex = historyIndex + 1;
                setHistoryIndex(nextIndex);
                setInput(commandHistory[nextIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const nextIndex = historyIndex - 1;
                setHistoryIndex(nextIndex);
                setInput(commandHistory[nextIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setInput('');
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const commands = [
                'help', 'stats', 'sys_check', 'clear', 'whoami', 'stores', 'logs',
                'maintenance', 'currency', 'health', 'config', 'sim_order',
                'couriers', 'users', 'auth', 'reset_pwd', 'backup', 'clear_cache',
                'db_stats', 'ai_usage', 'ai_test', 'broadcast', 'promo'
            ];
            const match = commands.find(c => c.startsWith(input.toLowerCase()));
            if (match) {
                setInput(match);
            }
        }
    };

    // Handle minimize - show only header
    if (isMinimized) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-[#020617]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden font-mono"
            >
                <div className="h-12 px-4 flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <button
                            onClick={onClose}
                            className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-400 border border-rose-600 transition-colors group flex items-center justify-center"
                            title="Close"
                        >
                            <X className="w-2 h-2 text-rose-900 opacity-0 group-hover:opacity-100" />
                        </button>
                        <button
                            onClick={() => setIsMinimized(false)}
                            className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-400 border border-amber-600 transition-colors group flex items-center justify-center"
                            title="Expand"
                        >
                            <Minus className="w-2 h-2 text-amber-900 opacity-0 group-hover:opacity-100" />
                        </button>
                        <button
                            onClick={() => { setIsMinimized(false); setIsMaximized(true); }}
                            className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-400 border border-emerald-600 transition-colors group flex items-center justify-center"
                            title="Maximize"
                        >
                            <Maximize2 className="w-2 h-2 text-emerald-900 opacity-0 group-hover:opacity-100" />
                        </button>
                    </div>
                    <TerminalIcon className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs text-slate-400">{t('terminal_system_title') || 'System Terminal'}</span>
                    <button
                        onClick={() => setIsMinimized(false)}
                        className="ml-4 px-3 py-1 text-xs text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        {t('expand') || 'Expand'}
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed z-[100] bg-[#020617]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col font-mono transition-all duration-300 ${isMaximized ? 'inset-0 rounded-none' : 'inset-4 md:inset-10 lg:inset-20'
                }`}
        >
            {/* Terminal Header */}
            <div className="h-14 bg-white/5 border-b border-white/5 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <TerminalIcon className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('terminal_system_title') || 'System Terminal'}</span>
                    <div className="flex gap-2 ml-4">
                        {/* Close Button - Red */}
                        <button
                            onClick={onClose}
                            className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-400 border border-rose-600 transition-all hover:scale-110 group flex items-center justify-center"
                            title="Close (⌘Q)"
                        >
                            <X className="w-2 h-2 text-rose-900 opacity-0 group-hover:opacity-100" />
                        </button>
                        {/* Minimize Button - Yellow */}
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-400 border border-amber-600 transition-all hover:scale-110 group flex items-center justify-center"
                            title="Minimize (⌘M)"
                        >
                            <Minus className="w-2 h-2 text-amber-900 opacity-0 group-hover:opacity-100" />
                        </button>
                        {/* Maximize Button - Green */}
                        <button
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-400 border border-emerald-600 transition-all hover:scale-110 group flex items-center justify-center"
                            title={isMaximized ? "Exit Fullscreen (⌘F)" : "Fullscreen (⌘F)"}
                        >
                            {isMaximized ? (
                                <Minimize2 className="w-2 h-2 text-emerald-900 opacity-0 group-hover:opacity-100" />
                            ) : (
                                <Maximize2 className="w-2 h-2 text-emerald-900 opacity-0 group-hover:opacity-100" />
                            )}
                        </button>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Terminal Output */}
            <div
                ref={scrollRef}
                className="flex-1 p-6 overflow-y-auto space-y-2 custom-scrollbar"
            >
                {history.map((line, i) => (
                    <div key={i} className="flex gap-3">
                        {line.type === 'input' && <ChevronRight className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-1" />}
                        <pre className={`text-[13px] leading-relaxed whitespace-pre-wrap break-all ${line.type === 'input' ? 'text-white font-bold' :
                            line.type === 'error' ? 'text-rose-400' :
                                line.type === 'success' ? 'text-emerald-400' :
                                    'text-slate-400'
                            }`}>
                            {line.content}
                        </pre>
                    </div>
                ))}
                {history.length === 0 && (
                    <div className="text-[11px] text-slate-600 uppercase tracking-widest italic">Terminal cleared.</div>
                )}
            </div>

            {/* Terminal Input */}
            <form
                onSubmit={handleCommand}
                className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center gap-4"
            >
                <div className="flex items-center gap-2 text-indigo-400 ml-2">
                    <span className="text-[12px] font-black tracking-widest">root@savdoon:</span>
                    <span className="text-emerald-400 font-black">~</span>
                    <span className="text-white">$</span>
                </div>
                <input
                    autoFocus
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white font-mono text-[14px] p-0 placeholder:text-slate-700"
                    placeholder={t('terminal_placeholder') || 'Type a command...'}
                />
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-slate-500 border border-white/5">
                    <CornerDownLeft className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{t('enter') || 'Enter'}</span>
                </div>
            </form>
        </motion.div>
    );
}

