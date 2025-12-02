export enum NoteType {
    // Cosmic Structures
    Galaxy = 'Galaxy',
    Nebula = 'Nebula', // New group container
    // Stars
    Sun = 'Sun',
    RedGiant = 'RedGiant',
    WhiteDwarf = 'WhiteDwarf',
    Pulsar = 'Pulsar',
    // Gas Giants
    Jupiter = 'Jupiter',
    Saturn = 'Saturn',
    // Ice Giants
    Neptune = 'Neptune',
    Uranus = 'Uranus',
    // Terrestrial Planets
    Earth = 'Earth',
    Venus = 'Venus',
    Mars = 'Mars',
    Mercury = 'Mercury',
    // Dwarf Planets
    Pluto = 'Pluto',
    Ceres = 'Ceres',
    // Other
    Moon = 'Moon',
    Asteroid = 'Asteroid',
    Comet = 'Comet',
}

export interface Note {
    id: string;
    content: string;
    position: { x: number; y: number };
    type: NoteType;
    parentId: string | null;
    tags: string[];
    linkedNoteIds: string[];
    groupId: string | null;
}

export interface CanvasState {
    zoom: number;
    pan: { x: number; y: number };
}

export interface Settings {
    theme: 'cosmic' | 'light' | 'dark';
    font: 'inter' | 'serif' | 'mono';
    fontColor: string;
    showConnections: boolean;
    showMinimap: boolean;
}
