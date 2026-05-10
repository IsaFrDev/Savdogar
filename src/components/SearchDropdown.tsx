import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, PackageSearch, ChevronRight } from 'lucide-react';
import { getMediaUrl } from '../utils/media';
import { useApp } from '../context/AppContext';

interface SearchDropdownProps {
  show: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  recentSearches: string[];
  setRecentSearches: (searches: string[]) => void;
  products: any[];
  setSelectedProduct: (product: any) => void;
  setShowSearchDropdown: (show: boolean) => void;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  show,
  searchQuery,
  setSearchQuery,
  recentSearches,
  setRecentSearches,
  products,
  setSelectedProduct,
  setShowSearchDropdown,
}) => {
  const { ln } = useApp();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[150]"
        >
          <div className="p-4 border-b border-slate-50 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {searchQuery ? 'Qidiruv natijalari' : 'Oxirgi qidiruvlar'}
            </span>
            {!searchQuery && recentSearches.length > 0 && (
              <button
                onClick={() => {
                  setRecentSearches([]);
                  localStorage.removeItem('recentSearches');
                }}
                className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
              >
                Tozalash
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {!searchQuery ? (
              recentSearches.length > 0 ? (
                <div className="p-2">
                  {recentSearches.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setSearchQuery(s)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-sm font-bold text-slate-700 group transition-all"
                    >
                      <Clock size={16} className="text-slate-300 group-hover:text-indigo-500" />
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Search className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-xs font-bold text-slate-400">Hech nima qidirilmadi</p>
                </div>
              )
            ) : (
              <div className="p-2 space-y-1">
                {products
                  .filter((p) => ln(p, 'name').toLowerCase().includes(searchQuery.toLowerCase()))
                  .slice(0, 6)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProduct(p);
                        setShowSearchDropdown(false);
                        if (!recentSearches.includes(searchQuery)) {
                          const newRecent = [searchQuery, ...recentSearches.slice(0, 4)];
                          setRecentSearches(newRecent);
                          localStorage.setItem('recentSearches', JSON.stringify(newRecent));
                        }
                      }}
                      className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50 group transition-all text-left"
                    >
                      <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                        {p.images?.[0] ? (
                          <img src={getMediaUrl(p.images[0].image)} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-200" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">
                          {ln(p, 'name')}
                        </h4>
                        <p className="text-xs font-bold text-indigo-500">{p.price.toLocaleString()} UZS</p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"
                      />
                    </button>
                  ))}
                {products.filter((p) => ln(p, 'name').toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="p-12 text-center">
                    <PackageSearch className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-xs font-bold text-slate-400">Mahsulot topilmadi</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
