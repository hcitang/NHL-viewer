// Use built-in Date methods instead of date-fns for now
// import { format, parseISO, addDays, subDays } from 'date-fns';

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

/**
 * Format time for display
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Format date for API calls (YYYY-MM-DD)
 */
export function formatDateForApi(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date in API format
 */
export function getTodayForApi(): string {
  return formatDateForApi(new Date());
}

/**
 * Get yesterday's date in API format
 */
export function getYesterdayForApi(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateForApi(yesterday);
}

/**
 * Get tomorrow's date in API format
 */
export function getTomorrowForApi(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateForApi(tomorrow);
}

/**
 * Format period ordinal (1st, 2nd, 3rd, OT, SO)
 */
export function formatPeriodOrdinal(periodNum: number, periodType: string): string {
  if (periodType === 'OVERTIME') return 'OT';
  if (periodType === 'SHOOTOUT') return 'SO';
  
  switch (periodNum) {
    case 1: return '1st';
    case 2: return '2nd';
    case 3: return '3rd';
    default: return `${periodNum}th`;
  }
}

/**
 * Format time on ice (MM:SS)
 */
export function formatTimeOnIce(timeString: string): string {
  // Input format is usually "MM:SS" already
  return timeString;
}

/**
 * Format player position abbreviation
 */
export function formatPosition(position: string): string {
  const positionMap: { [key: string]: string } = {
    'Center': 'C',
    'Left Wing': 'LW',
    'Right Wing': 'RW',
    'Defenseman': 'D',
    'Goalie': 'G'
  };
  
  return positionMap[position] || position;
}

/**
 * Format team record (W-L-OT)
 */
export function formatRecord(wins: number, losses: number, ot: number): string {
  return `${wins}-${losses}-${ot}`;
}

/**
 * Get game status display text
 */
export function getGameStatusText(status: string, currentPeriod?: number, timeRemaining?: string): string {
  switch (status.toLowerCase()) {
    case 'preview':
    case 'scheduled':
      return 'Preview';
    case 'live':
    case 'in progress':
      if (currentPeriod && timeRemaining) {
        const periodText = formatPeriodOrdinal(currentPeriod, 'REGULAR');
        return `${periodText} - ${timeRemaining}`;
      }
      return 'Live';
    case 'final':
      return 'Final';
    case 'postponed':
      return 'Postponed';
    default:
      return status;
  }
}

/**
 * Calculate save percentage
 */
export function calculateSavePercentage(saves: number, shots: number): string {
  if (shots === 0) return '0.000';
  return (saves / shots).toFixed(3);
}

/**
 * Format plus/minus stat
 */
export function formatPlusMinus(plusMinus: number): string {
  if (plusMinus > 0) return `+${plusMinus}`;
  if (plusMinus < 0) return `${plusMinus}`;
  return '0';
}

/**
 * Get event icon for play-by-play
 */
export function getEventIcon(eventType: string): string {
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
    'PERIOD_START': '▶️',
    'PERIOD_END': '⏹️',
    'GAME_END': '🏁'
  };
  
  return eventIcons[eventType.toUpperCase()] || '●';
}

/**
 * Truncate text to fit within specified width
 */
export function truncateText(text: string, maxWidth: number): string {
  if (text.length <= maxWidth) return text;
  return text.substring(0, maxWidth - 3) + '...';
}

/**
 * Pad text to specified width
 */
export function padText(text: string, width: number, align: 'left' | 'center' | 'right' = 'left'): string {
  const padLength = Math.max(0, width - text.length);
  
  switch (align) {
    case 'center':
      const leftPad = Math.floor(padLength / 2);
      const rightPad = padLength - leftPad;
      return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
    case 'right':
      return ' '.repeat(padLength) + text;
    default:
      return text + ' '.repeat(padLength);
  }
}