import React from 'react';


interface IPhone16FrameProps {
  children: React.ReactNode;
}

export function IPhone16Frame({ children }: IPhone16FrameProps) {
  return (
    <div className="relative mx-auto h-[820px] w-[390px] rounded-[3.5rem] shadow-2xl p-[2px] bg-gradient-to-br from-[#dcdcdf] via-[#c6c6c8] to-[#9a9a9d] ring-1 ring-black/10">
      
      {/* Action Button */}
      <div className="absolute top-[110px] -left-[3px] w-[3px] h-[26px] bg-gradient-to-r from-[#8e8e92] to-[#c6c6c8] rounded-l-md shadow-sm border border-black/20 border-r-0"></div>
      
      {/* Volume Up */}
      <div className="absolute top-[165px] -left-[3px] w-[3px] h-[60px] bg-gradient-to-r from-[#8e8e92] to-[#c6c6c8] rounded-l-md shadow-sm border border-black/20 border-r-0"></div>
      
      {/* Volume Down */}
      <div className="absolute top-[240px] -left-[3px] w-[3px] h-[60px] bg-gradient-to-r from-[#8e8e92] to-[#c6c6c8] rounded-l-md shadow-sm border border-black/20 border-r-0"></div>

      {/* Power Button */}
      <div className="absolute top-[180px] -right-[3px] w-[3px] h-[95px] bg-gradient-to-l from-[#8e8e92] to-[#c6c6c8] rounded-r-md shadow-sm border border-black/20 border-l-0"></div>

      {/* Inner Black Bezel */}
      <div className="relative h-full w-full rounded-[3.4rem] bg-black p-[6px] shadow-inner overflow-hidden flex flex-col justify-center items-center">
        
        {/* Anti-aliasing corner fix */}
        <div className="absolute inset-0 rounded-[3.4rem] ring-1 ring-white/5 pointer-events-none"></div>

        {/* The Actual Screen */}
        <div className="relative h-full w-full rounded-[3.1rem] bg-white overflow-hidden shadow-sm">
            
          {/* Dynamic Island */}
          <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[122px] h-[36px] bg-black rounded-[20px] z-[60] flex items-center justify-between px-3 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
             {/* Left Camera/Sensors */}
             <div className="w-3 h-3 rounded-full bg-[#111] border border-white/5 relative">
                 <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-[1px]"></div>
             </div>
             {/* Main Camera */}
             <div className="w-3 h-3 rounded-full bg-[#0a0a0a] border border-white/10 relative overflow-hidden">
                 <div className="absolute top-[2px] right-[2px] w-[2px] h-[2px] rounded-full bg-white/40 blur-[0.5px]"></div>
             </div>
          </div>
          
          {/* Status Bar Content (Time, Battery, Signal) - Optional but adds realism */}
          <div className="absolute top-[15px] inset-x-0 px-8 flex justify-between items-center text-black z-[50] text-[13px] font-semibold tracking-tighter">
              <span>9:41</span>
              <div className="flex items-center gap-1 opacity-80">
                 {/* Cellular */}
                 <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18h2V6H4v12zm4 0h2v-8H8v8zm4 0h2v-5h-2v5zm4 0h2V3h-2v15z"/></svg>
                 {/* Wifi */}
                 <svg className="w-4 h-4 ml-[-2px]" viewBox="0 0 16 16" fill="currentColor"><path d="M8 12.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-4.7-2.8a.5.5 0 01.7-.7 5.5 5.5 0 018 0 .5.5 0 01-.7.7 4.5 4.5 0 00-6.6 0zM1.4 7a.5.5 0 01.7-.7 8.5 8.5 0 0111.8 0 .5.5 0 01-.7.7 7.5 7.5 0 00-10.4 0zm-2.8-2.8a.5.5 0 01.7-.7 11.5 11.5 0 0116.2 0 .5.5 0 01-.7.7 10.5 10.5 0 00-14.8 0z"/></svg>
                 {/* Battery */}
                 <div className="w-6 h-3 rounded-[4px] border border-black p-[1px] relative ml-1">
                    <div className="w-full h-full bg-black rounded-[2px]"></div>
                    <div className="absolute right-[-2.5px] top-[3.5px] w-[1.5px] h-[3px] bg-black bg-opacity-70 rounded-r-sm"></div>
                 </div>
              </div>
          </div>

          <div className="w-full h-full overflow-y-auto custom-scrollbar pt-14 pb-8">
            {children}
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[130px] h-[5px] bg-black rounded-full z-[60] shadow-[0_1px_3px_rgba(255,255,255,0.3)]"></div>
        </div>
      </div>
    </div>
  );
}
