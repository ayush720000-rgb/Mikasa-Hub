// Match history for Chess players. Records are written by the server when a game finishes, so
// a client cannot add or edit a result. With MONGODB_URI set, history is kept in the
// `chess_match_records` collection and survives redeploys. Without it, history is kept in
// memory and is lost on restart.
import { Collection, MongoClient } from 'mongodb';
import type { RoomState } from '../types/chess';
import {
  buildMatchRecord,
  calculateStats,
  MatchRecord,
  MAX_STORED_MATCHES,
  PlayerStatsData,
} from '../utils/playerStatsCore';

/** One document per player and game. The match record is kept as a JSON string, as it was sent. */
interface MatchDoc {
  player_id: string;
  id: string;
  played_at: number;
  record: string;
}

const COLLECTION = 'chess_match_records';

/** Database name: MONGODB_DB if set, otherwise "mikasa". */
function dbName(): string {
  return (process.env.MONGODB_DB || '').trim() || 'mikasa';
}

class StatsStore {
  private client: MongoClient | null = null;
  private collection: Collection<MatchDoc> | null = null;
  private memory = new Map<string, MatchRecord[]>();

  public async init(): Promise<void> {
    const uri = (process.env.MONGODB_URI || '').trim();
    if (!uri) {
      console.warn('[stats] MONGODB_URI is not set. Chess match history is kept in memory and is lost on restart.');
      return;
    }
    const client = new MongoClient(uri, { maxPoolSize: 3, serverSelectionTimeoutMS: 10_000 });
    try {
      await client.connect();
      const collection = client.db(dbName()).collection<MatchDoc>(COLLECTION);
      // The unique index makes recording the same game twice a no-op. The second index serves
      // the "newest matches first" queries.
      await collection.createIndex({ player_id: 1, id: 1 }, { unique: true });
      await collection.createIndex({ player_id: 1, played_at: -1 });
      this.client = client;
      this.collection = collection;
      console.log('[stats] Using MongoDB for Chess match history.');
    } catch (err) {
      await client.close().catch(() => undefined);
      throw err;
    }
  }

  /** Record every human player's side of a finished game. Safe to call more than once. */
  public async recordFinishedGame(room: RoomState): Promise<void> {
    if (room.status !== 'finished') return;
    const humans = [room.whitePlayer, room.blackPlayer]
      .filter((p) => p && !p.user.isBot)
      .map((p) => String(p!.user.id));

    for (const playerId of humans) {
      const record = buildMatchRecord(room, playerId);
      if (!record) continue;

      if (this.collection) {
        await this.collection.updateOne(
          { player_id: playerId, id: record.id },
          { $setOnInsert: { played_at: record.date, record: JSON.stringify(record) } },
          { upsert: true }
        );
        await this.pruneOldMatches(playerId);
      } else {
        const list = this.memory.get(playerId) ?? [];
        if (!list.some((r) => r.id === record.id)) {
          this.memory.set(playerId, [record, ...list].slice(0, MAX_STORED_MATCHES));
        }
      }
    }
  }

  /** Keep only the newest MAX_STORED_MATCHES records for one player. */
  private async pruneOldMatches(playerId: string): Promise<void> {
    if (!this.collection) return;
    const older = await this.collection
      .find({ player_id: playerId }, { projection: { id: 1, _id: 0 } })
      .sort({ played_at: -1 })
      .skip(MAX_STORED_MATCHES)
      .toArray();
    if (older.length === 0) return;
    await this.collection.deleteMany({
      player_id: playerId,
      id: { $in: older.map((d) => d.id) },
    });
  }

  /** Close the MongoDB connection. Call on shutdown. */
  public async close(): Promise<void> {
    const client = this.client;
    this.client = null;
    this.collection = null;
    await client?.close().catch(() => undefined);
  }

  public async getStats(playerId: string): Promise<PlayerStatsData> {
    if (this.collection) {
      const docs = await this.collection
        .find({ player_id: playerId })
        .sort({ played_at: -1 })
        .limit(MAX_STORED_MATCHES)
        .toArray();
      return calculateStats(docs.map((d) => JSON.parse(d.record) as MatchRecord));
    }
    return calculateStats(this.memory.get(playerId) ?? []);
  }
}

export const statsStore = new StatsStore();
