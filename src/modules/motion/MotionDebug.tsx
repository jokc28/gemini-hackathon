import { useState, useEffect, useRef, useCallback } from 'react';
import { usePoseDetection } from './usePoseDetection';
import { detectAction, getDebugValues } from './detectors';
import type { DebugValues } from './detectors';
import { MissionGuide } from './MissionGuide';
import { COMBO_SEQUENCES } from './comboSequences';
import type { ComboSequence } from './comboSequences';
import type { MissionType, MissionResult, Landmark } from './types';

const ALL_MISSIONS: MissionType[] = [
  'jump', 'dodge_left', 'dodge_right', 'push', 'catch', 'throw',
  'duck', 'wave', 'clap', 'punch',
];

const MISSION_LABELS: Record<MissionType, string> = {
  jump: '점프!', dodge_left: '왼쪽 피하기', dodge_right: '오른쪽 피하기',
  push: '밀기', catch: '잡기', throw: '던지기',
  duck: '숙이기', wave: '흔들기', clap: '박수', punch: '펀치',
};

type FlashColor = 'green' | 'red' | null;

type ComboState = {
  sequence: ComboSequence;
  currentIndex: number;
  results: (MissionResult | null)[];
  finished: boolean;
};

export function MotionDebug() {
  const { canvasRef, isReady, error, getLatestLandmarks } = usePoseDetection();

  // Mission state
  const [activeMission, setActiveMission] = useState<MissionType | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [detecting, setDetecting] = useState(false);
  const [lastResult, setLastResult] = useState<MissionResult | null>(null);
  const [flash, setFlash] = useState<FlashColor>(null);
  const [debug, setDebug] = useState<DebugValues | null>(null);
  const [tab, setTab] = useState<'single' | 'combo'>('single');
  const [combo, setCombo] = useState<ComboState | null>(null);

  // Refs for the game loop
  const baselineRef = useRef<Landmark[] | null>(null);
  const detectLoopRef = useRef<number>(0);
  const timerLoopRef = useRef<number>(0);
  const comboTimeoutRef = useRef<number>(0);

  const clearAll = useCallback(() => {
    clearInterval(detectLoopRef.current);
    clearInterval(timerLoopRef.current);
    clearTimeout(comboTimeoutRef.current);
  }, []);

  // ── Flash effect ──
  const triggerFlash = useCallback((color: FlashColor) => {
    setFlash(color);
    setTimeout(() => setFlash(null), 800);
  }, []);

  // ── Core: start a timed mission detection ──
  const startMission = useCallback(
    (mission: MissionType, duration = 3, onResult?: (r: MissionResult) => void) => {
      clearAll();

      // Capture baseline pose RIGHT NOW
      const baseline = getLatestLandmarks();
      if (!baseline) {
        console.warn('[MotionDebug] No landmarks for baseline');
        return;
      }
      baselineRef.current = [...baseline];

      setActiveMission(mission);
      setDetecting(true);
      setTimeLeft(duration);
      setLastResult(null);

      const startTime = Date.now();

      // Countdown
      timerLoopRef.current = window.setInterval(() => {
        const remaining = Math.max(0, duration - (Date.now() - startTime) / 1000);
        setTimeLeft(remaining);
      }, 50);

      // Detection poll at ~30fps
      detectLoopRef.current = window.setInterval(() => {
        const current = getLatestLandmarks();
        if (!current || !baselineRef.current) return;

        // Update debug overlay
        setDebug(getDebugValues(current));

        const hit = detectAction(current, baselineRef.current, mission);
        const elapsed = (Date.now() - startTime) / 1000;

        const finish = (success: boolean) => {
          clearAll();
          const result: MissionResult = {
            missionType: mission,
            success,
            confidence: success ? 0.9 : 0,
          };
          setLastResult(result);
          setDetecting(false);
          setActiveMission(null);
          triggerFlash(success ? 'green' : 'red');
          onResult?.(result);
        };

        if (hit) {
          finish(true);
        } else if (elapsed >= duration) {
          finish(false);
        }
      }, 33);
    },
    [clearAll, getLatestLandmarks, triggerFlash]
  );

  // ── Single mission ──
  const handleSingle = useCallback(
    (type: MissionType) => {
      setCombo(null);
      startMission(type, 3);
    },
    [startMission]
  );

  // ── Combo sequence ──
  const startCombo = useCallback(
    (seq: ComboSequence) => {
      const state: ComboState = {
        sequence: seq,
        currentIndex: 0,
        results: new Array(seq.missions.length).fill(null),
        finished: false,
      };
      setCombo(state);
      setLastResult(null);

      function step(index: number, s: ComboState) {
        if (index >= seq.missions.length) {
          setCombo((prev) => prev ? { ...prev, finished: true } : null);
          return;
        }

        comboTimeoutRef.current = window.setTimeout(
          () => {
            startMission(seq.missions[index], seq.timeLimitPerMission, (result) => {
              const newResults = [...s.results];
              newResults[index] = result;
              const updated = { ...s, currentIndex: index + 1, results: newResults };
              setCombo(updated);
              comboTimeoutRef.current = window.setTimeout(() => step(index + 1, updated), 600);
            });
          },
          index === 0 ? 0 : 400
        );
      }

      step(0, state);
    },
    [startMission]
  );

  useEffect(() => clearAll, [clearAll]);

  // ── Also update debug when idle ──
  useEffect(() => {
    if (detecting) return;
    const id = setInterval(() => {
      const lm = getLatestLandmarks();
      if (lm) setDebug(getDebugValues(lm));
    }, 100);
    return () => clearInterval(id);
  }, [detecting, getLatestLandmarks]);

  const comboScore = combo ? combo.results.filter((r) => r?.success).length : 0;
  const comboTotal = combo ? combo.sequence.missions.length : 0;

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#111', color: '#fff', minHeight: '100vh', padding: 20 }}>
      <h1 style={{ margin: '0 0 12px', fontSize: 22 }}>World Motion Conquest — Motion Debug</h1>

      {error && (
        <div style={{ background: '#c0392b', padding: 12, borderRadius: 8, marginBottom: 12 }}>
          Error: {error}
        </div>
      )}
      {!isReady && !error && (
        <div style={{ fontSize: 18, color: '#aaa' }}>Loading MediaPipe & webcam...</div>
      )}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Canvas + overlays ── */}
        <div style={{ position: 'relative', width: 640, height: 480 }}>
          <canvas
            ref={canvasRef}
            style={{ width: 640, height: 480, borderRadius: 8, background: '#000', display: 'block' }}
          />

          {/* Full-screen flash */}
          {flash && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 8, pointerEvents: 'none',
              background: flash === 'green' ? 'rgba(46,204,113,0.45)' : 'rgba(231,76,60,0.45)',
              animation: 'flashFade 0.8s forwards',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontSize: 72, fontWeight: 'bold', color: '#fff',
                textShadow: '0 4px 20px rgba(0,0,0,0.7)',
              }}>
                {flash === 'green' ? 'SUCCESS!' : 'MISS!'}
              </span>
            </div>
          )}

          {/* Mission guide overlay */}
          {activeMission && <MissionGuide mission={activeMission} timeLeft={timeLeft} />}

          {/* ── Debug HUD ── */}
          {debug && (
            <div style={{
              position: 'absolute', bottom: combo ? 20 : 8, left: 8,
              background: 'rgba(0,0,0,0.75)', padding: '6px 10px', borderRadius: 6,
              fontSize: 12, fontFamily: 'monospace', lineHeight: 1.6, color: '#0f0',
              pointerEvents: 'none',
            }}>
              <div>Nose  X:{debug.noseX.toFixed(3)}  Y:{debug.noseY.toFixed(3)}  Z:{debug.noseZ.toFixed(3)}</div>
              <div>Shld  X:{debug.shoulderMidX.toFixed(3)}  Y:{debug.shoulderMidY.toFixed(3)}</div>
              <div>Wrst  L:{debug.wristDistL.toFixed(3)}  R:{debug.wristDistR.toFixed(3)}  Gap:{debug.wristGap.toFixed(3)}</div>
              <div>WrstY:{debug.wristMidY.toFixed(3)}</div>
              {activeMission && (
                <div style={{ color: '#f1c40f', marginTop: 2 }}>
                  ACTIVE: {activeMission}  |  Timer: {timeLeft.toFixed(1)}s
                </div>
              )}
            </div>
          )}

          {/* Combo progress bar */}
          {combo && !combo.finished && (
            <div style={{
              position: 'absolute', bottom: 4, left: 8, right: 8,
              display: 'flex', gap: 3, pointerEvents: 'none',
            }}>
              {combo.sequence.missions.map((m, i) => (
                <div key={i} style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background:
                    combo.results[i]?.success ? '#2ecc71'
                    : combo.results[i] && !combo.results[i]!.success ? '#e74c3c'
                    : i === combo.currentIndex ? '#f39c12' : '#444',
                  transition: 'background 0.2s',
                }} title={MISSION_LABELS[m]} />
              ))}
            </div>
          )}
        </div>

        {/* ── Controls panel ── */}
        <div style={{ minWidth: 270, maxWidth: 310 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {(['single', 'combo'] as const).map((t) => (
              <button key={t} onClick={() => {
                setTab(t); clearAll(); setActiveMission(null); setCombo(null); setDetecting(false);
              }} style={{
                flex: 1, padding: '7px 10px', fontSize: 13, borderRadius: 8, border: 'none',
                cursor: 'pointer', background: tab === t ? '#8e44ad' : '#333', color: '#fff',
              }}>
                {t === 'single' ? 'Single' : 'Combo'}
              </button>
            ))}
          </div>

          {tab === 'single' && (
            <>
              <p style={{ color: '#aaa', fontSize: 12, margin: '0 0 8px' }}>
                Stand still, click a button, then move within 3s.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {ALL_MISSIONS.map((type) => (
                  <button key={type} onClick={() => handleSingle(type)}
                    disabled={!isReady || detecting}
                    style={{
                      padding: '9px 6px', fontSize: 13, borderRadius: 8, border: 'none',
                      cursor: isReady && !detecting ? 'pointer' : 'not-allowed',
                      background: activeMission === type ? '#e67e22' : '#2980b9',
                      color: '#fff', opacity: isReady && !detecting ? 1 : 0.5,
                    }}>
                    {MISSION_LABELS[type]}
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === 'combo' && (
            <>
              <p style={{ color: '#aaa', fontSize: 12, margin: '0 0 8px' }}>
                Chain missions! Stand still before starting.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {COMBO_SEQUENCES.map((seq) => (
                  <button key={seq.name} onClick={() => startCombo(seq)}
                    disabled={!isReady || detecting}
                    style={{
                      padding: 10, fontSize: 13, borderRadius: 8, border: 'none',
                      cursor: isReady && !detecting ? 'pointer' : 'not-allowed',
                      background: '#8e44ad', color: '#fff', textAlign: 'left',
                      opacity: isReady && !detecting ? 1 : 0.5,
                    }}>
                    <div style={{ fontWeight: 'bold' }}>{seq.nameKo} ({seq.name})</div>
                    <div style={{ fontSize: 11, color: '#ddd', marginTop: 2 }}>
                      {seq.missions.map((m) => MISSION_LABELS[m]).join(' → ')}
                    </div>
                    <div style={{ fontSize: 10, color: '#aaa' }}>
                      {seq.timeLimitPerMission}s/action · {seq.missions.length} moves
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Single result */}
          {lastResult && !combo && (
            <div style={{
              marginTop: 12, padding: 10, borderRadius: 8, textAlign: 'center',
              background: lastResult.success ? '#27ae60' : '#c0392b',
            }}>
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                {lastResult.success ? 'SUCCESS' : 'FAILED'}
              </div>
              <div style={{ fontSize: 12 }}>{lastResult.missionType}</div>
            </div>
          )}

          {/* Combo result */}
          {combo?.finished && (
            <div style={{
              marginTop: 12, padding: 12, borderRadius: 8, textAlign: 'center',
              background: comboScore === comboTotal ? '#27ae60'
                : comboScore > comboTotal / 2 ? '#f39c12' : '#c0392b',
            }}>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                {comboScore === comboTotal ? 'PERFECT!' : comboScore > comboTotal / 2 ? 'GOOD!' : 'TRY AGAIN'}
              </div>
              <div style={{ fontSize: 26, fontWeight: 'bold', margin: '2px 0' }}>
                {comboScore} / {comboTotal}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 6 }}>
                {combo.results.map((r, i) => (
                  <div key={i} style={{
                    width: 24, height: 24, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 12,
                    background: r?.success ? '#2ecc71' : '#e74c3c', fontWeight: 'bold',
                  }}>
                    {r?.success ? 'O' : 'X'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes flashFade {
          0% { opacity: 1; }
          60% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
