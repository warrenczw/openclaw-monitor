import Dexie, { type EntityTable } from 'dexie';

export interface StatEntry {
    id?: number;
    timestamp: number;
    cpu: number;
    ram: number;
    latency: number;
}

export interface TokenEntry {
    id?: number;
    timestamp: number;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
}

const db = new Dexie('OpenClawMonitorDB') as Dexie & {
    stats: EntityTable<StatEntry, 'id'>;
    tokens: EntityTable<TokenEntry, 'id'>;
};

// Schema definition
db.version(1).stores({
    stats: '++id, timestamp',
    tokens: '++id, timestamp, model'
});

// Helper to keep 30 days of data
export async function cleanupOldData() {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    await db.stats.where('timestamp').below(thirtyDaysAgo).delete();
    await db.tokens.where('timestamp').below(thirtyDaysAgo).delete();
}

export { db };
