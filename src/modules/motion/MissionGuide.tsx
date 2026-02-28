import type { MissionType } from './types';

const guideStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  borderRadius: 8,
};

const labelStyle: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 'bold',
  color: '#fff',
  textShadow: '0 2px 12px rgba(0,0,0,0.8)',
  marginBottom: 12,
};

const subStyle: React.CSSProperties = {
  fontSize: 16,
  color: '#aaa',
  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
};

function StickFigure({ mission }: { mission: MissionType }) {
  const w = 200;
  const h = 260;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ marginBottom: 8 }}>
      <circle cx={100} cy={30} r={18} fill="none" stroke="#0ff" strokeWidth={3} />
      <line x1={100} y1={48} x2={100} y2={140} stroke="#0ff" strokeWidth={3} />

      {mission === 'jump' && <JumpPose />}
      {mission === 'dodge_left' && <DodgePose direction="left" />}
      {mission === 'dodge_right' && <DodgePose direction="right" />}
      {mission === 'push' && <PushPose />}
      {mission === 'catch' && <CatchPose />}
      {mission === 'throw' && <ThrowPose />}
      {mission === 'duck' && <DuckPose />}
      {mission === 'wave' && <WavePose />}
      {mission === 'clap' && <ClapPose />}
      {mission === 'punch' && <PunchPose />}
    </svg>
  );
}

