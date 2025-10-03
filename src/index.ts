import * as blessed from 'blessed';
import { StateManager } from './utils/stateManager';
import { ScheduleView } from './components/ScheduleView';
import { GameView } from './components/GameView';

class NHLViewer {
  private screen: blessed.Widgets.Screen;
  private stateManager: StateManager;
  private scheduleView: ScheduleView;
  private gameView: GameView;

  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'NHL Viewer',
    });

    this.stateManager = new StateManager();
    
    // Initialize views
    this.scheduleView = new ScheduleView(this.screen, this.stateManager);
    this.gameView = new GameView(this.screen, this.stateManager);

    // Set up state management
    this.stateManager.subscribe(this.onStateChange.bind(this));

    // Initial render
    this.showCurrentView();
    this.screen.render();
  }

  private onStateChange(state: any): void {
    this.showCurrentView();
    this.screen.render();
  }

  private showCurrentView(): void {
    const state = this.stateManager.getState();

    // Hide all views
    this.scheduleView.hide();
    this.gameView.hide();

    // Show current view
    switch (state.currentView) {
      case 'schedule':
        this.scheduleView.show();
        break;
      case 'game':
        this.gameView.show();
        break;
    }
  }

  public start(): void {
    console.log('Starting NHL Viewer...');
    this.screen.render();
  }

  public destroy(): void {
    this.scheduleView.destroy();
    this.gameView.destroy();
    this.screen.destroy();
  }
}

// Start the application
const app = new NHLViewer();

// Handle exit gracefully
process.on('SIGINT', () => {
  app.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  app.destroy();
  process.exit(0);
});

// Start the app
app.start();