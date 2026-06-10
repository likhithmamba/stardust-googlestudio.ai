import { initDB } from './idb';
import type { Note, Connection } from '../store/noteSlice';

export class StardustDB {
    private static instance: StardustDB;

    private constructor() {}

    public static getInstance(): StardustDB {
        if (!StardustDB.instance) {
            StardustDB.instance = new StardustDB();
        }
        return StardustDB.instance;
    }

    async getAllNotes(): Promise<Note[]> {
        try {
            const db = await initDB();
            return await db.getAll('notes');
        } catch (e) {
            console.error('[StardustDB] Failed to get all notes:', e);
            return [];
        }
    }

    async getAllConnections(): Promise<Connection[]> {
        try {
            const db = await initDB();
            return await db.getAll('connections');
        } catch (e) {
            console.error('[StardustDB] Failed to get all connections:', e);
            return [];
        }
    }

    async getAllGraveyard(): Promise<Note[]> {
        try {
            const db = await initDB();
            return await db.getAll('graveyard');
        } catch (e) {
            console.error('[StardustDB] Failed to get graveyard:', e);
            return [];
        }
    }

    async upsertNote(note: Note): Promise<void> {
        try {
            const db = await initDB();
            const tx = db.transaction('notes', 'readwrite');
            await tx.objectStore('notes').put(note);
            await tx.done;
        } catch (e) {
            console.error('[StardustDB] Failed to upsert note:', e);
        }
    }

    async bulkUpsertNotes(notes: Note[]): Promise<void> {
        try {
            const db = await initDB();
            const tx = db.transaction('notes', 'readwrite');
            const store = tx.objectStore('notes');
            for (const note of notes) {
                await store.put(note);
            }
            await tx.done;
        } catch (e) {
            console.error('[StardustDB] Failed to bulk upsert notes:', e);
        }
    }

    async deleteNote(id: string): Promise<void> {
        try {
            const db = await initDB();
            const tx = db.transaction('notes', 'readwrite');
            await tx.objectStore('notes').delete(id);
            await tx.done;
        } catch (e) {
            console.error('[StardustDB] Failed to delete note:', e);
        }
    }

    async bulkDeleteNotes(ids: string[]): Promise<void> {
        try {
            const db = await initDB();
            const tx = db.transaction('notes', 'readwrite');
            const store = tx.objectStore('notes');
            for (const id of ids) {
                await store.delete(id);
            }
            await tx.done;
        } catch (e) {
            console.error('[StardustDB] Failed to bulk delete notes:', e);
        }
    }

    async upsertConnection(conn: Connection): Promise<void> {
        try {
            const db = await initDB();
            const tx = db.transaction('connections', 'readwrite');
            await tx.objectStore('connections').put(conn);
            await tx.done;
        } catch (e) {
            console.error('[StardustDB] Failed to upsert connection:', e);
        }
    }

    async bulkUpsertConnections(conns: Connection[]): Promise<void> {
        try {
            const db = await initDB();
            const tx = db.transaction('connections', 'readwrite');
            const store = tx.objectStore('connections');
            for (const conn of conns) {
                await store.put(conn);
            }
            await tx.done;
        } catch (e) {
            console.error('[StardustDB] Failed to bulk upsert connections:', e);
        }
    }

    async deleteConnection(id: string): Promise<void> {
        try {
            const db = await initDB();
            const tx = db.transaction('connections', 'readwrite');
            await tx.objectStore('connections').delete(id);
            await tx.done;
        } catch (e) {
            console.error('[StardustDB] Failed to delete connection:', e);
        }
    }

    async bulkDeleteConnections(ids: string[]): Promise<void> {
        try {
            const db = await initDB();
            const tx = db.transaction('connections', 'readwrite');
            const store = tx.objectStore('connections');
            for (const id of ids) {
                await store.delete(id);
            }
            await tx.done;
        } catch (e) {
            console.error('[StardustDB] Failed to bulk delete connections:', e);
        }
    }

    async saveGraveyard(graveyard: Note[]): Promise<void> {
        try {
            const db = await initDB();
            const tx = db.transaction('graveyard', 'readwrite');
            const store = tx.objectStore('graveyard');
            await store.clear();
            for (const note of graveyard) {
                await store.put(note);
            }
            await tx.done;
        } catch (e) {
            console.error('[StardustDB] Failed to save graveyard:', e);
        }
    }

    async getFeedbackEntry(): Promise<any> {
        try {
            const db = await initDB();
            return await db.get('feedback', 'first-launch');
        } catch (e) {
            console.error('[StardustDB] Failed to get feedback entry:', e);
            return null;
        }
    }

    async putFeedbackEntry(entry: any): Promise<void> {
        try {
            const db = await initDB();
            const tx = db.transaction('feedback', 'readwrite');
            await tx.objectStore('feedback').put({ id: 'first-launch', ...entry });
            await tx.done;
        } catch (e) {
            console.error('[StardustDB] Failed to save feedback entry:', e);
        }
    }

    async getApiKey(provider: string): Promise<string | null> {
        try {
            const db = await initDB();
            return (await db.get('settings', `api_key_${provider}`)) || null;
        } catch (e) {
            console.error(`[StardustDB] Failed to get API key for ${provider}:`, e);
            return null;
        }
    }

    async saveApiKey(provider: string, key: string): Promise<void> {
        try {
            const db = await initDB();
            const tx = db.transaction('settings', 'readwrite');
            await tx.objectStore('settings').put(key, `api_key_${provider}`);
            await tx.done;
        } catch (e) {
            console.error(`[StardustDB] Failed to save API key for ${provider}:`, e);
        }
    }

    async clearApiKey(provider: string): Promise<void> {
        try {
            const db = await initDB();
            const tx = db.transaction('settings', 'readwrite');
            await tx.objectStore('settings').delete(`api_key_${provider}`);
            await tx.done;
        } catch (e) {
            console.error(`[StardustDB] Failed to clear API key for ${provider}:`, e);
        }
    }

    async getSetting(key: string, defaultValue: any): Promise<any> {
        try {
            const db = await initDB();
            const val = await db.get('settings', key);
            return val !== undefined ? val : defaultValue;
        } catch (e) {
            console.error(`[StardustDB] Failed to get setting ${key}:`, e);
            return defaultValue;
        }
    }

    async saveSetting(key: string, value: any): Promise<void> {
        try {
            const db = await initDB();
            const tx = db.transaction('settings', 'readwrite');
            await tx.objectStore('settings').put(value, key);
            await tx.done;
        } catch (e) {
            console.error(`[StardustDB] Failed to save setting ${key}:`, e);
        }
    }

    async clearAll(): Promise<void> {
        try {
            const db = await initDB();
            const tx = db.transaction(['notes', 'connections', 'graveyard', 'settings'], 'readwrite');
            await Promise.all([
                tx.objectStore('notes').clear(),
                tx.objectStore('connections').clear(),
                tx.objectStore('graveyard').clear(),
                tx.objectStore('settings').clear()
            ]);
            await tx.done;
        } catch (e) {
            console.error('[StardustDB] Failed to clear stores:', e);
        }
    }
}

export const stardustDB = StardustDB.getInstance();
