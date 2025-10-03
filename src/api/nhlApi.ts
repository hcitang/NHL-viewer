import fetch from 'node-fetch';
import { GameSchedule, LiveGameData, PlayByPlay } from '../types';

export class NHLApiClient {
  private readonly baseUrl = 'https://api-web.nhle.com/v1';
  
  /**
   * Get games for a specific date
   * @param date - Date in YYYY-MM-DD format
   */
  async getSchedule(date: string): Promise<GameSchedule> {
    try {
      const response = await fetch(`${this.baseUrl}/schedule/${date}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json() as GameSchedule;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get live game data including play-by-play
   * @param gameId - Game ID
   */
  async getLiveGameData(gameId: number): Promise<LiveGameData> {
    try {
      const response = await fetch(`${this.baseUrl}/gamecenter/${gameId}/play-by-play`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json() as LiveGameData;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch live game data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current schedule (today's games)
   */
  async getCurrentSchedule(): Promise<GameSchedule> {
    try {
      const response = await fetch(`${this.baseUrl}/schedule/now`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json() as GameSchedule;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch current schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get boxscore data for a game
   * @param gameId - Game ID
   */
  async getBoxscore(gameId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/gamecenter/${gameId}/boxscore`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch boxscore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}