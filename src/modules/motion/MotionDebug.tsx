import { useState, useEffect, useRef, useCallback } from 'react';
import { usePoseDetection } from './usePoseDetection';
import { detectMission } from './detectors';
import { MissionGuide } from './MissionGuide';
import { COMBO_SEQUENCES } from './comboSequences';
import type { ComboSequence } from './comboSequences';
import type { MissionType, MissionResult } from './types';

const ALL_MISSIONS: MissionType[] = [
  'jump', 'dodge_left', 'dodge_right', 'push', 'catch', 'throw',
  'duck', 'wave', 'clap', 'punch',
];

const MISSION_LABELS: Record<MissionType, string> = {
  jump: '점프!',
  dodge_left: '왼쪽 피하기',
  dodge_right: '오른쪽 피하기',
  push: '밀기',
  catch: '잡기',
  throw: '던지기',
  duck: '숙이기',
  wave: '흔들기',
  clap: '박수',
  punch: '펀치',
};

type ComboState = {
  sequence: ComboSequence;
  currentIndex: number;
  results: (MissionResult | null)[];
  finished: boolean;
};

export function MotionDebug() {
  const { canvasRef, isReady, error, getFrameBuffer } = usePoseDetection();
  const [activeMission, setActiveMission] = useState<MissionType | null>(null);
  const [lastResult, setLastResult] = useState<MissionResult | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3);
  const [combo, setCombo] = useState<ComboState | null>(null);
  const [tab, setTab] = useState<'single' | 'combo'>('single');
  const detectIntervalRef = useRef<number>(0);
  const timerRef = useRef<number>(0);
  const comboTimeoutRef = useRef<number>(0);

  const clearTimers = useCallback(() => {
    clearInterval(detectIntervalRef.current);
    clearInterval(timerRef.current);
    clearTimeout(comboTimeoutRef.current);
  }, []);

  const runMission = useCallback(
    (type: MissionType, timeLimit: number, onResult: (r: MissionResult) => void) => {
      clearTimers();
      setActiveMission(type);
      setLastResult(null);
      setDetecting(true);
      setTimeLeft(timeLimit);

      const startTime = Date.now();

      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setTimeLeft(Math.max(0, timeLimit - elapsed));
      }, 50);

      detectIntervalRef.current = window.setInterval(() => {
        const frames = getFrameBuffer();
        const result = detectMission(type, frames);

        if (result.success) {
          clearTimers();
          setLastResult(result);
          setDetecting(false);
          setActiveMission(null);
          onResult(result);
        } else if (Date.now() - startTime > timeLimit * 1000) {
          clearTimers();
          const miss: MissionResult = { missionType: type, success: false, confidence: 0 };
          setLastResult(miss);
          setDetecting(false);
          setActiveMission(null);
          onResult(miss);
        }
      }, 100);
    },
    [getFrameBuffer, clearTimers]
  );

  // Single mission
  const startSingle = useCallback(
    (type: MissionType) => {
      setCombo(null);
      runMission(type, 3, () => {});
    },
    [runMission]
  );

  // Combo sequence
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

      function runStep(index: number, s: ComboState) {
        if (index >= seq.missions.length) {
          setCombo((prev) => prev ? { ...prev, finished: true } : null);
          return;
        }

        // Brief pause between missions
        comboTimeoutRef.current = window.setTimeout(() => {
          runMission(seq.missions[index], seq.timeLimitPerMission, (result) => {
            const newResults = [...s.results];
            newResults[index] = result;
            const updated = { ...s, currentIndex: index + 1, results: newResults };
            setCombo(updated);

            // Show result briefly then next mission
            comboTimeoutRef.current = window.setTimeout(() => {
              runStep(index + 1, updated);
            }, 800);
          });
        }, index === 0 ? 0 : 600);
      }

      runStep(0, state);
    },
    [runMission]
  );

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  const comboScore = combo
    ? combo.results.filter((r) => r?.success).length
    : 0;
  const comboTotal = combo ? combo.sequence.missions.length : 0;

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#111', color: '#fff', minHeight: '100vh', padding: 20 }}>
      <h1 style={{ margin: '0 0 16px', fontSize: 24 }}>World Motion Conquest — Motion Debug</h1>

      {error && (
        <div style={{ background: '#c0392b', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          Error: {error}
        </div>
      )}

      {!isReady && !error && (
        <div style={{ fontSize: 18, color: '#aaa' }}>Loading MediaPipe & webcam...</div>
      )}

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Webcam + skeleton canvas */}
        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            style={{ width: 640, height: 480, borderRadius: 8, background: '#000' }}
          />

          {activeMission && <MissionGuide mission={activeMission} timeLeft={timeLeft} />}

          {lastResult && !activeMission && (
            <div
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: lastResult.success ? 'rgba(46,204,113,0.3)' : 'rgba(231,76,60,0.3)',
                borderRadius: 8, animation: 'fadeOut 1.2s forwards', pointerEvents: 'none',
              }}
            >
              <div style={{
                fontSize: 64, fontWeight: 'bold',
                textShadow: '0 4px 16px rgba(0,0,0,0.8)',
                color: lastResult.success ? '#2ecc71' : '#e74c3c',
              }}>
                {lastResult.success ? 'SUCCESS!' : 'MISS!'}
              </div>
            </div>
          )}

          {/* Combo progress bar */}
          {combo && !combo.finished && (
            <div style={{
              position: 'absolute', bottom: 8, left: 8, right: 8,
              display: 'flex', gap: 4, pointerEvents: 'none',
            }}>
              {combo.sequence.missions.map((m, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1, height: 8, borderRadius: 4,
                    background:
                      combo.results[i]?.success ? '#2ecc71'
                      : combo.results[i] && !combo.results[i]!.success ? '#e74c3c'
                      : i === combo.currentIndex ? '#f39c12'
                      : '#333',
                    transition: 'background 0.3s',
                  }}
                  title={MISSION_LABELS[m]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Controls panel */}
        <div style={{ minWidth: 280, maxWidth: 320 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {(['single', 'combo'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); clearTimers(); setActiveMission(null); setCombo(null); setDetecting(false); }}
                style={{
                  flex: 1, padding: '8px 12px', fontSize: 14, borderRadius: 8,
                  border: 'none', cursor: 'pointer',
                  background: tab === t ? '#8e44ad' : '#333', color: '#fff',
                }}
              >
                {t === 'single' ? 'Single Mission' : 'Combo Mode'}
              </button>
            ))}
          </div>

          {/* Single mission buttons */}
          {tab === 'single' && (
            <>
              <p style={{ color: '#aaa', fontSize: 13, margin: '0 0 8px' }}>
                Click a mission, perform the action within 3s.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {ALL_MISSIONS.map((type) => (
                  <button
                    key={type}
                    onClick={() => startSingle(type)}
                    disabled={!isReady || detecting}
                    style={{
                      padding: '10px 8px', fontSize: 14, borderRadius: 8,
                      border: 'none',
                      cursor: isReady && !detecting ? 'pointer' : 'not-allowed',
                      background: activeMission === type ? '#e67e22' : '#2980b9',
                      color: '#fff', opacity: isReady && !detecting ? 1 : 0.5,
                    }}
                  >
                    {MISSION_LABELS[type]}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Combo sequences */}
          {tab === 'combo' && (
            <>
              <p style={{ color: '#aaa', fontSize: 13, margin: '0 0 8px' }}>
                Chain missions! Complete each action in rapid succession.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {COMBO_SEQUENCES.map((seq) => (
                  <button
                    key={seq.name}
                    onClick={() => startCombo(seq)}
                    disabled={!isReady || detecting}
                    style={{
                      padding: '12px', fontSize: 14, borderRadius: 8, border: 'none',
                      cursor: isReady && !detecting ? 'pointer' : 'not-allowed',
                      background: '#8e44ad', color: '#fff', textAlign: 'left',
                      opacity: isReady && !detecting ? 1 : 0.5,
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                      {seq.nameKo} ({seq.name})
                    </div>
                    <div style={{ fontSize: 12, color: '#ddd' }}>
                      {seq.missions.map((m) => MISSION_LABELS[m]).join(' → ')}
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                      {seq.timeLimitPerMission}s per action · {seq.missions.length} moves
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Single result */}
          {lastResult && !combo && (
            <div style={{
              marginTop: 16, padding: 12, borderRadius: 8, textAlign: 'center',
              background: lastResult.success ? '#27ae60' : '#c0392b',
            }}>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                {lastResult.success ? 'SUCCESS' : 'FAILED'}
              </div>
              <div style={{ fontSize: 13, marginTop: 2 }}>
                {lastResult.missionType} — {lastResult.confidence.toFixed(2)}
              </div>
            </div>
          )}

          {/* Combo results */}
          {combo?.finished && (
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 8, textAlign: 'center',
              background: comboScore === comboTotal ? '#27ae60'
                : comboScore > comboTotal / 2 ? '#f39c12' : '#c0392b',
            }}>
              <div style={{ fontSize: 22, fontWeight: 'bold' }}>
                {comboScore === comboTotal ? 'PERFECT!' : comboScore > comboTotal / 2 ? 'GOOD!' : 'TRY AGAIN'}
              </div>
              <div style={{ fontSize: 28, fontWeight: 'bold', margin: '4px 0' }}>
                {comboScore} / {comboTotal}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8 }}>
                {combo.results.map((r, i) => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 14,
                    background: r?.success ? '#2ecc71' : '#e74c3c',
                  }}>
                    {r?.success ? 'O' : 'X'}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#ddd', marginTop: 8 }}>
                {combo.sequence.missions.map((m) => MISSION_LABELS[m]).join(' → ')}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeOut {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
