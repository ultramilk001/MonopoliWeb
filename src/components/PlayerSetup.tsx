import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, Shield, User, Bot, Sparkles, AlertCircle, Volume2, VolumeX, 
  Skull, Anchor, Coins, Sword, Check, Settings, Map, ChevronRight, X,
  Users, Key, Play, Plus, RefreshCw, Radio, Flame
} from 'lucide-react';
import { pirateAudio } from '../utils/audio';

export interface PirateTemplate {
  charId: number;
  name: string;
  avatar: string;
  color: string;
  textColor: string;
  bgColor: string;
  description: string;
  difficulty: "Mudah" | "Sedang" | "Sulit";
  playstyle: string;
  personalityDesc: string;
  aiPersonality: "Cunning" | "Aggressive" | "Conservative" | "Balanced";
}

const TEMPLATE_CAPTAINS: PirateTemplate[] = [
  {
    charId: 1,
    name: "Kapten Blackbeard",
    avatar: "🏴‍☠️",
    color: "#e11d48", // Rose Red
    textColor: "text-rose-500",
    bgColor: "bg-[#e11d48]/10",
    description: "Penguasa karismatik laut Karibia yang menakut-nakuti armada kolonial dengan membakar sumbu di janggutnya yang lebat.",
    difficulty: "Sedang",
    playstyle: "Monopoli & Agitasi Pelabuhan",
    personalityDesc: "Agresif memborong properti premium & gemar mendirikan benteng mewah seawal mungkin.",
    aiPersonality: "Aggressive"
  },
  {
    charId: 2,
    name: "Siren Anne Bonny",
    avatar: "🦜",
    color: "#f59e0b", // Gold
    textColor: "text-amber-500",
    bgColor: "bg-amber-500/10",
    description: "Ahli navigasi lincah berkemampuan tinggi. Penuh pesona taktis saat menguras pundi emas para saudagar lawan.",
    difficulty: "Mudah",
    playstyle: "Licik & Fleksibilitas Kartu",
    personalityDesc: "Sangat cerdik mengumpulkan piagam pembebasan & menghemat koin demi upeti murah.",
    aiPersonality: "Cunning"
  },
  {
    charId: 3,
    name: "Kapten Barbossa",
    avatar: "🐒",
    color: "#06b6d4", // Cyan
    textColor: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    description: "Mantan kapten Black Pearl yang bangkit dari kutukan mutiara hitam. Memiliki kepatuhan tanpa ampun terhadap aturan penjarahan.",
    difficulty: "Sulit",
    playstyle: "Ekspansionis Sangat Agresif",
    personalityDesc: "Tidak kenal ampun, memborong paksa semua petak karang berbiaya besar & memeras finansial sewa.",
    aiPersonality: "Aggressive"
  },
  {
    charId: 4,
    name: "Laksamana Cheng Ho",
    avatar: "🗺️",
    color: "#10b981", // Emerald Green
    textColor: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    description: "Komandan armada raksasa asal kekaisaran Timur. Mengutamakan kedamaian, keselamatan, dan efisiensi logistik pelayaran.",
    difficulty: "Sedang",
    playstyle: "Maritim Konservatif",
    personalityDesc: "Sangat hemat emas, menghindari investasi resiko tinggi dan mengamankan kas sisa yang tinggi.",
    aiPersonality: "Conservative"
  },
  {
    charId: 5,
    name: "Madame Cheng",
    avatar: "🐉",
    color: "#a855f7", // Purple
    textColor: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "Panglima legendaris dengan hukum disiplin besi komando di samudra timur, memimpin ratusan armada kapal jung.",
    difficulty: "Sulit",
    playstyle: "Sindikat Monopoli Terencana",
    personalityDesc: "Sengit mencari monopoli kelompok warna terpadu dan fokus mempertahankan dominasi pesisir.",
    aiPersonality: "Aggressive"
  },
  {
    charId: 6,
    name: "Hayreddin Barbarossa",
    avatar: "🦊",
    color: "#f97316", // Orange
    textColor: "text-orange-500",
    bgColor: "bg-orange-500/10",
    description: "Pasha autonomi laut dengan taktik cerdik yang lihai menyandera benteng pulau dan menarik upeti sewa dagang.",
    difficulty: "Sedang",
    playstyle: "Seimbang & Strategi Pelabuhan",
    personalityDesc: "Fokus menguasai pelabuhan transportasi pelayaran dan utilities pantai berharga sedang.",
    aiPersonality: "Balanced"
  },
  {
    charId: 7,
    name: "Jack si Burung Camar",
    avatar: "🥥",
    color: "#14b8a6", // Teal
    textColor: "text-teal-400",
    bgColor: "bg-teal-400/10",
    description: "Kapten eksentrik legendaris yang mengandalkan dewi fortuna, sebotol rum bajak laut, dan kompas gaibnya.",
    difficulty: "Mudah",
    playstyle: "Kombinasi Instingtif",
    personalityDesc: "Bertransaksi dengan gaya acak tak terduga, didukung keberuntungan dewi laut.",
    aiPersonality: "Balanced"
  },
  {
    charId: 8,
    name: "Davy Jones",
    avatar: "🐙",
    color: "#64748b", // Ocean Slate
    textColor: "text-slate-400",
    bgColor: "bg-slate-400/10",
    description: "Kapten terkutuk kapal hantu Flying Dutchman, penjaga sejati jurang laut terdalam penuh hisapan koin jiwa.",
    difficulty: "Sulit",
    playstyle: "Tirani Pemerasan Total",
    personalityDesc: "Penuh tipu daya, gemar menuntut upeti tebusan maksimal dan menyiksa awak saingan.",
    aiPersonality: "Cunning"
  }
];

