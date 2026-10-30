/**
 * Precision Clock Synchronization Service (Cristian's Algorithm)
 * 
 * Synchronizes client device clock with authoritative server time.
 * Calculates Round-Trip-Time (RTT) and one-way network latency to compute
 * the exact millisecond offset between the local device clock and the server.
 */

let clockOffset = 0; // ms to add to Date.now() to get authoritative server time
let estimatedRTT = 40; // baseline estimated RTT in ms
let isSynchronized = false;
let syncPromise = null;

const SYNC_ENDPOINTS = [
  '/api/time',
  'https://sashibitcode-music.vercel.app/api/time'
];

/**
 * Executes a single measurement sample
 */
async function measureSample(endpoint) {
  const tStart = performance.now();
  const localBefore = Date.now();

  const response = await fetch(`${endpoint}?t=${Math.floor(tStart)}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  const tEnd = performance.now();
  const localAfter = Date.now();

  const rtt = Math.max(1, tEnd - tStart);
  const serverTime = Number(data.serverTime);

  // Cristian's Algorithm: Server time occurred approximately midway through RTT
  const estimatedServerNow = serverTime + (rtt / 2);
  const offset = estimatedServerNow - localAfter;

  return { rtt, offset, serverTime };
}

/**
 * Runs 4-5 calibration rounds, discards outliers, and computes the offset
 * from the lowest-RTT samples (least network bufferbloat / jitter).
 */
export async function syncClockWithServer() {
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    let endpoint = SYNC_ENDPOINTS[0];
    const samples = [];

    // 1. Warm-up request to establish TLS connection and DNS cache
    try {
      await measureSample(endpoint);
    } catch (_) {
      endpoint = SYNC_ENDPOINTS[1]; // fallback to direct production URL
      try { await measureSample(endpoint); } catch (e) { console.warn('Clock sync warm-up failed:', e); }
    }

    // 2. Perform 4 calibration samples
    for (let i = 0; i < 4; i++) {
      try {
        const sample = await measureSample(endpoint);
        samples.push(sample);
      } catch (err) {
        // Soft fail on individual sample
      }
      // Small pause between samples to avoid burst packet collision
      await new Promise((r) => setTimeout(r, 60));
    }

    if (samples.length > 0) {
      // Sort by RTT ascending — lowest RTT has least network queueing delay
      samples.sort((a, b) => a.rtt - b.rtt);

      // Take the median of the top 2 cleanest samples
      const bestSamples = samples.slice(0, Math.min(2, samples.length));
      const avgOffset = bestSamples.reduce((sum, s) => sum + s.offset, 0) / bestSamples.length;
      const avgRTT = bestSamples.reduce((sum, s) => sum + s.rtt, 0) / bestSamples.length;

      clockOffset = Math.round(avgOffset);
      estimatedRTT = Math.round(avgRTT);
      isSynchronized = true;

      console.log(`[ClockSync] Synchronized! Offset: ${clockOffset > 0 ? '+' : ''}${clockOffset}ms | RTT: ${estimatedRTT}ms`);
    } else {
      console.warn('[ClockSync] Could not reach time server; using local monotonic clock fallback.');
      clockOffset = 0;
      isSynchronized = true;
    }

    syncPromise = null;
    return { clockOffset, estimatedRTT };
  })();

  return syncPromise;
}

/**
 * Returns the current high-precision server timestamp
 */
export function getServerTime() {
  return Date.now() + clockOffset;
}

/**
 * Returns the current clock offset in ms
 */
export function getClockOffset() {
  return clockOffset;
}

/**
 * Returns estimated RTT in ms
 */
export function getEstimatedRTT() {
  return estimatedRTT;
}

/**
 * Indicates whether the clock has been synchronized with the server
 */
export function isClockSynchronized() {
  return isSynchronized;
}

// Auto-run clock synchronization on module load
if (typeof window !== 'undefined') {
  syncClockWithServer().catch(console.warn);

  // Re-synchronize periodically every 60 seconds
  setInterval(() => {
    syncClockWithServer().catch(console.warn);
  }, 60000);

  // Re-synchronize immediately when page becomes visible or regains online connection
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncClockWithServer().catch(console.warn);
    }
  });

  window.addEventListener('online', () => {
    syncClockWithServer().catch(console.warn);
  });
}

