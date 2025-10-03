import * as blessed from 'blessed';
import { BaseComponent, StateManager } from '../utils/stateManager';
import { NHLApiClient } from '../api/nhlApi';
import { AppState, LiveGameData, PlayEvent } from '../types';

export class GameView extends BaseComponent {
  private headerBox!: blessed.Widgets.BoxElement;
  private scoreBox!: blessed.Widgets.BoxElement;
  private playByPlayList!: blessed.Widgets.ListElement;
  private statsBox!: blessed.Widgets.BoxElement;
  private statusBox!: blessed.Widgets.BoxElement;
  private apiClient: NHLApiClient;
  private updateInterval?: NodeJS.Timeout;

  constructor(screen: blessed.Widgets.Screen, stateManager: StateManager) {
    super(screen, stateManager);
    this.apiClient = new NHLApiClient();
  }

  protected createContainer(): blessed.Widgets.BoxElement {
    const container = this.createBox({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      label: ' Game Details ',
    });

    // Header with team names
    this.headerBox = this.createBox({
      parent: container,
      top: 1,
      left: 1,
      width: '100%-2',
      height: 3,
    });

    // Score and game status
    this.scoreBox = this.createBox({
      parent: container,
      top: 4,
      left: 1,
      width: '50%-2',
      height: 8,
      label: ' Score ',
    });

    // Basic stats
    this.statsBox = this.createBox({
      parent: container,
      top: 4,
      left: '50%',
      width: '50%-1',
      height: 8,
      label: ' Stats ',
    });

    // Play-by-play
    this.playByPlayList = this.createList({
      parent: container,
      top: 12,
      left: 1,
      width: '100%-2',
      height: '100%-16',
      label: ' Play-by-Play ',
      items: [],
      scrollable: true,
      alwaysScroll: true,
    });

    // Status bar
    this.statusBox = this.createBox({
      parent: container,
      bottom: 1,
      left: 1,
      width: '100%-2',
      height: 3,
      content: 'Press b to go back, r to refresh, q to quit',
      style: {
        fg: 'gray',
      },
    });

    return container;
  }

  protected setupEventHandlers(): void {
    // Go back to schedule
    this.container.key(['b', 'escape'], () => {
      this.stopLiveUpdates();
      this.stateManager.setState({ currentView: 'schedule' });
    });

    // Refresh
    this.container.key(['r'], () => {
      this.loadGameData();
    });

    // Quit
    this.container.key(['q', 'C-c'], () => {
      process.exit(0);
    });

    // Scroll play-by-play
    this.playByPlayList.key(['up', 'k'], () => {
      this.playByPlayList.up(1);
      this.screen.render();
    });

    this.playByPlayList.key(['down', 'j'], () => {
      this.playByPlayList.down(1);
      this.screen.render();
    });
  }

  protected onStateChange(state: AppState): void {
    if (state.currentView === 'game' && state.selectedGame) {
      this.loadGameData();
      this.startLiveUpdates();
    } else {
      this.stopLiveUpdates();
    }

    if (state.liveGameData) {
      this.updateGameDisplay(state.liveGameData);
    }

    if (state.error) {
      this.showError(state.error);
    }

    if (state.loading) {
      this.showLoading('Loading game data...');
    }
  }

  private updateGameDisplay(gameData: LiveGameData): void {
    this.updateHeader(gameData);
    this.updateScore(gameData);
    this.updateStats(gameData);
    this.updatePlayByPlay(gameData);
  }

  private updateHeader(gameData: LiveGameData): void {
    const awayTeam = gameData.gameData.teams.away.name;
    const homeTeam = gameData.gameData.teams.home.name;
    const venue = gameData.gameData.venue.name;
    
    const content = `{center}${awayTeam} @ ${homeTeam}{/center}\n{center}${venue}{/center}`;
    this.headerBox.setContent(content);
  }