interface PlayerSetupProps {
  onStartGame: (selectedPlayerId: number, startingGold: number, playersConfig: any[], soundEnabled: boolean) => void;
}

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onStartGame }) => {
  // General configs
  const [startingGold, setStartingGold] = useState<number>(1500);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'lobby' | 'multiplayer_lobby' | 'custom_bots'>('lobby');

  // --- BOT BATTLE SETUP ---
  const [userTemplateId, setUserTemplateId] = useState<number>(1);
  const [botCount, setBotCount] = useState<number>(3); // Default 3 bots (total 4 players)
  const [botDifficulty, setBotDifficulty] = useState<'Mudah' | 'Sedang' | 'Sulit'>('Sedang');
  const [selectedBotTemplateIds, setSelectedBotTemplateIds] = useState<number[]>([2, 3, 4]);

  // Expert Bots Configuration variables
  const [bot1TemplateId, setBot1TemplateId] = useState<number>(2);
  const [bot2TemplateId, setBot2TemplateId] = useState<number>(3);
  const [bot2Active, setBot2Active] = useState<boolean>(true);
  const [bot3TemplateId, setBot3TemplateId] = useState<number>(4);
  const [bot3Active, setBot3Active] = useState<boolean>(true);

  // --- MULTIPLAYER SETUP ---
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('');
  const [multiplayerStatus, setMultiplayerStatus] = useState<'idle' | 'creating' | 'joining' | 'joined'>('idle');
  const [lobbyPlayers, setLobbyPlayers] = useState<any[]>([]);
  const [friendCount, setFriendCount] = useState<number>(4); // default 4 friends (total 5 players)

  // Selection slot manager
  const [selectingSlot, setSelectingSlot] = useState<"user" | "bot1" | "bot2" | "bot3" | "quick_bot" | null>(null);
  const [quickBotToReplaceIndex, setQuickBotToReplaceIndex] = useState<number | null>(null);

  // Sync Bot Count to active list & expert settings
  useEffect(() => {
    // Populate selection templates for bots
    const newBots: number[] = [];
    let templateIdx = 1; // start after Blackbeard
    for (let i = 0; i < botCount; i++) {
      // Find unused templates
      while (templateIdx === userTemplateId && templateIdx < TEMPLATE_CAPTAINS.length) {
        templateIdx++;
      }
      const actualId = (TEMPLATE_CAPTAINS[templateIdx] || TEMPLATE_CAPTAINS[0]).charId;
      newBots.push(actualId);
      templateIdx++;
    }
    setSelectedBotTemplateIds(newBots);

    // Sync expert settings too
    setBot2Active(botCount >= 2);
    setBot3Active(botCount >= 3);
    if (newBots[0]) setBot1TemplateId(newBots[0]);
    if (newBots[1]) setBot2TemplateId(newBots[1]);
    if (newBots[2]) setBot3TemplateId(newBots[2]);
  }, [botCount, userTemplateId]);

  // Audio mute toggler
  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    pirateAudio.setEnabled(nextState);
    if (nextState) {
      pirateAudio.playCoin();
    }
  };

  // Quick Start Bot Game
  const handleQuickStartBots = () => {
    pirateAudio.playCannon();

    const selectedHuman = TEMPLATE_CAPTAINS.find(c => c.charId === userTemplateId)!;
    
    const playersConfig = [
      {
        id: 1,
        name: selectedHuman.name,
        avatar: selectedHuman.avatar,
        color: selectedHuman.color,
        textColor: selectedHuman.textColor,
        bgColor: selectedHuman.bgColor,
        isAI: false,
        aiPersonality: selectedHuman.aiPersonality,
      }
    ];

    // Add bots according to selections
    selectedBotTemplateIds.forEach((botId, index) => {
      const template = TEMPLATE_CAPTAINS.find(c => c.charId === botId) || TEMPLATE_CAPTAINS[1];
      playersConfig.push({
        id: index + 2,
        name: `${template.name} [BOT ${botDifficulty}]`,
        avatar: template.avatar,
        color: template.color,
        textColor: template.textColor,
        bgColor: template.bgColor,
        isAI: true,
        aiPersonality: template.aiPersonality,
      });
    });

    onStartGame(1, startingGold, playersConfig, soundEnabled);
  };

  // Launch from Custom / Expert configurations
  const handleStartCustomBots = () => {
    pirateAudio.playCannon();

    const selectedHuman = TEMPLATE_CAPTAINS.find(c => c.charId === userTemplateId)!;
    const selectedBot1 = TEMPLATE_CAPTAINS.find(c => c.charId === bot1TemplateId)!;
    const selectedBot2 = TEMPLATE_CAPTAINS.find(c => c.charId === bot2TemplateId)!;
    const selectedBot3 = TEMPLATE_CAPTAINS.find(c => c.charId === bot3TemplateId)!;

    const playersConfig = [
      {
        id: 1,
        name: selectedHuman.name,
        avatar: selectedHuman.avatar,
        color: selectedHuman.color,
        textColor: selectedHuman.textColor,
        bgColor: selectedHuman.bgColor,
        isAI: false,
        aiPersonality: selectedHuman.aiPersonality,
      },
      {
        id: 2,
        name: `${selectedBot1.name} (BOT)`,
        avatar: selectedBot1.avatar,
        color: selectedBot1.color,
        textColor: selectedBot1.textColor,
        bgColor: selectedBot1.bgColor,
        isAI: true,
        aiPersonality: selectedBot1.aiPersonality,
      }
    ];

    if (bot2Active) {
      playersConfig.push({
        id: 3,
        name: `${selectedBot2.name} (BOT)`,
        avatar: selectedBot2.avatar,
        color: selectedBot2.color,
        textColor: selectedBot2.textColor,
        bgColor: selectedBot2.bgColor,
        isAI: true,
        aiPersonality: selectedBot2.aiPersonality,
      });
    }

    if (bot3Active) {
      playersConfig.push({
        id: 4,
        name: `${selectedBot3.name} (BOT)`,
        avatar: selectedBot3.avatar,
        color: selectedBot3.color,
        textColor: selectedBot3.textColor,
        bgColor: selectedBot3.bgColor,
        isAI: true,
        aiPersonality: selectedBot3.aiPersonality,
      });
    }

    // Launch!
    onStartGame(1, startingGold, playersConfig, soundEnabled);
  };

  // --- MULTIPLAYER ROOM SIMULATION CODE ---
  const handleCreateRoom = () => {
    pirateAudio.playBell();
    setMultiplayerStatus('creating');
    const randomCode = 'NASSAU-' + Math.floor(1000 + Math.random() * 9000);
    setRoomCode(randomCode);

    setTimeout(() => {
      setMultiplayerStatus('joined');
      setViewMode('multiplayer_lobby');
      
      const human = TEMPLATE_CAPTAINS.find(c => c.charId === userTemplateId)!;
      setLobbyPlayers([{
        id: 1,
        name: `${human.name} (Laksamana Utama)`,
        avatar: human.avatar,
        color: human.color,
        status: 'Sedang menanti awak kapal...',
        isHost: true,
        isHuman: true
      }]);
    }, 900);
  };

  const handleJoinRoom = () => {
    if (!roomCodeInput.trim()) {
      alert("Masukkan kode kemudi kamar terlebih dahulu!");
      return;
    }
    pirateAudio.playBell();
    setMultiplayerStatus('joining');
    setRoomCode(roomCodeInput.toUpperCase());

    setTimeout(() => {
      setMultiplayerStatus('joined');
      setViewMode('multiplayer_lobby');
      
      const human = TEMPLATE_CAPTAINS.find(c => c.charId === userTemplateId)!;
      setLobbyPlayers([
        {
          id: 1,
          name: `${human.name} (Anda)`,
          avatar: human.avatar,
          color: human.color,
          status: 'Bersiap menghimpun kru!',
          isHost: false,
          isHuman: true
        }
      ]);
    }, 1000);
  };

  // Simulation logic for 5 other pirate players dynamically joining the multiplayer room
  useEffect(() => {
    if (viewMode !== 'multiplayer_lobby' || lobbyPlayers.length === 0 || lobbyPlayers.length >= friendCount + 1) return;

    const joinTimers = [
      {
        delay: 800,
        name: "Sobat Jack",
        status: "🦜 Baru berlabuh! 'Siap menjarah!'",
        avatar: "🦜",
        color: "#f59e0b"
      },
      {
        delay: 1705,
        name: "Edward Kenway [Lokal]",
        status: "🗡️ 'Pedang terhunus!' Menyusun peta harta.",
        avatar: "🐒",
        color: "#06b6d4"
      },
      {
        delay: 2605,
        name: "Rian Srigala Samudra",
        status: "⛵ 'Rantai diangkat!' Menggulung layar deck.",
        avatar: "🦊",
        color: "#f97316"
      },
      {
        delay: 3505,
        name: "Anne Srikandi",
        status: "🗺️ 'Dewi Fortuna di pihak kita!' Menghidupkan kompas.",
        avatar: "🐉",
        color: "#a855f7"
      },
      {
        delay: 4305,
        name: "Kapten Hook",
        status: "⚓ 'Sepasang kait besi!' Bersiap menyerbu pantai Nassau.",
        avatar: "🐙",
        color: "#14b8a6"
      }
    ];

    const currentPendingIndex = lobbyPlayers.length - 1;
    if (currentPendingIndex < joinTimers.length && currentPendingIndex < friendCount) {
      const nextJoiner = joinTimers[currentPendingIndex];
      const timer = setTimeout(() => {
        pirateAudio.playBell();
        setLobbyPlayers(prev => [
          ...prev,
          {
            id: prev.length + 1,
            name: nextJoiner.name,
            avatar: nextJoiner.avatar,
            color: nextJoiner.color,
            status: nextJoiner.status,
            isHost: false,
            isHuman: false
          }
        ]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [viewMode, lobbyPlayers, friendCount]);

  const handleStartSimulatedMultiplayerGame = () => {
    pirateAudio.playCannon();

    // Map lobby players into final game Engine layout
    const playersConfig = lobbyPlayers.map((lobbyPlayer, idx) => {
      // Find template properties for visuals or fallback
      const matchingTemplate = TEMPLATE_CAPTAINS[idx] || TEMPLATE_CAPTAINS[0];
      return {
        id: lobbyPlayer.id,
        name: lobbyPlayer.name,
        avatar: lobbyPlayer.avatar,
        color: lobbyPlayer.color,
        textColor: matchingTemplate.textColor,
        bgColor: matchingTemplate.bgColor,
        // Host/you are human, others acts as AI simulating online peers
        isAI: !lobbyPlayer.isHuman,
        aiPersonality: matchingTemplate.aiPersonality,
      };
    });

    onStartGame(1, startingGold, playersConfig, soundEnabled);
  };

  const currentSelectionList = () => {
    if (selectingSlot === "quick_bot") return selectedBotTemplateIds;
    const list: number[] = [userTemplateId];
    list.push(bot1TemplateId);
    if (bot2Active) list.push(bot2TemplateId);
    if (bot3Active) list.push(bot3TemplateId);
    return list;
  };

  const handleSelectCharacter = (charId: number) => {
    if (!selectingSlot) return;
    pirateAudio.playBell();

    if (selectingSlot === "user") {
      setUserTemplateId(charId);
    } else if (selectingSlot === "bot1") {
      setBot1TemplateId(charId);
    } else if (selectingSlot === "bot2") {
      setBot2TemplateId(charId);
    } else if (selectingSlot === "bot3") {
      setBot3TemplateId(charId);
    } else if (selectingSlot === "quick_bot" && quickBotToReplaceIndex !== null) {
      const copy = [...selectedBotTemplateIds];
      copy[quickBotToReplaceIndex] = charId;
      setSelectedBotTemplateIds(copy);
    }

    setSelectingSlot(null);
    setQuickBotToReplaceIndex(null);
  };

  const userChar = TEMPLATE_CAPTAINS.find(c => c.charId === userTemplateId)!;
  const bot1Char = TEMPLATE_CAPTAINS.find(c => c.charId === bot1TemplateId)!;
  const bot2Char = TEMPLATE_CAPTAINS.find(c => c.charId === bot2TemplateId)!;
  const bot3Char = TEMPLATE_CAPTAINS.find(c => c.charId === bot3TemplateId)!;

  // Render character cards in standard view
  const renderPirateCard = (
    titleSlot: string, 
    char: typeof TEMPLATE_CAPTAINS[0], 
    isActive: boolean, 
    onToggleActive?: () => void, 
    onOpenChange?: () => void
  ) => {
    return (
      <div 
        className={`relative flex flex-col justify-between p-3.5 rounded-sm border-4 transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.75)] ${
          isActive 
            ? 'border-[#8b5a2b] bg-gradient-to-b from-[#311f14] to-[#1c110a] text-[#f4efe8]' 
            : 'border-stone-850 bg-stone-950/80 text-stone-500 opacity-60'
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between border-b border-[#3d2b1f]/60 pb-1.5 mb-2">
          <span className={`text-[9.5px] font-sans font-black tracking-widest uppercase ${isActive ? 'text-amber-500' : 'text-stone-600'}`}>
            {titleSlot}
          </span>
          {onToggleActive && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                pirateAudio.playBell();
                onToggleActive();
              }}
              className={`text-[8.5px] font-sans font-bold px-2 py-0.5 rounded-sm border cursor-pointer transition-colors ${
                isActive 
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-950/50 hover:bg-emerald-900/30' 
                  : 'bg-stone-900 text-stone-500 border-stone-800 hover:bg-stone-850'
              }`}
            >
              {isActive ? "● AKTIF" : "○ NONAKTIF"}
            </button>
          )}
          {!onToggleActive && (
            <span className="text-[8px] font-sans font-bold px-1.5 py-0.5 rounded-sm bg-rose-950/40 text-rose-400 border border-rose-950/50">
              ● KAPTEN ANDA
            </span>
          )}
        </div>

        {isActive ? (
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex gap-3 mb-2">
              <div 
                className="w-13 h-13 rounded-full flex items-center justify-center text-3xl border-2 shrink-0 bg-[#0c0806]/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.95)]"
                style={{ borderColor: char.color }}
              >
                {char.avatar}
              </div>
              <div className="min-w-0">
                <h3 className="font-serif font-black text-xs uppercase tracking-wide truncate" style={{ color: char.color }}>
                  {char.name}
                </h3>
                
                <div className="flex flex-wrap gap-1 mt-1 font-sans">
                  <span className={`text-[8px] px-1.5 py-0.1 select-none font-bold rounded-sm border ${
                    char.difficulty === "Mudah" 
                      ? "text-emerald-400 bg-emerald-950/45 border-emerald-900/40" 
                      : char.difficulty === "Sedang" 
                      ? "text-amber-400 bg-amber-950/45 border-amber-900/40" 
                      : "text-rose-400 bg-rose-950/45 border-rose-900/40"
                  }`}>
                    {char.difficulty}
                  </span>

                  <span className="text-[7.5px] px-1 py-0.1 bg-stone-900 border border-stone-800 rounded-sm text-stone-300 font-bold truncate max-w-[110px]">
                    {char.playstyle}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[9.5px] text-stone-300/80 leading-snug italic line-clamp-2 pb-1.5 border-b border-[#3d2b1f]/40">
              "{char.description}"
            </p>

            <div className="mt-1.5 text-[9px] leading-tight text-[#d4c19c]/80 flex gap-1">
              <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>{char.personalityDesc}</span>
            </div>

            {onOpenChange && (
              <button 
                onClick={onOpenChange}
                className="mt-3 w-full py-1.5 bg-[#432f1b] hover:bg-[#5c4025] text-amber-100 text-[9.5px] font-sans font-black border border-amber-800/20 rounded-sm tracking-wider cursor-pointer select-none transition-colors"
              >
                GANTI BAJAK LAUT
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-stone-600 font-sans">
            <Skull className="w-7 h-7 text-stone-700/60 mb-2.5 animate-pulse" />
            <p className="text-[11px] font-bold uppercase tracking-wider">Slot Kosong</p>
            <p className="text-[9.5px] text-stone-600/70 text-center px-4 mt-0.5 leading-tight">
              Aktifkan slot ini untuk menambahkan pelaut dalam persaingan Nassau
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#070504]/98 flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none font-serif">
      
      {/* Immersive Starry night sea backdrop decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-color-burn">
        <img 
          src="/src/assets/images/pirate_board_center_1779246629628.png" 
          alt="Ancient Treasure Map Parchment Background decorative mesh" 
          className="w-full h-full object-cover filter sepia brightness-[0.35] contrast-125"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040302] via-[#040302]/75 to-transparent" />
      </div>

      <div className="relative bg-[#1a0e07] bg-gradient-to-b from-[#22130a] to-[#0c0604] border-4 border-[#4a3420] p-4 sm:p-5.5 rounded-sm max-w-4xl w-full text-zinc-100 shadow-[0_0_150px_rgba(0,0,0,0.98)] my-auto relative">
        {/* Glowing ship hanging lantern style outer glow borders */}
        <div className="absolute top-2 left-2 bottom-2 right-2 border-2 border-dashed border-[#8b5a2b]/25 rounded-sm pointer-events-none" />

        {/* ==================== PANEL MAIN HEADER CONTROL ==================== */}
        <div className="text-center mb-4 sm:mb-5 relative z-10">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <span className="h-0.5 w-10 sm:w-16 bg-gradient-to-r from-transparent to-amber-500/40" />
            <div className="w-10 sm:w-11 h-10 sm:h-11 bg-[#0c0806]/90 rounded-full flex items-center justify-center border border-amber-500/50 shadow-lg animate-pulse">
              <Skull className="w-5.5 sm:w-6 h-5.5 sm:h-6 text-amber-500" />
            </div>
            <span className="h-0.5 w-10 sm:w-16 bg-gradient-to-l from-transparent to-amber-500/40" />
          </div>
          <h1 className="text-2xl sm:text-3.5xl font-serif font-black text-amber-100 uppercase tracking-widest leading-none text-shadow-md">
            DEK UTAMA DEK LOBBY NASSAU
          </h1>
          <p className="text-[10px] sm:text-xs text-[#d4c19c]/70 font-sans font-bold tracking-widest mt-1.5 uppercase leading-none">
            ⚓ Kapal Mewah Nakhoda • Pelayaran Malam Bajak Laut Mandiri & Kolektif ⚓
          </p>
        </div>

        {/* Global Toolbar Card (Suara/Gold settings) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4.5 font-sans text-xs relative z-10">
          {/* Audio setting card */}
          <div className="flex items-center justify-between p-2.5 bg-[#0c0806]/75 border border-[#3d2b1f]/80 rounded-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-[#d4c19c] font-black uppercase tracking-wider text-[10.5px]">Suara Ombak & Meriam:</span>
            </div>
            <button
              onClick={toggleSound}
              className={`flex items-center gap-1 px-3 py-1 rounded-sm text-[10px] font-black transition-all cursor-pointer border ${
                soundEnabled 
                  ? "bg-amber-400 border-amber-950 text-stone-950 hover:bg-amber-300"
                  : "bg-stone-900 border-stone-800 text-stone-500"
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>AKTIF</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>SENYAP</span>
                </>
              )}
            </button>
          </div>

          {/* Golden Starter Allowance Slider */}
          <div className="flex flex-col justify-center p-2 bg-[#0c0806]/75 border border-[#3d2b1f]/80 rounded-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[#d4c19c] font-black uppercase tracking-wider text-[10.5px]">Emas Awal Pelayaran:</span>
              <span className="text-sm font-serif font-black text-amber-400">
                {startingGold} <span className="text-[10px] text-[#d4c19c]">Gold</span>
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="2500"
              step="100"
              value={startingGold}
              onChange={(e) => setStartingGold(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1 bg-[#120a06] border border-[#3d2b1f]/40 rounded"
            />
          </div>
        </div>

        {/* Toggle switch if currently inside sub-configurations */}
        {viewMode !== 'lobby' && (
          <div className="mb-3 relative z-10">
            <button 
              onClick={() => {
                pirateAudio.playBell();
                setViewMode('lobby');
              }}
              className="px-3.5 py-1.5 bg-[#441212]/90 hover:bg-[#5a1c1c] text-rose-300 border border-rose-900/60 font-sans font-black text-[10px] rounded-sm flex items-center gap-1 cursor-pointer select-none"
            >
              <span>← KEMBALI KE DEK UTAMA LOBBY</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 1: MAIN LOBBY TWO SPLIT MODE CHOICE PANELS                           */}
        {/* ========================================================================= */}
        {viewMode === 'lobby' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative z-10 w-full">
            
            {/* 1. BERMAIN DENGAN TEMAN (Simulated Online Multiplayer Crew Room) */}
            <div className="relative group bg-gradient-to-b from-[#2f1b0f] to-[#120704] border-3 border-[#8b5a2b] p-4.5 rounded-sm flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.85)] hover:border-amber-500/50 transition-all duration-300">
              <div className="absolute top-1 left-1 bottom-1 right-1 border border-dashed border-[#d4c19c]/10 pointer-events-none" />
              
              <div>
                <div className="flex justify-between items-start mb-2.5 border-b border-[#3a2517] pb-2">
                  <div>
                    <span className="text-[8.5px] font-sans font-black uppercase tracking-widest text-[#d4c19c]/60">UTAS BERGABUNG</span>
                    <h3 className="text-lg font-serif font-black text-rose-400 uppercase tracking-widest leading-none mt-1">
                      1. Bermain dengan Teman
                    </h3>
                  </div>
                  <Users className="w-6.5 h-6.5 text-rose-400 shrink-0 fill-rose-950/20" />
                </div>

                <p className="text-[11px] text-stone-300 leading-relaxed font-serif italic mb-3.5">
                  "Menyatukan armada nakhoda di bawah pimpinan satu kamar kemudi online. Kumpulkan maksimal **5 Kapten** legendaris untuk saling menyerang pelabuhan!"
                </p>

                {/* Sub Content Information (Lobby details) */}
                <div className="space-y-2.5 bg-stone-950/65 p-2.5 rounded-sm border border-[#3d2b1f]/50 mb-4 font-sans">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#f4efe8]/90">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Lobby Multiplayer: **{friendCount + 1} Kapten** ({friendCount} teman + Anda)</span>
                  </div>
                  
                  {/* Small avatar checklist representation */}
                  <div className="flex items-center gap-1 py-1">
                    <span className="text-[9px] text-[#d4c19c]/70 uppercase font-bold mr-1 block flex-wrap max-w-full">Awak Kapal ({friendCount + 1}):</span>
                    <div className="flex -space-x-1.5 overflow-hidden">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-amber-500 bg-stone-900 leading-none text-xs">🏴‍☠️</span>
                      {friendCount >= 1 && <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-blue-500 bg-stone-900 leading-none text-xs">🦜</span>}
                      {friendCount >= 2 && <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-emerald-500 bg-stone-900 leading-none text-xs">🐒</span>}
                      {friendCount >= 3 && <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-purple-500 bg-stone-900 leading-none text-xs">🐉</span>}
                      {friendCount >= 4 && <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-teal-500 bg-stone-900 leading-none text-xs">🦊</span>}
                      {friendCount >= 5 && <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-rose-500 bg-stone-900 leading-none text-xs">🐙</span>}
                    </div>
                  </div>

                  {/* Pilih Jumlah Teman Option */}
                  <div className="pt-2 border-t border-[#3d2b1f]/40">
                    <div className="flex justify-between items-center text-[10px] text-stone-300 font-bold mb-1.5 uppercase">
                      <span className="flex items-center gap-1 text-[#d4c19c]">
                        <Users className="w-3.5 h-3.5 text-rose-450 shrink-0" />
                        Pilih Jumlah Teman:
                      </span>
                      <span className="text-rose-400 font-black">{friendCount} Teman</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => {
                            pirateAudio.playBell();
                            setFriendCount(count);
                          }}
                          className={`py-1 rounded-sm text-[9px] font-black cursor-pointer border transition-colors ${
                            friendCount === count 
                              ? 'bg-rose-900 text-[#f4efe8] border-rose-500 shadow-md' 
                              : 'bg-stone-900 text-stone-400 border-stone-850 hover:bg-stone-850'
                          }`}
                        >
                          {count} Teman
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between border-t border-stone-900 pt-2.5">
                    <span className="text-[9.5px] text-[#d4c19c]/90 uppercase font-black">Pilih Karakter Utama Anda:</span>
                    <button 
                      onClick={() => setSelectingSlot('user')}
                      className="px-2 py-0.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded text-[9px] font-bold cursor-pointer"
                    >
                      {userChar.avatar} Ubah ({userChar.name.replace("Kapten ", "")})
                    </button>
                  </div>
                </div>

                {/* Multi Online Join Inputs */}
                <div className="space-y-2 font-sans">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-2.5 top-2 w-3.5 h-3.5 text-stone-500" />
                      <input 
                        type="text" 
                        placeholder="Masukkan Kode Kamur (contoh: 8092)"
                        value={roomCodeInput}
                        onChange={(e) => setRoomCodeInput(e.target.value)}
                        className="w-full bg-[#110804] border border-[#5c3e21] rounded-sm pl-8 pr-2 py-1.5 text-xs font-mono tracking-widest text-[#f4efe8] placeholder-stone-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 font-sans">
                {/* CREATE ROOM BUTTON */}
                <button
                  onClick={handleCreateRoom}
                  disabled={multiplayerStatus !== 'idle'}
                  className="w-full py-2 bg-gradient-to-b from-[#4d1010] to-[#2d0a0a] hover:from-[#661b1b] hover:to-[#401212] border border-rose-900 text-rose-200 text-[10.5px] font-black uppercase rounded-sm flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{multiplayerStatus === 'creating' ? "MEMBUAT..." : "Buat Room"}</span>
                </button>

                {/* JOIN ROOM BUTTON */}
                <button
                  onClick={handleJoinRoom}
                  disabled={multiplayerStatus !== 'idle'}
                  className="w-full py-2 bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border border-[#d4c19c]/20 text-[#0c0806] text-[10.5px] font-black uppercase rounded-sm flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <Radio className="w-3.5 h-3.5 text-stone-950 shrink-0" />
                  <span>{multiplayerStatus === 'joining' ? "MENGGABUNG..." : "Gabung Room"}</span>
                </button>
              </div>

            </div>

            {/* 2. BERMAIN DENGAN BOT (Singleplayer Skirmish presets and configs) */}
            <div className="relative group bg-gradient-to-b from-[#241a14] to-[#0c0704] border-3 border-[#5c3e21] p-4.5 rounded-sm flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.85)] hover:border-amber-500/50 transition-all duration-300">
              <div className="absolute top-1 left-1 bottom-1 right-1 border border-dashed border-[#d4c19c]/10 pointer-events-none" />

              <div>
                <div className="flex justify-between items-start mb-2.5 border-b border-[#3a2517] pb-2">
                  <div>
                    <span className="text-[8.5px] font-sans font-black uppercase tracking-widest text-[#d4c19c]/60">PELAYARAN TRADISIONAL</span>
                    <h3 className="text-lg font-serif font-black text-amber-500 uppercase tracking-widest leading-none mt-1">
                      2. Bermain dengan Bot
                    </h3>
                  </div>
                  <Bot className="w-6.5 h-6.5 text-amber-400 shrink-0" />
                </div>

                <p className="text-[11px] text-stone-300 leading-relaxed font-serif italic mb-3">
                  "Uji kelihaian taktis Anda sendirian mengitari pelabuhan komando melawan intel kecerdasan buatan (AI) kapten bajak laut tangguh!"
                </p>

                {/* Bot Quick configurations selection inside card */}
                <div className="bg-stone-950/70 p-3 rounded-sm border border-[#3d2b1f]/50 mb-3 space-y-3 font-sans">
                  
                  {/* Select Bot Count Option */}
                  <div>
                    <div className="flex justify-between text-[10px] text-stone-300 font-bold mb-1.5 uppercase">
                      <span>Pilih Jumlah Bot Lawan:</span>
                      <span className="text-amber-400 font-black">{botCount} Bot</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[1, 2, 3, 4].map((count) => (
                        <button
                          key={count}
                          onClick={() => {
                            pirateAudio.playBell();
                            setBotCount(count);
                          }}
                          className={`py-1 text-[10px] font-black rounded-sm border cursor-pointer transition-colors ${
                            botCount === count 
                              ? 'bg-amber-400 text-stone-950 border-amber-500' 
                              : 'bg-stone-900 text-stone-400 border-stone-800 hover:bg-stone-850'
                          }`}
                        >
                          {count} Opp
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select Bot Difficulty Option */}
                  <div>
                    <div className="flex justify-between text-[10px] text-stone-300 font-bold mb-1.5 uppercase">
                      <span>Tingkat Kesulitan Bot AI:</span>
                      <span className={`font-black ${
                        botDifficulty === 'Mudah' ? 'text-emerald-400' : botDifficulty === 'Sedang' ? 'text-amber-400' : 'text-rose-400'
                      }`}>{botDifficulty}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {(['Mudah', 'Sedang', 'Sulit'] as any[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => {
                            pirateAudio.playBell();
                            setBotDifficulty(level);
                          }}
                          className={`py-1 text-[10px] font-black rounded-sm border cursor-pointer transition-colors ${
                            botDifficulty === level
                              ? 'bg-amber-400 text-stone-300 border-amber-400'
                              : 'bg-stone-900 text-stone-400 border-stone-800'
                          }`}
                          style={botDifficulty === level ? { 
                            backgroundColor: level === 'Mudah' ? '#14532d' : level === 'Sedang' ? '#78350f' : '#7f1d1d',
                            borderColor: level === 'Mudah' ? '#22c55e' : level === 'Sedang' ? '#eab308' : '#ef4444',
                            color: '#ffff'
                          } : {}}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Selected Bot Opponents Face Row */}
                  <div>
                    <span className="text-[9.5px] font-black text-[#d4c19c] block mb-1 uppercase">Karakter Bot Yang Dilawan:</span>
                    
                    <div className="flex gap-2 flex-wrap py-1 border-t border-stone-900 mt-1">
                      {selectedBotTemplateIds.map((templateId, idx) => {
                        const charObj = TEMPLATE_CAPTAINS.find(c => c.charId === templateId) || TEMPLATE_CAPTAINS[1];
                        return (
                          <div 
                            key={idx}
                            onClick={() => {
                              pirateAudio.playBell();
                              setSelectingSlot('quick_bot');
                              setQuickBotToReplaceIndex(idx);
                            }}
                            className="bg-[#110804] border border-[#8b5a2b]/35 px-1.5 py-1 rounded flex items-center gap-1 text-[10px] hover:border-amber-400 cursor-pointer text-[#f4efe8]"
                          >
                            <span className="text-xs">{charObj.avatar}</span>
                            <span className="font-bold truncate max-w-[80px]">{charObj.name.replace("Kapten ", "")}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>

              {/* Action buttons list for Bots */}
              <div className="grid grid-cols-2 gap-2 font-sans mt-3">
                {/* EXPERT CUSTOMIZER LINK */}
                <button
                  onClick={() => {
                    pirateAudio.playBell();
                    setViewMode('custom_bots');
                  }}
                  className="w-full py-2 bg-gradient-to-b from-[#3a2517] to-[#1a100a] text-amber-200 border border-[#8b5a2b]/50 hover:bg-stone-900 text-[10.5px] font-black uppercase rounded-sm flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-500" />
                  <span>Kustom Level</span>
                </button>

                {/* FAST LAUNCH ACTION */}
                <button
                  onClick={handleQuickStartBots}
                  className="w-full py-2 bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600 text-[10.5px] font-black uppercase rounded-sm flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95 shadow-[0_3px_10px_rgba(245,158,11,0.3)] animate-pulse"
                >
                  <Play className="w-3.5 h-3.5 fill-stone-950 shrink-0" />
                  <span>Mulai Cepat</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 2: SIMULATED MULTIPLAYER WAITING LOBBY                               */}
        {/* ========================================================================= */}
        {viewMode === 'multiplayer_lobby' && (
          <div className="bg-[#100703]/90 border-2 border-dashed border-rose-900/60 p-4 rounded-sm relative z-10 font-sans shadow-inner">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-rose-950 pb-3 mb-3 gap-2.5">
              <div>
                <span className="inline-block text-[8px] px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-900 rounded font-black tracking-widest uppercase mb-1">
                  🔴 KONEKSI SIMULASI AMAN
                </span>
                <h3 className="text-base font-serif font-black text-amber-400 uppercase tracking-wide">
                  Ruang Kemudi Kamar: <span className="font-mono text-rose-400 tracking-widest bg-stone-950 px-2.5 py-1 rounded shadow-inner ml-1 border border-stone-900 select-all">{roomCode}</span>
                </h3>
              </div>
              <div className="text-[10px] leading-tight text-stone-400 text-left sm:text-right flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Saluran Pelayaran Nassau Sinkron Aktif</span>
              </div>
            </div>

            <p className="text-[10.5px] text-stone-300 font-serif italic mb-3 leading-relaxed">
              *Raja Bajak Laut sedang mengirimkan hembusan lilin gaib ke seluruh perairan Nassau. Teman-teman Anda terdeteksi mendarat satu per satu di dek kemudi Anda:*
            </p>

            {/* Simulated Peers Joined Card Grid */}
            <div className="space-y-2 mb-5">
              {lobbyPlayers.map((p, idx) => (
                <div 
                  key={p.id} 
                  className="flex items-center justify-between p-2.5 bg-stone-950/80 border border-[#3d2b1f]/50 rounded shadow-md animate-fadeIn"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-lg border bg-stone-900 shadow-inner"
                      style={{ borderColor: p.color }}
                    >
                      {p.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black" style={{ color: p.color }}>{p.name}</span>
                        {p.isHost && (
                          <span className="text-[7px] font-black bg-amber-400 text-stone-950 px-1 py-0.2 rounded uppercase">HOST</span>
                        )}
                        {!p.isHost && idx === 1 && (
                          <span className="text-[7.5px] font-black bg-rose-500/10 text-rose-400 border border-rose-900/40 px-1 py-0.2 rounded uppercase animate-pulse">BERHASIL JOIN</span>
                        )}
                      </div>
                      <span className="text-[9.5px] text-stone-400 block italic leading-tight mt-0.5">{p.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-emerald-400 text-[10px] font-bold">READY</span>
                  </div>
                </div>
              ))}

              {/* Waiting placeholders */}
              {lobbyPlayers.length < friendCount + 1 && (
                <div className="p-3 bg-[#0d0705]/40 border border-stone-900 rounded border-dashed flex items-center justify-center gap-2 text-stone-500 animate-pulse text-xs">
                  <RefreshCw className="w-4.5 h-4.5 animate-spin text-amber-500/25" />
                  <span className="font-serif">Menunggu kapten kapal lain bersandar ({lobbyPlayers.length}/{friendCount + 1})...</span>
                </div>
              )}
            </div>

            {/* Starting info */}
            <div className="flex items-start gap-2 p-2.5 bg-amber-950/20 border border-amber-600/20 rounded mb-4 text-[#d4c19c] font-sans text-[10px] leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 select-none" />
              <span>Multiplayer disimulasikan secara **Peer-To-Peer** langsung pada peranti browser Anda tanpa lag jaringan! Semua rival dikendalikan oleh taktik kepribadian bajak laut teman orisinal yang cerdas.</span>
            </div>

            {/* Launch multiplayer game button */}
            <button
              onClick={handleStartSimulatedMultiplayerGame}
              disabled={lobbyPlayers.length < friendCount + 1}
              className="w-full py-3.5 bg-gradient-to-b from-[#e1b15c] to-[#b8860b] hover:from-[#f2c77d] hover:to-[#cd9a21] text-stone-950 font-serif font-black text-sm rounded-sm transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 inline-flex"
            >
              <Anchor className="w-5 h-5 text-stone-950" />
              <span>MULAI PELAYARAN MULTIPLAYER BER-{friendCount + 1}!</span>
            </button>

          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 3: ORIGINAL/EXPERT CUSTOMIZER SLOT CHARACTER GRIDS                   */}
        {/* ========================================================================= */}
        {viewMode === 'custom_bots' && (
          <div className="space-y-4.5 relative z-10">
            {/* Step Title */}
            <div className="border-b-2 border-[#3d2b1f]/70 pb-1 flex items-center gap-1.5">
              <Map className="w-4 h-4 text-[#d4c19c]" />
              <h2 className="text-xs uppercase font-sans font-black tracking-widest text-[#d4c19c]">
                KOMPOSISI AWAK PELAUT & RIVAL BAJAK LAUT (TETAPKAN UTUSAN)
              </h2>
            </div>

            {/* 4 Cards Main Slots Configuration Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Player Slot */}
              {renderPirateCard("KAPAL ANDA (MANUSIA)", userChar, true, undefined, () => {
                pirateAudio.playBell();
                setSelectingSlot("user");
              })}

              {/* 2. Bot Slot 1 (Mandatory Opponent) */}
              {renderPirateCard("SAINGAN BOT 1 (AI)", bot1Char, true, undefined, () => {
                pirateAudio.playBell();
                setSelectingSlot("bot1");
              })}

              {/* 3. Bot Slot 2 */}
              {renderPirateCard("SAINGAN BOT 2 (AI)", bot2Char, bot2Active, () => {
                setBot2Active(!bot2Active);
              }, () => {
                pirateAudio.playBell();
                setSelectingSlot("bot2");
              })}

              {/* 4. Bot Slot 3 */}
              {renderPirateCard("SAINGAN BOT 3 (AI)", bot3Char, bot3Active, () => {
                setBot3Active(!bot3Active);
              }, () => {
                pirateAudio.playBell();
                setSelectingSlot("bot3");
              })}
            </div>

            {/* Launch Game Custom bots Button */}
            <button
              onClick={handleStartCustomBots}
              className="w-full py-3.5 bg-gradient-to-b from-amber-400 to-[#b8860b] hover:from-amber-300 hover:to-[#cd9a21] text-[#0c0806] font-serif font-black text-base rounded-sm transition-all duration-300 transform active:scale-95 inline-flex items-center justify-center gap-2 border-2 border-[#1a120b] cursor-pointer"
            >
              <Anchor className="w-5.5 h-5.5 text-[#1a120b]" />
              <span>MULAI PERANG LAUT CUSTOM!</span>
            </button>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* POPUP SELECTION MODAL CATALOG DESIGNS FOR SELECTION                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectingSlot !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#040201]/95 flex items-center justify-center p-4"
          >
            <div className="relative bg-[#1f120a] border-4 border-[#8b5a2b] p-4.5 md:p-5.5 rounded-sm w-full max-w-4xl text-[#f4efe8] shadow-[0_0_80px_rgba(0,0,0,0.98)] max-h-[92vh] overflow-y-auto">
              
              <button 
                onClick={() => {
                  pirateAudio.playBell();
                  setSelectingSlot(null);
                  setQuickBotToReplaceIndex(null);
                }}
                className="absolute top-4 right-4 text-[#d4c19c] hover:text-[#f4efe8] p-1.5 rounded-full hover:bg-stone-900 border border-[#8b5a2b]/30 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-5 border-b border-[#3d2b1f] pb-3">
                <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-500 uppercase tracking-widest">
                  darma nakhoda bajak laut
                </h2>
                <p className="text-[11px] font-sans font-bold text-[#d4c19c]/80 mt-1 uppercase tracking-wider">
                  Sewa salah satu Kapten Legendaris di bawah ini untuk menduduki posisi: <span className="text-amber-400">
                    {selectingSlot === "user" ? "KAPAL ANDA (MANUSIA)" : selectingSlot === "quick_bot" ? "PRESET BOT LAWAN" : selectingSlot === "bot1" ? "SAINGAN BOT 1" : selectingSlot === "bot2" ? "SAINGAN BOT 2" : "SAINGAN BOT 3"}
                  </span>
                </p>
              </div>

              {/* 8 Captain template Catalog List Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {TEMPLATE_CAPTAINS.map((char) => {
                  const idInSlots = currentSelectionList();
                  const isAlreadySailed = idInSlots.includes(char.charId);
                  
                  let isCurrentInThisSlot = false;
                  if (selectingSlot === "user" && userTemplateId === char.charId) isCurrentInThisSlot = true;
                  else if (selectingSlot === "bot1" && bot1TemplateId === char.charId) isCurrentInThisSlot = true;
                  else if (selectingSlot === "bot2" && bot2TemplateId === char.charId) isCurrentInThisSlot = true;
                  else if (selectingSlot === "bot3" && bot3TemplateId === char.charId) isCurrentInThisSlot = true;
                  else if (selectingSlot === "quick_bot" && quickBotToReplaceIndex !== null) {
                    isCurrentInThisSlot = selectedBotTemplateIds[quickBotToReplaceIndex] === char.charId;
                  }

                  const canSelect = !isAlreadySailed || isCurrentInThisSlot;

                  return (
                    <div
                      key={char.charId}
                      onClick={() => {
                        if (canSelect) {
                          handleSelectCharacter(char.charId);
                        }
                      }}
                      className={`relative flex flex-col justify-between p-3.5 rounded-sm border-2 transition-all duration-300 text-left cursor-pointer ${
                        isCurrentInThisSlot 
                          ? "bg-[#1a120b] border-amber-400 text-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                          : !canSelect
                          ? "bg-stone-900/60 border-stone-850 text-stone-600 opacity-40 cursor-not-allowed"
                          : "bg-gradient-to-tr from-[#2d1b0f] to-[#3a2517] border-[#8b5a2b]/50 text-stone-100 hover:border-[#b8860b] hover:shadow-[0_0_10px_rgba(139,90,43,0.3)]"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="w-11 h-11 rounded-full flex items-center justify-center text-2xl border bg-[#0c0806]/85 shadow-md flex-shrink-0"
                          style={{ borderColor: char.color }}
                        >
                          {char.avatar}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-serif font-black text-xs uppercase tracking-wide truncate" style={{ color: char.color }}>
                            {char.name}
                          </h4>
                          <span className={`inline-block text-[8px] px-1 py-0.1 select-none mt-0.5 font-bold rounded-sm border ${
                            char.difficulty === "Mudah" 
                              ? "text-emerald-400 bg-emerald-950/25 border-emerald-900/35" 
                              : char.difficulty === "Sedang" 
                              ? "text-amber-400 bg-amber-950/25 border-amber-900/35" 
                              : "text-rose-400 bg-rose-950/25 border-rose-900/35"
                          }`}>
                            {char.difficulty}
                          </span>
                        </div>
                      </div>

                      <p className="text-[9.5px] text-stone-300 leading-snug line-clamp-3 italic mb-2">
                        "{char.description}"
                      </p>

                      <div className="mt-auto border-t border-[#3d2b1f] pt-2">
                        <span className="text-[8px] block uppercase font-sans font-bold text-amber-500 leading-none">
                          Kecenderungan Taktik:
                        </span>
                        <p className="text-[9px] text-[#d4c19c] mt-0.5 leading-tight font-black">
                          {char.playstyle}
                        </p>
                      </div>

                      {isCurrentInThisSlot && (
                        <div className="absolute top-2 right-2 bg-amber-500 text-[#0c0806] text-[7.5px] font-sans font-black px-1.5 py-0.2 rounded uppercase">
                          TERPILIH
                        </div>
                      )}
                      {!isCurrentInThisSlot && isAlreadySailed && (
                        <div className="absolute top-2 right-2 bg-rose-950/90 text-rose-400 border border-rose-900/40 text-[7px] font-sans font-black px-1 py-0.2 rounded uppercase">
                          AKTIF DI SLOT LAIN
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
