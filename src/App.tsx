import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, BoardCell, GameLog, PirateCard, CellType } from './types';
import { INITIAL_CELLS, CAPTAIN_CHARACTERS, PROPERTY_GROUP_COLORS } from './data/boardData';
import { CHANCE_CARDS, COMMUNITY_CARDS } from './data/cardsData';
import { GameBoard } from './components/GameBoard';
import { PlayerSetup } from './components/PlayerSetup';
import { PlayerConsole } from './components/PlayerConsole';
import { pirateAudio } from './utils/audio';
import { 
  Skull, 
  Anchor, 
  Compass, 
  Coins, 
  User, 
  Bot, 
  HelpCircle, 
  Sparkles, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Award,
  BookOpen,
  X,
  House,
  Shield
} from 'lucide-react';

export default function App() {
  // Game state
  const [cells, setCells] = useState<BoardCell[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerId, setActivePlayerId] = useState<number>(1);
  const [dice, setDice] = useState<[number, number]>([0, 0]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [doubleCount, setDoubleCount] = useState<number>(0);
  const [accumulatedTax, setAccumulatedTax] = useState<number>(100); // starts with some bounty
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'gameover'>('setup');
  const [winnerId, setWinnerId] = useState<number | null>(null);

  // Active drawn card state
  const [activeCard, setActiveCard] = useState<PirateCard | null>(null);

  // Inspect selection state
  const [inspectCell, setInspectCell] = useState<BoardCell | null>(null);

  // Interactive menu toggles
  const [showBuildManager, setShowBuildManager] = useState<boolean>(false);
  const [bgSound, setBgSound] = useState<boolean>(true);

  // AI orchestrator state variable
  const [aiIsThinking, setAiIsThinking] = useState<boolean>(false);
  const [aiThinkingText, setAiThinkingText] = useState<string>("");

  // Moving transitions and AI resolution flags
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [aiHasResolvedLanding, setAiHasResolvedLanding] = useState<boolean>(false);

  // Refs for auto scrolling logs
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Reference to hold the active AI timeout so it doesn't get canceled and rescheduled repeatedly
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial configuration
  useEffect(() => {
    // Reset configurations on load
    setCells(JSON.parse(JSON.stringify(INITIAL_CELLS)));
    addLog("Selamat datang di Papan Permainan Monopoli Bajak Laut! Konfigurasikan pelayaran Anda.", "info");
  }, []);

  // Sync automatic scrolling of game logs
  useEffect(() => {
    const el = document.getElementById("logs-scrolling-box");
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [gameLogs]);

  // Handle Turn Reset variables on turn changes
  useEffect(() => {
    // Clear any active AI timers on turn swap to prevent double or stale execution
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    setAiHasResolvedLanding(false);
    if (gamePhase === 'playing') {
      const activePlayer = players.find(p => p.id === activePlayerId);
      if (activePlayer) {
        setInspectCell(cells[activePlayer.position] || null);
      }
    }
  }, [activePlayerId, gamePhase]);

  // Unified State-Based AI Engine
  useEffect(() => {
    if (gamePhase !== 'playing') return;

    const activePlayer = players.find(p => p.id === activePlayerId);
    if (!activePlayer || activePlayer.isBankrupt || !activePlayer.isAI) {
      if (aiIsThinking) {
        setAiIsThinking(false);
        setAiThinkingText("");
      }
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
      return;
    }

    // Prohibit overlapping executions if a timer is already active
    if (aiTimeoutRef.current) return;

    // AI execution depends on current turn state:
    const hasRolled = dice[0] !== 0;

    // Phase 1: Roll the Dice
    if (!hasRolled && !isRolling && !isMoving && !aiHasResolvedLanding) {
      if (activePlayer.inJail) {
        if (activePlayer.jailFreeCards > 0) {
          setAiIsThinking(true);
          setAiThinkingText(`${activePlayer.name} menyerahkan piagam pembebasan kramat...`);
          aiTimeoutRef.current = setTimeout(() => {
            aiTimeoutRef.current = null;
            useJailFreeCard();
            setAiIsThinking(false);
          }, 1000);
        } else if (activePlayer.money >= 150) {
          setAiIsThinking(true);
          setAiThinkingText(`${activePlayer.name} menyogok sipir penjara dengan emas...`);
          aiTimeoutRef.current = setTimeout(() => {
            aiTimeoutRef.current = null;
            payBribeToEscape();
            setAiIsThinking(false);
          }, 1000);
        } else {
          setAiIsThinking(true);
          setAiThinkingText(`${activePlayer.name} bersiap mengocok dadu kebebasan...`);
          aiTimeoutRef.current = setTimeout(() => {
            aiTimeoutRef.current = null;
            rollDice();
            setAiIsThinking(false);
          }, 1000);
        }
      } else {
        setAiIsThinking(true);
        setAiThinkingText(`${activePlayer.name} sibuk mempelajari arah mata angin...`);
        aiTimeoutRef.current = setTimeout(() => {
          aiTimeoutRef.current = null;
          rollDice();
          setAiIsThinking(false);
        }, 800);
      }
      return;
    }

    // Phase 2: Active Card Modal
    if (activeCard !== null) {
      setAiIsThinking(true);
      setAiThinkingText(`${activePlayer.name} menerima takdir petualang...`);
      aiTimeoutRef.current = setTimeout(() => {
        aiTimeoutRef.current = null;
        handleDismissCard();
        setAiHasResolvedLanding(true);
        setAiIsThinking(false);
        setAiThinkingText("");
      }, 1500);
      return;
    }

    // Phase 3: Landed Resolution
    if (hasRolled && !isRolling && !isMoving && !activeCard && !aiHasResolvedLanding) {
      const currentCell = cells[activePlayer.position];
      const isUnowned = currentCell && currentCell.ownerId === null && (currentCell.type === 'property' || currentCell.type === 'railroad' || currentCell.type === 'utility');
      const canBuy = isUnowned && activePlayer.hasPassedStart && activePlayer.money >= (currentCell?.price || 0);

      const isOwnedByOther = currentCell && currentCell.ownerId !== null && currentCell.ownerId !== activePlayer.id && !currentCell.isMortgaged;
      const hasRentOwed = isOwnedByOther;
      const hasTaxOwed = currentCell?.type === 'tax';

      if (hasRentOwed) {
        let rentValue = 0;
        if (currentCell.type === 'property' && currentCell.rent) {
          const siblingCells = cells.filter(c => c.group === currentCell.group);
          const isFullGroupOwnedBySame = siblingCells.every(c => c.ownerId === currentCell.ownerId);
          const level = currentCell.cabins;
          if (level === 0) {
            rentValue = isFullGroupOwnedBySame ? currentCell.rent[0] * 2 : currentCell.rent[0];
          } else {
            rentValue = currentCell.rent[level];
          }
        } else if (currentCell.type === 'railroad') {
          const ownedPorts = cells.filter(c => c.type === 'railroad' && c.ownerId === currentCell.ownerId).length;
          rentValue = 25 * Math.pow(2, ownedPorts - 1);
        } else if (currentCell.type === 'utility') {
          const ownedServices = cells.filter(c => c.type === 'utility' && c.ownerId === currentCell.ownerId).length;
          const diceSum = dice[0] + dice[1];
          rentValue = ownedServices === 2 ? diceSum * 10 : diceSum * 4;
        }

        if (activePlayer.money < rentValue) {
          const aiProperties = cells.filter(c => c.ownerId === activePlayer.id && !c.isMortgaged);
          if (aiProperties.length > 0) {
            setAiIsThinking(true);
            setAiThinkingText(`${activePlayer.name} terbelit hutang sewa! Menggadaikan pulau...`);
            aiTimeoutRef.current = setTimeout(() => {
              aiTimeoutRef.current = null;
              let tempMoney = activePlayer.money;
              for (const prop of aiProperties) {
                if (tempMoney >= rentValue) break;
                if (prop.mortgage) {
                  mortgageProperty(prop.id);
                  tempMoney += prop.mortgage;
                }
              }
              setAiIsThinking(false);
            }, 1000);
            return;
          } else {
            // Cannot raise money, bankruptcy will trigger in endTurn()
            setAiIsThinking(true);
            setAiThinkingText(`${activePlayer.name} bangkrut total di pulau ini...`);
            aiTimeoutRef.current = setTimeout(() => {
              aiTimeoutRef.current = null;
              setAiHasResolvedLanding(true);
              setAiIsThinking(false);
            }, 1000);
            return;
          }
        } else {
          setAiIsThinking(true);
          setAiThinkingText(`${activePlayer.name} menyetor upeti tambat ${rentValue} G...`);
          aiTimeoutRef.current = setTimeout(() => {
            aiTimeoutRef.current = null;
            payRent();
            setAiHasResolvedLanding(true);
            setAiIsThinking(false);
            setAiThinkingText("");
          }, 1000);
          return;
        }
      }

      if (hasTaxOwed) {
        const taxVal = currentCell?.price || 100;
        if (activePlayer.money < taxVal) {
          const aiProperties = cells.filter(c => c.ownerId === activePlayer.id && !c.isMortgaged);
          if (aiProperties.length > 0) {
            setAiIsThinking(true);
            setAiThinkingText(`${activePlayer.name} denda bea cukai! Menggadaikan pangkalan...`);
            aiTimeoutRef.current = setTimeout(() => {
              aiTimeoutRef.current = null;
              let tempMoney = activePlayer.money;
              for (const prop of aiProperties) {
                if (tempMoney >= taxVal) break;
                if (prop.mortgage) {
                  mortgageProperty(prop.id);
                  tempMoney += prop.mortgage;
                }
              }
              setAiIsThinking(false);
            }, 1000);
            return;
          } else {
            setAiIsThinking(true);
            setAiThinkingText(`${activePlayer.name} denda bea cukai bangkrut...`);
            aiTimeoutRef.current = setTimeout(() => {
              aiTimeoutRef.current = null;
              setAiHasResolvedLanding(true);
              setAiIsThinking(false);
            }, 1000);
            return;
          }
        } else {
          setAiIsThinking(true);
          setAiThinkingText(`${activePlayer.name} menyetor upeti denda ${taxVal} G...`);
          aiTimeoutRef.current = setTimeout(() => {
            aiTimeoutRef.current = null;
            payTax();
            setAiHasResolvedLanding(true);
            setAiIsThinking(false);
            setAiThinkingText("");
          }, 1000);
          return;
        }
      }

      if (canBuy) {
        let buyDecision = false;
        const remainder = activePlayer.money - (currentCell.price || 0);
        if (activePlayer.aiPersonality === 'Aggressive' && remainder >= 30) {
          buyDecision = true;
        } else if (activePlayer.aiPersonality === 'Cunning' && remainder >= 100) {
          buyDecision = true;
        } else if (activePlayer.aiPersonality === 'Conservative' && remainder >= 200) {
          buyDecision = true;
        }

        setAiIsThinking(true);
        if (buyDecision) {
          setAiThinkingText(`${activePlayer.name} memancangkan bendera klaim di ${currentCell.indonesianName}...`);
          aiTimeoutRef.current = setTimeout(() => {
            aiTimeoutRef.current = null;
            buyProperty();
            setAiHasResolvedLanding(true);
            setAiIsThinking(false);
            setAiThinkingText("");
          }, 1000);
        } else {
          setAiThinkingText(`${activePlayer.name} melewati pantai ${currentCell.indonesianName}...`);
          aiTimeoutRef.current = setTimeout(() => {
            aiTimeoutRef.current = null;
            setAiHasResolvedLanding(true);
            setAiIsThinking(false);
            setAiThinkingText("");
          }, 800);
        }
        return;
      }

      // Optional property management (building cabins)
      const myProperties = cells.filter(c => c.ownerId === activePlayer.id && c.type === 'property');
      const uniqueGroups = Array.from(new Set(myProperties.map(c => c.group).filter(Boolean)));
      let builtSomething = false;

      if (activePlayer.money > 250) {
        for (const group of uniqueGroups) {
          const siblings = cells.filter(c => c.group === group);
          const ownsAll = siblings.every(c => c.ownerId === activePlayer.id);
          if (ownsAll) {
            const buildTarget = siblings.find(c => c.cabins < 5 && c.cabinCost && activePlayer.money > (c.cabinCost + 150));
            if (buildTarget && buildTarget.cabinCost) {
              builtSomething = true;
              setAiIsThinking(true);
              setAiThinkingText(`${activePlayer.name} mendirikan bangunan kabin di ${buildTarget.indonesianName}...`);
              aiTimeoutRef.current = setTimeout(() => {
                aiTimeoutRef.current = null;
                buildCabin(buildTarget.id);
                setAiIsThinking(false);
                setAiThinkingText("");
              }, 1000);
              return;
            }
          }
        }
      }

      if (!builtSomething) {
        setAiHasResolvedLanding(true);
      }
    }

    // Phase 4: End Turn
    if (hasRolled && !isRolling && !isMoving && !activeCard && aiHasResolvedLanding) {
      setAiIsThinking(true);
      setAiThinkingText(`${activePlayer.name} menyelesaikan pelayaran giliran...`);
      aiTimeoutRef.current = setTimeout(() => {
        aiTimeoutRef.current = null;
        setAiIsThinking(false);
        setAiThinkingText("");
        endTurn();
      }, 1000);
      return;
    }

  }, [gamePhase, activePlayerId, players, cells, dice, isRolling, isMoving, activeCard, aiHasResolvedLanding, aiIsThinking]);

  // Utility to add console logs
  const addLog = (message: string, type: GameLog['type'] = 'info', playerId?: number) => {
    const time = new Date();
    const timestamp = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
    
    setGameLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        timestamp,
        playerId,
        message,
        type,
      }
    ]);
  };

  // Launch Pirate Monopoly Game Setup
  const handleStartGame = (
    selectedId: number,
    startingGold: number,
    playersConfig: typeof CAPTAIN_CHARACTERS,
    soundEnabled: boolean
  ) => {
    // Create actual player models
    const activePlayerSet: Player[] = playersConfig.map((char) => ({
      id: char.id,
      name: char.name,
      avatar: char.avatar,
      color: char.color,
      textColor: char.textColor,
      bgColor: char.bgColor,
      position: 0,
      money: startingGold,
      isBankrupt: false,
      inJail: false,
      jailTurns: 0,
      isAI: char.isAI,
      aiPersonality: char.aiPersonality || "Cunning",
      jailFreeCards: 0,
      hasPassedStart: false
    }));

    setPlayers(activePlayerSet);
    setCells(JSON.parse(JSON.stringify(INITIAL_CELLS)));
    setDice([0, 0]);
    setDoubleCount(0);
    setAccumulatedTax(150); // initial Nassau pirate reserve
    setGamePhase('playing');
    setActivePlayerId(selectedId);
    setBgSound(soundEnabled);
    pirateAudio.setEnabled(soundEnabled);

    // Initial Inspect Cell set to Go/START
    setInspectCell(INITIAL_CELLS[0]);

    setGameLogs([]); // Clear logs for a fresh match
    addLog(`🚢 Bendera Hitam Dikibarkan! Petualangan dimulai dengan modal awal ${startingGold} koin emas per Kapten.`, 'info');
    
    const startingCaptain = activePlayerSet.find(p => p.id === selectedId);
    if (startingCaptain) {
      addLog(`Kemudi giliran pertama dipegang oleh ${startingCaptain.name}!`, 'info', selectedId);
    }
  };

  // Escaping jail calculations
  const payBribeToEscape = () => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === activePlayerId) {
          addLog(`${p.name} membayar sogokan 50 koin emas kepada petugas kolonial dan berhasil lepas dari Davy Jones' Locker!`, 'jail', activePlayerId);
          return {
            ...p,
            money: Math.max(0, p.money - 50),
            inJail: false,
            jailTurns: 0,
          };
        }
        return p;
      })
    );
  };

  const useJailFreeCard = () => {
    const p = players.find((pl) => pl.id === activePlayerId);
    if (!p || p.jailFreeCards === 0) return;

    setPlayers((prev) =>
      prev.map((pl) => {
        if (pl.id === activePlayerId) {
          addLog(`${pl.name} menunjukkan Piagam Pengampunan kramat dan berlayar bebas dari Penjara tanpa membayar sepeser pun koin!`, 'jail', activePlayerId);
          return {
            ...pl,
            jailFreeCards: pl.jailFreeCards - 1,
            inJail: false,
            jailTurns: 0,
          };
        }
        return pl;
      })
    );
  };

  // STEP BY STEP TOKEN MOVEMENT ANIMATION (The "Hop" effect)
  const animateMovement = (playerId: number, steps: number, totalDice: number, isDouble: boolean) => {
    let currentStep = 0;
    const intervalTime = 150; // ms per step for dynamic smooth visual timing

    const activePl = players.find(p => p.id === playerId);
    if (!activePl) return;

    setIsMoving(true);

    // Play movement clicking ship bells
    const movementTimer = setInterval(() => {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === playerId) {
            const nextPosition = (p.position + 1) % 40;
            pirateAudio.playBell();

            // Check if they passed START (Anchor's Aweigh)
            if (nextPosition === 0) {
              addLog(`Melewati jangkar awal! Raja Bajak Laut memberikan upah pelayaran sebesar 40 Emas.`, 'buy', playerId);
              return {
                ...p,
                position: nextPosition,
                money: p.money + 40,
                hasPassedStart: true
              };
            }

            return {
              ...p,
              position: nextPosition
            };
          }
          return p;
        })
      );

      currentStep++;
      if (currentStep >= steps) {
        clearInterval(movementTimer);
        // Step animation concluded! Execute tile triggers
        setTimeout(() => {
          setIsMoving(false);
          handleLandingEffects(playerId, totalDice, isDouble);
        }, 120);
      }
    }, intervalTime);
  };

  // ROLL DICE LOGIC
  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    setAiHasResolvedLanding(false); // Reset for the new roll turn
    pirateAudio.playCannon();

    // Reset building view temporarily on rolls
    setShowBuildManager(false);

    // Simulate 600ms rolling visual delay
    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const sum = d1 + d2;
      const isDouble = d1 === d2;

      setDice([d1, d2]);
      setIsRolling(false);

      const p = players.find(pl => pl.id === activePlayerId);
      if (!p) return;

      addLog(`Kocok Dadu: Mengeluarkan angka [ ${d1} ] dan [ ${d2} ] (Maju ${sum} langkah).`, 'roll', activePlayerId);

      // Handle Jail roll dynamics
      if (p.inJail) {
        if (isDouble) {
          addLog(`Luar biasa! Angka kembar berhasil meloloskan ${p.name} keluar dari kurungan laut secara instan!`, 'jail', activePlayerId);
          setPlayers((prev) =>
            prev.map((pl) => (pl.id === activePlayerId ? { ...pl, inJail: false, jailTurns: 0 } : pl))
          );
          // Move the player normally using the double dice values!
          animateMovement(activePlayerId, sum, sum, true);
        } else {
          const nextTurns = p.jailTurns + 1;
          addLog(`Angka dadu tidak kembar. ${p.name} tetap dikurung di Davy Jones' Locker.`, 'jail', activePlayerId);
          
          setPlayers((prev) =>
            prev.map((pl) => {
              if (pl.id === activePlayerId) {
                if (nextTurns >= 3) {
                  // After 3 failed escapes, force pay 50 gold bribe and liberate
                  addLog(`${p.name} dipaksa membayar denda jaminan jembatan 50 koin emas karena masa penahanan maksimum terlewati!`, 'jail', activePlayerId);
                  return {
                    ...pl,
                    money: Math.max(0, pl.money - 50),
                    inJail: false,
                    jailTurns: 0
                  };
                }
                return {
                  ...pl,
                  jailTurns: nextTurns
                };
              }
              return pl;
            })
          );

          // Force release movement logic
          if (nextTurns >= 3) {
            animateMovement(activePlayerId, sum, sum, false);
          } else {
            // Did not escape, so trigger end turn instantly
            // Wait a bit to let player inspect
            if (p.isAI) {
              setAiHasResolvedLanding(true);
            }
          }
        }
      } else {
        // Evaluate continuous doubles rule (3 doubles = Prison)
        let nextDoubleCount = isDouble ? doubleCount + 1 : 0;
        setDoubleCount(nextDoubleCount);

        if (nextDoubleCount === 3) {
          addLog(`Menakutkan! Berlayar ugal-ugalan dengan 3 kecepatan tinggi berturut-turut! ${p.name} dituduh melanggar hukum armada dan dibuang ke Sea Jail!`, 'jail', activePlayerId);
          pirateAudio.playSplash();
          setPlayers((prev) =>
            prev.map((pl) =>
              pl.id === activePlayerId ? { ...pl, position: 10, inJail: true, jailTurns: 0 } : pl
            )
          );
          setDoubleCount(0);
          if (p.isAI) {
            setAiHasResolvedLanding(true);
          }
        } else {
          // Regular free sailing movement
          animateMovement(activePlayerId, sum, sum, isDouble);
        }
      }

    }, 600);
  };

  // EVALUATE LANDING IN TILES
  const handleLandingEffects = (playerId: number, totalDice: number, isDouble: boolean) => {
    const pl = players.find(p => p.id === playerId);
    if (!pl) return;

    const cell = INITIAL_CELLS[pl.position]; // Read base immutable coordinates
    const liveCellState = cells[pl.position]; // Read current mutable ownerships

    // Auto set Inspect Selection to landed cell so player always views details!
    setInspectCell(liveCellState);

    addLog(`Mendarat di ${liveCellState.indonesianName}.`, 'info', playerId);

    // 1. Check Walk the Plank trigger
    if (liveCellState.type === 'gotojail') {
      pirateAudio.playSplash();
      addLog(`Oh tidak! ${pl.name} dipaksa berjalan menutup mata melintasi papan dek ke Davy Jones' Locker (Sea Jail)!`, 'jail', playerId);
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId ? { ...p, position: 10, inJail: true, jailTurns: 0 } : p
        )
      );
      if (pl.isAI) {
        setAiHasResolvedLanding(true);
      }
      return;
    }

    // 2. Check Nassau Parking tax collector reward
    if (liveCellState.type === 'parking') {
      pirateAudio.playCoin();
      addLog(`Luar biasa! Kapten ${pl.name} bersandar di Nassau dan berhasil menyita seluruh upeti bajak laut yang menumpuk sebesar ${accumulatedTax} Koin Emas!`, 'buy', playerId);
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, money: p.money + accumulatedTax } : p))
      );
      setAccumulatedTax(0);
      if (pl.isAI) {
        setAiHasResolvedLanding(true);
      }
      return;
    }

    // 3. Check Taxes (Dinas Coastguards / Pajak Armada)
    if (liveCellState.type === 'tax') {
      const fine = liveCellState.price || 100;
      addLog(`Tercegat Kapal Patroli Bea Cukai! ${pl.name} harus menyerahkan upeti sebesar ${fine} koin emas ke peti penyimpanan Nassau.`, 'tax', playerId);
      return;
    }

    // 4. Draw Cards elements
    if (liveCellState.type === 'chance') {
      drawPirateCard('chance', playerId);
    } else if (liveCellState.type === 'community') {
      drawPirateCard('community', playerId);
    }
  };

  // RAW DECK DRAWING SHUFFLER
  const drawPirateCard = (deckType: 'chance' | 'community', playerId: number) => {
    const deck = deckType === 'chance' ? CHANCE_CARDS : COMMUNITY_CARDS;
    const randomIndex = Math.floor(Math.random() * deck.length);
    const selectedCard = deck[randomIndex];

    setActiveCard(selectedCard);
    addLog(`Dapat kabar: ${selectedCard.title}! "${selectedCard.text}"`, 'card', playerId);
  };

  const executeCardEffect = (card: PirateCard, playerId: number) => {
    setPlayers((prevPlayers) => {
      const pl = prevPlayers.find(p => p.id === playerId);
      if (!pl) return prevPlayers;

      let nextMoney = pl.money;
      let nextPosition = pl.position;
      let nextInJail = pl.inJail;
      let nextJailTurns = pl.jailTurns;
      let nextJailFree = pl.jailFreeCards;
      let nextPassedStart = pl.hasPassedStart;

      const effect = card.effect;

      switch (effect.type) {
        case 'money':
          nextMoney = Math.max(0, pl.money + (effect.amount || 0));
          if ((effect.amount || 0) > 0) {
            pirateAudio.playCoin();
          }
          break;

        case 'move_by':
          nextPosition = (pl.position + (effect.amount || 0) + 40) % 40;
          break;

        case 'move_to':
          const target = effect.destinationId || 0;
          if (effect.passGoChance && target < pl.position) {
            // Passed START
            nextMoney += 40;
            nextPassedStart = true;
            addLog(`Melewati jangkar awal dari kartu takdir! Terima bonus 40 Koin Emas.`, 'buy', playerId);
          }
          nextPosition = target;
          break;

        case 'jail':
          nextPosition = 10;
          nextInJail = true;
          nextJailTurns = 0;
          pirateAudio.playSplash();
          break;

        case 'jail_free':
          nextJailFree += 1;
          break;

        case 'collect_from_all':
          // Collect from everyone
          const activeOthers = prevPlayers.filter(p => !p.isBankrupt && p.id !== playerId);
          const totalCollected = activeOthers.length * (effect.amount || 0);
          nextMoney += totalCollected;
          pirateAudio.playCoin();
          break;

        case 'repairs':
          // Calculate owned properties cabins
          const myProperties = cells.filter(c => c.ownerId === playerId);
          let cabinCount = 0;
          let fortCount = 0;
          myProperties.forEach(c => {
            if (c.cabins === 5) fortCount++;
            else cabinCount += c.cabins;
          });
          const totalCost = (cabinCount * (effect.houseCost || 0)) + (fortCount * (effect.hotelCost || 0));
          nextMoney = Math.max(0, pl.money - totalCost);
          addLog(`Kapten ${pl.name} membayar upah renovasi dermaga sebesar ${totalCost} koin emas (${cabinCount} kabin, ${fortCount} benteng).`, 'tax', playerId);
          break;
      }

      return prevPlayers.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            money: nextMoney,
            position: nextPosition,
            inJail: nextInJail,
            jailTurns: nextJailTurns,
            jailFreeCards: nextJailFree,
            hasPassedStart: nextPassedStart
          };
        } else if (effect.type === 'collect_from_all' && !p.isBankrupt && p.id !== playerId) {
          // Subtract from others
          return {
            ...p,
            money: Math.max(0, p.money - (effect.amount || 0))
          };
        }
        return p;
      });
    });

    // Handle immediate updates to UI inspect panel if position shifted by card
    setTimeout(() => {
      const refreshedPlayer = players.find(p => p.id === playerId);
      if (refreshedPlayer) {
        setInspectCell(cells[refreshedPlayer.position]);
      }
    }, 100);
  };

  const handleDismissCard = () => {
    if (!activeCard) return;
    executeCardEffect(activeCard, activePlayerId);
    setActiveCard(null);
  };

  // BUY PROPERTY LOGIC
  const buyProperty = () => {
    const pl = players.find(p => p.id === activePlayerId);
    if (!pl) return;

    // Enforce passing START at least once before buying
    if (!pl.hasPassedStart) {
      addLog(`Kapten ${pl.name} belum diperbolehkan membeli wilayah sebelum melewati garis START minimal sekali!`, 'info', activePlayerId);
      return;
    }

    const cell = cells[pl.position];
    if (!cell || cell.ownerId !== null || !cell.price) return;

    if (pl.money < cell.price) {
      addLog(`Koin emas tidak mencukupi untuk menguasai ${cell.indonesianName}!`, 'info', activePlayerId);
      return;
    }

    // Spend gold, change ownership
    setPlayers((prev) =>
      prev.map((p) => (p.id === activePlayerId ? { ...p, money: p.money - cell.price! } : p))
    );

    setCells((prevCells) =>
      prevCells.map((c, idx) => (idx === pl.position ? { ...c, ownerId: activePlayerId } : c))
    );

    addLog(`Berhasil menguasai ${cell.indonesianName} seharga ${cell.price} emas! Bendera kapten resmi berkibar di pantai ini.`, 'buy', activePlayerId);
    pirateAudio.playCoin();

    // Re-inspect to sync display state
    setInspectCell({ ...cell, ownerId: activePlayerId });
  };

  // PAY RENT DEDUCTION EXECUTION
  const payRent = () => {
    const pl = players.find(p => p.id === activePlayerId);
    if (!pl) return;

    const cell = cells[pl.position];
    if (!cell || cell.ownerId === null || cell.ownerId === activePlayerId) return;

    const owner = players.find(p => p.id === cell.ownerId);
    if (!owner) return;

    let rentValue = 0;

    if (cell.type === 'property' && cell.rent) {
      const siblingCells = cells.filter(c => c.group === cell.group);
      const isFullGroupOwnedBySame = siblingCells.every(c => c.ownerId === cell.ownerId);

      const level = cell.cabins; // 0 to 5
      if (level === 0) {
        rentValue = isFullGroupOwnedBySame ? cell.rent[0] * 2 : cell.rent[0];
      } else {
        rentValue = cell.rent[level];
      }
    } else if (cell.type === 'railroad') {
      const ownedPorts = cells.filter(c => c.type === 'railroad' && c.ownerId === cell.ownerId).length;
      rentValue = 25 * Math.pow(2, ownedPorts - 1);
    } else if (cell.type === 'utility') {
      const ownedServices = cells.filter(c => c.type === 'utility' && c.ownerId === cell.ownerId).length;
      const diceSum = dice[0] + dice[1];
      rentValue = ownedServices === 2 ? diceSum * 10 : diceSum * 4;
    }

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === activePlayerId) {
          // Tenant pays rent
          addLog(`Membayar upeti tambat sebesar ${rentValue} emas kepada ${owner.name} di ${cell.indonesianName}.`, 'rent', activePlayerId);
          return {
            ...p,
            money: Math.max(0, p.money - rentValue)
          };
        }
        if (p.id === cell.ownerId) {
          // Landlord receives rent
          return {
            ...p,
            money: p.money + rentValue
          };
        }
        return p;
      })
    );

    pirateAudio.playCoin();
  };

  // PAY TAX ACTION
  const payTax = () => {
    const pl = players.find(p => p.id === activePlayerId);
    if (!pl) return;

    const cell = cells[pl.position];
    if (!cell || cell.type !== 'tax' || !cell.price) return;

    const taxAmount = cell.price;

    setPlayers((prev) =>
      prev.map((p) => (p.id === activePlayerId ? { ...p, money: Math.max(0, p.money - taxAmount) } : p))
    );

    setAccumulatedTax((prev) => prev + taxAmount);
    addLog(`Membayar upeti kerajaan ${taxAmount} koin emas di dermaga. Disimpan dalam kas kekayaan Nassau.`, 'tax', activePlayerId);
    pirateAudio.playCoin();
  };

  // BUILD HOUSES / CABINS LOGICS
  const buildCabin = (cellId: number) => {
    const cell = cells[cellId];
    const pl = players.find(p => p.id === activePlayerId);

    if (!cell || !pl || cell.ownerId !== activePlayerId || !cell.cabinCost) return;

    if (pl.money < cell.cabinCost) return;

    setPlayers((prev) =>
      prev.map((p) => (p.id === activePlayerId ? { ...p, money: p.money - cell.cabinCost! } : p))
    );

    setCells((prevCells) =>
      prevCells.map((c) => {
        if (c.id === cellId) {
          const nextCabins = c.cabins + 1;
          addLog(`${pl.avatar} ${pl.name} mendirikan ${nextCabins === 5 ? "BENTENG MEWAH" : `kabin ke-${nextCabins}`} di pulau ${c.indonesianName}.`, 'build', activePlayerId);
          return {
            ...c,
            cabins: nextCabins
          };
        }
        return c;
      })
    );
  };

  const sellCabin = (cellId: number) => {
    const cell = cells[cellId];
    if (!cell || cell.ownerId !== activePlayerId || cell.cabins === 0 || !cell.cabinCost) return;

    // Refund 50%
    const refund = Math.floor(cell.cabinCost / 2);

    setPlayers((prev) =>
      prev.map((p) => (p.id === activePlayerId ? { ...p, money: p.money + refund } : p))
    );

    setCells((prevCells) =>
      prevCells.map((c) => {
        if (c.id === cellId) {
          const nextCabins = c.cabins - 1;
          addLog(`Menghancurkan sebagian kabin di ${c.indonesianName}. Refund penukaran kayu +${refund} emas.`, 'build', activePlayerId);
          return {
            ...c,
            cabins: nextCabins
          };
        }
        return c;
      })
    );
  };

  // MORTGAGE PROPERTIES ELEMENTS
  const mortgageProperty = (cellId: number) => {
    const cell = cells[cellId];
    if (!cell || cell.ownerId !== activePlayerId || cell.isMortgaged || !cell.mortgage) return;

    const mortgageCash = cell.mortgage;

    setPlayers((prev) =>
      prev.map((p) => (p.id === activePlayerId ? { ...p, money: p.money + mortgageCash } : p))
    );

    setCells((prevCells) =>
      prevCells.map((c) => 
        c.id === cellId ? { ...c, isMortgaged: true, cabins: 0 } : c 
      )
    );

    addLog(`Menggadaikan ${cell.indonesianName} ke guild penjarah. Terima koin darurat +${mortgageCash} emas. Semesta sewa dihentikan sementara!`, 'build', activePlayerId);
  };

  const unmortgageProperty = (cellId: number) => {
    const cell = cells[cellId];
    const pl = players.find(p => p.id === activePlayerId);

    if (!cell || !pl || cell.ownerId !== activePlayerId || !cell.isMortgaged || !cell.mortgage) return;

    // Repayment carries 10% interest
    const cost = Math.ceil(cell.mortgage * 1.1);

    if (pl.money < cost) return;

    setPlayers((prev) =>
      prev.map((p) => (p.id === activePlayerId ? { ...p, money: p.money - cost } : p))
    );

    setCells((prevCells) =>
      prevCells.map((c) => 
        c.id === cellId ? { ...c, isMortgaged: false } : c 
      )
    );

    addLog(`Tebusan sukses! ${cell.indonesianName} dibebaskan dari denda seharga -${cost} emas. Pantai siap menarik upeti penuh.`, 'build', activePlayerId);
  };

  // END TURN STATE MACHINE
  const endTurn = () => {
    // If they rolled dynamic doubles, let them play again!
    const isDouble = dice[0] === dice[1] && dice[0] !== 0;
    const pl = players.find(p => p.id === activePlayerId);
    
    // Auto purge bankrupt players
    if (pl && pl.money <= 0 && cells.filter(c => c.ownerId === activePlayerId).length === 0) {
      handleBankruptcy(activePlayerId);
      return;
    }

    let nextPlayerId = activePlayerId;

    if (isDouble && pl && !pl.inJail && !pl.isBankrupt) {
      addLog(`Mendapat giliran ganda karena melempar dadu kembar! Silakan kocok sekali lagi kapten!`, 'info', activePlayerId);
      setDice([0, 0]); // Reset dice roll to allow next roll
      setAiHasResolvedLanding(false);
      return;
    }

    // Clear double indicators
    setDoubleCount(0);
    setDice([0, 0]);
    setAiHasResolvedLanding(false);

    // Simple round robin shift to next active non-bankrupt players
    const activePlayers = players.filter(p => !p.isBankrupt);

    if (activePlayers.length <= 1) {
      handleGameOver();
      return;
    }

    const currentIndexInActive = activePlayers.findIndex(p => p.id === activePlayerId);
    const nextIndex = (currentIndexInActive + 1) % activePlayers.length;
    nextPlayerId = activePlayers[nextIndex].id;

    setActivePlayerId(nextPlayerId);
    addLog(`Giliran beralih kepada kapten selanjutnya. Bersiaplah!`, 'info');
  };

  // TRIGGER BANKRUPTCY & ASSETS TRANSFERS
  const handleBankruptcy = (playerId: number) => {
    const pl = players.find(p => p.id === playerId);
    if (!pl) return;

    addLog(`💀 Kapten ${pl.name} kehabisan emas dan bekal logistik! Kapal karam, kru memberontak dan menyatakan KEBANGKRUTAN total!`, 'bankrupt', playerId);

    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, isBankrupt: true, money: 0 } : p))
    );

    // Release and clear all properties held to bank/null
    setCells((prevCells) =>
      prevCells.map((c) => (c.ownerId === playerId ? { ...c, ownerId: null, cabins: 0, isMortgaged: false } : c))
    );

    // Check remaining survivor counts
    const survivors = players.filter((p) => !p.isBankrupt && p.id !== playerId);
    if (survivors.length === 1) {
      setWinnerId(survivors[0].id);
      setGamePhase('gameover');
      addLog(`🏆 Kemenangan Mutlak! Kapten ${survivors[0].name} tersisa sendirian menjajah lautan dan dinobatkan sebagai Raja Diraja Bajak Laut!`, 'info', survivors[0].id);
    } else {
      // Advance to next active turn
      const currentIndexInActive = players.findIndex(p => p.id === playerId);
      const activePlayers = players.filter(p => !p.isBankrupt && p.id !== playerId);
      const nextId = activePlayers[0]?.id || 1;
      setAiHasResolvedLanding(false);
      setActivePlayerId(nextId);
    }
  };

  const handleGameOver = () => {
    const survivors = players.filter((p) => !p.isBankrupt);
    if (survivors.length >= 1) {
      setWinnerId(survivors[0].id);
    }
    setGamePhase('gameover');
  };

  // AUTOMATED DECISION MAKER ENGINE FOR INTEL INTELLIGENT AI BOTS CAPTAINS
  // Deprecated: AI decision orchestration is now modular, pure dynamic state-machine driven within the main useEffect.

  return (
    <div className="min-h-screen bg-[#0d0a07] text-[#f4efe8] flex flex-col font-sans selection:bg-amber-600/30">
      
      {/* PERSISTENT CUSTOM DESIGNED HEADER */}
      <header className="bg-[#1a1209] border-b-2 border-[#422e1a] py-3.5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-950/40 rounded-xl border border-amber-500/30 flex items-center justify-center">
            <Skull className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold tracking-widest text-amber-400 leading-none">
              PIRATE MONOPOLY
            </h1>
            <span className="text-[9px] font-mono tracking-widest text-[#ab8e66]/80 uppercase mt-1 block">
              Peta Teritorium & Kemudi Bajak Laut
            </span>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const before = bgSound;
              setBgSound(!before);
              pirateAudio.setEnabled(!before);
              if (!before) pirateAudio.playCoin();
            }}
            className="p-2 rounded bg-black/40 border border-amber-900/40 hover:bg-black text-amber-400 transition-colors"
            title="Toggle Sound Effects"
          >
            {bgSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => {
              pirateAudio.playCannon();
              setGamePhase('setup');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-[#3f2113] border border-amber-600/20 rounded hover:bg-[#542d1b] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">MULAI ULANG</span>
          </button>
        </div>
      </header>

      {/* SETUP PHASE DRAWERS AND SCREEN */}
      {gamePhase === 'setup' && (
        <PlayerSetup onStartGame={handleStartGame} />
      )}

      {/* REVOLUTIONARY ACTIVE INTERACTIVE BOARD GRID VIEWPORT */}
      {gamePhase === 'playing' && (
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: ACTIVE ENROLLED PIRATE CREWS STATUS (3 COLS) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            
            <div className="bg-[#140e07] border-2 border-[#432f1b] rounded-xl p-4 shadow-xl">
              <h2 className="text-sm font-serif font-bold tracking-wider text-amber-400 uppercase border-b border-amber-900/30 pb-2 mb-3 flex items-center gap-1.5">
                <Anchor className="w-4 h-4 text-amber-500" />
                <span>KAPAL & ARSENAL KAPTEN</span>
              </h2>

              <div className="space-y-2.5">
                {players.map((p) => {
                  const isActive = p.id === activePlayerId;
                  const isUserChar = p.isAI === false;
                  
                  return (
                    <div 
                      key={p.id}
                      className={`p-3 rounded-lg border transition-all duration-300 relative overflow-hidden ${
                        p.isBankrupt 
                          ? "bg-zinc-950/80 border-transparent text-zinc-500 opacity-40 line-through" 
                          : isActive 
                            ? "bg-[#25170d] border-amber-400 shadow-lg"
                            : "bg-black/35 border-amber-950/25"
                      }`}
                    >
                      {/* Active marker banner */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 animate-pulse" />
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{p.avatar}</span>
                          <div>
                            <span className={`text-xs font-serif font-bold leading-tight block ${isActive ? "text-amber-200" : "text-zinc-300"}`}>
                              {p.name}
                            </span>
                            <span className="text-[8px] font-mono text-zinc-400 flex items-center gap-1 mt-0.5">
                              {p.isAI ? (
                                <>
                                  <Bot className="w-3 h-3 text-rose-400 shrink-0" />
                                  <span>BOT ({p.aiPersonality})</span>
                                </>
                              ) : (
                                <>
                                  <User className="w-3 h-3 text-sky-400 shrink-0" />
                                  <span>MANUSIA (PC)</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Money metrics */}
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-yellow-400 flex items-center justify-end gap-1">
                            <Coins className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                            <span>{p.money} G</span>
                          </div>
                          <span className="text-[8px] font-mono text-zinc-500 block uppercase tracking-tighter mt-0.5">
                            Petak {p.position}
                          </span>
                        </div>
                      </div>

                      {/* Display owned assets count summary tags */}
                      {!p.isBankrupt && (
                        <div className="flex gap-1.5 flex-wrap mt-2 pt-2 border-t border-amber-900/10">
                          {cells.filter(c => c.ownerId === p.id).map((asset) => (
                            <div 
                              key={asset.id} 
                              onClick={() => {
                                setInspectCell(asset);
                                pirateAudio.playBell();
                              }}
                              className={`text-[7px] font-mono font-bold px-1.5 py-0.5 rounded border border-black cursor-pointer hover:scale-105 transition-all text-white ${
                                asset.group && asset.group !== 'port' && asset.group !== 'service'
                                  ? PROPERTY_GROUP_COLORS[asset.group]
                                  : "bg-zinc-800 border-zinc-700 text-zinc-300"
                              }`}
                              title={asset.indonesianName}
                            >
                              🏝️ {asset.id}
                            </div>
                          ))}
                          {cells.filter(c => c.ownerId === p.id).length === 0 && (
                            <span className="text-[7.5px] font-mono italic text-zinc-500">Belum ada wilayah pulau duku kuasai</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI THINKING STATUS MODAL FLOATER */}
            {aiIsThinking && (
              <div className="bg-[#241108]/90 border border-amber-500 rounded-xl p-4 text-center animate-pulse shadow-xl shadow-black/70">
                <Skull className="w-8 h-8 text-amber-500 mx-auto animate-bounce mb-1.5" />
                <h4 className="text-xs font-serif font-bold tracking-widest text-amber-400 uppercase">BOT SEDANG BERPIKIR</h4>
                <p className="text-[10px] text-zinc-300 font-mono italic mt-1 font-semibold">{aiThinkingText}</p>
              </div>
            )}

            {/* BRIEF LEGEND CHART BOX */}
            <div className="bg-[#140e07] border-2 border-[#432f1b] rounded-xl p-4 shadow-xl text-xs space-y-2">
              <span className="font-serif font-bold text-amber-400 block border-b border-amber-900/30 pb-1.5 mb-2 uppercase">LORE PETUALANGAN</span>
              <p className="text-[10px] text-zinc-400 italic">
                Setiap petak dalam game mewakili pulau karang misterius, pelabuhan legendaris dagang, dan kedai minum terpencil. Dominasi warna grup yang utuh mengizinkan pendirian kabin penjarah seharga emas.
              </p>
              <div className="text-[9px] font-mono text-amber-200 bg-amber-950/20 p-2 rounded border border-amber-500/10 space-y-1">
                <div>- ⚔️ **Davy Jones' Locker**: Istirahat paksa</div>
                <div>- 🎪 **Kabin Bajak Laut**: Meningkatkan biaya sewa</div>
                <div>- 🏰 **Benteng Laut**: Melipatgandakan sewa maksimum</div>
              </div>
            </div>

          </div>

          {/* CENTER COLUMN: GORGEOUS SQUARE MONOPOLY BOARD LAYOUT VIEWER (5 COLS) */}
          <div className="lg:col-span-5 flex justify-center">
            <GameBoard 
              cells={cells}
              players={players}
              activePlayerId={activePlayerId}
              onCellClick={(cell) => {
                setInspectCell(cell);
                pirateAudio.playBell();
              }}
              accumulatedTax={accumulatedTax}
              dice={dice}
              isRolling={isRolling}
              rollDice={rollDice}
            />
          </div>

          {/* RIGHT COLUMN: DETAIL CERTIFICATE DRAWER AND CONSOLE ACTION DOCK (4 COLS) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* INSPECT DETAIL MODAL (Parchment Property Certificate Style) */}
            {inspectCell && (
              <div className="bg-[#291e12] border-2 border-[#ab8e66]/50 p-4 rounded-xl shadow-2xl relative select-none">
                <div className="absolute top-1 left-1 bottom-1 right-1 border border-dashed border-[#ab8e66]/20 rounded-lg pointer-events-none" />
                
                {/* Close inspect certificate */}
                <button 
                  onClick={() => setInspectCell(null)} 
                  className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Property Ribbons header */}
                <div className="text-center font-serif">
                  {inspectCell.group && inspectCell.group !== 'port' && inspectCell.group !== 'service' && (
                    <div className={`w-full py-1.5 rounded-md font-bold text-xs uppercase ${PROPERTY_GROUP_COLORS[inspectCell.group]} mb-3 shadow`} />
                  )}
                  
                  <span className="text-[8px] font-mono tracking-widest text-[#ab8e66] uppercase block">SERTIFIKAT KEPEMILIKAN</span>
                  <h3 className="text-lg font-bold text-amber-100 uppercase mt-0.5 leading-tight">{inspectCell.indonesianName}</h3>
                  <span className="text-[9px] font-mono text-zinc-400 block mt-0.5">Petak Indeks #{inspectCell.id}</span>
                </div>

                <div className="mt-3 bg-black/45 rounded-lg border border-[#4a3520] p-3 text-xs space-y-2">
                  <p className="text-[10px] text-zinc-300 italic leading-snug">
                    "{inspectCell.description}"
                  </p>

                  <div className="divide-y divide-amber-900/10 text-[10px] font-mono pt-1 text-zinc-300">
                    
                    {inspectCell.price && (
                      <div className="flex justify-between py-1">
                        <span>Harga Klaim Pulau:</span>
                        <span className="text-yellow-400 font-bold">{inspectCell.price} Emas</span>
                      </div>
                    )}

                    {inspectCell.rent && (
                      <>
                        <div className="flex justify-between py-1 text-amber-200">
                          <span>Sewa Dasar:</span>
                          <span>{inspectCell.rent[0]} Emas</span>
                        </div>
                        {inspectCell.type === 'property' && (
                          <>
                            <div className="flex justify-between py-1">
                              <span>Dengan 1 Kabin:</span>
                              <span>{inspectCell.rent[1]} Emas</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span>Dengan 2 Kabin:</span>
                              <span>{inspectCell.rent[2]} Emas</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span>Dengan 3 Kabin:</span>
                              <span>{inspectCell.rent[3]} Emas</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span>Dengan 4 Kabin:</span>
                              <span>{inspectCell.rent[4]} Emas</span>
                            </div>
                            <div className="flex justify-between py-1 text-emerald-400">
                              <span>Dengan Benteng Laut:</span>
                              <span>{inspectCell.rent[5]} Emas</span>
                            </div>
                            <div className="flex justify-between py-1 text-amber-400">
                              <span>Harga Pendirian Kabin:</span>
                              <span>{inspectCell.cabinCost} Emas / unit</span>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {inspectCell.mortgage && (
                      <div className="flex justify-between py-1 text-rose-400">
                        <span>Nilai Gadai Darurat:</span>
                        <span>{inspectCell.mortgage} Emas</span>
                      </div>
                    )}

                    <div className="flex justify-between py-1 pt-2 text-[#f59e0b] font-serif font-bold text-xs">
                      <span>Status Kepemilikan:</span>
                      <span>
                        {inspectCell.ownerId === null 
                          ? "Bebas / Belum Diklaim" 
                          : inspectCell.ownerId === -1 
                            ? "Milik Bank" 
                            : `Dikuasai Kapten #${inspectCell.ownerId}`
                        }
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* COCKPIT DASHBOARD ACTIONS PLAYER CONSOLE */}
            <PlayerConsole 
              players={players}
              activePlayerId={activePlayerId}
              cells={cells}
              gameLogs={gameLogs}
              dice={dice}
              isRolling={isRolling}
              rollDice={rollDice}
              buyProperty={buyProperty}
              buildCabin={buildCabin}
              sellCabin={sellCabin}
              mortgageProperty={mortgageProperty}
              unmortgageProperty={unmortgageProperty}
              payRent={payRent}
              payTax={payTax}
              payBribeToEscape={payBribeToEscape}
              useJailFreeCard={useJailFreeCard}
              endTurn={endTurn}
              activeCard={activeCard}
              dismissCard={handleDismissCard}
              showBuildManager={showBuildManager}
              setShowBuildManager={setShowBuildManager}
            />

          </div>

        </div>
      )}

      {/* GAMEOVER PHASE VICTORY SCREEN */}
      {gamePhase === 'gameover' && (
        <div className="absolute inset-0 z-50 bg-[#070503] flex items-center justify-center p-6">
          <div className="bg-[#1a1209] border-4 border-amber-500 rounded-2xl max-w-md w-full p-8 text-center text-zinc-100 shadow-2xl relative select-none">
            
            <div className="mx-auto w-20 h-20 bg-[#2d1e0f] rounded-full border-2 border-amber-400 flex items-center justify-center mb-4">
              <Award className="w-12 h-12 text-yellow-400 animate-pulse" />
            </div>

            <h1 className="text-3xl font-serif font-extrabold text-amber-400 uppercase tracking-widest leading-none">
              RESTORASI SELESAI
            </h1>
            <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest mt-1">
              Petualangan Bajak Laut Telah Berakhir
            </p>

            <div className="my-6 p-4 bg-black/60 rounded-xl border border-amber-500/20">
              <span className="text-[9px] font-mono tracking-widest text-[#ab8e66] uppercase block">PENGUASA TUNGGAL SAMUDRA</span>
              
              {winnerId !== null ? (
                <div className="mt-3 flex flex-col items-center">
                  <span className="text-5xl mb-2">
                    {players.find(p => p.id === winnerId)?.avatar || "🏴‍☠️"}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-yellow-400">
                    {players.find(p => p.id === winnerId)?.name || "Kapten Pemenang"}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2">
                    Berhasil melumpuhkan semua armada saingan dan mendominasi sistem ekonomi bajak laut Nassau!
                  </p>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 mt-3 font-mono">Pertempuran usai tanpa pemenang yang sah.</p>
              )}
            </div>

            <button
              onClick={() => {
                pirateAudio.playCannon();
                setGamePhase('setup');
              }}
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-[#171107] font-serif font-bold rounded-xl transition-all shadow-xl shadow-amber-500/10 cursor-pointer"
            >
              KEMBALI BERLAYAR (MAIN LAGI)
            </button>
          </div>
        </div>
      )}

      {/* FOOTER credit brand */}
      <footer className="bg-[#130d07] border-t border-[#302111]/65 py-4 px-8 text-center text-[10px] font-mono text-zinc-500">
        <p>© 2026 Pirate Monopoly Premium. Hak cipta dilindungi undang-undang pelaut.</p>
      </footer>

    </div>
  );
}
