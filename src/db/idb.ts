import { openDB } from 'idb';

export const initDB = async () => openDB('stardust', 4, {
    upgrade(db) {
        if (!db.objectStoreNames.contains('notes')) db.createObjectStore('notes', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('contents')) db.createObjectStore('contents', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
        if (!db.objectStoreNames.contains('backups')) db.createObjectStore('backups', { autoIncrement: true });
        if (!db.objectStoreNames.contains('connections')) db.createObjectStore('connections', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('graveyard')) db.createObjectStore('graveyard', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('feedback')) db.createObjectStore('feedback', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('constellations')) db.createObjectStore('constellations', { keyPath: 'id' });
    }
});
