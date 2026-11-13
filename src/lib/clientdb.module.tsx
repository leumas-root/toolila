'use client';

import { openDB, unwrap, wrap } from 'idb';

const NOOTIN_DB_VERSION = 2;
const NOOTIN_STORES = [
    { name: 'personals', key: 'id', indexes: ['name_tool', 'id'] },
    { name: 'remote', key: 'id', indexes: ['name_tool', 'id'] },
] as const;

type InsertResult<T> = {
    error: string | null;
    data: T[] | null;
};

type UpdateResult<T> = {
    error: string | null;
    data: T | null;
};

export type ClientDbProps<T extends object> = {
    db: IDBDatabase | null;
    data: T[] | null;
    error: string | null;
    store: string | null;
    init: (storeName: string, key: string, indexes: string[]) => Promise<ClientDbProps<T>>;
    close: () => void;
    insert: (data?: T[]) => Promise<InsertResult<T>>;
    get: (keys?: string[]) => Promise<ClientDbProps<T>>;
    all: () => Promise<IDBValidKey[] | null>;
    update: (key: IDBValidKey, changes: Partial<T>) => Promise<UpdateResult<T>>;
};

function ensureObjectStore(
    db: IDBDatabase,
    transaction: IDBTransaction,
    storeName: string,
    key: string,
    indexes: readonly string[],
) {
    const objectStore = db.objectStoreNames.contains(storeName)
        ? transaction.objectStore(storeName)
        : db.createObjectStore(storeName, { keyPath: key });

    for (const index of indexes) {
        if (!objectStore.indexNames.contains(index)) {
            objectStore.createIndex(index, index, { unique: false });
        }
    }
}

export function clientDb<T extends object = Record<string, unknown>>(name: string): ClientDbProps<T> {
    const clientDbStore: ClientDbProps<T> = {
        db: null,
        data: null,
        error: null,
        store: null,
        async init(storeName, key, indexes) {
            const version = name === 'Nootin' ? NOOTIN_DB_VERSION : 1;
            const database = await openDB(name, version, {
                upgrade(database, _oldVersion, _newVersion, upgradeTransaction) {
                    const db = unwrap(database);
                    const transaction = unwrap(upgradeTransaction);
                    if (name === 'Nootin') {
                        for (const store of NOOTIN_STORES) {
                            ensureObjectStore(
                                db,
                                transaction,
                                store.name,
                                store.key,
                                store.indexes,
                            );
                        }
                    }

                    ensureObjectStore(db, transaction, storeName, key, indexes);
                },
            });

            this.db = unwrap(database);
            this.store = storeName;
            return this;
        },
        close() {
            this.db?.close();
            this.db = null;
        },
        async insert(records) {
            if (this.error) return { error: this.error, data: this.data };
            if (!this.db || !this.store) {
                this.error = 'Enregistrement local indisponible.';
                return { error: this.error, data: this.data };
            }
            if (!records) return { error: null, data: this.data };

            try {
                const transaction = wrap(this.db).transaction(this.store, 'readwrite');
                for (const record of records) {
                    await transaction.store.add(record);
                }
                await transaction.done;
                this.data = records;
                return { error: null, data: this.data };
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.error = `L'insertion des enregistrements a échoué. ${message}`;
                console.error(this.error, error);
                return { error: this.error, data: null };
            }
        },
        async get(keys) {
            if (this.error || !this.db || !this.store) {
                if (!this.error) this.error = 'Le stockage local est indisponible.';
                return this;
            }

            try {
                const database = wrap(this.db);
                if (!keys || keys.length === 0) {
                    this.data = await database.getAll(this.store) as T[];
                    return this;
                }

                const storeName = this.store;
                const records = await Promise.all(
                    keys.map((key) => database.get(storeName, key)),
                );
                this.data = records.filter((record) => record !== undefined) as T[];
                return this;
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.error = `La récupération des enregistrements a échoué. ${message}`;
                console.error(this.error, error);
                return this;
            }
        },
        async all() {
            if (this.error || !this.db || !this.store) {
                if (!this.error) this.error = 'Le stockage local est indisponible.';
                return null;
            }

            try {
                return await wrap(this.db).getAllKeys(this.store);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                console.error(`La récupération des clés a échoué. ${message}`, error);
                return null;
            }
        },
        async update(key, changes) {
            if (this.error) return { error: this.error, data: null };
            if (!this.db || !this.store) {
                return { error: 'La mise à jour locale est indisponible.', data: null };
            }

            try {
                const transaction = wrap(this.db).transaction(this.store, 'readwrite');
                const record = await transaction.store.get(key) as T | undefined;
                if (!record) {
                    await transaction.done;
                    return { error: 'La mise à jour a échoué. Aucun enregistrement ne correspond à cette clé.',
                         data: null };
                }

                const updatedRecord = Object.assign(record, changes);
                await transaction.store.put(updatedRecord);
                await transaction.done;
                this.data = null;
                return { error: null, data: updatedRecord };
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                console.error(`La mise à jour de l'enregistrement a échoué. ${message}`, error);
                return { error: `La mise à jour de l'enregistrement a échoué. ${message}`, data: null };
            }
        }
    };

    return clientDbStore;
}
