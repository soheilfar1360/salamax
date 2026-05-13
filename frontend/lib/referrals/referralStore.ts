import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { ReferralPayload, ReferralRecord } from "./types";

type ReferralStoreData = Record<string, ReferralRecord>;

const storeDirectory = path.join(process.cwd(), ".tmp");
const storeFilePath = path.join(storeDirectory, "salamax-referrals.json");

async function readStore(): Promise<ReferralStoreData> {
  try {
    const rawStore = await readFile(storeFilePath, "utf8");
    const parsedStore = JSON.parse(rawStore) as unknown;

    if (!parsedStore || typeof parsedStore !== "object") {
      return {};
    }

    return parsedStore as ReferralStoreData;
  } catch {
    return {};
  }
}

async function writeStore(store: ReferralStoreData) {
  await mkdir(storeDirectory, { recursive: true });
  await writeFile(storeFilePath, JSON.stringify(store, null, 2), "utf8");
}

// TODO: Replace this MVP/dev JSON-file store with a real database in production.
export async function saveReferral(
  referralId: string,
  payload: ReferralPayload
) {
  const store = await readStore();
  const record: ReferralRecord = {
    referralId,
    payload,
    storedAt: new Date().toISOString(),
  };

  store[referralId] = record;
  await writeStore(store);

  return record;
}

export async function getReferral(referralId: string) {
  const store = await readStore();
  return store[referralId] ?? null;
}
