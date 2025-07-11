import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  PaginatedResponse,
  Player,
  PlayerInput,
  PlayerFilters,
  Tournament,
  TournamentInput,
  TournamentFilters,
  TournamentResult,
  TournamentResultInput,
  TournamentResultFilters,
  PaginationOptions,
} from '../types/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        
        // Handle rate limiting (429 errors)
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 1;
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return this.client.request(error.config);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Generic methods
  private async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  private async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  private async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  private async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Player API methods
  async getPlayers(filters?: PlayerFilters & PaginationOptions): Promise<PaginatedResponse<Player>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return this.get<PaginatedResponse<Player>>(`/players?${params.toString()}`);
  }

  async getPlayer(id: string): Promise<ApiResponse<Player>> {
    return this.get<ApiResponse<Player>>(`/players/${id}`);
  }

  async createPlayer(data: PlayerInput): Promise<ApiResponse<Player>> {
    return this.post<ApiResponse<Player>>('/players', data);
  }

  async updatePlayer(id: string, data: Partial<PlayerInput>): Promise<ApiResponse<Player>> {
    return this.put<ApiResponse<Player>>(`/players/${id}`, data);
  }

  async deletePlayer(id: string): Promise<ApiResponse> {
    return this.delete<ApiResponse>(`/players/${id}`);
  }

  async getPlayerStats(): Promise<ApiResponse> {
    return this.get<ApiResponse>('/players/stats');
  }

  async getChampions(minChampionships = 1): Promise<ApiResponse<Player[]>> {
    return this.get<ApiResponse<Player[]>>(`/players/champions?min=${minChampionships}`);
  }

  async searchPlayers(query: string, options?: PaginationOptions): Promise<PaginatedResponse<Player>> {
    const params = new URLSearchParams({ q: query });
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return this.get<PaginatedResponse<Player>>(`/players/search?${params.toString()}`);
  }

  // Tournament API methods
  async getTournaments(filters?: TournamentFilters & PaginationOptions): Promise<PaginatedResponse<Tournament>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return this.get<PaginatedResponse<Tournament>>(`/tournaments?${params.toString()}`);
  }

  async getTournament(id: string): Promise<ApiResponse<Tournament>> {
    return this.get<ApiResponse<Tournament>>(`/tournaments/${id}`);
  }

  async createTournament(data: TournamentInput): Promise<ApiResponse<Tournament>> {
    return this.post<ApiResponse<Tournament>>('/tournaments', data);
  }

  async updateTournament(id: string, data: Partial<TournamentInput>): Promise<ApiResponse<Tournament>> {
    return this.put<ApiResponse<Tournament>>(`/tournaments/${id}`, data);
  }

  async deleteTournament(id: string, cascade = false): Promise<ApiResponse> {
    return this.delete<ApiResponse>(`/tournaments/${id}?cascade=${cascade}`);
  }

  async getTournamentStats(): Promise<ApiResponse> {
    return this.get<ApiResponse>('/tournaments/stats');
  }

  async getTournamentsByYear(year: number): Promise<ApiResponse<Tournament[]>> {
    return this.get<ApiResponse<Tournament[]>>(`/tournaments/year/${year}`);
  }

  async getTournamentsByFormat(format: string): Promise<ApiResponse<Tournament[]>> {
    return this.get<ApiResponse<Tournament[]>>(`/tournaments/format/${format}`);
  }

  async getUpcomingTournaments(limit = 10): Promise<ApiResponse<Tournament[]>> {
    return this.get<ApiResponse<Tournament[]>>(`/tournaments/upcoming?limit=${limit}`);
  }

  async getRecentTournaments(limit = 10): Promise<ApiResponse<Tournament[]>> {
    return this.get<ApiResponse<Tournament[]>>(`/tournaments/recent?limit=${limit}`);
  }

  // Tournament Result API methods
  async getTournamentResults(filters?: TournamentResultFilters & PaginationOptions): Promise<PaginatedResponse<TournamentResult>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return this.get<PaginatedResponse<TournamentResult>>(`/tournament-results?${params.toString()}`);
  }

  async getTournamentResult(id: string): Promise<ApiResponse<TournamentResult>> {
    return this.get<ApiResponse<TournamentResult>>(`/tournament-results/${id}`);
  }

  async createTournamentResult(data: TournamentResultInput): Promise<ApiResponse<TournamentResult>> {
    return this.post<ApiResponse<TournamentResult>>('/tournament-results', data);
  }

  async updateTournamentResult(id: string, data: Partial<TournamentResultInput>): Promise<ApiResponse<TournamentResult>> {
    return this.put<ApiResponse<TournamentResult>>(`/tournament-results/${id}`, data);
  }

  async deleteTournamentResult(id: string): Promise<ApiResponse> {
    return this.delete<ApiResponse>(`/tournament-results/${id}`);
  }

  async getTournamentResultStats(): Promise<ApiResponse> {
    return this.get<ApiResponse>('/tournament-results/stats');
  }

  async getResultsByTournament(tournamentId: string): Promise<ApiResponse> {
    return this.get<ApiResponse>(`/tournament-results/tournament/${tournamentId}`);
  }

  async getResultsByPlayer(playerId: string): Promise<ApiResponse> {
    return this.get<ApiResponse>(`/tournament-results/player/${playerId}`);
  }

  async getLeaderboard(filters?: { tournamentId?: string; format?: string; year?: number; limit?: number }): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return this.get<ApiResponse>(`/tournament-results/leaderboard?${params.toString()}`);
  }

  // Authentication methods
  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  removeAuthToken(): void {
    localStorage.removeItem('authToken');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.get<ApiResponse>('/health');
  }
}

export const apiClient = new ApiClient();
export default apiClient;