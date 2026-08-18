import {Injectable, signal, computed, inject, effect} from '@angular/core';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { Instrument, Song } from '../models/song.model';
import { db } from '../firebase';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SongService {
  private authService = inject(AuthService);
  private songsCollection = collection(db, 'songs');

  songs = signal<Song[]>([]);
  activeSong = signal<Song | null>(null);
  isLoading = signal<boolean>(false);

  // Záložka: 'my-songs' (Můj zpěvník) | 'all-songs' (Veřejný katalog)
  activeTab = signal<'my-songs' | 'all-songs'>('my-songs');

  // Perzistence nastavení
  private savedNotation = (localStorage.getItem('songbook_notation') as 'CZ' | 'EN') || 'CZ';
  private savedInstrument = (localStorage.getItem('songbook_instrument') as Instrument) || 'GTR';

  currentNotation = signal<'CZ' | 'EN'>(this.savedNotation);
  currentInstrument = signal<Instrument>(this.savedInstrument);
  isSidebarCollapsed = signal<boolean>(false);
  searchQuery = signal<string>('');
  sortBy = signal<string>('title-asc');

  selectedArtist = signal<string | null>(null);
  selectedTag = signal<string | null>(null);

  customTags = signal<string[]>(this.loadCustomTags());

  constructor() {
    this.loadSongs();

    // Kdykoliv se změní přihlášený uživatel (login/logout), vybereme první dostupný song
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.loadSongs();
      }
    });
  }

  private loadCustomTags(): string[] {
    const stored = localStorage.getItem('user_song_tags');
    return stored ? JSON.parse(stored) : ['táborák', 'pop', 'rock', 'pohoda'];
  }

  // Získání tagů aktuálního uživatele pro konkrétní písničku
  getMyTags(song: Song): string[] {
    const uid = this.authService.getUserId();
    if (!uid || !song.userTags) {
      return song.tags || []; // fallback na staré tagy, pokud existují
    }
    return song.userTags[uid] || [];
  }

  // Zda má přihlášený uživatel píseň ve svém osobním zpěvníku
  isSavedByMe(song: Song): boolean {
    const uid = this.authService.getUserId();
    if (!uid) return true; // Nepřihlášený vidí vše
    return Array.isArray(song.savedBy) && song.savedBy.includes(uid);
  }

  // Seznam všech unikátních tagů patřících aktuálnímu uživateli
  myAvailableTags = computed(() => {
    const uid = this.authService.getUserId();
    const allTags = new Set<string>(this.customTags());

    this.songs().forEach(song => {
      const tags = this.getMyTags(song);
      tags.forEach(t => allTags.add(t));
    });

    return Array.from(allTags).sort();
  });

  // Filtrovaný a seřazený seznam skladeb
  filteredSongs = computed(() => {
    const query = this.searchQuery().toLowerCase().trim().replace(/^#/, '');
    const artist = this.selectedArtist();
    const tag = this.selectedTag();
    const tab = this.activeTab();
    const uid = this.authService.getUserId();

    let list = [...this.songs()];

    // 1. Filtr podle záložky (Můj zpěvník vs Katalog)
    if (tab === 'my-songs' && uid) {
      list = list.filter(song => this.isSavedByMe(song));
    }

    // 2. Vyhledávání v textu, názvu, autorovi a vlastních tazích
    if (query) {
      list = list.filter(song => {
        const myTags = this.getMyTags(song);
        return (
          song.title.toLowerCase().includes(query) ||
          song.artist.toLowerCase().includes(query) ||
          myTags.some(t => t.toLowerCase().includes(query))
        );
      });
    }

    // 3. Filtr podle interpreta
    if (artist) {
      list = list.filter(song => (song.artist || 'Neznámý autor') === artist);
    }

    // 4. Filtr podle uživatelského štítku
    if (tag) {
      if (tag === '__UNTAGGED__') {
        list = list.filter(song => this.getMyTags(song).length === 0);
      } else {
        list = list.filter(song => this.getMyTags(song).includes(tag));
      }
    }

    // 5. Řazení
    const sort = this.sortBy();
    list.sort((a, b) => {
      if (sort === 'title-asc') return a.title.localeCompare(b.title, 'cs');
      if (sort === 'title-desc') return b.title.localeCompare(a.title, 'cs');
      if (sort === 'artist-asc') return (a.artist || '').localeCompare(b.artist || '', 'cs');
      if (sort === 'artist-desc') return (b.artist || '').localeCompare(a.artist || '', 'cs');
      return 0;
    });

    return list;
  });

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }

  toggleNotation() {
    this.currentNotation.update(n => {
      const next = n === 'CZ' ? 'EN' : 'CZ';
      localStorage.setItem('songbook_notation', next);
      return next;
    });
  }

  toggleInstrument() {
    this.currentInstrument.update(i => {
      const next: Instrument = i === 'GTR' ? 'UKU' : 'GTR';
      localStorage.setItem('songbook_instrument', next);
      return next;
    });
  }

  addGlobalTag(tagName: string) {
    const clean = tagName.trim().toLowerCase().replace(/^#/, '');
    if (clean && !this.customTags().includes(clean)) {
      const updated = [...this.customTags(), clean].sort();
      this.customTags.set(updated);
      localStorage.setItem('user_song_tags', JSON.stringify(updated));
    }
  }

  removeGlobalTag(tagName: string) {
    const updated = this.customTags().filter(t => t !== tagName);
    this.customTags.set(updated);
    localStorage.setItem('user_song_tags', JSON.stringify(updated));
  }

  // Přidání / odebrání tagu pro aktuálního uživatele
  async toggleSongTag(songId: string, tag: string) {
    const song = this.songs().find(s => s.id === songId);
    const uid = this.authService.getUserId();
    if (!song || !uid) return;

    const currentTags = this.getMyTags(song);
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];

    const updatedUserTags = {
      ...(song.userTags || {}),
      [uid]: newTags
    };

    await this.updateSong(songId, { userTags: updatedUserTags });
  }

  // Uložení / odebrání písničky z osobního zpěvníku
  async toggleSaveSong(songId: string) {
    const song = this.songs().find(s => s.id === songId);
    const uid = this.authService.getUserId();
    if (!song || !uid) return;

    const isSaved = this.isSavedByMe(song);
    const songRef = doc(db, 'songs', songId);

    await updateDoc(songRef, {
      savedBy: isSaved ? arrayRemove(uid) : arrayUnion(uid)
    });

    const updatedSavedBy = isSaved
      ? (song.savedBy || []).filter(id => id !== uid)
      : [...(song.savedBy || []), uid];

    this.songs.update(list =>
      list.map(s => s.id === songId ? { ...s, savedBy: updatedSavedBy } : s)
    );

    if (this.activeSong()?.id === songId) {
      this.activeSong.update(curr => curr ? { ...curr, savedBy: updatedSavedBy } : null);
    }
  }

  async loadSongs() {
    this.isLoading.set(true);
    try {
      const querySnapshot = await getDocs(this.songsCollection);
      const loadedSongs: Song[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loadedSongs.push({
          id: docSnap.id,
          title: data['title'] || 'Bez názvu',
          artist: data['artist'] || 'Neznámý autor',
          capo: data['capo'] || '',
          strumming: data['strumming'] || '',
          notes: data['notes'] || '',
          text: data['text'] || '',
          createdBy: data['createdBy'] || '',
          savedBy: Array.isArray(data['savedBy']) ? data['savedBy'] : [],
          userTags: data['userTags'] || {},
          tags: Array.isArray(data['tags']) ? data['tags'] : []
        });
      });

      this.songs.set(loadedSongs);

      if (loadedSongs.length > 0 && !this.activeSong()) {
        this.activeSong.set(loadedSongs[0]);
      }
    } catch (error) {
      console.error('Chyba při načítání písniček:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  selectSong(song: Song) {
    this.activeSong.set(song);
  }

  async addSong(newSong: Omit<Song, 'id'>) {
    try {
      const uid = this.authService.getUserId();
      const songPayload = {
        ...newSong,
        createdBy: uid || 'anonymous',
        savedBy: uid ? [uid] : [],
        userTags: newSong.tags && uid ? { [uid]: newSong.tags } : (newSong.userTags || {}),
        createdAt: new Date()
      };

      const docRef = await addDoc(this.songsCollection, songPayload);
      const createdSong: Song = { id: docRef.id, ...songPayload };

      this.songs.update(list => [...list, createdSong]);
      this.activeSong.set(createdSong);
      return createdSong;
    } catch (error) {
      console.error('Chyba při přidávání písničky:', error);
      throw error;
    }
  }

  async updateSong(param1: string | Song, param2?: Partial<Song>) {
    let id: string | undefined;
    let updatedData: Partial<Song>;

    if (typeof param1 === 'object') {
      id = param1.id;
      const { id: _, ...rest } = param1;
      updatedData = rest;
    } else {
      id = param1;
      updatedData = param2 || {};
    }

    if (!id) {
      console.error('Chyba: Písnička nemá platné ID pro úpravu.');
      return;
    }

    try {
      const songRef = doc(db, 'songs', id);
      await updateDoc(songRef, updatedData);

      this.songs.update(list =>
        list.map(song => song.id === id ? { ...song, ...updatedData } : song)
      );

      if (this.activeSong()?.id === id) {
        this.activeSong.update(curr => curr ? { ...curr, ...updatedData } : null);
      }
    } catch (error) {
      console.error('Chyba při úpravě písničky:', error);
      throw error;
    }
  }

  async deleteSong(id: string) {
    try {
      const songRef = doc(db, 'songs', id);
      await deleteDoc(songRef);

      this.songs.update(list => list.filter(song => song.id !== id));

      if (this.activeSong()?.id === id) {
        const remaining = this.filteredSongs();
        this.activeSong.set(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (error) {
      console.error('Chyba při mazání písničky:', error);
      throw error;
    }
  }
}
