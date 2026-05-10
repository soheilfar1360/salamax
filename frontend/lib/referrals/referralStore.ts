import type { ReferralPayload, ReferralRecord } from "./types";

type ReferralStoreGlobal = typeof globalThis & {
  salamaxReferralStore?: Map<string, ReferralRecord>;
};

const storeGlobal = globalThis as ReferralStoreGlobal;

// TODO: Replace this MVP in-memory store with a database for production use.
const referralStore =
  storeGlobal.salamaxReferralStore ?? new Map<string, ReferralRecord>();

storeGlobal.salamaxReferralStore = referralStore;

export function saveReferral(referralId: string, payload: ReferralPayload) {
  const record: ReferralRecord = {
    referralId,
    payload,
    storedAt: new Date().toISOString(),
  };

  referralStore.set(referralId, record);
  return record;
}

export function getReferral(referralId: string) {
  return referralStore.get(referralId) ?? null;
}
