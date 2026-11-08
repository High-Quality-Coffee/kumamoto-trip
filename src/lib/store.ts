import "server-only";
import { promises as fs } from "fs";
import path from "path";

/**
 * 아주 작은 문서 저장소.
 * - FIREBASE_PROJECT_ID 가 있으면 Firestore (서버에서 firebase-admin 으로만 접근)
 * - 없으면 개발용으로 .data/db.json 파일에 저장 (배포 환경에서는 사용 불가)
 */
export interface Store {
  list<T>(col: string): Promise<T[]>;
  get<T>(col: string, id: string): Promise<T | null>;
  set<T extends object>(col: string, id: string, data: T): Promise<void>;
  remove(col: string, id: string): Promise<void>;
  /** 문서를 읽고 고쳐서 저장하는 걸 한 번에(트랜잭션) 해요. 동시에 고쳐도 내용이 사라지지 않아요. */
  update<T>(col: string, id: string, fn: (cur: T) => T): Promise<T>;
}

export class NotFoundError extends Error {}

/* ---------- Firestore ---------- */
async function firestoreStore(): Promise<Store> {
  const { initializeApp, getApps, cert } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
      }),
    });
  const db = getFirestore(app);
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // 이미 설정됨 (개발 서버 핫 리로드)
  }
  return {
    async list<T>(col: string) {
      const snap = await db.collection(col).get();
      return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T);
    },
    async get<T>(col: string, id: string) {
      const snap = await db.collection(col).doc(id).get();
      return snap.exists ? ({ ...snap.data(), id: snap.id } as T) : null;
    },
    async set(col, id, data) {
      await db.collection(col).doc(id).set(data as FirebaseFirestore.DocumentData);
    },
    async remove(col, id) {
      await db.collection(col).doc(id).delete();
    },
    async update<T>(col: string, id: string, fn: (cur: T) => T) {
      const ref = db.collection(col).doc(id);
      return db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) throw new NotFoundError(`${col}/${id}`);
        const next = fn({ ...snap.data(), id: snap.id } as T);
        tx.set(ref, next as FirebaseFirestore.DocumentData);
        return next;
      });
    },
  };
}

/* ---------- 로컬 JSON 파일 (개발용) ---------- */
function fileStore(): Store {
  const file = path.join(process.cwd(), ".data", "db.json");
  type DB = Record<string, Record<string, unknown>>;
  let queue: Promise<unknown> = Promise.resolve();
  const read = async (): Promise<DB> => {
    try {
      return JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      return {};
    }
  };
  const write = async (db: DB) => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(db, null, 2));
  };
  const serial = <R>(job: () => Promise<R>): Promise<R> => {
    const run = queue.then(job, job);
    queue = run.catch(() => undefined);
    return run;
  };
  const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
  return {
    list: <T>(col: string) =>
      serial(async () => {
        const db = await read();
        return Object.entries(db[col] ?? {}).map(([id, v]) => clone({ ...(v as object), id }) as T);
      }),
    get: <T>(col: string, id: string) =>
      serial(async () => {
        const v = (await read())[col]?.[id];
        return v ? (clone({ ...(v as object), id }) as T) : null;
      }),
    set: (col, id, data) =>
      serial(async () => {
        const db = await read();
        (db[col] ??= {})[id] = clone(data);
        await write(db);
      }),
    remove: (col, id) =>
      serial(async () => {
        const db = await read();
        if (db[col]) delete db[col][id];
        await write(db);
      }),
    update: <T>(col: string, id: string, fn: (cur: T) => T) =>
      serial(async () => {
        const db = await read();
        const cur = db[col]?.[id];
        if (!cur) throw new NotFoundError(`${col}/${id}`);
        const next = fn(clone({ ...(cur as object), id }) as T);
        db[col][id] = clone(next);
        await write(db);
        return next;
      }),
  };
}

let storePromise: Promise<Store> | null = null;

export function getStore(): Promise<Store> {
  if (!storePromise) {
    if (process.env.FIREBASE_PROJECT_ID) storePromise = firestoreStore();
    else if (process.env.NODE_ENV !== "production") storePromise = Promise.resolve(fileStore());
    else
      throw new Error(
        "FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY 환경 변수를 설정해 주세요.",
      );
  }
  return storePromise;
}
