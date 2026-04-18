import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import { ReportData, CapturedImageData, CapturedVideoData, ReportService } from './reportService';

const QUEUE_KEY = '@aeris_report_queue';
const OFFLINE_PHOTOS_DIR = `${FileSystem.documentDirectory}offline_queue/`;
const MAX_RETRIES = 5;
const RETRY_DELAY_BASE = 2000;

export interface QueuedReport {
  id: string;
  data: ReportData;
  queuedAt: number;
  retries: number;
  lastAttempt: number;
  status: 'pending' | 'uploading' | 'failed' | 'sent';
}

let isProcessing = false;

/**
 * Save report to persistent queue and attempt immediate upload.
 * Always succeeds — callers should never catch and show an error to the user.
 */
export async function queueRequest(data: ReportData): Promise<void> {
  // Copy photos to persistent storage so they survive app restarts
  const persistedData = await persistMediaUris(data);

  const entry: QueuedReport = {
    id: data.reportId,
    data: persistedData,
    queuedAt: Date.now(),
    retries: 0,
    lastAttempt: 0,
    status: 'pending',
  };

  const queue = await loadQueue();
  queue.push(entry);
  await saveQueue(queue);

  // Fire-and-forget — syncs now if online, otherwise waits for reconnect
  processQueue();
}

/**
 * Copy image/video URIs to documentDirectory so they persist after app restart.
 */
async function persistMediaUris(data: ReportData): Promise<ReportData> {
  try {
    await FileSystem.makeDirectoryAsync(OFFLINE_PHOTOS_DIR, { intermediates: true });

    const persistedImages: CapturedImageData[] = await Promise.all(
      data.images.map(async (img) => {
        if (img.uri.startsWith(OFFLINE_PHOTOS_DIR)) return img; // already persisted
        try {
          const dest = `${OFFLINE_PHOTOS_DIR}${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
          await FileSystem.copyAsync({ from: img.uri, to: dest });
          return { ...img, uri: dest };
        } catch {
          return img; // keep original URI on copy failure
        }
      })
    );

    const sourceVideos = data.videos ?? [];
    const persistedVideos: CapturedVideoData[] = await Promise.all(
      sourceVideos.map(async (vid) => {
        if (vid.uri.startsWith(OFFLINE_PHOTOS_DIR)) return vid;
        try {
          const dest = `${OFFLINE_PHOTOS_DIR}${Date.now()}_${Math.random().toString(36).slice(2)}.mp4`;
          await FileSystem.copyAsync({ from: vid.uri, to: dest });
          return { ...vid, uri: dest };
        } catch {
          return vid;
        }
      })
    );

    return { ...data, images: persistedImages, videos: persistedVideos };
  } catch {
    return data; // on any failure, keep original data
  }
}

/**
 * Process all pending queue entries when online.
 * Safe to call multiple times — guards against concurrent runs.
 */
export async function processQueue(): Promise<void> {
  if (isProcessing) return;

  const netState = await NetInfo.fetch();
  if (!netState.isConnected || !netState.isInternetReachable) return;

  isProcessing = true;
  try {
    const queue = await loadQueue();
    const pending = queue.filter(
      (r) => r.status === 'pending' || r.status === 'failed'
    );

    for (const report of pending) {
      if (report.retries >= MAX_RETRIES) continue;

      // Respect exponential backoff
      const backoffMs = RETRY_DELAY_BASE * Math.pow(2, report.retries);
      if (report.lastAttempt && Date.now() - report.lastAttempt < backoffMs) continue;

      await uploadReport(report);
    }
  } finally {
    isProcessing = false;
  }
}

async function uploadReport(report: QueuedReport): Promise<void> {
  // Mark uploading
  await updateEntry(report.id, { status: 'uploading' });

  try {
    await ReportService.submitReport(report.data);

    // Success — remove from queue and clean up persisted files
    await removeEntry(report.id);
    await cleanPersistedFiles(report.data);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Upload failed';
    await updateEntry(report.id, {
      status: 'failed',
      retries: report.retries + 1,
      lastAttempt: Date.now(),
    });
    console.warn(`[OfflineQueue] Upload failed for ${report.id} (attempt ${report.retries + 1}):`, errMsg);
  }
}

async function cleanPersistedFiles(data: ReportData): Promise<void> {
  try {
    for (const img of data.images) {
      if (img.uri.startsWith(OFFLINE_PHOTOS_DIR)) {
        await FileSystem.deleteAsync(img.uri, { idempotent: true });
      }
    }
    for (const vid of data.videos ?? []) {
      if (vid.uri.startsWith(OFFLINE_PHOTOS_DIR)) {
        await FileSystem.deleteAsync(vid.uri, { idempotent: true });
      }
    }
  } catch {
    // Non-critical — leftover files are harmless
  }
}

async function updateEntry(
  id: string,
  patch: Partial<Omit<QueuedReport, 'id' | 'data' | 'queuedAt'>>
): Promise<void> {
  const queue = await loadQueue();
  await saveQueue(queue.map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

async function removeEntry(id: string): Promise<void> {
  const queue = await loadQueue();
  await saveQueue(queue.filter((r) => r.id !== id));
}

async function loadQueue(): Promise<QueuedReport[]> {
  try {
    const json = await AsyncStorage.getItem(QUEUE_KEY);
    return json ? (JSON.parse(json) as QueuedReport[]) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedReport[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/** Returns count of reports not yet sent — used by NetworkStatusBar. */
export async function getPendingCount(): Promise<number> {
  const queue = await loadQueue();
  return queue.filter((r) => r.status !== 'sent').length;
}
