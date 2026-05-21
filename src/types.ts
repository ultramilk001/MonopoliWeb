export type CellType = 'start' | 'property' | 'chance' | 'community' | 'tax' | 'railroad' | 'utility' | 'jail' | 'parking' | 'gotojail';

export type PropertyGroup = 
  | 'brown' 
  | 'lightblue' 
  | 'maroon' 
  | 'orange' 
  | 'red' 
  | 'yellow' 
  | 'green' 
  | 'darkblue' 
  | 'port'       // Railroad replacements (ports)
  | 'service';   // Utility replacements (Mermaid Tavern, Shipyard Forge)

export interface BoardCell {
  id: number;
  name: string;
  indonesianName: string;
  type: CellType;
  group?: PropertyGroup;
  price?: number;
  rent?: number[]; // [base, 1_cabin, 2_cabins, 3_cabins, 4_cabins, fortress]
  cabinCost?: number;
  mortgage?: number;
  ownerId: number | null; // null if unowned, -1 if bank
  cabins: number; // 0 to 4 (cabins), 5 (fortress)
  isMortgaged: boolean;
  description: string;
}

export interface Player {
  id: number;
  name: string;
  avatar: string; // emoji or icon
  color: string; // CSS color string
  textColor: string; // Tailwind text color class
  bgColor: string; // Tailwind bg color class
  position: number; // 0 to 39
  money: number; // in gold doubloons
  isBankrupt: boolean;
  inJail: boolean;
  jailTurns: number;
  isAI: boolean;
  aiPersonality?: string;
  jailFreeCards: number; // quantity of get-out-of-jail cards
  hasPassedStart: boolean; // Must pass START at least once before buying properties
}

export interface GameLog {
  id: string;
  timestamp: string;
  playerId?: number;
  message: string;
  type: 'roll' | 'buy' | 'rent' | 'tax' | 'card' | 'jail' | 'bankrupt' | 'build' | 'info';
}

export interface PirateCard {
  id: string;
  type: 'chance' | 'community';
  title: string;
  text: string;
  subtext: string;
  effect: {
    type: 'money' | 'move_to' | 'move_by' | 'jail' | 'jail_free' | 'repairs' | 'collect_from_all' | 'pay_all';
    amount?: number; // koin emas
    houseCost?: number; // cost per cabin
    hotelCost?: number; // cost per fortress
    destinationId?: number; // destination cell index
    passGoChance?: boolean; // trigger 200 gold if pass 0
  };
}

