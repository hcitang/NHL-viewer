import * as blessed from 'blessed';
import { AppState, ViewProps } from '../types';

export class StateManager {
  private state: AppState;
  private subscribers: Array<(state: AppState) => void> = [];

  constructor() {
    this.state = {
      currentView: 'schedule',
      selectedDate: this.getTodayString(),
      selectedGame: null,
      scheduleData: null,
      liveGameData: null,
      loading: false,
      error: null,
    };
  }

  getState(): AppState {
    return { ...this.state };
  }

  setState(newState: Partial<AppState>): void {
    this.state = { ...this.state, ...newState };
    this.notifySubscribers();
  }

  subscribe(callback: (state: AppState) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.getState()));
  }

  private getTodayString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}

export abstract class BaseComponent {
  protected screen: blessed.Widgets.Screen;
  protected container: blessed.Widgets.BoxElement;
  protected stateManager: StateManager;
  protected unsubscribe?: () => void;

  constructor(screen: blessed.Widgets.Screen, stateManager: StateManager) {
    this.screen = screen;
    this.stateManager = stateManager;
    this.container = this.createContainer();
    this.setupEventHandlers();
    this.unsubscribe = this.stateManager.subscribe(this.onStateChange.bind(this));
  }

  protected abstract createContainer(): blessed.Widgets.BoxElement;
  protected abstract setupEventHandlers(): void;
  protected abstract onStateChange(state: AppState): void;

  public show(): void {
    this.container.show();
    this.container.focus();
  }

  public hide(): void {
    this.container.hide();
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.container.destroy();
  }

  protected createBox(options: blessed.Widgets.BoxOptions): blessed.Widgets.BoxElement {
    return blessed.box({
      ...options,
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'cyan',
        },
        ...options.style,
      },
    });
  }

  protected createList(options: any): blessed.Widgets.ListElement {
    return blessed.list({
      ...options,
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'cyan',
        },
        selected: {
          bg: 'blue',
          fg: 'white',
        },
        ...options.style,
      },
      keys: true,
      vi: true,
    });
  }

  protected createTable(options: blessed.Widgets.TableOptions): blessed.Widgets.TableElement {
    return blessed.table({
      ...options,
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'cyan',
        },
        header: {
          fg: 'white',
          bold: true,
        },
        cell: {
          fg: 'white',
        },
        ...options.style,
      },
    });
  }

  protected showLoading(message: string = 'Loading...'): void {
    const loading = blessed.box({
      parent: this.container,
      content: message,
      top: 'center',
      left: 'center',
      width: message.length + 4,
      height: 3,
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'yellow',
        },
        fg: 'yellow',
      },
    });

    this.screen.render();

    // Auto-remove after state updates
    const unsubscribe = this.stateManager.subscribe((state) => {
      if (!state.loading) {
        loading.destroy();
        this.screen.render();
        unsubscribe();
      }
    });
  }

  protected showError(error: string): void {
    const errorBox = blessed.box({
      parent: this.container,
      content: `Error: ${error}\n\nPress any key to dismiss`,
      top: 'center',
      left: 'center',
      width: Math.min(60, error.length + 20),
      height: 5,
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'red',
        },
        fg: 'red',
      },
    });

    errorBox.focus();
    errorBox.key(['enter', 'escape', 'space'], () => {
      errorBox.destroy();
      this.screen.render();
    });

    this.screen.render();
  }
}