import { saveScan, updateScan, type SavedScan } from "./api.ts";
import type { ScanResult } from "../../shared/types.ts";

export type SaveStatus = "saving" | "saved" | "error";

export interface ActiveSaveState {
  scanSessionId: string;
  garmentBlob: Blob;
  scanResult: ScanResult;
  status: SaveStatus;
  savedRecordId: string | null;
  error: string | null;
  savedScan: SavedScan | null;
}

type StateListener = (state: ActiveSaveState) => void;
type GlobalSavedListener = (scan: SavedScan) => void;

class ScanSaveService {
  private saves = new Map<string, ActiveSaveState>();
  private inFlightPromises = new Map<string, Promise<SavedScan>>();
  private listeners = new Map<string, Set<StateListener>>();
  private globalSavedListeners = new Set<GlobalSavedListener>();

  /**
   * Starts background saving as soon as POST /scan succeeds.
   * Outlives components and guards against duplicate calls.
   */
  startAutoSave(
    scanSessionId: string,
    garmentBlob: Blob,
    scanResult: ScanResult
  ): ActiveSaveState {
    const existing = this.saves.get(scanSessionId);
    if (existing) {
      return existing;
    }

    const state: ActiveSaveState = {
      scanSessionId,
      garmentBlob,
      scanResult,
      status: "saving",
      savedRecordId: null,
      error: null,
      savedScan: null,
    };

    this.saves.set(scanSessionId, state);
    this.executeSave(scanSessionId);
    return state;
  }

  private executeSave(scanSessionId: string) {
    const state = this.saves.get(scanSessionId);
    if (!state) return;

    // Guard against duplicate saves
    if (state.savedRecordId) return;
    if (this.inFlightPromises.has(scanSessionId)) return;

    state.status = "saving";
    state.error = null;
    this.notify(scanSessionId);

    const promise = saveScan(state.garmentBlob, state.scanResult)
      .then((saved) => {
        state.status = "saved";
        state.savedRecordId = saved.id;
        state.savedScan = saved;
        state.error = null;
        this.inFlightPromises.delete(scanSessionId);
        this.notify(scanSessionId);
        this.notifyGlobalSaved(saved);
        return saved;
      })
      .catch((err: any) => {
        state.status = "error";
        state.error = err.message || "Couldn't save";
        this.inFlightPromises.delete(scanSessionId);
        this.notify(scanSessionId);
        throw err;
      });

    this.inFlightPromises.set(scanSessionId, promise);
  }

  /**
   * Retries an initial save if it previously failed and no ID has been returned yet.
   */
  async retrySave(scanSessionId: string): Promise<SavedScan | null> {
    const state = this.saves.get(scanSessionId);
    if (!state) return null;

    // Guard: ignore if already saved or in-flight
    if (state.savedRecordId) {
      return state.savedScan;
    }

    const inFlight = this.inFlightPromises.get(scanSessionId);
    if (inFlight) {
      return inFlight;
    }

    this.executeSave(scanSessionId);
    try {
      return await this.inFlightPromises.get(scanSessionId)!;
    } catch {
      return null;
    }
  }

  /**
   * Applies manual picker corrections.
   * If initial save is in flight, waits for it to finish then PATCHes.
   * If save failed (no ID), only updates local state so Retry saves corrected data.
   */
  async applyManualCorrections(
    scanSessionId: string,
    updatedResult: ScanResult
  ): Promise<void> {
    const state = this.saves.get(scanSessionId);
    if (!state) return;

    state.scanResult = updatedResult;

    // Wait for in-flight save if currently running
    const inFlight = this.inFlightPromises.get(scanSessionId);
    if (inFlight) {
      try {
        await inFlight;
      } catch {
        // Handled in catch of initial save
      }
    }

    // If an ID exists, update the saved record in the backend
    if (state.savedRecordId) {
      const symbolIds = updatedResult.detected.map((d) => d.symbolId);
      try {
        const updated = await updateScan(state.savedRecordId, symbolIds);
        state.savedScan = updated;
        state.status = "saved";
        this.notify(scanSessionId);
        this.notifyGlobalSaved(updated);
      } catch (err: any) {
        console.error("Failed to update saved scan:", err);
        // Retain instructions in client state
        this.notify(scanSessionId);
      }
    } else {
      // No ID yet; screen is updated with new instructions, and Retry will save them
      this.notify(scanSessionId);
    }
  }

  getState(scanSessionId: string): ActiveSaveState | undefined {
    return this.saves.get(scanSessionId);
  }

  subscribe(scanSessionId: string, listener: StateListener): () => void {
    if (!this.listeners.has(scanSessionId)) {
      this.listeners.set(scanSessionId, new Set());
    }
    this.listeners.get(scanSessionId)!.add(listener);

    const current = this.saves.get(scanSessionId);
    if (current) {
      listener(current);
    }

    return () => {
      this.listeners.get(scanSessionId)?.delete(listener);
    };
  }

  subscribeGlobalSaved(listener: GlobalSavedListener): () => void {
    this.globalSavedListeners.add(listener);
    return () => {
      this.globalSavedListeners.delete(listener);
    };
  }

  private notify(scanSessionId: string) {
    const state = this.saves.get(scanSessionId);
    if (!state) return;
    const subs = this.listeners.get(scanSessionId);
    if (subs) {
      subs.forEach((cb) => cb({ ...state }));
    }
  }

  private notifyGlobalSaved(scan: SavedScan) {
    this.globalSavedListeners.forEach((cb) => cb(scan));
  }
}

export const scanSaveService = new ScanSaveService();
