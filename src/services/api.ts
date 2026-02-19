import axios from 'axios';
import { TitleItem, StreamingPlatform, AppPreferences } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000
});

export async function fetchTrending() {
  const { data } = await client.get<{ data: TitleItem[] }>('/trending');
  return data.data;
}

export async function searchTitles(query: string) {
  const { data } = await client.get<{ data: TitleItem[] }>('/search', { params: { q: query } });
  return data.data;
}

export async function fetchTitle(id: number) {
  const { data } = await client.get<{ data: TitleItem }>(`/title/${id}`);
  return data.data;
}

export async function fetchPlatforms() {
  const { data } = await client.get<{ data: StreamingPlatform[] }>('/platforms');
  return data.data;
}

export async function fetchRecommendations() {
  const { data } = await client.get<{ data: TitleItem[] }>('/recommendations');
  return data.data;
}

export async function fetchPreferences() {
  const { data } = await client.get<{ data: AppPreferences }>('/user/preferences');
  return data.data;
}

export async function updatePreferences(payload: Partial<AppPreferences>) {
  const { data } = await client.put<{ data: AppPreferences }>('/user/preferences', payload);
  return data.data;
}

export async function fetchRecentSearches() {
  const { data } = await client.get<{ data: { query: string }[] }>('/user/search-history');
  return data.data;
}
