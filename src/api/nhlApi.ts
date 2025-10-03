import fetch from 'node-fetch';
import { GameSchedule, LiveGameData } from '../types';

export class NHLApiClient {
  private readonly baseUrl = 'https://statsapi.web.nhl.com/api/v1';
  
  /**
   * Get games for a specific date
   * @param date - Date in YYYY-MM-DD format
   */
  async getSchedule(date: string): Promise<GameSchedule> {
    try {
      const response = await fetch(`${this.baseUrl}/schedule?date=${date}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json() as any;
      return data.dates[0] || { date, totalItems: 0, totalEvents: 0, totalGames: 0, totalMatches: 0, games: [] };
    } catch (error) {
      throw new Error(`Failed to fetch schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get live game data including play-by-play
   * @param gamePk - Game primary key
   */
  async getLiveGameData(gamePk: number): Promise<LiveGameData> {
    try {
      const response = await fetch(`${this.baseUrl}/game/${gamePk}/feed/live`);
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
   * Get boxscore data for a game
   * @param gamePk - Game primary key
   */
  async getBoxscore(gamePk: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/game/${gamePk}/boxscore`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch boxscore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get team information
   * @param teamId - Team ID
   */
  async getTeam(teamId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/teams/${teamId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all teams
   */
  async getAllTeams(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/teams`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch teams: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get player information
   * @param playerId - Player ID
   */
  async getPlayer(playerId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/people/${playerId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch player: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get standings
   * @param season - Season (e.g., "20232024")
   */
  async getStandings(season?: string): Promise<any> {
    try {
      const url = season 
        ? `${this.baseUrl}/standings?season=${season}`
        : `${this.baseUrl}/standings`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch standings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}