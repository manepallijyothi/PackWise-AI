import { HistoryRecord, AnalysisResult } from '../types/packaging';

const LOCAL_STORAGE_KEY = 'packwise_ai_history_v1';

export async function fetchHistoryRecords(): Promise<HistoryRecord[]> {
  try {
    const res = await fetch('/api/history');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Cache to local storage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(json.data));
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Backend history API unreachable, reading from localStorage:', err);
  }

  // Fallback to localStorage
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (e) {
    return [];
  }
}

export async function saveHistoryRecord(result: AnalysisResult): Promise<HistoryRecord> {
  const commodityName = result.input.customName || result.input.commodityType;
  const newRecord: HistoryRecord = {
    id: result.id,
    timestamp: result.timestamp,
    commodityName,
    recommendedMaterial: result.primaryRecommendation.material.shortName,
    compatibility: result.primaryRecommendation.compatibility,
    shelfLifeDays: result.input.targetShelfLifeDays,
    storageType: result.input.storageType,
    temperature: result.input.storageTemperature,
    result
  };

  // Always update localStorage first for instant client availability
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    const existing: HistoryRecord[] = local ? JSON.parse(local) : [];
    const updated = [newRecord, ...existing.filter((r) => r.id !== newRecord.id)].slice(0, 100);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }

  // Then attempt backend persistence
  try {
    await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    });
  } catch (err) {
    console.warn('Backend history save error (stored locally):', err);
  }

  return newRecord;
}

export async function deleteHistoryRecord(id: string): Promise<void> {
  // Update localStorage
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      const existing: HistoryRecord[] = JSON.parse(local);
      const filtered = existing.filter((r) => r.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('LocalStorage delete error:', e);
  }

  // Update backend
  try {
    await fetch(`/api/history/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Backend history delete error:', err);
  }
}

export async function clearAllHistory(): Promise<void> {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {}

  try {
    await fetch('/api/history', { method: 'DELETE' });
  } catch (err) {
    console.warn('Backend history clear error:', err);
  }
}
