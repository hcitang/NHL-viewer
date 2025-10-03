// NHL API Data Types for https://api-web.nhle.com/v1/

export interface NHLTeam {
  id: number;
  commonName: {
    default: string;
  };
  placeName: {
    default: string;
  };
  abbrev: string;
  logo: string;
  darkLogo: string;
}

export interface Player {
  playerId: number;
  sweaterNumber?: number;
  name: {
    default: string;
  };
  position: string;
  headshot?: string;
}

export interface Game {
  id: number;
  season: number;
  gameType: number;
  venue: {
    default: string;
  };
  startTimeUTC: string;
  gameState: 'FUT' | 'LIVE' | 'FINAL' | 'OFF';
  gameScheduleState: string;
  awayTeam: NHLTeam & { score?: number };
  homeTeam: NHLTeam & { score?: number };
  periodDescriptor: {
    number: number;
    periodType: string;
    maxRegulationPeriods: number;
  };
  gameCenterLink: string;
}

export interface GameWeek {
  date: string;
  dayAbbrev: string;
  numberOfGames: number;
  games: Game[];
}

export interface GameSchedule {
  nextStartDate: string;
  previousStartDate: string;
  gameWeek: GameWeek[];
}

export interface PlayEvent {
  eventId: number;
  period: number;
  timeInPeriod: string;
  timeRemaining: string;
  situationCode?: string;
  homeTeamDefendingSide: string;
  typeCode: number;
  typeDescKey: string;
  sortOrder: number;
  details?: {
    eventOwnerTeamId?: number;
    losingPlayerId?: number;
    winningPlayerId?: number;
    playerId?: number;
    shootingPlayerId?: number;
    goalieInNetId?: number;
    awaySOG?: number;
    homeSOG?: number;
    xCoord?: number;
    yCoord?: number;
    zoneCode?: string;
    shotType?: string;
    reason?: string;
    duration?: number;
    committedByPlayerId?: number;
    drawnByPlayerId?: number;
    descKey?: string;
    typeCode?: string;
  };
  periodDescriptor: {
    number: number;
    periodType: string;
    maxRegulationPeriods?: number;
  };
}

export interface PlayByPlay {
  id: number;
  season: number;
  gameType: number;
  gameDate: string;
  venue: {
    default: string;
  };
  awayTeam: NHLTeam;
  homeTeam: NHLTeam;
  gameState: string;
  plays: PlayEvent[];
  rosterSpots: Player[];
  periodDescriptor: {
    number: number;
    periodType: string;
    maxRegulationPeriods: number;
  };
  gameOutcome?: {
    lastPeriodType: string;
  };
}

export interface LiveGameData extends PlayByPlay {
  clock?: {
    timeRemaining: string;
    secondsRemaining: number;
    running: boolean;
    inIntermission: boolean;
  };
}

// Application State Types
export interface AppState {
  currentView: 'schedule' | 'game' | 'stats';
  selectedDate: string;
  selectedGame: Game | null;
  scheduleData: GameSchedule | null;
  liveGameData: LiveGameData | null;
  loading: boolean;
  error: string | null;
}

// UI Component Types
export interface KeyboardHandler {
  [key: string]: () => void;
}

export interface ViewProps {
  state: AppState;
  onStateChange: (newState: Partial<AppState>) => void;
}