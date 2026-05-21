import React, { useState } from 'react';
import { Player, BoardCell, GameLog, PirateCard } from '../types';
import { Anchor, Coins, Shield, HelpCircle, Activity, Play, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { pirateAudio } from '../utils/audio';

interface PlayerConsoleProps {
  players: Player[];
  activePlayerId: number;
  cells: BoardCell[];
  gameLogs: GameLog[];
  dice: [number, number];
  isRolling: boolean;
  rollDice: () => void;
  buyProperty: () => void;
  buildCabin: (cellId: number) => void;
  sellCabin: (cellId: number) => void;
  mortgageProperty: (cellId: number) => void;
  unmortgageProperty: (cellId: number) => void;
  payRent: () => void;
  payTax: () => void;
  payBribeToEscape: () => void;
  useJailFreeCard: () => void;
  endTurn: () => void;
  activeCard: PirateCard | null;
  dismissCard: () => void;
  showBuildManager: boolean;
  setShowBuildManager: (show: boolean) => void;
}

export const PlayerConsole: React.FC<PlayerConsoleProps> = ({
  players,
  activePlayerId,
  cells,
  gameLogs,
  dice,
  isRolling,
  rollDice,
  buyProperty,
  buildCabin,
  sellCabin,
  mortgageProperty,
  unmortgageProperty,
  payRent,
  payTax,
  payBribeToEscape,
  useJailFreeCard,
  endTurn,
  activeCard,
  dismissCard,
  showBuildManager,
  setShowBuildManager,
}) => {
  const activePlayer = players.find(p => p.id === activePlayerId);
  const currentCell = activePlayer ? cells[activePlayer.position] : null;

  // Track state of action requirements
  // If player hasn't rolled yet, they must roll or escape prison
  const hasRolled = dice[0] !== 0;

  // Determine what button is required
  const canRoll = activePlayer && !activePlayer.isBankrupt && !hasRolled && !isRolling;
  const inJail = activePlayer?.inJail;

  // Determine if land cell has actions
  const isUnownedProperty = currentCell && currentCell.type === 'property' && currentCell.ownerId === null;
  const isUnownedRailroad = currentCell && currentCell.type === 'railroad' && currentCell.ownerId === null;
  const isUnownedUtility = currentCell && currentCell.type === 'utility' && currentCell.ownerId === null;
  const isUnowned = isUnownedProperty || isUnownedRailroad || isUnownedUtility;

  // Can buy flag
  const canBuy = activePlayer && isUnowned && hasRolled && activePlayer.hasPassedStart && activePlayer.money >= (currentCell?.price || 0);

  // Rent / Tax penalties
  const isOwnedByOther = currentCell && currentCell.ownerId !== null && currentCell.ownerId !== activePlayerId && currentCell.ownerId >= 1;
  const hasRentOwed = hasRolled && isOwnedByOther && !currentCell?.isMortgaged;
  const hasTaxOwed = hasRolled && currentCell?.type === 'tax';

  // State to toggle build manager cell selection
  const ownedProperties = cells.filter(c => c.ownerId === activePlayerId && (c.type === 'property' || c.type === 'railroad' || c.type === 'utility'));

  // Calculate current rent rate for active cell
  const currentRentCalculated = () => {
    if (!currentCell || !isOwnedByOther) return 0;
    const owner = players.find(p => p.id === currentCell.ownerId);
    if (!owner) return 0;

    if (currentCell.type === 'property' && currentCell.rent) {
      // Check full set
      const siblingCells = cells.filter(c => c.group === currentCell.group);
      const isFullGroupOwnedBySame = siblingCells.every(c => c.ownerId === currentCell.ownerId);

      const level = currentCell.cabins; // 0 to 5
      if (level === 0) {
        return isFullGroupOwnedBySame ? currentCell.rent[0] * 2 : currentCell.rent[0];
      }
      return currentCell.rent[level];
    }

    if (currentCell.type === 'railroad') {
      const ownedPorts = cells.filter(c => c.type === 'railroad' && c.ownerId === currentCell.ownerId).length;
      return 25 * Math.pow(2, ownedPorts - 1);
    }

    if (currentCell.type === 'utility') {
      // Utility: 10 * dice roll or similar
      const ownedServices = cells.filter(c => c.type === 'utility' && c.ownerId === currentCell.ownerId).length;
      const diceSum = dice[0] + dice[1];
      return ownedServices === 2 ? diceSum * 10 : diceSum * 4;
    }

    return 0;
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'roll': return <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'buy': return <Coins className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
      case 'rent': return <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
      case 'tax': return <Shield className="w-3.5 h-3.5 text-red-400 shrink-0" />;
      case 'build': return <Anchor className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      default: return <HelpCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />;
    }
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
      <div className="w-12 h-12 bg-[#d4c19c] rounded-sm border-2 border-[#1a120b] shadow-md flex items-center justify-center p-2 relative">
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full gap-1">
          {Array.from({ length: 9 }).map((_, idx) => {
            const hasDot = dots[val]?.includes(idx);
            return (
              <div key={idx} className="flex items-center justify-center">
                {hasDot && (
                  <div className="w-2.5 h-2.5 bg-[#1a120b] rounded-full shadow-inner" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!activePlayer) return null;

  return (
    <div className="flex flex-col h-full bg-[#2a1a10] border-4 border-[#3d2b1f] p-4 rounded-sm shadow-[0_0_80px_rgba(0,0,0,0.8)] space-y-4 font-serif">
      
      {/* 1. CURRENT TURN PLAYER PROFILE BANNER */}
      <div className="p-3 bg-[#1a120b] rounded-sm border border-[#3d2b1f] flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-3 font-sans">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-3xl font-serif filter shadow-lg"
            style={{ 
              backgroundColor: activePlayer.color,
              boxShadow: `0 0 12px ${activePlayer.color}40`,
              border: `2px solid ${activePlayer.color}`
            }}
          >
            {activePlayer.avatar}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-sans">
              <h2 className="font-serif font-black text-[#d4c19c] text-base leading-none uppercase">
                {activePlayer.name}
              </h2>
              {activePlayer.isAI && (
                <span className="text-[8px] font-sans tracking-widest font-bold bg-[#800000]/20 text-[#a31a1a] border border-[#a31a1a]/10 px-1 py-0.5 rounded-sm uppercase">
                  AI BOT
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-[#d4c19c] font-sans font-bold">
              <Coins className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{activePlayer.money} Gold Doubloons</span>
            </div>
          </div>
        </div>

        {/* Action helper badges */}
        <div className="text-right">
          <span className="text-[8px] font-sans tracking-widest text-[#d4c19c]/60 uppercase leading-none block">DAN DAN DI:</span>
          <span className="text-xs font-serif font-black text-zinc-100 mt-1 block uppercase">
            {currentCell?.indonesianName}
          </span>
        </div>
      </div>

      {/* 2. STATUS PENJARA (JIKA ADA) */}
      {inJail && (
        <div className="w-full text-center p-2.5 bg-[#800000]/15 border border-[#800000]/30 text-rose-300 rounded-sm text-xs flex items-center justify-center gap-1.5 font-sans font-bold">
          <AlertTriangle className="w-4 h-4 text-[#a31a1a] shrink-0 animate-bounce" />
          <span>Terkurung di Penjara Davy Jones ({activePlayer.jailTurns} giliran)</span>
        </div>
      )}

      {/* 3. TRANSACTION ACTION FOOTERS */}
      <div className="grid grid-cols-2 gap-2">
        {/* ESCAPE PRISON CONTROLS */}
        {inJail && !hasRolled && (
          <>
            <button
              onClick={() => {
                payBribeToEscape();
                pirateAudio.playCoin();
              }}
              disabled={activePlayer.isAI || activePlayer.money < 50}
              className="col-span-1 p-2.5 bg-[#d4c19c] text-[#1a120b] border-2 border-[#1a120b] font-serif text-xs rounded-sm font-black hover:bg-[#c9b48c] uppercase transition-all disabled:opacity-45 cursor-pointer"
            >
              Bayar Sogokan (50 G)
            </button>
            <button
              onClick={() => {
                useJailFreeCard();
                pirateAudio.playBell();
              }}
              disabled={activePlayer.isAI || activePlayer.jailFreeCards === 0}
              className="col-span-1 p-2.5 bg-[#1b4d3e] text-zinc-100 border-2 border-[#1a120b] font-serif text-xs rounded-sm font-black hover:bg-[#153a2f] uppercase transition-all disabled:opacity-45 cursor-pointer"
            >
              Pas Bebas ({activePlayer.jailFreeCards})
            </button>
          </>
        )}

        {/* ROLL DICE BUTTON */}
        {!inJail && canRoll && (
          <button
            onClick={() => {
              rollDice();
            }}
            disabled={activePlayer.isAI}
            className="col-span-2 py-3 bg-[#d4c19c] hover:bg-[#c9b48c] text-[#1a120b] font-serif font-black hover:scale-[1.01] active:scale-[0.99] rounded-sm shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border-2 border-[#1a120b]"
          >
            <Play className="w-5 h-5 text-[#1a120b] fill-[#1a120b]" />
            <span>Kocok Kemudi Dadumu!</span>
          </button>
        )}

        {/* PRISON ESCAPE ROLL TRIAL */}
        {inJail && !hasRolled && (
          <button
            onClick={rollDice}
            disabled={activePlayer.isAI}
            className="col-span-2 py-3 bg-[#111] hover:bg-black text-white border border-[#333] font-serif font-bold text-xs rounded-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            Kocok Untuk Keberuntungan (Double)
          </button>
        )}

        {/* BUY PROPERTY BUTTON */}
        {canBuy && (
          <button
            onClick={() => {
              buyProperty();
              pirateAudio.playCoin();
            }}
            disabled={activePlayer.isAI}
            className="col-span-2 py-3 bg-[#1b4d3e] hover:bg-[#153a2f] text-zinc-100 font-serif font-black text-sm rounded-sm flex items-center justify-center gap-2 cursor-pointer border-2 border-[#1a120b] shadow-inner"
          >
            <Coins className="w-5 h-5 text-[#d4c19c]" />
            <span>Beli Wilayah ({currentCell?.price} G)</span>
          </button>
        )}

        {/* LOCKED BUY PROPERTY WARNING (NOT PASSED GO YET) */}
        {activePlayer && isUnowned && hasRolled && !activePlayer.hasPassedStart && (
          <div className="col-span-2 p-3 bg-amber-950/25 border border-amber-500/35 text-[#d4c19c] font-sans text-xs rounded-sm text-center flex flex-col items-center justify-center gap-1.5 shadow-md animate-fadeIn">
            <Anchor className="w-5.5 h-5.5 text-amber-500 shrink-0 fill-amber-500/10" />
            <span className="font-serif font-black uppercase text-[10.5px] text-amber-400 tracking-wider">🔒 Pembelian Wilayah Terkunci</span>
            <p className="text-[10px] leading-relaxed text-[#f4efe8]/80 px-1 font-serif text-center">
              Kapten wajib berlayar satu putaran penuh mengitari samudra & melewati **Garis START** minimal sekali demi mendapat izin resmi dari Raja Bajak Laut untuk mengklaim wilayah perairan ini!
            </p>
          </div>
        )}

        {/* PAY RENT BUTTON */}
        {hasRentOwed && (
          <button
            onClick={() => {
              payRent();
              pirateAudio.playCoin();
            }}
            disabled={activePlayer.isAI}
            className="col-span-2 py-3 bg-[#800000] hover:bg-[#600000] text-zinc-100 font-serif font-black text-sm rounded-sm flex items-center justify-center gap-2 cursor-pointer border-2 border-[#1a120b] shadow-inner animate-pulse"
          >
            <AlertTriangle className="w-5 h-5 text-red-200" />
            <span>Bayar Upeti Sewa ({currentRentCalculated()} G)</span>
          </button>
        )}

        {/* PAY TAX BUTTON */}
        {hasTaxOwed && (
          <button
            onClick={() => {
              payTax();
              pirateAudio.playCoin();
            }}
            disabled={activePlayer.isAI}
            className="col-span-2 py-3 bg-[#800000] hover:bg-[#600000] text-zinc-100 font-serif font-black text-sm rounded-sm flex items-center justify-center gap-2 cursor-pointer border-2 border-[#1a120b] shadow-inner"
          >
            <Shield className="w-5 h-5 text-red-200" />
            <span>Bayar Pajak Upeti ({currentCell?.price} G)</span>
          </button>
        )}

        {/* BUILD CABIN BUTTONS */}
        <button
          onClick={() => {
            setShowBuildManager(!showBuildManager);
            pirateAudio.playBell();
          }}
          className="col-span-1 p-2.5 bg-[#1a120b] border border-[#3d2b1f] text-[#d4c19c] font-sans text-xs rounded-sm font-bold uppercase hover:bg-[#0c0806] transition-all cursor-pointer"
        >
          Kelola Pulau {ownedProperties.length > 0 ? `(${ownedProperties.length})` : ""}
        </button>

        {/* END TURN BUTTON */}
        {hasRolled && !hasRentOwed && !hasTaxOwed && (
          <button
            onClick={() => {
              endTurn();
              pirateAudio.playBell();
            }}
            disabled={activePlayer.isAI}
            className="col-span-1 py-2.5 bg-[#1a120b] text-[#d4c19c] font-sans font-bold border border-[#3d2b1f] rounded-sm text-xs hover:bg-[#0c0806] transition-all uppercase tracking-wider disabled:opacity-45 cursor-pointer"
          >
            Selesai Giliran
          </button>
        )}
      </div>

      {/* 4. SEPARATE ACCORDION AREA FOR BUILDING & PROPERTY MANAGEMENT */}
      {showBuildManager && (
        <div className="p-3 bg-[#1a120b]/90 border border-[#3d2b1f] rounded-sm space-y-2 shadow-xl">
          <div className="flex justify-between items-center text-xs border-b border-[#3d2b1f] pb-1.5 font-sans">
            <span className="font-serif font-black text-[#d4c19c] uppercase">PENGELOLAAN WILAYAH</span>
            <button 
              onClick={() => setShowBuildManager(false)} 
              className="text-[#d4c19c]/60 hover:text-white font-sans font-bold text-xs cursor-pointer"
            >
              TUTUP
            </button>
          </div>
          
          {ownedProperties.length === 0 ? (
            <p className="text-[10px] text-zinc-500 text-center py-2 italic font-sans uppercase">
              Anda belum menguasai pelabuhan atau pulau manapun!
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-[#3d2b1f]/35 font-sans">
              {ownedProperties.map((prop) => {
                const canAddCabin = prop.type === 'property' && prop.cabins < 5 && activePlayer.money >= (prop.cabinCost || 100) && !prop.isMortgaged;
                const canSellCabin = prop.type === 'property' && prop.cabins > 0;
                
                return (
                  <div key={prop.id} className="flex flex-col pt-1.5 first:pt-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[11px] font-serif font-bold text-zinc-200 leading-none block">
                          {prop.indonesianName}
                        </span>
                        <div className="text-[8px] text-zinc-400 font-sans flex gap-1 items-center mt-1">
                          <span>Kabin: {prop.cabins === 5 ? "Benteng" : prop.cabins}/4</span>
                          {prop.isMortgaged && <span className="bg-red-950 text-red-400 px-1 border border-rose-950 rounded-sm">TERGADAI</span>}
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex gap-1">
                        {prop.type === 'property' && (
                          <>
                            <button
                              onClick={() => {
                                buildCabin(prop.id);
                                pirateAudio.playCoin();
                              }}
                              disabled={!canAddCabin}
                              className="text-[9px] font-sans px-2 py-0.5 bg-[#1b4d3e]/25 border border-[#1b4d3e]/40 text-[#1b4d3e] hover:text-zinc-100 rounded-sm hover:bg-[#1b4d3e] disabled:opacity-30 disabled:pointer-events-none cursor-pointer font-bold"
                            >
                              +Kabin ({prop.cabinCost}G)
                            </button>
                            <button
                              onClick={() => {
                                sellCabin(prop.id);
                                pirateAudio.playCoin();
                              }}
                              disabled={!canSellCabin}
                              className="text-[9px] font-sans px-2 py-0.5 bg-[#800000]/25 border border-[#800000]/40 text-[#a31a1a] hover:text-zinc-100 rounded-sm hover:bg-[#800000] disabled:opacity-30 disabled:pointer-events-none cursor-pointer font-bold"
                            >
                              Jual CAB
                            </button>
                          </>
                        )}

                        {!prop.isMortgaged ? (
                          <button
                            onClick={() => {
                              mortgageProperty(prop.id);
                              pirateAudio.playBell();
                            }}
                            className="text-[9px] font-sans px-2 py-0.5 bg-[#d4c19c]/25 border border-[#1a120b]/20 text-[#d4c19c] rounded-sm hover:bg-[#d4c19c] hover:text-[#1a120b] cursor-pointer font-bold"
                          >
                            Gadai (+{prop.mortgage}G)
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              unmortgageProperty(prop.id);
                              pirateAudio.playCoin();
                            }}
                            disabled={activePlayer.money < Math.ceil((prop.mortgage || 100) * 1.1)}
                            className="text-[9px] font-sans px-2 py-0.5 bg-blue-900/30 border border-blue-500 text-blue-300 rounded-sm hover:bg-blue-600 cursor-pointer font-bold"
                          >
                            Tebus (-{Math.ceil((prop.mortgage || 100) * 1.1)}G)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. HISTORIC REAL-TIME LIVE LOG GAME CHATBOX */}
      <div className="flex-1 flex flex-col bg-[#1a120b] rounded-sm border border-[#3d2b1f] overflow-hidden shadow-inner font-sans">
        <div className="px-3 py-1.5 bg-[#1a120b]/60 border-b border-[#3d2b1f] flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] tracking-widest text-[#d4c19c] uppercase font-bold">Log Kapal Samudra</span>
          </div>
          <span className="text-[8px] font-sans text-[#d4c19c]/40">Live Feed</span>
        </div>

        <div className="p-2.5 flex-1 overflow-y-auto space-y-1.5 font-mono text-[10px] max-h-40 min-h-[100px]" id="logs-scrolling-box">
          {gameLogs.map((log) => {
            const playerChar = log.playerId !== undefined ? players.find(p => p.id === log.playerId) : null;
            return (
              <div key={log.id} className="flex gap-1.5 items-start py-0.5 border-b border-zinc-950/10 hover:bg-zinc-900/10">
                {getLogIcon(log.type)}
                <div>
                  <span className="text-[#d4c19c]/40 select-none mr-1">[{log.timestamp}]</span>
                  {playerChar && (
                    <span className="font-bold mr-1" style={{ color: playerChar.color }}>
                      {playerChar.name}:
                    </span>
                  )}
                  <span className="text-zinc-300">{log.message}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. DRAWN CARD PARCHMENT MODAL OVERLAY */}
      <AnimatePresence>
        {activeCard && (
          <motion.div
            key="card-draw-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#0c0806]/85 flex items-center justify-center p-4 rounded-sm"
          >
            {activeCard.type === 'community' ? (
              <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                className="bg-[#eddcc0] border-4 border-[#3a2312] p-6 rounded-md text-[#1d1109] shadow-[0_0_80px_rgba(0,0,0,0.95)] text-center relative max-w-sm w-full font-serif overflow-hidden select-none"
              >
                {/* Vintage paper margins */}
                <div className="absolute top-1 left-1 bottom-1 right-1 border-2 border-dashed border-[#57351b]/35 rounded-sm pointer-events-none" />
                
                {/* Top Banner Ribbon */}
                <div className="relative mb-6 flex flex-col items-center">
                  <span className="absolute left-1 top-2 text-xl opacity-40 shrink-0">🧭</span>
                  <span className="absolute right-1 top-2 text-xl opacity-40 shrink-0">⚓</span>
                  
                  {/* "PETI HARTA" ribbon scroll */}
                  <div className="relative bg-[#2a170b] px-9 py-2 rounded-sm border-2 border-[#b8860b] shadow-md transform -skew-x-2">
                    <div className="absolute top-0.5 left-0.5 right-0.5 bottom-0.5 border border-[#e1b15c]/25 rounded-sm pointer-events-none" />
                    <span className="font-sans text-xs tracking-[5px] text-[#e1b15c] font-black uppercase">
                      PETI HARTA
                    </span>
                  </div>
                </div>

                {/* Card Title */}
                <h3 className="text-lg md:text-xl font-serif font-black text-[#2e1c0c] uppercase mb-4 leading-tight tracking-wide">
                  {activeCard.title}
                </h3>

                {/* Decorative Separator Line */}
                <div className="w-24 h-0.5 mx-auto bg-[#57351b]/35 mb-4" />

                {/* Card Main Story Text */}
                <p className="text-xs md:text-sm text-[#382312] leading-relaxed font-semibold italic bg-[#dec6aa]/30 p-4 rounded-sm border border-[#1d1109]/15 mb-4 shadow-inner min-h-[90px] flex items-center justify-center">
                  "{activeCard.text}"
                </p>

                {/* Impact Indicator with Emojis */}
                <div className="flex justify-center items-center gap-2 mb-2">
                  <div className="text-[11px] font-sans font-black text-[#a61c1c] uppercase bg-[#a61c1c]/10 border border-[#a61c1c]/25 px-3 py-1.5 rounded-sm shadow-sm flex items-center gap-1.5">
                    <span className="text-xs">🔑</span>
                    <span> {activeCard.subtext}</span>
                  </div>
                </div>

                {/* Decorative Bottom Assets like Barrels & Chests */}
                <div className="flex justify-between items-center text-xs opacity-50 px-2 mt-2">
                  <span>🛢️</span>
                  <span className="text-[10px] font-sans tracking-widest text-[#57351b] font-bold">PARCHMENT #22</span>
                  <span>📦</span>
                </div>

                {/* Confirmation trigger */}
                <button
                  onClick={() => {
                    dismissCard();
                    pirateAudio.playCoin();
                  }}
                  className="w-full mt-5 py-3.5 bg-gradient-to-b from-[#2a170b] to-[#120904] hover:from-[#3d2312] hover:to-[#221008] text-[#f4efe8] font-serif font-black text-xs rounded-sm uppercase tracking-widest transition-all cursor-pointer border-2 border-[#e1b15c]/65 shadow-md hover:shadow-lg transform active:scale-[0.98]"
                >
                  AMBIL HARTA LAUT!
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                className="bg-[#eedebc] border-4 border-[#1a120b] p-6 rounded-sm text-[#1a120b] shadow-[0_0_80px_rgba(0,0,0,0.95)] text-center relative max-w-sm w-full font-serif"
              >
                {/* Outer map lines decorative */}
                <div className="absolute top-1 left-1 bottom-1 right-1 border border-dashed border-[#1a120b]/20 rounded-sm pointer-events-none" />

                {/* Header card icon type */}
                <div className="relative mb-6 flex flex-col items-center">
                  <span className="absolute left-1 top-2 text-xl opacity-40 shrink-0">🌊</span>
                  <span className="absolute right-1 top-2 text-xl opacity-40 shrink-0">⚔️</span>
                  
                  {/* "BISIKAN SAMUDRA" ribbon scroll */}
                  <div className="relative bg-[#0d2a35] px-7 py-2 rounded-sm border-2 border-[#14b8a6] shadow-md transform rotate-1">
                    <div className="absolute top-0.5 left-0.5 right-0.5 bottom-0.5 border border-[#14b8a6]/25 rounded-sm pointer-events-none" />
                    <span className="font-sans text-xs tracking-[4px] text-[#14b8a6] font-black uppercase">
                      BISIKAN SAMUDRA
                    </span>
                  </div>
                </div>

                <h3 className="text-lg md:text-xl font-serif font-black text-[#1a120b] uppercase mb-4 leading-tight">
                  {activeCard.title}
                </h3>

                {/* Decorative Separator Line */}
                <div className="w-24 h-0.5 mx-auto bg-gradient-to-r from-transparent via-[#1a120b]/35 to-transparent mb-4" />

                <p className="text-xs md:text-sm text-[#1a120b]/90 leading-relaxed italic bg-[#d9c4a8]/35 p-4 rounded-sm border border-[#1a120b]/20 mb-4 shadow-inner min-h-[90px] flex items-center justify-center">
                  "{activeCard.text}"
                </p>

                <div className="flex justify-center items-center gap-2 mb-2">
                  <div className="text-[11px] font-sans font-black text-[#a31a1a] uppercase bg-[#a31a1a]/10 border border-[#a31a1a]/25 px-3 py-1.5 rounded-sm shadow-sm flex items-center gap-1.5">
                    <span className="text-xs">🗺️</span>
                    <span> {activeCard.subtext}</span>
                  </div>
                </div>

                {/* Decorative Bottom Assets */}
                <div className="flex justify-between items-center text-xs opacity-40 px-2 mt-2">
                  <span>🧭</span>
                  <span className="text-[10px] font-sans tracking-widest text-[#1a120b] font-bold">KARTU TAKDIR</span>
                  <span>⛵</span>
                </div>

                {/* Confirmation trigger */}
                <button
                  onClick={() => {
                    dismissCard();
                    pirateAudio.playCoin();
                  }}
                  className="w-full mt-5 py-3.5 bg-gradient-to-b from-[#0d2a35] to-[#041217] hover:from-[#113a48] hover:to-[#091b22] text-[#f4efe8] font-serif font-black text-xs rounded-sm uppercase tracking-widest transition-all cursor-pointer border-2 border-[#14b8a6]/65 shadow-md transform active:scale-95"
                >
                  TERIMA TAKDIR!
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
