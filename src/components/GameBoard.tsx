import React, { useMemo, useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BoardCell, Player, PropertyGroup } from '../types';
import { PROPERTY_GROUP_COLORS } from '../data/boardData';
import { Anchor, Skull, Compass, Coins, House, Shield, Siren, BookOpen, Scroll, X } from 'lucide-react';
import pirateBoardCenter from '../assets/images/pirate_board_center_1779246629628.png';

interface GameBoardProps {
  cells: BoardCell[];
  players: Player[];
  activePlayerId: number;
  onCellClick: (cell: BoardCell) => void;
  accumulatedTax: number;
  dice: [number, number];
  isRolling: boolean;
  rollDice: () => void;
}

// Map cell ID to CSS Grid row/col coordinates (1-indexed for CSS Grid)
export const getGridCoords = (id: number): { row: number; col: number } => {
  // Bottom Row (Right to Left): 0 -> 10
  if (id >= 0 && id <= 10) {
    return { row: 11, col: 11 - id };
  }
  // Left Column (Bottom to Top): 11 -> 20
  if (id >= 11 && id <= 20) {
    return { row: 11 - (id - 10), col: 1 };
  }
  // Top Row (Left to Right): 21 -> 30
  if (id >= 21 && id <= 30) {
    return { row: 1, col: id - 19 };
  }
  // Right Column (Top to Bottom): 31 -> 39
  return { row: id - 29, col: 11 };
};

