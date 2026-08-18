export type Instrument = 'GTR' | 'UKU';

export interface Song {
  id?: string;
  title: string;
  artist: string;
  capo?: string;
  strumming?: string;
  notes?: string;
  text: string;
  createdBy?: string;
  savedBy?: string[];
  userTags?: Record<string, string[]>;
  tags?: string[];
  createdAt?: any;
}
