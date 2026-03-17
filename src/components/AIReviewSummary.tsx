import React, { useState, useEffect } from 'react';
import { aiApi } from '../services/api';
import { Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AIReviewSummaryProps {
    productId: number;
    language: string;
}

export const AIReviewSummary: React.FC<AIReviewSummaryProps> = ({ productId, language }) => {
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { t } = useApp();

    const fetchSummary = async () => {
        if (!productId) return;
        setLoading(true);
        try {
            const response = await aiApi.getReviewSummary({ product: productId, language });
            setSummary(response.data.summary);
        } catch (error) {
            console.error('Failed to fetch AI review summary:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [productId, language]);

    if (loading) {
        return (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 animate-pulse flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-[var(--primary)] animate-spin" />
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">{t('aiAnalyzingReviews') || 'AI Analyzing...'}</span>
            </div>
        );
    }

    if (!summary) return null;

    return (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-transparent border border-[var(--primary)]/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                <Sparkles className="w-12 h-12 text-[var(--primary)]" />
            </div>

            <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)]">
                    <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.2em]">{t('aiReviewInsights') || 'AI Review Insights'}</h4>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed font-medium">
                {summary}
            </p>
        </div>
    );
};
