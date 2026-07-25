export interface Song {
  id?: string;
  title: string;
  artist: string;
  text: string;
  notes?: string;
  capo?: string;
  strumming?: string;
}

export type Instrument = 'GTR' | 'UKU';
export type ChordNotation = 'CZ' | 'EN';
export type SortOption = 'title-asc' | 'title-desc' | 'artist-asc' | 'artist-desc';
