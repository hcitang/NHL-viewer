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
      tags: true,
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
      this.updateGameDisplay(state.liveGameData).catch(error => {
        console.error('Error updating game display:', error);
      });
    }

    if (state.error) {
      this.showError(state.error);
    }

    if (state.loading) {
      this.showLoading('Loading game data...');
    }
  }

  private async updateGameDisplay(gameData: LiveGameData): Promise<void> {
    this.updateHeader(gameData);
    await this.updateScore(gameData);
    this.updateStats(gameData);
    this.updatePlayByPlay(gameData);
  }

  private updateHeader(gameData: LiveGameData): void {
    const awayTeam = `${gameData.awayTeam.placeName.default} ${gameData.awayTeam.commonName.default}`;
    const homeTeam = `${gameData.homeTeam.placeName.default} ${gameData.homeTeam.commonName.default}`;
    const venue = gameData.venue.default;
    
    const content = `{center}${awayTeam} @ ${homeTeam}{/center}\n{center}${venue}{/center}`;
    this.headerBox.setContent(content);
  }

  private async updateScore(gameData: LiveGameData): Promise<void> {
    const awayTeam = gameData.awayTeam.abbrev;
    const homeTeam = gameData.homeTeam.abbrev;
    
    let awayScore = 0;
    let homeScore = 0;
    
    // For completed games, try to get boxscore data for accurate scores
    if (gameData.gameState === 'FINAL' || gameData.gameState === 'OFF') {
      try {
        const boxscore = await this.apiClient.getBoxscore(gameData.id);
        // Extract scores from boxscore if available
        if (boxscore && boxscore.awayTeam && boxscore.homeTeam) {
          awayScore = boxscore.awayTeam.score || 0;
          homeScore = boxscore.homeTeam.score || 0;
        } else {
          // Fallback to counting goal plays
          const goalPlays = gameData.plays.filter(play => play.typeDescKey === 'goal');
          goalPlays.forEach(goal => {
            if (goal.details?.eventOwnerTeamId === gameData.awayTeam.id) {
              awayScore++;
            } else if (goal.details?.eventOwnerTeamId === gameData.homeTeam.id) {
              homeScore++;
            }
          });
        }
      } catch (error) {
        // Fallback to counting goal plays if boxscore fails
        const goalPlays = gameData.plays.filter(play => play.typeDescKey === 'goal');
        goalPlays.forEach(goal => {
          if (goal.details?.eventOwnerTeamId === gameData.awayTeam.id) {
            awayScore++;
          } else if (goal.details?.eventOwnerTeamId === gameData.homeTeam.id) {
            homeScore++;
          }
        });
      }
    } else {
      // For live/future games, count goal plays
      const goalPlays = gameData.plays.filter(play => play.typeDescKey === 'goal');
      goalPlays.forEach(goal => {
        if (goal.details?.eventOwnerTeamId === gameData.awayTeam.id) {
          awayScore++;
        } else if (goal.details?.eventOwnerTeamId === gameData.homeTeam.id) {
          homeScore++;
        }
      });
    }
    
    let content = `${awayTeam}: ${awayScore}\n${homeTeam}: ${homeScore}\n\n`;
    
    // Game status
    content += `Status: ${gameData.gameState}\n`;
    
    if (gameData.gameState === 'LIVE' && gameData.clock) {
      const period = gameData.periodDescriptor.number;
      const timeRemaining = gameData.clock.timeRemaining;
      content += `Period ${period} - ${timeRemaining}`;
    }

    this.scoreBox.setContent(content);
  }

  private updateStats(gameData: LiveGameData): void {
    // Calculate basic stats from plays
    const shotPlays = gameData.plays.filter(play => 
      play.typeDescKey === 'shot-on-goal' || play.typeDescKey === 'goal'
    );
    const hitPlays = gameData.plays.filter(play => play.typeDescKey === 'hit');
    const penaltyPlays = gameData.plays.filter(play => play.typeDescKey === 'penalty');
    
    let awayShots = 0;
    let homeShots = 0;
    let awayHits = 0;
    let homeHits = 0;
    let awayPenalties = 0;
    let homePenalties = 0;
    
    shotPlays.forEach(shot => {
      if (shot.details?.eventOwnerTeamId === gameData.awayTeam.id) awayShots++;
      else if (shot.details?.eventOwnerTeamId === gameData.homeTeam.id) homeShots++;
    });
    
    hitPlays.forEach(hit => {
      if (hit.details?.eventOwnerTeamId === gameData.awayTeam.id) awayHits++;
      else if (hit.details?.eventOwnerTeamId === gameData.homeTeam.id) homeHits++;
    });
    
    penaltyPlays.forEach(penalty => {
      if (penalty.details?.eventOwnerTeamId === gameData.awayTeam.id) awayPenalties++;
      else if (penalty.details?.eventOwnerTeamId === gameData.homeTeam.id) homePenalties++;
    });
    
    const awayTeam = gameData.awayTeam.abbrev;
    const homeTeam = gameData.homeTeam.abbrev;

    let content = `Shots:\n${awayTeam}: ${awayShots}\n${homeTeam}: ${homeShots}\n\n`;
    content += `Hits:\n${awayTeam}: ${awayHits}\n${homeTeam}: ${homeHits}\n\n`;
    content += `Penalties:\n${awayTeam}: ${awayPenalties}\n${homeTeam}: ${homePenalties}`;

    this.statsBox.setContent(content);
  }

  private updatePlayByPlay(gameData: LiveGameData): void {
    const plays = gameData.plays;
    const playItems = plays.slice(-20).map(play => this.formatPlayEvent(play));
    
    this.playByPlayList.setItems(playItems);
    this.playByPlayList.select(playItems.length - 1);
    this.screen.render();
  }

  private formatPlayEvent(play: PlayEvent): string {
    const period = play.periodDescriptor.periodType === 'REG' 
      ? `P${play.period}` 
      : play.periodDescriptor.periodType;
    
    const time = play.timeInPeriod;
    const eventType = play.typeDescKey;
    
    // Create a simple description based on event type
    let description = eventType.replace(/-/g, ' ').toUpperCase();
    if (play.details?.playerId) {
      const player = this.getPlayerName(play.details.playerId, play);
      if (player) description += ` - ${player}`;
    }
    
    const icon = this.getEventIcon(eventType);
    
    return `${icon} ${period} ${time} - ${description}`;
  }

  private getPlayerName(playerId: number, play: PlayEvent): string {
    // For now, just return the player ID since we don't have roster data easily accessible
    // In a full implementation, you'd look up the player from rosterSpots
    return `Player ${playerId}`;
  }

  private getEventIcon(eventType: string): string {
    const eventIcons: { [key: string]: string } = {
      'goal': '🚨',
      'shot-on-goal': '🏒',
      'missed-shot': '💨',
      'penalty': '⚠️',
      'faceoff': '🔵',
      'hit': '💥',
      'save': '🥅',
      'blocked-shot': '🛡️',
      'takeaway': '⚡',
      'giveaway': '❌',
      'stoppage': '⏸️',
    };
    
    return eventIcons[eventType] || '●';
  }

  private async loadGameData(): Promise<void> {
    const state = this.stateManager.getState();
    
    if (!state.selectedGame) return;

    this.stateManager.setState({ loading: true, error: null });

    try {
      const liveGameData = await this.apiClient.getLiveGameData(state.selectedGame.id);
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
      if (state.liveGameData?.gameState === 'LIVE') {
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