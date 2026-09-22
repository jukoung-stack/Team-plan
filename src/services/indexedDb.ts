import { Task, SyncQueueItem } from '../types';

const DB_NAME = 'EventCheckLocalDB';
const DB_VERSION = 1;

const STORES = {
  TASKS: 'tasks',
  SYNC_QUEUE: 'sync_queue',
  META: 'meta',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

// Check if IndexedDB is supported
export const isIndexedDBSupported = (): boolean => {
  return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
};

// Initialize / Open the IndexedDB database
export const getDB = (): Promise<IDBDatabase> => {
  if (!isIndexedDBSupported()) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Tasks Store (Cache of all tasks)
        if (!db.objectStoreNames.contains(STORES.TASKS)) {
          const taskStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
          taskStore.createIndex('eventId', 'eventId', { unique: false });
          taskStore.createIndex('status', 'status', { unique: false });
          taskStore.createIndex('dueDate', 'dueDate', { unique: false });
        }

        // 2. Sync Queue Store (Offline/pending actions queue)
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('taskId', 'taskId', { unique: false });
        }

        // 3. Meta Store (Sync timestamps, client state)
        if (!db.objectStoreNames.contains(STORES.META)) {
          db.createObjectStore(STORES.META, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (e) => {
        console.error('Failed to open IndexedDB:', request.error || e);
        reject(request.error);
      };

      request.onblocked = () => {
        console.warn('IndexedDB database open was blocked.');
      };
    } catch (err) {
      console.error('Error starting IndexedDB open request:', err);
      reject(err);
    }
  });

  return dbPromise;
};

// ==================== TASK CACHE OPERATIONS ====================

// Cache a single task into IndexedDB
export const cacheTaskInDB = async (task: Task): Promise<void> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.TASKS], 'readwrite');
      const store = tx.objectStore(STORES.TASKS);
      const req = store.put(task);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not cache task:', err);
  }
};

// Cache multiple tasks into IndexedDB (bulk)
export const cacheTasksBatchInDB = async (tasks: Task[]): Promise<void> => {
  if (!tasks.length) return;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.TASKS], 'readwrite');
      const store = tx.objectStore(STORES.TASKS);

      tasks.forEach((task) => {
        store.put(task);
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not batch cache tasks:', err);
  }
};

// Retrieve all cached tasks from IndexedDB
export const getAllCachedTasksFromDB = async (): Promise<Task[]> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.TASKS], 'readonly');
      const store = tx.objectStore(STORES.TASKS);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not read cached tasks:', err);
    return [];
  }
};

// Retrieve a single task by ID from IndexedDB
export const getCachedTaskByIdFromDB = async (id: string): Promise<Task | null> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.TASKS], 'readonly');
      const store = tx.objectStore(STORES.TASKS);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not get cached task:', err);
    return null;
  }
};

// Delete a cached task from IndexedDB
export const deleteCachedTaskFromDB = async (id: string): Promise<void> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.TASKS], 'readwrite');
      const store = tx.objectStore(STORES.TASKS);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not delete cached task:', err);
  }
};

// ==================== SYNC QUEUE OPERATIONS ====================

// Add an action to the sync queue (e.g. 1-minute field action, toggle, update)
export const enqueueSyncActionInDB = async (item: SyncQueueItem): Promise<void> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const req = store.put(item);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not enqueue sync action:', err);
  }
};

// Get all sync queue items (ordered by timestamp)
export const getAllSyncQueueFromDB = async (): Promise<SyncQueueItem[]> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.SYNC_QUEUE], 'readonly');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const req = store.getAll();

      req.onsuccess = () => {
        const items: SyncQueueItem[] = req.result || [];
        // Sort newest first
        items.sort((a, b) => b.timestamp - a.timestamp);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not fetch sync queue:', err);
    return [];
  }
};

// Get only pending sync queue items
export const getPendingSyncQueueFromDB = async (): Promise<SyncQueueItem[]> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.SYNC_QUEUE], 'readonly');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const index = store.index('status');
      const req = index.getAll('pending');

      req.onsuccess = () => {
        const items: SyncQueueItem[] = req.result || [];
        // FIFO order for processing
        items.sort((a, b) => a.timestamp - b.timestamp);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not fetch pending sync items:', err);
    return [];
  }
};

// Update status of a sync queue item
export const updateSyncQueueItemInDB = async (
  id: string,
  updates: Partial<SyncQueueItem>
): Promise<void> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        if (!getReq.result) {
          resolve();
          return;
        }
        const updated = { ...getReq.result, ...updates };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not update sync item:', err);
  }
};

// Delete a sync queue item
export const removeSyncQueueItemFromDB = async (id: string): Promise<void> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not remove sync item:', err);
  }
};

// Clear completed ('synced') items
export const clearSyncedQueueFromDB = async (): Promise<void> => {
  try {
    const all = await getAllSyncQueueFromDB();
    const synced = all.filter((item) => item.status === 'synced');
    if (!synced.length) return;

    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      synced.forEach((item) => store.delete(item.id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not clear synced queue:', err);
  }
};

// Clear all queue items
export const clearEntireSyncQueueFromDB = async (): Promise<void> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not clear entire sync queue:', err);
  }
};

// ==================== META STORE ====================

export const setMetaInDB = async (key: string, value: any): Promise<void> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.META], 'readwrite');
      const store = tx.objectStore(STORES.META);
      const req = store.put({ key, value, updatedAt: Date.now() });

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not set meta:', err);
  }
};

export const getMetaFromDB = async (key: string): Promise<any> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.META], 'readonly');
      const store = tx.objectStore(STORES.META);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not get meta:', err);
    return null;
  }
};

// Get high level cache statistics
export const getIndexedDBStats = async (): Promise<{
  cachedTasksCount: number;
  pendingCount: number;
  totalQueueCount: number;
  isAvailable: boolean;
}> => {
  if (!isIndexedDBSupported()) {
    return { cachedTasksCount: 0, pendingCount: 0, totalQueueCount: 0, isAvailable: false };
  }
  try {
    const [tasks, queue] = await Promise.all([
      getAllCachedTasksFromDB(),
      getAllSyncQueueFromDB(),
    ]);

    const pending = queue.filter((q) => q.status === 'pending').length;

    return {
      cachedTasksCount: tasks.length,
      pendingCount: pending,
      totalQueueCount: queue.length,
      isAvailable: true,
    };
  } catch (err) {
    console.warn('[IndexedDB] Stats error:', err);
    return { cachedTasksCount: 0, pendingCount: 0, totalQueueCount: 0, isAvailable: false };
  }
};