function JumpPose() {
  return (
    <g>
      <line x1={100} y1={70} x2={60} y2={30} stroke="#0f0" strokeWidth={3} />
      <line x1={100} y1={70} x2={140} y2={30} stroke="#0f0" strokeWidth={3} />
      <line x1={100} y1={140} x2={70} y2={180} stroke="#0ff" strokeWidth={3} />
      <line x1={70} y1={180} x2={80} y2={220} stroke="#0ff" strokeWidth={3} />
      <line x1={100} y1={140} x2={130} y2={180} stroke="#0ff" strokeWidth={3} />
      <line x1={130} y1={180} x2={120} y2={220} stroke="#0ff" strokeWidth={3} />
      <polygon points="100,240 88,255 112,255" fill="#0f0" opacity={0.9}>
        <animateTransform attributeName="transform" type="translate" values="0,0;0,-15;0,0" dur="0.8s" repeatCount="indefinite" />
      </polygon>
      <circle cx={100} cy={140} r={8} fill="#0f0" opacity={0.5}>
        <animate attributeName="opacity" values="0.5;1;0.5" dur="0.8s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

function DodgePose({ direction }: { direction: 'left' | 'right' }) {
  const dx = direction === 'left' ? -30 : 30;
  return (
    <g>
      <line x1={100} y1={70} x2={70} y2={110} stroke="#0ff" strokeWidth={3} />
      <line x1={100} y1={70} x2={130} y2={110} stroke="#0ff" strokeWidth={3} />
      <line x1={100} y1={140} x2={80} y2={200} stroke="#0ff" strokeWidth={3} />
      <line x1={100} y1={140} x2={120} y2={200} stroke="#0ff" strokeWidth={3} />
      <g>
        <animateTransform attributeName="transform" type="translate" values={`0,0;${dx},0;0,0`} dur="1s" repeatCount="indefinite" />
        <line x1={direction === 'left' ? 30 : 170} y1={100} x2={direction === 'left' ? 10 : 190} y2={100} stroke="#f1c40f" strokeWidth={4} />
        <polygon points={direction === 'left' ? '10,100 22,90 22,110' : '190,100 178,90 178,110'} fill="#f1c40f" />
      </g>
      <circle cx={100} cy={70} r={8} fill="#f1c40f" opacity={0.5}>
        <animate attributeName="opacity" values="0.5;1;0.5" dur="0.8s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

function PushPose() {
  return (
    <g>
      <line x1={100} y1={70} x2={60} y2={85} stroke="#0f0" strokeWidth={3} />
      <line x1={60} y1={85} x2={30} y2={75} stroke="#0f0" strokeWidth={3} />
      <line x1={100} y1={70} x2={140} y2={85} stroke="#0f0" strokeWidth={3} />
      <line x1={140} y1={85} x2={170} y2={75} stroke="#0f0" strokeWidth={3} />
      <line x1={100} y1={140} x2={80} y2={200} stroke="#0ff" strokeWidth={3} />
      <line x1={100} y1={140} x2={120} y2={200} stroke="#0ff" strokeWidth={3} />
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0;-10,0;0,0" dur="0.6s" repeatCount="indefinite" />
        <polygon points="10,70 20,63 20,77" fill="#e74c3c" />
      </g>
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0;10,0;0,0" dur="0.6s" repeatCount="indefinite" />
        <polygon points="190,70 180,63 180,77" fill="#e74c3c" />
      </g>
      <circle cx={30} cy={75} r={7} fill="#e74c3c" opacity={0.5}>
        <animate attributeName="opacity" values="0.5;1;0.5" dur="0.6s" repeatCount="indefinite" />
      </circle>
      <circle cx={170} cy={75} r={7} fill="#e74c3c" opacity={0.5}>
        <animate attributeName="opacity" values="0.5;1;0.5" dur="0.6s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

function CatchPose() {
  return (
    <g>
      <line x1={100} y1={70} x2={75} y2={85} stroke="#0f0" strokeWidth={3} />
      <line x1={75} y1={85} x2={85} y2={75} stroke="#0f0" strokeWidth={3} />
      <line x1={100} y1={70} x2={125} y2={85} stroke="#0f0" strokeWidth={3} />
      <line x1={125} y1={85} x2={115} y2={75} stroke="#0f0" strokeWidth={3} />
      <line x1={100} y1={140} x2={80} y2={200} stroke="#0ff" strokeWidth={3} />
      <line x1={100} y1={140} x2={120} y2={200} stroke="#0ff" strokeWidth={3} />
      <circle cx={100} cy={72} r={14} fill="none" stroke="#f39c12" strokeWidth={3}>
        <animate attributeName="r" values="14;18;14" dur="0.8s" repeatCount="indefinite" />
      </circle>
      <circle cx={100} cy={20} r={8} fill="#f39c12" opacity={0.8}>
        <animate attributeName="cy" values="0;72;0" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0;0.8" dur="1.2s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

function ThrowPose() {
  return (
    <g>
      <line x1={100} y1={70} x2={60} y2={100} stroke="#0ff" strokeWidth={3} />
      <line x1={100} y1={70} x2={140} y2={40} stroke="#0f0" strokeWidth={3}>
        <animateTransform attributeName="transform" type="rotate" values="0,100,70;-30,100,70;0,100,70" dur="0.7s" repeatCount="indefinite" />
      </line>
      <line x1={100} y1={140} x2={75} y2={200} stroke="#0ff" strokeWidth={3} />
      <line x1={100} y1={140} x2={120} y2={200} stroke="#0ff" strokeWidth={3} />
      <circle cx={160} cy={30} r={6} fill="#e74c3c">
        <animate attributeName="cx" values="140;195;140" dur="0.7s" repeatCount="indefinite" />
        <animate attributeName="cy" values="40;10;40" dur="0.7s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0;1" dur="0.7s" repeatCount="indefinite" />
      </circle>
      <circle cx={140} cy={40} r={8} fill="#e74c3c" opacity={0.5}>
        <animate attributeName="opacity" values="0.5;1;0.5" dur="0.7s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

// --- New motion guides ---

function DuckPose() {
  return (
    <g>
      {/* Crouched figure - head dropped, knees bent */}
      <line x1={100} y1={70} x2={65} y2={95} stroke="#0ff" strokeWidth={3} />
      <line x1={100} y1={70} x2={135} y2={95} stroke="#0ff" strokeWidth={3} />
      <line x1={100} y1={140} x2={65} y2={170} stroke="#0ff" strokeWidth={3} />
      <line x1={65} y1={170} x2={75} y2={210} stroke="#0ff" strokeWidth={3} />
      <line x1={100} y1={140} x2={135} y2={170} stroke="#0ff" strokeWidth={3} />
      <line x1={135} y1={170} x2={125} y2={210} stroke="#0ff" strokeWidth={3} />
      {/* Down arrow over head */}
      <polygon points="100,5 88,0 112,0" fill="#e74c3c" opacity={0.9} transform="rotate(180,100,2)">
        <animateTransform attributeName="transform" type="translate" values="0,-5;0,10;0,-5" dur="0.8s" repeatCount="indefinite" />
      </polygon>
      {/* Danger bar overhead */}
      <rect x={20} y={2} width={160} height={6} rx={3} fill="#e74c3c" opacity={0.6}>
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="0.5s" repeatCount="indefinite" />
      </rect>
      {/* Highlight: head/nose */}
      <circle cx={100} cy={30} r={22} fill="none" stroke="#e74c3c" strokeWidth={2} strokeDasharray="6,4">
        <animate attributeName="r" values="22;26;22" dur="0.8s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

function WavePose() {
  return (
    <g>
      {/* Left arm down */}
      <line x1={100} y1={70} x2={65} y2={110} stroke="#0ff" strokeWidth={3} />
      {/* Right arm up, waving */}
      <line x1={100} y1={70} x2={135} y2={50} stroke="#0f0" strokeWidth={3} />
      <line x1={135} y1={50} x2={150} y2={25} stroke="#0f0" strokeWidth={3}>
        <animateTransform attributeName="transform" type="rotate" values="0,135,50;20,135,50;-20,135,50;0,135,50" dur="0.6s" repeatCount="indefinite" />
      </line>
      {/* Legs */}
      <line x1={100} y1={140} x2={80} y2={200} stroke="#0ff" strokeWidth={3} />
      <line x1={100} y1={140} x2={120} y2={200} stroke="#0ff" strokeWidth={3} />
      {/* Wave arcs */}
      <path d="M 140,15 Q 155,10 160,20" fill="none" stroke="#f1c40f" strokeWidth={2} opacity={0.7}>
        <animate attributeName="opacity" values="0;0.8;0" dur="0.6s" repeatCount="indefinite" />
      </path>
      <path d="M 145,10 Q 165,3 170,18" fill="none" stroke="#f1c40f" strokeWidth={2} opacity={0.5}>
        <animate attributeName="opacity" values="0;0.6;0" dur="0.6s" begin="0.15s" repeatCount="indefinite" />
      </path>
      <path d="M 150,5 Q 175,-3 180,15" fill="none" stroke="#f1c40f" strokeWidth={2} opacity={0.3}>
        <animate attributeName="opacity" values="0;0.4;0" dur="0.6s" begin="0.3s" repeatCount="indefinite" />
      </path>
      {/* Highlight: waving hand */}
      <circle cx={150} cy={25} r={8} fill="#f1c40f" opacity={0.5}>
        <animate attributeName="opacity" values="0.3;1;0.3" dur="0.6s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

function ClapPose() {
  return (
    <g>
      {/* Arms coming together */}
      <line x1={100} y1={70} x2={65} y2={55} stroke="#0f0" strokeWidth={3}>
        <animateTransform attributeName="transform" type="rotate" values="0,100,70;15,100,70;0,100,70" dur="0.5s" repeatCount="indefinite" />
      </line>
      <line x1={100} y1={70} x2={135} y2={55} stroke="#0f0" strokeWidth={3}>
        <animateTransform attributeName="transform" type="rotate" values="0,100,70;-15,100,70;0,100,70" dur="0.5s" repeatCount="indefinite" />
      </line>
      {/* Legs */}
      <line x1={100} y1={140} x2={80} y2={200} stroke="#0ff" strokeWidth={3} />
      <line x1={100} y1={140} x2={120} y2={200} stroke="#0ff" strokeWidth={3} />
      {/* Impact burst at clap point */}
      <circle cx={100} cy={50} r={5} fill="#f1c40f">
        <animate attributeName="r" values="5;18;5" dur="0.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0;1" dur="0.5s" repeatCount="indefinite" />
      </circle>
      {/* Radiating lines */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1={100 + Math.cos((angle * Math.PI) / 180) * 12}
          y1={50 + Math.sin((angle * Math.PI) / 180) * 12}
          x2={100 + Math.cos((angle * Math.PI) / 180) * 22}
          y2={50 + Math.sin((angle * Math.PI) / 180) * 22}
          stroke="#f1c40f"
          strokeWidth={2}
        >
          <animate attributeName="opacity" values="0;1;0" dur="0.5s" repeatCount="indefinite" />
        </line>
      ))}
    </g>
  );
}

function PunchPose() {
  return (
    <g>
      {/* Back arm (left) tucked */}
      <line x1={100} y1={70} x2={70} y2={85} stroke="#0ff" strokeWidth={3} />
      <line x1={70} y1={85} x2={75} y2={70} stroke="#0ff" strokeWidth={3} />
      {/* Punch arm (right) extended forward */}
      <line x1={100} y1={70} x2={140} y2={70} stroke="#e74c3c" strokeWidth={4} />
      <line x1={140} y1={70} x2={180} y2={70} stroke="#e74c3c" strokeWidth={4}>
        <animateTransform attributeName="transform" type="translate" values="0,0;10,0;0,0" dur="0.4s" repeatCount="indefinite" />
      </line>
      {/* Legs - fighter stance */}
      <line x1={100} y1={140} x2={70} y2={200} stroke="#0ff" strokeWidth={3} />
      <line x1={100} y1={140} x2={130} y2={200} stroke="#0ff" strokeWidth={3} />
      {/* Impact burst at fist */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0;10,0;0,0" dur="0.4s" repeatCount="indefinite" />
        <circle cx={185} cy={70} r={4} fill="#e74c3c">
          <animate attributeName="r" values="4;14;4" dur="0.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0;1" dur="0.4s" repeatCount="indefinite" />
        </circle>
        {/* POW text */}
        <text x={185} y={55} textAnchor="middle" fill="#e74c3c" fontSize={14} fontWeight="bold">
          <animate attributeName="opacity" values="0;1;0" dur="0.4s" repeatCount="indefinite" />
          POW!
        </text>
      </g>
      {/* Highlight: punching wrist */}
      <circle cx={180} cy={70} r={8} fill="#e74c3c" opacity={0.5}>
        <animate attributeName="opacity" values="0.3;1;0.3" dur="0.4s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

// --- Labels and hints ---

const MISSION_LABELS: Record<MissionType, string> = {
  jump: '점프하세요!',
  dodge_left: '왼쪽으로 피하세요!',
  dodge_right: '오른쪽으로 피하세요!',
  push: '밀어요!',
  catch: '잡으세요!',
  throw: '던지세요!',
  duck: '숙이세요!',
  wave: '흔들어요!',
  clap: '박수쳐요!',
  punch: '펀치!',
};

const MISSION_HINTS: Record<MissionType, string> = {
  jump: 'Jump up! Your hips should rise.',
  dodge_left: 'Lean your body to the LEFT',
  dodge_right: 'Lean your body to the RIGHT',
  push: 'Extend both arms forward',
  catch: 'Cup both hands together in front',
  throw: 'Swing your arm forward quickly',
  duck: 'Crouch down! Lower your head.',
  wave: 'Raise one hand and wave side to side',
  clap: 'Bring both hands together quickly!',
  punch: 'Punch forward with one fist!',
};

export function MissionGuide({ mission, timeLeft }: { mission: MissionType; timeLeft: number }) {
  return (
    <div style={guideStyle}>
      {/* Countdown ring */}
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <svg width={60} height={60}>
          <circle cx={30} cy={30} r={26} fill="rgba(0,0,0,0.5)" stroke="#333" strokeWidth={3} />
          <circle
            cx={30}
            cy={30}
            r={26}
            fill="none"
            stroke={timeLeft > 1 ? '#2ecc71' : '#e74c3c'}
            strokeWidth={3}
            strokeDasharray={163}
            strokeDashoffset={163 - (timeLeft / 3) * 163}
            strokeLinecap="round"
            transform="rotate(-90 30 30)"
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
          <text x={30} y={36} textAnchor="middle" fill="#fff" fontSize={22} fontWeight="bold">
            {Math.ceil(timeLeft)}
          </text>
        </svg>
      </div>

      <div style={labelStyle}>{MISSION_LABELS[mission]}</div>
      <StickFigure mission={mission} />
      <div style={subStyle}>{MISSION_HINTS[mission]}</div>
    </div>
  );
}
