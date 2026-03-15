import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, Clock, Package, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { deliveryApi } from '../services/api';

interface DeliveryOption {
    type: string;
    name: string;
    name_ru?: string;
    name_en?: string;
    price: number;
    time: string;
    time_ru?: string;
    time_en?: string;
    address?: string;
}

interface DeliveryOptionsProps {
    storeId: number;
    onSelect: (option: DeliveryOption) => void;
    selectedType?: string;
    customerLat?: number;
    customerLng?: number;
}

export function DeliveryOptions({
    storeId,
    onSelect,
    selectedType,
    customerLat,
    customerLng
}: DeliveryOptionsProps) {
    const { language, formatPrice } = useApp();
    const [options, setOptions] = useState<DeliveryOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [distance, setDistance] = useState<number | null>(null);

    useEffect(() => {
        loadOptions();
    }, [storeId, customerLat, customerLng]);

    const loadOptions = async () => {
        setLoading(true);
        try {
            const response = await deliveryApi.getOptions(storeId, customerLat, customerLng);
            setOptions(response.data.options);
            setDistance(response.data.distance_km);
        } catch (err) {
            console.error('Failed to load delivery options:', err);
        }
        setLoading(false);
    };

    const getName = (option: DeliveryOption) => {
        if (language === 'ru' && option.name_ru) return option.name_ru;
        if (language === 'en' && option.name_en) return option.name_en;
        return option.name;
    };

    const getTime = (option: DeliveryOption) => {
        if (language === 'ru' && option.time_ru) return option.time_ru;
        if (language === 'en' && option.time_en) return option.time_en;
        return option.time;
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'pickup': return Package;
            case 'express': return Truck;
            case 'same_day': return Clock;
            default: return MapPin;
        }
    };

    const getColorClass = (type: string) => {
        switch (type) {
            case 'pickup': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'express': return 'bg-[var(--brand-secondary)]/20 text-[var(--brand-secondary)] border-[var(--brand-secondary)]/30';
            case 'same_day': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            default: return 'bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] border-[var(--brand-primary)]/30';
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {distance && (
                <p className="text-sm text-gray-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {language === 'uz' ? `Masofa: ${distance} km` :
                        language === 'ru' ? `Расстояние: ${distance} km` :
                            `Distance: ${distance} km`}
                </p>
            )}

            {options.map((option, index) => {
                const Icon = getIcon(option.type);
                const isSelected = selectedType === option.type;

                return (
                    <motion.div
                        key={option.type}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <button
                            onClick={() => onSelect(option)}
                            className={`w-full p-4 rounded-xl border transition-all text-left ${isSelected
                                ? 'bg-[var(--brand-primary)]/20 border-[var(--brand-primary)]/50 ring-2 ring-[var(--brand-primary)]/30'
                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${getColorClass(option.type)}`}>
                                    <Icon className="w-5 h-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-white">{getName(option)}</p>
                                        {isSelected && (
                                            <Check className="w-4 h-4 text-indigo-400" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {getTime(option)}
                                    </p>
                                    {option.address && (
                                        <p className="text-xs text-gray-500 mt-1 truncate">
                                            {option.address}
                                        </p>
                                    )}
                                </div>

                                <div className="text-right">
                                    {option.price === 0 ? (
                                        <span className="text-emerald-400 font-medium">
                                            {language === 'uz' ? "Bepul" :
                                                language === 'ru' ? "Бесплатно" : "Free"}
                                        </span>
                                    ) : (
                                        <span className="font-semibold text-white">
                                            {formatPrice(option.price)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    </motion.div>
                );
            })}
        </div>
    );
}
