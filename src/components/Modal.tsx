import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[999] bg-slate-950/40 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-white rounded-[48px] shadow-[0_60px_120px_-20px_rgba(0,0,0,0.3)] pointer-events-auto overflow-hidden relative border border-slate-100"
            >
              {/* Header */}
              {title && (
                <div className="px-12 py-10 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-3xl font-black text-slate-950 tracking-tighter uppercase font-heading leading-none">
                    {title}
                  </h3>
                  <button 
                    onClick={onClose}
                    className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-950 hover:bg-slate-100 transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              )}

              {/* Close Button if no title */}
              {!title && (
                <button 
                  onClick={onClose}
                  className="absolute top-8 right-8 w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-950 hover:bg-slate-100 transition-all z-10"
                >
                  <X size={24} />
                </button>
              )}

              {/* Content */}
              <div className="relative">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
