/**
 * High-Precision Audio Drift Controller
 * 
 * Continuously monitors audio playback offset against the authoritative timeline.
 * Applies gentle pitch-preserved speed adjustments (playbackRate micro-tuning)
 * for small differences (40ms - 1200ms) to avoid audio decoder flushing / stuttering,
 * and performs smooth position realignment for large differences (> 1200ms).
 */

export class DriftController {
  constructor(audioElement) {
    this.audio = audioElement;
    this.currentDriftMs = 0;
    this.activeRate = 1.0;
    this.lastAdjustmentTime = 0;
  }

  setAudioElement(element) {
    this.audio = element;
    this.activeRate = 1.0;
  }

  /**
   * Evaluates drift and adjusts audio playback accordingly.
   * @param {number} expectedPositionSeconds - Authoritative position in seconds
   * @param {boolean} shouldBePlaying - Whether playback is currently active
   * @returns {{ driftMs: number, status: string, adjustedRate: number }}
   */
  evaluate(expectedPositionSeconds, shouldBePlaying) {
    if (!this.audio || isNaN(expectedPositionSeconds)) {
      return { driftMs: 0, status: 'NO_AUDIO', adjustedRate: 1.0 };
    }

    const currentPos = this.audio.currentTime;
    const diffSeconds = currentPos - expectedPositionSeconds;
    const driftMs = Math.round(diffSeconds * 1000);
    this.currentDriftMs = driftMs;

    const absDriftMs = Math.abs(driftMs);

    // If room is PAUSED
    if (!shouldBePlaying) {
      if (!this.audio.paused) {
        this.audio.pause();
      }
      if (absDriftMs > 100) {
        this.audio.currentTime = expectedPositionSeconds;
      }
      this.setPlaybackRate(1.0);
      return { driftMs, status: 'PAUSED', adjustedRate: 1.0 };
    }

    // If room is PLAYING, but local audio is paused (and not waiting for gesture)
    if (this.audio.paused && absDriftMs > 200) {
      this.audio.currentTime = expectedPositionSeconds;
      this.audio.play().catch(console.warn);
      this.setPlaybackRate(1.0);
      return { driftMs, status: 'RESTARTING', adjustedRate: 1.0 };
    }

    // ZONE 1: TIGHT LOCK (|drift| < 40ms)
    // Differences below 40ms are within normal audio hardware buffer jitter.
    if (absDriftMs < 40) {
      this.setPlaybackRate(1.0);
      return { driftMs, status: 'PERFECT_SYNC', adjustedRate: 1.0 };
    }

    // ZONE 2: MICRO DRIFT (40ms - 300ms)
    // Adjust playback rate by ±4%. Humans cannot detect pitch change (browser handles WSOLA),
    // but the device gains or loses ~40ms every second, converging within 2-4 seconds!
    if (absDriftMs <= 300) {
      const targetRate = driftMs < 0 ? 1.04 : 0.96;
      this.setPlaybackRate(targetRate);
      return {
        driftMs,
        status: driftMs < 0 ? 'CATCHING_UP' : 'SLOWING_DOWN',
        adjustedRate: targetRate
      };
    }

    // ZONE 3: MODERATE DRIFT (300ms - 1200ms)
    // Adjust playback rate by ±8% for faster non-destructive convergence.
    if (absDriftMs <= 1200) {
      const targetRate = driftMs < 0 ? 1.08 : 0.92;
      this.setPlaybackRate(targetRate);
      return {
        driftMs,
        status: driftMs < 0 ? 'FAST_CATCHUP' : 'FAST_SLOWDOWN',
        adjustedRate: targetRate
      };
    }

    // ZONE 4: MACRO DRIFT (> 1200ms, e.g. late join or network stall)
    // Directly seek without resetting buffer.
    this.audio.currentTime = Math.max(0, expectedPositionSeconds);
    this.setPlaybackRate(1.0);
    return { driftMs, status: 'SEEK_REALIGNED', adjustedRate: 1.0 };
  }

  setPlaybackRate(rate) {
    if (!this.audio) return;
    if (Math.abs(this.activeRate - rate) > 0.005) {
      this.activeRate = rate;
      try {
        this.audio.playbackRate = rate;
      } catch (e) {
        console.warn('Failed setting playbackRate:', e);
      }
    }
  }

  reset() {
    this.setPlaybackRate(1.0);
    this.currentDriftMs = 0;
  }
}

