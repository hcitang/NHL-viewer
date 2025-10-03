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
      tags: true,
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
      tags: true,
      keys: true,
      scrollable: true,
      style: {
        selected: {
          bg: 'blue'
        }
      }
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
    // Date navigation - only on container
    this.container.key(['left', 'h'], () => {
      this.navigateDate(-1);
    });

    this.container.key(['right', 'l'], () => {
      this.navigateDate(1);
    });

    // Game selection - only on container to avoid conflicts
    this.container.key(['enter'], () => {
      this.selectGame();
    });

    // Game list navigation - let blessed handle this natively
    this.container.key(['up', 'k'], () => {
      this.gamesList.up(1);
      this.screen.render();
    });

    this.container.key(['down', 'j'], () => {
      this.gamesList.down(1);
      this.screen.render();
    });

    // Refresh
    this.container.key(['r'], () => {
      this.loadSchedule();
    });

    // Quit
    this.container.key(['q', 'C-c'], () => {
      process.exit(0);
    });

    // Make sure the container can receive key events
    this.container.focus();
  }

  protected onStateChange(state: AppState): void {
    this.updateDateDisplay(state.selectedDate);
    
    if (state.scheduleData) {
      // Find the games for the selected date
      const selectedWeek = state.scheduleData.gameWeek.find(week => week.date === state.selectedDate);
      const games = selectedWeek?.games || [];
      this.updateGamesList(games);
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
      const awayTeam = game.awayTeam.abbrev;
      const homeTeam = game.homeTeam.abbrev;
      const status = this.getGameStatusDisplay(game);
      const score = this.getScoreDisplay(game);
      
      return `${awayTeam} @ ${homeTeam} ${score} ${status}`;
    });

    this.gamesList.setItems(gameItems);
    this.gamesList.select(0); // Select first item by default
    this.screen.render();
  }

  private getGameStatusDisplay(game: Game): string {
    const gameTime = new Date(game.startTimeUTC);
    
    switch (game.gameState) {
      case 'FUT':
        return gameTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      case 'LIVE':
        return '{red-fg}LIVE{/red-fg}';
      case 'FINAL':
        return '{green-fg}FINAL{/green-fg}';
      default:
        return game.gameScheduleState;
    }
  }

  private getScoreDisplay(game: Game): string {
    if (game.gameState === 'FUT') {
      return '';
    }
    
    // For completed games, use the scores from the API response
    if (game.gameState === 'FINAL' || game.gameState === 'OFF') {
      const awayScore = game.awayTeam.score ?? '?';
      const homeScore = game.homeTeam.score ?? '?';
      return `${awayScore}-${homeScore}`;
    }
    
    // For live games, show current score if available
    if (game.gameState === 'LIVE') {
      const awayScore = game.awayTeam.score ?? 0;
      const homeScore = game.homeTeam.score ?? 0;
      return `${awayScore}-${homeScore}`;
    }
    
    return '';
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
    
    if (state.scheduleData) {
      // Find the games for the selected date
      const selectedWeek = state.scheduleData.gameWeek.find(week => week.date === state.selectedDate);
      const games = selectedWeek?.games || [];
      
      if (games.length > 0 && selectedIndex < games.length) {
        const selectedGame = games[selectedIndex];
        this.stateManager.setState({
          selectedGame,
          currentView: 'game',
        });
      }
    }
  }

  private async loadSchedule(): Promise<void> {
    const state = this.stateManager.getState();
    
    this.stateManager.setState({ loading: true, error: null });
    
    try {
      // Use the current schedule (which includes multiple dates) or specific date
      const today = new Date().toISOString().split('T')[0];
      let scheduleData;
      
      if (state.selectedDate === today) {
        scheduleData = await this.apiClient.getCurrentSchedule();
      } else {
        scheduleData = await this.apiClient.getSchedule(state.selectedDate);
      }
      
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