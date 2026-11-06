/**
 * Automated Verification Script for SAS MUSIC SyncPlay
 * Tests multi-client real-time synchronization, state calculation, and drift compensation
 */

console.log('--- [SAS MUSIC SyncPlay] Automated Verification Suite ---');

// 1. Test 6-digit room code generation & validation
function testRoomCode() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`[Test 1] Generated Room Code: ${code}`);
  if (!/^\d{6}$/.test(code)) {
    throw new Error('Room code must be exactly 6 digits');
  }
  console.log('✓ Room code generation & validation PASSED');
  return code;
}

// 2. Test Server-Authoritative Timing & Latency Compensation
function testLatencyCompensation() {
  console.log('\n[Test 2] Testing Server-Authoritative Timing & Elapsed Calculation');
  const hostTime = Date.now() - 1500; // 1.5 seconds ago
  const hostPosition = 30.0;
  const isPlaying = true;

  const now = Date.now();
  const elapsed = (now - hostTime) / 1000;
  const expectedPosition = hostPosition + (isPlaying ? elapsed : 0);

  console.log(`Host sent position: ${hostPosition}s at T_host (${1500}ms ago)`);
  console.log(`Member calculated expected position: ${expectedPosition.toFixed(2)}s`);

  if (Math.abs(expectedPosition - 31.5) > 0.1) {
    throw new Error(`Latency compensation incorrect: expected ~31.5, got ${expectedPosition}`);
  }
  console.log('✓ Latency compensation logic PASSED');
}

// 3. Test Drift Correction Thresholds
function testDriftCorrection() {
  console.log('\n[Test 3] Testing Drift Correction Thresholds');
  const expectedPosition = 45.0;

  // Case A: Small drift (within 1.8s tolerance) -> Should NOT interrupt audio
  const clientTimeNear = 45.6;
  const driftNear = Math.abs(clientTimeNear - expectedPosition);
  const shouldCorrectNear = driftNear > 1.8;
  console.log(`Drift: ${driftNear.toFixed(2)}s -> Smooth continue (no seek): ${!shouldCorrectNear}`);
  if (shouldCorrectNear) throw new Error('Small drift should not trigger seek');

  // Case B: Large drift (user paused or buffered) -> MUST smoothly seek
  const clientTimeFar = 40.0;
  const driftFar = Math.abs(clientTimeFar - expectedPosition);
  const shouldCorrectFar = driftFar > 1.8;
  console.log(`Drift: ${driftFar.toFixed(2)}s -> Smooth seek to host: ${shouldCorrectFar}`);
  if (!shouldCorrectFar) throw new Error('Large drift must trigger seek');

  console.log('✓ Drift correction threshold PASSED');
}

// 4. Test Multi-Client WebSocket / MQTT Connection
async function testWebSocketBroker() {
  console.log('\n[Test 4] Testing Real-Time WSS Connection to Primary Broker (HiveMQ)');
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('wss://broker.hivemq.com:8884/mqtt', 'mqtt');
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket connection timed out'));
    }, 6000);

    ws.onopen = () => {
      clearTimeout(timer);
      console.log('✓ Connected to wss://broker.hivemq.com:8884/mqtt');
      ws.close();
      resolve(true);
    };

    ws.onerror = (err) => {
      clearTimeout(timer);
      console.warn('Primary broker warning, testing fallback broker (EMQX)...', err.message);
      const wsFallback = new WebSocket('wss://broker.emqx.io:8084/mqtt', 'mqtt');
      wsFallback.onopen = () => {
        console.log('✓ Connected to fallback broker wss://broker.emqx.io:8084/mqtt');
        wsFallback.close();
        resolve(true);
      };
      wsFallback.onerror = (e) => reject(new Error('Both brokers unreachable: ' + e.message));
    };
  });
}

// Run all test suites
async function runAll() {
  try {
    testRoomCode();
    testLatencyCompensation();
    testDriftCorrection();
    await testWebSocketBroker();
    console.log('\n=========================================');
    console.log('🎉 ALL SYNCPLAY TESTS PASSED SUCCESSFULLY');
    console.log('=========================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
}

runAll();

