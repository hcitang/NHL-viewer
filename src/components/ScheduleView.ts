import * as blessed from 'blessed';
import { BaseComponent, StateManager } from '../utils/stateManager';
import { NHLApiClient } from '../api/nhlApi';
import { AppState, Game } from '../types';

export class ScheduleView extends BaseComponent {
  private gamesList!: blessed.Widgets.ListElement;
  private dateBox!: blessed.Widgets.BoxElement;
  private statusBox!: blessed.Widgets.BoxElement;
  private apiClient: NHLApiClient;

  constructor(screen: blessed.Widgets.Screen, stateManager: StateManager) {
    super(screen, stateManager);
    this.apiClient = new NHLApiClient();
    this.loadSchedule();
  }

  protected createContainer(): blessed.Widgets.BoxElement {
    const container = this.createBox({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      label: ' NHL Schedule ',
    });

    // Date display and navigation
    this.dateBox = this.createBox({
      parent: container,
      top: 1,
      left: 1,
      width: '100%-2',
      height: 3,
      content: '',
    });

    // Games list
    this.gamesList = this.createList({
      parent: container,
      top: 4,
      left: 1,
      width: '100%-2',
      height: '100%-8',
      label: ' Games ',
      items: [],
    });

    // Status bar
    this.statusBox = this.createBox({
      parent: container,
      bottom: 1,
      left: 1,
      width: '100%-2',
      height: 3,
      content: 'Use ←/→ to change date, Enter to view game, q to quit',
      style: {
        fg: 'gray',
      },
    });

    return container;
  }

  protected setupEventHandlers(): void {
    // Date navigation
    this.container.key(['left', 'h'], () => {
      this.navigateDate(-1);
    });

    this.container.key(['right', 'l'], () => {
      this.navigateDate(1);
    });

    // Game selection
    this.gamesList.key(['enter'], () => {
      this.selectGame();
    });

    // Refresh
    this.container.key(['r'], () => {
      this.loadSchedule();
    });

    // Quit
    this.container.key(['q', 'C-c'], () => {
      process.exit(0);
    });
  }

  protected onStateChange(state: AppState): void {
    this.updateDateDisplay(state.selectedDate);
    
    if (state.scheduleData) {
      this.updateGamesList(state.scheduleData.games);
    }

    if (state.error) {
      this.showError(state.error);
    }

    if (state.loading) {
      this.showLoading('Loading schedule...');
    }
  }

  private updateDateDisplay(date: string): void {
    const displayDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    this.dateBox.setContent(`{center}${displayDate}{/center}`);
    this.screen.render();
  }

  private updateGamesList(games: Game[]): void {
    if (games.length === 0) {
      this.gamesList.setItems(['No games scheduled for this date']);
      this.screen.render();
      return;
    }

    const gameItems = games.map(game => {
      const awayTeam = game.teams.away.team.abbreviation;
      const homeTeam = game.teams.home.team.abbreviation;
      const status = this.getGameStatusDisplay(game);
      const score = this.getScoreDisplay(game);
      
      return `${awayTeam} @ ${homeTeam} ${score} ${status}`;
    });

    this.gamesList.setItems(gameItems);
    this.screen.render();
  }

  private getGameStatusDisplay(game: Game): string {
    const gameTime = new Date(game.gameDate);
    
    switch (game.status.abstractGameState) {
      case 'Preview':
        return gameTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      case 'Live':
        return '{red-fg}LIVE{/red-fg}';
      case 'Final':
        return '{green-fg}FINAL{/green-fg}';
      default:
        return game.status.detailedState;
    }
  }

  private getScoreDisplay(game: Game): string {
    if (game.status.abstractGameState === 'Preview') {
      return '';
    }
    
    return `${game.teams.away.score}-${game.teams.home.score}`;
  }

  private navigateDate(days: number): void {
    const currentDate = new Date(this.stateManager.getState().selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    
    const newDate = currentDate.toISOString().split('T')[0];
    this.stateManager.setState({ selectedDate: newDate });
    this.loadSchedule();
  }

  private selectGame(): void {
    const selectedIndex = (this.gamesList as any).selected || 0;
    const state = this.stateManager.getState();
    
    if (state.scheduleData && state.scheduleData.games[selectedIndex]) {
      const selectedGame = state.scheduleData.games[selectedIndex];
      this.stateManager.setState({
        selectedGame,
        currentView: 'game',
      });
    }
  }

  private async loadSchedule(): Promise<void> {
    const state = this.stateManager.getState();
    
    this.stateManager.setState({ loading: true, error: null });
    
    try {
      const scheduleData = await this.apiClient.getSchedule(state.selectedDate);
      this.stateManager.setState({
        scheduleData,
        loading: false,
      });
    } catch (error) {
      this.stateManager.setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load schedule',
      });
    }
  }
}