  private updateScore(gameData: LiveGameData): void {
    const linescore = gameData.liveData.linescore;
    const awayScore = linescore.teams.away.goals;
    const homeScore = linescore.teams.home.goals;
    const awayTeam = gameData.gameData.teams.away.abbreviation;
    const homeTeam = gameData.gameData.teams.home.abbreviation;
    
    let content = `${awayTeam}: ${awayScore}\n${homeTeam}: ${homeScore}\n\n`;
    
    // Game status
    const status = gameData.gameData.status.detailedState;
    content += `Status: ${status}\n`;
    
    if (gameData.gameData.status.abstractGameState === 'Live') {
      const period = linescore.currentPeriodOrdinal;
      const timeRemaining = linescore.currentPeriodTimeRemaining;
      content += `${period} - ${timeRemaining}`;
    }

    this.scoreBox.setContent(content);
  }

  private updateStats(gameData: LiveGameData): void {
    const awayStats = gameData.liveData.boxscore.teams.away.teamStats.teamSkaterStats;
    const homeStats = gameData.liveData.boxscore.teams.home.teamStats.teamSkaterStats;
    const awayTeam = gameData.gameData.teams.away.abbreviation;
    const homeTeam = gameData.gameData.teams.home.abbreviation;

    let content = `Shots:\n${awayTeam}: ${awayStats.shots}\n${homeTeam}: ${homeStats.shots}\n\n`;
    content += `Hits:\n${awayTeam}: ${awayStats.hits}\n${homeTeam}: ${homeStats.hits}\n\n`;
    content += `PP:\n${awayTeam}: ${awayStats.powerPlayGoals}/${awayStats.powerPlayOpportunities}\n`;
    content += `${homeTeam}: ${homeStats.powerPlayGoals}/${homeStats.powerPlayOpportunities}`;

    this.statsBox.setContent(content);
  }

  private updatePlayByPlay(gameData: LiveGameData): void {
    const plays = gameData.liveData.plays.allPlays;
    const playItems = plays.slice(-20).map(play => this.formatPlayEvent(play));
    
    this.playByPlayList.setItems(playItems);
    this.playByPlayList.select(playItems.length - 1);
    this.screen.render();
  }

  private formatPlayEvent(play: PlayEvent): string {
    const period = play.about.periodType === 'REGULAR' 
      ? play.about.ordinalNum 
      : play.about.periodType;
    
    const time = play.about.periodTime;
    const event = play.result.event;
    const description = play.result.description;
    
    const icon = this.getEventIcon(event);
    
    return `${icon} ${period} ${time} - ${description}`;
  }

  private getEventIcon(eventType: string): string {
    const eventIcons: { [key: string]: string } = {
      'GOAL': '🚨',
      'SHOT': '🏒',
      'MISS': '💨',
      'PENALTY': '⚠️',
      'FACEOFF': '🔵',
      'HIT': '💥',
      'SAVE': '🥅',
      'BLOCK': '🛡️',
      'TAKEAWAY': '⚡',
      'GIVEAWAY': '❌',
      'STOP': '⏸️',
    };
    
    return eventIcons[eventType] || '●';
  }

  private async loadGameData(): Promise<void> {
    const state = this.stateManager.getState();
    
    if (!state.selectedGame) return;

    this.stateManager.setState({ loading: true, error: null });

    try {
      const liveGameData = await this.apiClient.getLiveGameData(state.selectedGame.gamePk);
      this.stateManager.setState({
        liveGameData,
        loading: false,
      });
    } catch (error) {
      this.stateManager.setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load game data',
      });
    }
  }

  private startLiveUpdates(): void {
    // Update every 10 seconds for live games
    this.updateInterval = setInterval(() => {
      const state = this.stateManager.getState();
      if (state.liveGameData?.gameData.status.abstractGameState === 'Live') {
        this.loadGameData();
      }
    }, 10000);
  }

  private stopLiveUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  public destroy(): void {
    this.stopLiveUpdates();
    super.destroy();
  }
}