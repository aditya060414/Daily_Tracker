import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MOONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dailyos';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully to DailyOS.');

    // Self-healing: Drop legacy single-user indexes that conflict with multi-user configurations
    try {
      const db = mongoose.connection.db;
      if (db) {
        const dropIndexSafely = async (collectionName: string, indexName: string) => {
          try {
            const collections = await db.listCollections({ name: collectionName }).toArray();
            if (collections.length > 0) {
              const indexes = await db.collection(collectionName).indexes();
              const exists = indexes.some(idx => idx.name === indexName);
              if (exists) {
                await db.collection(collectionName).dropIndex(indexName);
                console.log(`Successfully dropped legacy index '${indexName}' from '${collectionName}' collection.`);
              }
            }
          } catch (e: any) {
            console.warn(`Unable to drop index '${indexName}' from '${collectionName}':`, e.message);
          }
        };

        await dropIndexSafely('users', 'username_1');
        await dropIndexSafely('dailylogs', 'date_1');
        await dropIndexSafely('gymsessions', 'date_1');
        await dropIndexSafely('dayplans', 'date_1');
        await dropIndexSafely('dayreviews', 'date_1');
        await dropIndexSafely('meals', 'date_1_mealType_1');
      }
    } catch (cleanupError) {
      console.warn('Post-connection index cleanup warning:', cleanupError);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
