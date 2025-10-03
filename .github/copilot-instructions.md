# NHL Viewer - Terminal Hockey Dashboard

This project is a terminal-based NHL game viewer inspired by the playball MLB viewer. It provides an interactive terminal interface to view NHL schedules, live game data, player stats, and play-by-play events.

## Project Overview

- **Language**: TypeScript/Node.js
- **UI Library**: blessed (terminal UI components)
- **Architecture**: Component-based with state management
- **Data Source**: NHL API endpoints
- **Features**: Schedule view, live game updates, boxscores, player stats, keyboard navigation

## Key Components

- **ScheduleView**: Display daily NHL games
- **GameView**: Live game details and play-by-play
- **StatsView**: Player and team statistics
- **APIClient**: NHL API integration
- **StateManager**: Application state management

## Development Guidelines

- Use TypeScript for type safety
- Implement real-time data polling for live updates
- Follow component-based architecture
- Ensure responsive terminal UI across different screen sizes
- Use blessed widgets for consistent terminal interface
- Implement keyboard navigation patterns