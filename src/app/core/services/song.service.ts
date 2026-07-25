import { Injectable, signal, computed } from '@angular/core';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Instrument, Song } from '../models/song.model';
import { db } from '../firebase';

@Injectable({
  providedIn: 'root'
})
export class SongService {
  songs = signal<Song[]>([]);
  activeSong = signal<Song | null>(null);
  isLoading = signal<boolean>(false);

  // Načtení z localStorage pro perzistenci
  private savedNotation = (localStorage.getItem('songbook_notation') as 'CZ' | 'EN') || 'CZ';
  private savedInstrument = (localStorage.getItem('songbook_instrument') as Instrument) || 'GTR';

  currentNotation = signal<'CZ' | 'EN'>(this.savedNotation);
  currentInstrument = signal<Instrument>(this.savedInstrument);
  isSidebarCollapsed = signal<boolean>(false);
  searchQuery = signal<string>('');
  sortBy = signal<string>('title-asc');

  filteredSongs = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const sort = this.sortBy();
    let list = [...this.songs()];

    if (query) {
      list = list.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
      );
    }

    list.sort((a, b) => {
      let fieldA = sort.startsWith('title') ? a.title.toLowerCase() : a.artist.toLowerCase();
      let fieldB = sort.startsWith('title') ? b.title.toLowerCase() : b.artist.toLowerCase();

      const res = fieldA.localeCompare(fieldB, 'cs');
      return sort.endsWith('asc') ? res : -res;
    });

    return list;
  });

  private songsCollection = collection(db, 'songs');

  constructor() {
    this.loadSongs();
  }

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
          text: data['text'] || ''
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
      const docRef = await addDoc(this.songsCollection, newSong);
      const createdSong: Song = { id: docRef.id, ...newSong };
      this.songs.update(list => [...list, createdSong]);
      this.activeSong.set(createdSong);
      return createdSong;
    } catch (error) {
      console.error('Chyba při přidávání písničky:', error);
      throw error;
    }
  }

  // Podpora obou zápisů: updateSong(id, data) i updateSong(fullSongObject)
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

    // Pokud ID chybí, nemůžeme ve Firestore nic upravit
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
        const remaining = this.songs();
        this.activeSong.set(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (error) {
      console.error('Chyba při mazání písničky:', error);
      throw error;
    }
  }
}
