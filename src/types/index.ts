export type ThemeType = 'light' | 'dark';

export interface StreamingPlatform {
  id: string;
  name: string;
  color?: string;
}

export interface DeepLinkOption {
  platform: string;
  app: string;
  web: string;
  directApp?: string | null;
  directWeb?: string | null;
}

export interface TitleItem {
  id: number;
  title: string;
  type: 'filme' | 'serie';
  mediaType?: 'movie' | 'tv';
  overview: string;
  poster: string | null;
  backdrop?: string | null;
  availableOn: string[];
  deepLinks: DeepLinkOption[];
}

export interface AppPreferences {
  favoriteGenre: string;
  selectedPlatforms: string[];
  theme: ThemeType;
}
