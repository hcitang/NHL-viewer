# NHL Viewer

A terminal-based NHL game viewer inspired by the playball MLB viewer. View NHL schedules, live game data, player stats, and play-by-play events in an interactive terminal interface.

## Features

- **Daily Schedule View**: Browse NHL games by date
- **Live Game Updates**: Real-time game data with automatic refreshes
- **Play-by-Play Events**: See goals, penalties, and other game events as they happen
- **Boxscore Data**: Player stats and team statistics
- **Keyboard Navigation**: Intuitive terminal-based interface
- **Team Information**: Scores, shots, hits, and power play stats

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd nhl-viewer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run the application:
   ```bash
   npm start
   ```

## Usage

### Schedule View
- Use `←` and `→` arrow keys to navigate between dates
- Press `Enter` to view details for a selected game
- Press `r` to refresh the current schedule
- Press `q` to quit

### Game View
- View live scores, game status, and basic statistics
- Scroll through play-by-play events with `↑` and `↓` arrows
- Press `b` or `Escape` to return to schedule view
- Press `r` to refresh game data
- Press `q` to quit

## Development

### Scripts
- `npm run dev` - Build and run in development mode
- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and rebuild
- `npm start` - Run the compiled application
- `npm run clean` - Remove build artifacts

### Project Structure
```
src/
├── api/           # NHL API client
├── components/    # UI components (ScheduleView, GameView)
├── types/         # TypeScript type definitions
├── utils/         # Utilities and state management
└── index.ts       # Application entry point
```

## API Data Source

This application uses NHL API endpoints. Note that the NHL API endpoints may change over time:

**Current endpoints tried:**
- Schedule data: `https://statsapi.web.nhl.com/api/v1/schedule`
- Live game data: `https://statsapi.web.nhl.com/api/v1/game/{id}/feed/live`

**Alternative endpoints (if main API is unavailable):**
- Check the NHL API documentation for current endpoints
- Consider using the newer NHL API: `https://api-web.nhle.com/v1/`

**Network Issues:**
If you see DNS errors (ENOTFOUND), the API endpoint may be temporarily unavailable or have moved to a new location.

## Requirements

- Node.js 16.0.0 or higher
- Terminal with color support for the best experience

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details