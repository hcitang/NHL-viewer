// NHL API Data Types

export interface NHLTeam {
  id: number;
  name: string;
  abbreviation: string;
  locationName: string;
  teamName: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface NHLPlayer {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  primaryNumber: string;
  birthDate: string;
  currentAge: number;
  birthCity: string;
  birthCountry: string;
  nationality: string;
  height: string;
  weight: number;
  active: boolean;
  alternateCaptain: boolean;
  captain: boolean;
  rookie: boolean;
  shootsCatches: string;
  rosterStatus: string;
  currentTeam: NHLTeam;
  primaryPosition: {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
  };
}

export interface GameSchedule {
  date: string;
  totalItems: number;
  totalEvents: number;
  totalGames: number;
  totalMatches: number;
  games: Game[];
}

export interface Game {
  gamePk: number;
  link: string;
  gameType: string;
  season: string;
  gameDate: string;
  status: GameStatus;
  teams: {
    away: TeamGame;
    home: TeamGame;
  };
  venue: {
    id: number;
    name: string;
    link: string;
  };
  content: {
    link: string;
  };
}

export interface GameStatus {
  abstractGameState: 'Live' | 'Final' | 'Preview';
  codedGameState: string;
  detailedState: string;
  statusCode: string;
  startTimeTBD: boolean;
}

export interface TeamGame {
  leagueRecord: {
    wins: number;
    losses: number;
    ot: number;
    type: string;
  };
  score: number;
  team: NHLTeam;
}

export interface LiveGameData {
  gamePk: number;
  gameData: {
    game: {
      pk: number;
      season: string;
      type: string;
    };
    datetime: {
      dateTime: string;
      endDateTime: string;
    };
    status: GameStatus;
    teams: {
      away: NHLTeam;
      home: NHLTeam;
    };
    players: { [key: string]: NHLPlayer };
    venue: {
      id: number;
      name: string;
    };
  };
  liveData: {
    plays: {
      allPlays: PlayEvent[];
      scoringPlays: number[];
      penaltyPlays: number[];
      playsByPeriod: PlaysByPeriod[];
      currentPlay: PlayEvent;
    };
    linescore: {
      currentPeriod: number;
      currentPeriodOrdinal: string;
      currentPeriodTimeRemaining: string;
      periods: Period[];
      shootoutInfo: {
        away: { scores: number; attempts: number };
        home: { scores: number; attempts: number };
      };
      teams: {
        home: TeamLinescore;
        away: TeamLinescore;
      };
      powerPlayStrength: string;
      hasShootout: boolean;
      intermissionInfo: {
        intermissionTimeRemaining: number;
        intermissionTimeElapsed: number;
        inIntermission: boolean;
      };
    };
    boxscore: {
      teams: {
        away: TeamBoxscore;
        home: TeamBoxscore;
      };
      officials: Official[];
    };
  };
}

export interface PlayEvent {
  players?: PlayEventPlayer[];
  result: {
    event: string;
    eventCode: string;
    eventTypeId: string;
    description: string;
    secondaryType?: string;
    strength?: {
      code: string;
      name: string;
    };
    gameWinningGoal?: boolean;
    emptyNet?: boolean;
    penaltySeverity?: string;
    penaltyMinutes?: number;
  };
  about: {
    eventIdx: number;
    eventId: number;
    period: number;
    periodType: string;
    ordinalNum: string;
    periodTime: string;
    periodTimeRemaining: string;
    dateTime: string;
    goals: {
      away: number;
      home: number;
    };
  };
  coordinates?: {
    x: number;
    y: number;
  };
  team?: NHLTeam;
}

export interface PlayEventPlayer {
  player: NHLPlayer;
  playerType: string;
  seasonTotal?: number;
}

export interface PlaysByPeriod {
  startIndex: number;
  plays: number[];
  endIndex: number;
}

export interface Period {
  periodType: string;
  startTime: string;
  endTime: string;
  num: number;
  ordinalNum: string;
  home: {
    goals: number;
    shotsOnGoal: number;
    rinkSide: string;
  };
  away: {
    goals: number;
    shotsOnGoal: number;
    rinkSide: string;
  };
}

export interface TeamLinescore {
  team: NHLTeam;
  goals: number;
  shotsOnGoal: number;
  goaliePulled: boolean;
  numSkaters: number;
  powerPlay: boolean;
}

export interface TeamBoxscore {
  team: NHLTeam;
  teamStats: {
    teamSkaterStats: {
      goals: number;
      pim: number;
      shots: number;
      powerPlayPercentage: string;
      powerPlayGoals: number;
      powerPlayOpportunities: number;
      faceOffWinPercentage: string;
      blocked: number;
      takeaways: number;
      giveaways: number;
      hits: number;
    };
  };
  players: { [key: string]: PlayerBoxscore };
  goalies: number[];
  skaters: number[];
  onIce: number[];
  onIcePlus: Array<{
    playerId: number;
    shiftDuration: number;
    stamina: number;
  }>;
  scratches: number[];
  penaltyBox: number[];
  coaches: Array<{
    person: {
      fullName: string;
      link: string;
    };
    position: {
      code: string;
      name: string;
      type: string;
    };
  }>;
}

export interface PlayerBoxscore {
  person: NHLPlayer;
  jerseyNumber: string;
  position: {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  stats: {
    skaterStats?: {
      timeOnIce: string;
      assists: number;
      goals: number;
      shots: number;
      hits: number;
      powerPlayGoals: number;
      powerPlayAssists: number;
      penaltyMinutes: number;
      faceOffWins: number;
      faceoffTaken: number;
      takeaways: number;
      giveaways: number;
      shortHandedGoals: number;
      shortHandedAssists: number;
      blocked: number;
      plusMinus: number;
      evenTimeOnIce: string;
      powerPlayTimeOnIce: string;
      shortHandedTimeOnIce: string;
    };
    goalieStats?: {
      timeOnIce: string;
      assists: number;
      goals: number;
      pim: number;
      shots: number;
      saves: number;
      powerPlaySaves: number;
      shortHandedSaves: number;
      evenSaves: number;
      shortHandedShotsAgainst: number;
      evenShotsAgainst: number;
      powerPlayShotsAgainst: number;
      decision?: string;
      savePercentage: number;
      powerPlaySavePercentage?: number;
      shortHandedSavePercentage?: number;
      evenStrengthSavePercentage: number;
    };
  };
}

export interface Official {
  official: {
    id: number;
    fullName: string;
    link: string;
  };
  officialType: string;
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