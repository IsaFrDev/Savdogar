import React from 'react';
import { motion } from 'framer-motion';

interface IPhone16FrameProps {
  children: React.ReactNode;
}

export function IPhone16Frame({ children }: IPhone16FrameProps) {
  return (
    <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[3.5rem] h-[800px] w-[380px] shadow-2xl overflow-hidden">
      {/* Volume Buttons */}
      <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
      <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
      {/* Power Button */}
      <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
      {/* Action Button */}
      <div className="h-[24px] w-[3px] bg-gray-800 absolute -left-[17px] top-[80px] rounded-l-lg"></div>

      {/* Screen Content */}
      <div className="rounded-[2.5rem] overflow-hidden w-full h-full bg-white relative">
        {/* Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-[20px] z-[60] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-blue-500/20 blur-[2px]"></div>
        </div>
        
        <div className="w-full h-full overflow-y-auto custom-scrollbar pt-12">
          {children}
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-[5px] bg-black/20 rounded-full z-[60]"></div>
      </div>
    </div>
  );
}
