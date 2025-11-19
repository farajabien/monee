import { init, id } from "@instantdb/react";
import schema from "../instant.schema";

// ID for app: jibu-delivery
const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID!;

/**
 * InstantDB client initialization
 *
 * Note: InstantDB uses localStorage and IndexedDB for caching query results.
 * If you encounter JSON parse errors, use the storage utilities from @/lib/storage-utils
 * to clear corrupted storage.
 *
 * The useStorageInit hook in app layout handles automatic error recovery.
 */
const db = init({ appId: APP_ID, schema });

export { db, id };