export const GameBoard: React.FC<GameBoardProps> = ({
  cells,
  players,
  activePlayerId,
  onCellClick,
  accumulatedTax,
  dice,
  isRolling,
  rollDice,
}) => {
  const [showRuleBook, setShowRuleBook] = useState(false);
  const [activeRuleTab, setActiveRuleTab] = useState<'start' | 'buy' | 'rent' | 'jail' | 'cards' | 'win'>('start');

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    const updateScale = () => {
      const parent = containerRef.current;
      if (!parent) return;
      const width = parent.getBoundingClientRect().width;
      const baseWidth = 820;
      if (width < baseWidth) {
        setScale(width / baseWidth);
      } else {
        setScale(1);
      }
    };

    updateScale();

    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Find which players are on a specific cell
  const getPlayersOnCell = (cellId: number) => {
    return players.filter((p) => p.position === cellId && !p.isBankrupt);
  };

  const renderDiceFace = (val: number) => {
    const dots: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    return (
      <div className="w-9 h-9 bg-[#f4efe8] rounded-md border border-[#1a120b] shadow flex items-center justify-center p-1.5 relative select-none">
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full gap-0.5">
          {Array.from({ length: 9 }).map((_, idx) => {
            const hasDot = dots[val]?.includes(idx);
            return (
              <div key={idx} className="flex items-center justify-center">
                {hasDot && (
                  <div className="w-1.5 h-1.5 bg-[#1a120b] rounded-full shadow-inner" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const activePlayer = players.find(p => p.id === activePlayerId);
  const hasRolled = dice[0] !== 0;
  const canRoll = activePlayer && !activePlayer.isBankrupt && !hasRolled && !isRolling && !activePlayer.isAI;

  const getCellCornerLabel = (id: number): { title: string; subtitle: string; color: string; textColor: string; icon: React.ReactNode } | null => {
    switch (id) {
      case 0:
        return {
          title: "SET SAIL",
          subtitle: "COLLECT 200 GOLD",
          color: "bg-[#d4c19c] border-[#1a120b]",
          textColor: "text-[#a31a1a]",
          icon: <Anchor className="w-10 h-10 text-[#a31a1a] animate-pulse" />,
        };
      case 10:
        return {
          title: "IN THE BRIG",
          subtitle: "JUST VISITING",
          color: "bg-[#d4c19c] border-[#1a120b]",
          textColor: "text-[#1a120b]",
          icon: <Skull className="w-9 h-9 text-[#800000]" />,
        };
      case 20:
        return {
          title: "FREE ANCHORAGE",
          subtitle: "DESERT ISLAND",
          color: "bg-[#d4c19c] border-[#1a120b]",
          textColor: "text-[#1b4d3e]",
          icon: <Compass className="w-9 h-9 text-[#1b4d3e] rotate-animation" />,
        };
      case 30:
        return {
          title: "GO TO PLANK",
          subtitle: "DEATH PENALTY",
          color: "bg-[#d4c19c] border-[#1a120b]",
          textColor: "text-[#a31a1a]",
          icon: <Siren className="w-9 h-9 text-[#a31a1a] animate-ping duration-1000" />,
        };
      default:
        return null;
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full max-w-[820px] mx-auto relative flex justify-center items-start overflow-visible transition-all duration-100"
      style={{ height: `${820 * scale}px` }}
    >
      <div 
        id="pirate-monopoly-board-container" 
        className="absolute top-0 select-none w-[820px] h-[820px] bg-[#2a1a10] p-2 shadow-[0_0_80px_rgba(0,0,0,0.85)] rounded-sm border-4 border-[#3d2b1f] shrink-0"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
      {/* Wooden Framing Overlay Details */}
      <div className="absolute inset-0 border border-[#ab8e66]/10 rounded-sm pointer-events-none" />
      <div className="absolute top-1 left-1 bottom-1 right-1 border-2 border-dashed border-[#1a120b]/25 rounded-sm pointer-events-none" />

      {/* 11x11 Grid Board */}
      <div className="grid grid-cols-11 grid-rows-11 w-full h-full gap-[2px] relative bg-[#1a120b] overflow-hidden rounded-sm border-2 border-[#1a120b]">
        
        {/* CENTER ELEMENT (Renders Central Visual Area) */}
        <div className="col-start-2 col-end-11 row-start-2 row-end-11 bg-[#c1ab7b] border-[1px] border-[#1a120b] relative overflow-hidden flex flex-col items-center justify-between p-4">
          
          {/* AI Generated Vintage Sea Illustration Backdrop */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 mix-blend-multiply transition-opacity duration-700">
            <img 
              src={pirateBoardCenter} 
              alt="Pirate Ocean Map Centerpiece" 
              className="w-full h-full object-cover scale-105 filter sepia contrast-125"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Concentric compass circles matching the mock design */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none z-0">
            <div className="w-[85%] h-[85%] border-4 border-[#8b7355] rounded-full flex items-center justify-center">
              <div className="w-[88%] h-[88%] border border-[#8b7355] rounded-full flex items-center justify-center">
                <span className="text-8xl opacity-40">🧭</span>
              </div>
            </div>
          </div>

          <div className="absolute top-8 right-8 text-4xl opacity-20 z-0">⛵</div>
          <div className="absolute bottom-8 left-8 text-4xl opacity-20 z-0">🦑</div>

          {/* Golden Old Map Compass Graticulates Decors */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(42,26,16,0.15)_0%,transparent_75%)] pointer-events-none z-10" />

          {/* Top Title Banner */}
          <div className="z-10 text-center select-none pt-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2a1a10] rounded-sm border border-[#d4c19c]/30 mb-2 shadow">
              <Skull className="w-4 h-4 text-[#d4c19c]" />
              <span className="text-[10px] font-serif font-bold tracking-widest text-[#d4c19c] uppercase">PREMIUM HARBOUR EDITION</span>
            </div>
            
            <div className="relative mt-2">
              <div className="text-[10px] tracking-[0.4em] text-[#5d4037] font-bold mb-[-10px] font-sans">THE LEGEND OF</div>
              <h1 className="text-6xl font-black text-[#1a120b] italic tracking-tight font-serif mt-2" style={{ textShadow: '2px 2px 0px #b8860b' }}>
                PIRATE
              </h1>
              <h1 className="text-4xl font-black text-[#1a120b] tracking-[0.2em] font-sans uppercase mt-[-5px]">
                MONOPOLY
              </h1>
            </div>
          </div>

          {/* Side-by-side: Nassau Plunder, Captain's Logbook, & Interactive Dice */}
          <div className="z-10 flex flex-row items-center justify-center gap-2.5 my-auto w-full px-1">
            
            {/* Nassau Free Port accumulated chest inside center */}
            <div className="flex flex-col items-center justify-center p-2 rounded-sm bg-[#d4c19c] border-2 border-[#1a120b] w-[130px] h-[108px] text-center shadow-md">
              <Coins className="w-4.5 h-4.5 text-[#804000] mb-0.5 animate-bounce" />
              <span className="text-[8px] font-serif uppercase tracking-wider text-[#1a120b] font-bold leading-tight">Uang Nassau</span>
              <div className="text-sm font-bold text-[#800000] mt-0.5">{accumulatedTax} <span className="text-[10px] font-serif text-[#1a120b]">Gold</span></div>
              <p className="text-[7px] text-[#5d4037] italic mt-0.5 leading-tight">Singgah di anchorage!</p>
            </div>

            {/* Captain's logbook rule book button */}
            <button
              onClick={() => {
                setShowRuleBook(true);
              }}
              className="flex flex-col items-center justify-between p-2 rounded-sm bg-gradient-to-b from-[#5c1c1c] to-[#2d0a0a] border-2 border-[#d4c19c] w-[130px] h-[108px] text-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer relative group"
            >
              {/* Gold corners decorations */}
              <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t border-l border-[#d4c19c]/60" />
              <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border-t border-r border-[#d4c19c]/60" />
              <div className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-b border-l border-[#d4c19c]/60" />
              <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b border-r border-[#d4c19c]/60" />

              <span className="text-[8px] font-serif uppercase tracking-widest text-amber-400 font-bold leading-none">
                BUKU ATURAN
              </span>
              
              <div className="my-1.5 transform group-hover:rotate-6 transition-transform">
                <BookOpen className="w-7 h-7 text-[#d4c19c] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
              </div>

              <div className="text-[7.5px] font-sans font-black bg-amber-400 text-stone-950 px-1 py-0.5 rounded shadow-sm hover:bg-amber-300 transition-colors">
                BACA JURNAL
              </div>
            </button>

            {/* Interactive Monopoly Dice */}
            <button
              onClick={() => {
                if (canRoll) {
                  rollDice();
                }
              }}
              disabled={!canRoll}
              className={`flex flex-col items-center justify-between p-2 rounded-sm bg-[#d4c19c] border-2 border-[#1a120b] w-[130px] h-[108px] text-center shadow-md transition-all relative ${
                canRoll 
                  ? 'hover:bg-[#c9b48c] hover:scale-105 cursor-pointer border-[#8b0000]' 
                  : 'cursor-default'
              }`}
            >
              <span className="text-[8px] font-serif uppercase tracking-wider text-[#1a120b] font-bold leading-tight truncate max-w-full">
                {activePlayer?.isAI ? `${activePlayer.name}` : "Kemudi Dadu"}
              </span>

              <div className="flex items-center gap-1 my-0.5">
                <AnimatePresence mode="popLayout">
                  {isRolling ? (
                    <motion.div
                      key="rolling-inner"
                      animate={{ rotate: [0, -25, 25, -15, 15, 0], scale: [1, 1.12, 0.9, 1.05, 1] }}
                      transition={{ duration: 0.6, repeat: 1 }}
                      className="flex gap-1"
                    >
                      {renderDiceFace(Math.floor(Math.random() * 6) + 1)}
                      {renderDiceFace(Math.floor(Math.random() * 6) + 1)}
                    </motion.div>
                  ) : (
                    <div className="flex gap-1">
                      {renderDiceFace(dice[0] || 1)}
                      {renderDiceFace(dice[1] || 1)}
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status and Total */}
              <div className="font-sans leading-none">
                {isRolling ? (
                  <span className="text-[7.5px] text-[#800000] font-bold animate-pulse">MEMUTAR...</span>
                ) : dice[0] !== 0 ? (
                  <div className="flex items-center justify-center gap-0.5">
                    <span className="text-[7px] text-[#5d4037] font-bold">Langkah:</span>
                    <span className="text-xs font-black text-[#800000]">{dice[0] + dice[1]}</span>
                  </div>
                ) : canRoll ? (
                  <span className="text-[7.5px] text-[#1b4d3e] font-black tracking-wider animate-pulse block">
                    TEKAN KOCOK!
                  </span>
                ) : (
                  <span className="text-[7px] text-[#5d4037] italic">Tunggu Giliran</span>
                )}
              </div>

              {/* Little interactive glow */}
              {canRoll && (
                <div className="absolute -inset-0.5 rounded-sm border-2 border-emerald-600 animate-pulse pointer-events-none" />
              )}
            </button>

          </div>

          {/* Elegant instructions overlay footer inside board */}
          <div className="z-10 w-full text-center pb-1.5 select-none">
            <p className="text-[8.5px] font-serif text-[#5d4037] font-bold uppercase tracking-widest leading-none">
              KEMUDI TAKDIR DI TANGAN KAPTEN • 🏴‍☠️
            </p>
          </div>

        </div>

        {/* ========================================================== */}
        {/* IMMERSIVE PIRATE CAPTAIN'S LOGBOOK RULES OVERLAY MODAL     */}
        {/* ========================================================== */}
        <AnimatePresence>
          {showRuleBook && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-[#090604]/96 flex flex-col justify-between p-3"
            >
              {/* Background ancient map parchment watermark decoration */}
              <div className="absolute inset-0 opacity-[0.07] pointer-events-none z-0">
                <img 
                  src={pirateBoardCenter} 
                  alt="Ancient Map background inside rules book" 
                  className="w-full h-full object-cover filter contrast-200 brightness-50"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Wooden Leather Binder Styling Wrapper */}
              <div className="relative flex-1 bg-gradient-to-b from-[#2e1a0c] to-[#1a0f07] border-4 border-[#8b5a2b] rounded shadow-2xl flex flex-col overflow-hidden z-10">
                
                {/* Gold binder ornaments */}
                <div className="absolute top-1 left-1 bottom-1 right-1 border border-dashed border-[#d4c19c]/15 pointer-events-none" />

                {/* Leather Spine Header */}
                <div className="bg-[#4d1010] border-b-2 border-[#1a120b] px-3.5 py-2 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2">
                    <Scroll className="w-5 h-5 text-amber-400 animate-pulse" />
                    <div>
                      <h2 className="text-sm font-serif font-black text-amber-400 uppercase tracking-widest leading-none">
                        JURNAL ATURAN SAMUDRA
                      </h2>
                      <span className="text-[8px] font-sans font-bold text-[#d4c19c]/70 uppercase tracking-wider block mt-0.5">
                        Kitab Panduan & Hukum Pelayaran Bajak Laut Nassau
                      </span>
                    </div>
                  </div>
                  
                  {/* Close button with high feedback */}
                  <button
                    onClick={() => {
                      setShowRuleBook(false);
                    }}
                    className="p-1 px-2.5 bg-[#1a0f07] hover:bg-stone-900 text-amber-100 hover:text-amber-400 border border-[#8b5a2b]/60 rounded-sm text-[10px] font-sans font-black flex items-center gap-1 transition-all cursor-pointer select-none"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>TUTUP KITAB</span>
                  </button>
                </div>

                {/* Inside Pages Row - Dual Section (Chapters Tab list vs Parchment Information Area) */}
                <div className="flex-1 flex min-h-0 bg-[#25160b]">
                  
                  {/* Left Column: Wood-grain Chapter Menu selector */}
                  <div className="w-[185px] bg-[#1a1006] border-r border-[#3d2b1f] p-2 flex flex-col gap-1.5 overflow-y-auto">
                    <span className="text-[8px] font-sans font-black text-[#d4c19c]/50 uppercase tracking-widest px-1 mb-1 block">
                      Daftar Bab Kitab:
                    </span>

                    {[
                      { id: 'start', label: '📖 Cara Memulai', color: 'border-l-rose-500' },
                      { id: 'buy', label: '🏝️ Klaim Wilayah', color: 'border-l-amber-500' },
                      { id: 'rent', label: '💰 Upeti Tambat', color: 'border-l-emerald-500' },
                      { id: 'jail', label: '⛓️ Jeruji Davy Jones', color: 'border-l-slate-400' },
                      { id: 'cards', label: '🔮 Kartu Kesempatan', color: 'border-l-purple-500' },
                      { id: 'win', label: '🏆 Gelar Penguasa', color: 'border-l-yellow-400' }
                    ].map((tab) => {
                      const isActive = activeRuleTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveRuleTab(tab.id as any);
                          }}
                          className={`text-left px-2.5 py-2 border-l-4 text-[10px] font-semibold leading-tight rounded-sm transition-all text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer select-none ${
                            isActive
                              ? `bg-[#4d1010] text-amber-200 border-l-[#d4c19c] font-black shadow-inner`
                              : `bg-stone-950/25 text-stone-300 border-l-[#3a2211] hover:bg-stone-900/40 hover:text-[#f4efe8]`
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}

                    <div className="mt-auto p-1.5 bg-[#0e0904] rounded border border-[#3d2b1f]/20 text-center select-none">
                      <p className="text-[7.5px] italic text-[#d4c19c]/40 font-sans leading-tight">
                        "Hukum bajak laut hanyalah pedoman, bukan perintah suci."
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Beautiful Old Vintage Yellowed Parchment Detail Page */}
                  <div className="flex-1 bg-[#f4ebd0] p-4 text-[#1a120b] overflow-y-auto relative flex flex-col justify-between">
                    
                    {/* Retro Corner lines */}
                    <div className="absolute top-2 left-2 right-2 bottom-2 border border-[#8b5a2b]/15 pointer-events-none" />

                    <div>
                      {/* Interactive rule content rendering block */}
                      {activeRuleTab === 'start' && (
                        <div className="font-serif animate-fadeIn">
                          <h3 className="text-sm font-black text-[#5c1a1a] uppercase border-b border-[#2d0a0a]/20 pb-1 mb-2">
                            ⚓ CARA MEMULAI PERMAINAN
                          </h3>
                          <p className="text-[11px] leading-relaxed mb-2.5">
                            Sebelum pelayaran dimulai, para nakhoda bajak laut berkumpul di lobby utama untuk menentukan armada.
                          </p>
                          <ul className="text-[10px] space-y-2 list-none text-[#2a1b11]">
                            <li className="flex gap-1.5 items-start">
                              <span className="text-amber-800 shrink-0 font-bold">•</span>
                              <span>Pemain manusia dapat memilih **Karakter Bajak Laut** pribadinya di slot pertama, lalu menyusun bot saingan (1 hingga 3 lawan gratis).</span>
                            </li>
                            <li className="flex gap-1.5 items-start">
                              <span className="text-amber-800 shrink-0 font-bold">•</span>
                              <span>Tentukan **Koin Emas Awal** (Default: 1,500 G) dan status preferensi audio yang diinginkan awak.</span>
                            </li>
                            <li className="flex gap-1.5 items-start">
                              <span className="text-amber-800 shrink-0 font-bold">•</span>
                              <span>Pelayaran dilakukan bergiliran searah jarum jam, dikomandoi oleh gulungan mata dadu di bagian bawah.</span>
                            </li>
                            <li className="flex gap-1.5 items-start">
                              <span className="text-amber-800 shrink-0 font-bold">💎</span>
                              <span>Setiap kali kapal berhasil melewati garis **START**, kapten secara otomatis menerima upeti pelayaran sebesar **40 emas** langsung dicairkan ke saldo peti harta!</span>
                            </li>
                          </ul>
                        </div>
                      )}

                      {activeRuleTab === 'buy' && (
                        <div className="font-serif animate-fadeIn">
                          <h3 className="text-sm font-black text-[#5c1a1a] uppercase border-b border-[#2d0a0a]/20 pb-1 mb-2">
                            🏝️ ATURAN MEMBELI WILAYAH
                          </h3>
                          <p className="text-[11px] leading-relaxed mb-2.5">
                            Menancapkan kekuasaan di setiap pantai dan gugusan teluk di samudra Nassau sangat krusial.
                          </p>
                          <ul className="text-[10px] space-y-2 list-none text-[#2a1b11]">
                            <li className="flex gap-1.5 items-start">
                              <span className="text-red-700 shrink-0 font-bold">⚠️</span>
                              <span className="font-bold text-red-950">Syarat Keliling Start: Kapten wajib berlayar keliling dan melewati garis START minimal 1 kali sebelum boleh membeli properti atau mengklaim tanah apa pun!</span>
                            </li>
                            <li className="flex gap-1.5 items-start">
                              <span className="text-amber-800 shrink-0 font-bold">•</span>
                              <span>Kapal bersandar di pantai tak bertuan berhak **mengklaim daerah tersebut** dengan menyetor upeti emas perdana tertera.</span>
                            </li>
                            <li className="flex gap-1.5 items-start">
                              <span className="text-amber-800 shrink-0 font-bold">•</span>
                              <span>Jika berhasil memonopoli **Seluruh kelompok pantai warna laut sejenis**, tarif sewa akan berlipat ganda!</span>
                            </li>
                            <li className="flex gap-1.5 items-start">
                              <span className="text-amber-800 shrink-0 font-bold">•</span>
                              <span>Monopoli kelompok warna memberikan wewenang mutlak untuk **mendirikan bangunan Kabin Awak** di pantai kekuasaan Anda secara langsung berbayar.</span>
                            </li>
                          </ul>
                        </div>
                      )}

                      {activeRuleTab === 'rent' && (
                        <div className="font-serif animate-fadeIn">
                          <h3 className="text-sm font-black text-[#5c1a1a] uppercase border-b border-[#2d0a0a]/20 pb-1 mb-2">
                            💰 SISTEM PEMBAYARAN SEWA
                          </h3>
                          <p className="text-[11px] leading-relaxed mb-2.5">
                            Setiap nakhoda saing yang numpang berlabuh di teritori Anda harus membayar upeti tambat pelayaran!
                          </p>
                          <ul className="text-[10px] space-y-2 list-none text-[#2a1b11]">
                            <li className="flex gap-1.5 items-start">
                              <span className="text-amber-800 shrink-0 font-bold">•</span>
                              <span>Nilai upeti sewa bervariasi bergantung seberapa mewah pelabuhan tersebut didirikan pondokan (1 hingga 4 kabin).</span>
                            </li>
                            <li className="flex gap-1.5 items-start">
                              <span className="text-amber-800 shrink-0 font-bold">•</span>
                              <span>Kabin kelima mengintegrasikan pelabuhan menjadi **Benteng Utama**, meningkatkan tagihan sewa ke titik maksimal!</span>
                            </li>
                            <li className="flex gap-1.5 items-start">
                              <span className="text-amber-800 shrink-0 font-bold">•</span>
                              <span>Gugusan utilitas **Kedai Layanan Laut** menuntut denda upeti sesuai perkalian jumlah angka mata dadu kemudi saat disinggahi.</span>
                            </li>
                          </ul>
                        </div>
                      )}

                      {activeRuleTab === 'jail' && (
                        <div className="font-serif animate-fadeIn">
                          <h3 className="text-sm font-black text-[#5c1a1a] uppercase border-b border-[#2d0a0a]/20 pb-1 mb-2">
                            ⛓️ ATURAN JERUJI Davy Jones
                          </h3>
                          <p className="text-[11px] leading-relaxed mb-2.5">
                            Melanggar kesepakatan komando atau tersandung denda tak sengaja akan menyeret kapal ke Jeruji Davy Jones.
                          </p>
                          <ul className="text-[10px] space-y-2 list-none text-[#2a1b11]">
                            <li className="flex gap-1.5 items-start">
                              <span className="text-amber-800 shrink-0 font-bold">•</span>
                              <span>Selama terkurung dalam masa hukuman (maksimal 3 putaran), kapal tidak diperbolehkan berlayar bebas secara normal.</span>
                            </li>
                            <li className="flex gap-1.5 items-start">
                              <span className="text-amber-800 shrink-0 font-bold">•</span>
                              <span>**Tiga cara bebas:** Melempar angka dadu kembar, menyerahkan Piagam Bebas Kramat yang langka, atau menyogok sipir laut sebesar 150 koin emas.</span>
                            </li>
                          </ul>
                        </div>
                      )}

                      {activeRuleTab === 'cards' && (
                        <div className="font-serif animate-fadeIn">
                          <h3 className="text-sm font-black text-[#5c1a1a] uppercase border-b border-[#2d0a0a]/20 pb-1 mb-2">
                            🔮 GULUNGAN KESEMPATAN TAKDIR
                          </h3>
                          <p className="text-[11px] leading-relaxed mb-2.5">
                            Berlabuh di petak gulungan magis memicu pembacaan wahyu samudra tak terduga.
                          </p>
                          <ul className="text-[10px] space-y-2 list-none text-[#2a1b11]">
                            <li className="flex gap-1.5 items-start">
                              <span className="text-amber-800 shrink-0 font-bold">•</span>
                              <span>**Peti Harta:** Kumpulan kartu berisikan keberuntungan instan, kado dewi laut, upeti balik pelindung, ataupun komisi dagang denda.</span>
                            </li>
                            <li className="flex gap-1.5 items-start">
                              <span className="text-amber-800 shrink-0 font-bold">•</span>
                              <span>**Gulungan Takdir:** Kejutan tak terduga yang berpeluang mengirimkan hembusan angin gratis relokasi kapal, atau badai denda bea cukai menyakitkan.</span>
                            </li>
                          </ul>
                        </div>
                      )}

                      {activeRuleTab === 'win' && (
                        <div className="font-serif animate-fadeIn">
                          <h3 className="text-sm font-black text-[#5c1a1a] uppercase border-b border-[#2d0a0a]/20 pb-1 mb-2">
                            🏆 GELAR REZIM TUNGGAL SAMUDRA nassau
                          </h3>
                          <p className="text-[11px] leading-relaxed mb-2.5">
                            Monopoli total dan kesabaran kapten mengelola investasi kapal bajak laut adalah tumpuan kemenangan sejati!
                          </p>
                          <ul className="text-[10px] space-y-2 list-none text-[#2a1b11]">
                            <li className="flex gap-1.5 items-start">
                              <span className="text-amber-800 shrink-0 font-bold">•</span>
                              <span>Kapten memenangkan kejayaan samudra tatkala seluruh nakhoda rival lain jatuh bangkrut karena krisis emas modal dagang.</span>
                            </li>
                            <li className="flex gap-1.5 items-start">
                              <span className="text-amber-800 shrink-0 font-bold">•</span>
                              <span>Harta Nassau paling menumpuk dinobatkan kepada kapten tangguh pelayar terakhir yang mampir ke pelabuhan!</span>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Footer logbook signature */}
                    <div className="mt-4 border-t border-[#8b5a2b]/20 pt-2 flex justify-between items-center text-[8px] font-sans font-bold text-amber-900 select-none">
                      <span>KITAB KAPTEN BAJAK LAUT</span>
                      <span>PREMIUM HARBOUR • EDISI I</span>
                    </div>

                  </div>

                </div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>


        {/* 40 GRID TILES */}
        {cells.map((cell) => {
          const coords = getGridCoords(cell.id);
          const playersOnCell = getPlayersOnCell(cell.id);
          const isCorner = cell.type === 'start' || cell.type === 'jail' || cell.type === 'parking' || cell.type === 'gotojail';
          const cornerData = getCellCornerLabel(cell.id);

          // Find owner info if property
          const ownerColor = cell.ownerId !== null && cell.ownerId !== undefined && cell.ownerId >= 1
            ? players.find(p => p.id === cell.ownerId)?.color
            : null;

          return (
            <button
              key={cell.id}
              onClick={() => onCellClick(cell)}
              className={`group flex flex-col h-full w-full justify-between relative border text-left cursor-pointer transition-all duration-300 select-none overflow-hidden ${
                isCorner 
                  ? `border-[#1a120b] p-2 z-10 font-serif` 
                  : `bg-[#d4c19c] border-[#1a120b] hover:bg-[#c9b48c] p-1 text-[#1a120b]`
              }`}
              style={{
                gridRow: coords.row,
                gridColumn: coords.col,
                backgroundColor: isCorner ? '#d4c19c' : undefined,
                borderColor: '#1a120b'
              }}
            >
              {/* Corner Render Block */}
              {isCorner && cornerData ? (
                <div className="flex flex-col h-full w-full justify-between items-center text-center">
                  <span className={`text-[9px] font-black tracking-wider leading-tight font-serif uppercase ${cornerData.textColor || 'text-[#1a120b]'}`}>
                    {cornerData.title}
                  </span>
                  
                  <div className="my-auto scale-90 filter drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                    {cornerData.icon}
                  </div>

                  <span className="text-[7.5px] font-serif font-bold text-[#5d4037] leading-tight uppercase">
                    {cornerData.subtitle}
                  </span>
                </div>
              ) : (
                /* Regular Edge Property Render Block */
                <div className="flex flex-col h-full w-full justify-between font-serif">
                  
                  {/* Top Header Ribbon based on group group */}
                  {cell.group && cell.group !== 'port' && cell.group !== 'service' ? (
                    <div className="w-full h-3 border-b border-[#1a120b]/60 relative" style={{ backgroundColor: PROPERTY_GROUP_COLORS[cell.group] || '#ccc' }} />
                  ) : null}

                  {/* Icon replacement if utility or station */}
                  {cell.type === 'railroad' && (
                    <div className="w-full bg-[#1b4d3e]/20 py-0.5 text-center text-[7px] text-[#1b4d3e] font-sans tracking-wider font-bold uppercase border-b border-[#1a120b]/20">
                      PELABUHAN
                    </div>
                  )}
                  {cell.type === 'utility' && (
                    <div className="w-full bg-[#804000]/10 py-0.5 text-center text-[7px] text-[#804000] font-sans tracking-wider font-bold uppercase border-b border-[#1a120b]/20">
                      KEDAI LAUT
                    </div>
                  )}
                  {cell.type === 'tax' && (
                    <div className="w-full bg-[#a31a1a]/15 py-0.5 text-center text-[7px] text-[#a31a1a] font-sans tracking-wider font-bold uppercase border-b border-[#1a120b]/20">
                      UPETI LAUT
                    </div>
                  )}

                  {/* Middle Section (House counts or names) */}
                  <div className="px-0.5 py-0.5 flex flex-col flex-1 justify-between">
                    
                    {/* Property / Island Name */}
                    <div className="leading-none text-[8.5px] font-bold text-[#1a120b] tracking-tight hover:text-[#3d2b1f] line-clamp-2 uppercase">
                      {cell.indonesianName}
                    </div>

                    {/* Cabins (Houses) visual indicator */}
                    {cell.cabins > 0 && cell.ownerId !== null && (
                      <div className="flex gap-0.5 items-center mt-1 bg-[#1a120b]/10 px-1 py-0.5 rounded w-max border border-[#1a120b]/20">
                        {cell.cabins === 5 ? (
                          // Fortress
                          <div className="flex items-center gap-0.5 text-[6.5px] text-[#a31a1a] font-sans font-black">
                            <Shield className="w-2.5 h-2.5 text-[#a31a1a]" />
                            <span>BENTENG</span>
                          </div>
                        ) : (
                          // Cabins
                          Array.from({ length: cell.cabins }).map((_, i) => (
                            <House key={i} className="w-2 h-2 text-[#1b4d3e]" />
                          ))
                        )}
                      </div>
                    )}

                    {/* Rent or price label at bottom */}
                    <div className="flex justify-between items-center text-[8px] mt-1 font-sans font-bold text-[#5d4037]">
                      {cell.price && cell.ownerId === null ? (
                        <span className="text-[#800000]">{cell.price}G</span>
                      ) : cell.isMortgaged ? (
                        <span className="text-[#a31a1a] line-through text-[7px]">GADAI</span>
                      ) : cell.price ? (
                        <span className="text-[#1b4d3e]">K-{cell.ownerId}</span>
                      ) : (
                        <span className="text-stone-500 font-light italic text-[7px]">KARTU</span>
                      )}
                    </div>

                  </div>

                  {/* Owner visual strip on the bottom edge if owned */}
                  {ownerColor && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-1" 
                      style={{ backgroundColor: ownerColor }}
                    />
                  )}

                </div>
              )}

              {/* Dynamic Player Avatars Floating Tokens inside tile */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="flex flex-wrap gap-0.5 max-w-[90%] justify-center items-center">
                  <AnimatePresence>
                    {playersOnCell.map((player) => {
                      const isActive = player.id === activePlayerId;
                      return (
                        <motion.div
                          key={player.id}
                          layoutId={`player-token-${player.id}`}
                          initial={{ scale: 0.5, y: -10 }}
                          animate={{ 
                            scale: isActive ? 1.2 : 1, 
                            y: 0,
                            z: 10,
                          }}
                          exit={{ scale: 0.5 }}
                          transition={{ type: "spring", stiffness: 180, damping: 15 }}
                          className={`w-5 h-5 rounded-full flex items-center justify-center relative shadow-md filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] p-0.5 group-hover:scale-110`}
                          style={{
                            backgroundColor: player.color,
                            border: isActive ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.6)',
                            boxShadow: isActive ? '0 0 10px #f59e0b, inset 0 2px 4px rgba(255,255,255,0.7)' : 'inset 0 2px 4px rgba(255,255,255,0.4)',
                          }}
                        >
                          <span className="text-[11px] leading-none select-none drop-shadow-sm">
                            {player.avatar}
                          </span>
                          
                          {/* Active Golden Glow Halo */}
                          {isActive && (
                            <span className="absolute -inset-1 rounded-full border-2 border-amber-400 animate-ping opacity-60 pointer-events-none" />
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </button>
          );
        })}

      </div>
    </div>
  </div>
);
};
