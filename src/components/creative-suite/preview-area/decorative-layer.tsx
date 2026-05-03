'use client';

import { DecorativeElement } from '@/constants/creative-palettes';

const D = 'absolute pointer-events-none z-0';

interface DecorativeLayerProps {
  element: DecorativeElement;
  accent: string;
  secondary: string;
  brandName?: string;
}

export function DecorativeLayer({ element, accent, secondary, brandName }: DecorativeLayerProps) {
  switch (element) {
    // ── GEOMÉTRICO ──────────────────────────────────────────────────────────

    case 'circles':
      return (
        <div className={`${D} inset-0 overflow-hidden`}>
          <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-full" fill="none">
            <circle cx="340" cy="80" r="260" stroke={accent} strokeWidth="1" opacity="0.12"/>
            <circle cx="340" cy="80" r="180" stroke={accent} strokeWidth="1.5" opacity="0.15"/>
            <circle cx="340" cy="80" r="100" stroke={accent} strokeWidth="2" opacity="0.18"/>
            <circle cx="340" cy="80" r="40"  stroke={accent} strokeWidth="3" opacity="0.25"/>
            <circle cx="60"  cy="520" r="120" stroke={secondary} strokeWidth="1" opacity="0.08"/>
            <circle cx="60"  cy="520" r="60"  stroke={secondary} strokeWidth="1" opacity="0.10"/>
          </svg>
        </div>
      );

    case 'diamond-grid':
      return (
        <div className={`${D} inset-0 overflow-hidden`}>
          <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-full" fill="none">
            {[0,1,2,3,4,5,6].map(i => (
              <rect key={i} x={-40 + i*70} y={-40 + i*60} width="80" height="80"
                transform={`rotate(45 ${-40+i*70+40} ${-40+i*60+40})`}
                stroke={i % 2 === 0 ? accent : secondary} strokeWidth="1.5"
                opacity={0.06 + i * 0.025} fill="none"/>
            ))}
            <rect x="280" y="440" width="160" height="160"
              transform="rotate(45 360 520)"
              fill={accent} opacity="0.06"/>
          </svg>
        </div>
      );

    case 'triangle-burst':
      return (
        <div className={`${D} inset-0 overflow-hidden`}>
          <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-full">
            <polygon points="400,600 200,600 400,300" fill={accent} opacity="0.12"/>
            <polygon points="400,600 400,350 250,600" fill={secondary} opacity="0.09"/>
            <polygon points="400,600 150,600 400,200" fill="none" stroke={accent} strokeWidth="1" opacity="0.10"/>
            <polygon points="400,100 350,0 400,0" fill={accent} opacity="0.20"/>
            <polygon points="0,0 120,0 0,180" fill={secondary} opacity="0.07"/>
          </svg>
        </div>
      );

    case 'slash':
      return (
        <div className={`${D} inset-0 overflow-hidden`}>
          <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-full">
            <polygon points="0,0 120,0 0,600 -120,600" fill={accent} opacity="0.13"/>
            <polygon points="130,0 170,0 50,600 10,600" fill={accent} opacity="0.06"/>
            <polygon points="340,0 400,0 400,600 280,600" fill={secondary} opacity="0.08"/>
          </svg>
        </div>
      );

    case 'arch':
      return (
        <div className={`${D} inset-0 overflow-hidden`}>
          <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-full" fill="none">
            <path d="M80,600 L80,250 A120,120 0 0,1 320,250 L320,600" stroke={accent} strokeWidth="2.5" opacity="0.18"/>
            <path d="M100,600 L100,270 A100,100 0 0,1 300,270 L300,600" stroke={accent} strokeWidth="1" opacity="0.10"/>
            <path d="M20,600 L20,230 A180,180 0 0,1 380,230 L380,600" stroke={secondary} strokeWidth="1" opacity="0.07"/>
            <circle cx="200" cy="130" r="8" fill={accent} opacity="0.40"/>
          </svg>
        </div>
      );

    case 'cross-marks':
      return (
        <div className={`${D} inset-0 overflow-hidden`}>
          <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-full" stroke={accent} fill="none">
            {([
              [340, 80, 40, 0.20], [60, 180, 22, 0.15], [310, 340, 60, 0.12],
              [130, 500, 18, 0.18], [360, 480, 30, 0.10], [30, 60, 14, 0.22],
              [220, 420, 10, 0.30], [170, 140, 50, 0.08],
            ] as [number,number,number,number][]).map(([cx,cy,r,op], i) => (
              <g key={i} transform={`translate(${cx},${cy}) rotate(45)`} opacity={op}>
                <line x1={-r} y1="0" x2={r} y2="0" strokeWidth={r > 30 ? 1.5 : 2}/>
                <line x1="0" y1={-r} x2="0" y2={r} strokeWidth={r > 30 ? 1.5 : 2}/>
              </g>
            ))}
          </svg>
        </div>
      );

    case 'abstract':
      return (
        <div className={`${D} inset-0 overflow-hidden`}>
          <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-full" fill="none">
            <rect x="300" y="-60" width="200" height="200" transform="rotate(30 400 40)"
              stroke={accent} strokeWidth="2" opacity="0.15"/>
            <rect x="290" y="-50" width="160" height="160" transform="rotate(15 370 30)"
              stroke={accent} strokeWidth="1" opacity="0.10"/>
            <rect x="-80" y="420" width="220" height="220" transform="rotate(-20 30 530)"
              stroke={secondary} strokeWidth="1.5" opacity="0.12"/>
            <rect x="160" y="260" width="12" height="12" transform="rotate(45 166 266)"
              fill={accent} opacity="0.50"/>
            <rect x="60" y="320" width="6" height="6" transform="rotate(45 63 323)"
              fill={accent} opacity="0.35"/>
          </svg>
        </div>
      );

    // ── PATRÓN / TEXTURA ────────────────────────────────────────────────────

    case 'grid':
      return (
        <div className={`${D} inset-0 opacity-[0.06]`}
          style={{
            backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`,
            backgroundSize: '55px 55px',
          }}/>
      );

    case 'dots':
      return (
        <div className={`${D} inset-0 opacity-[0.09]`}
          style={{
            backgroundImage: `radial-gradient(circle, ${accent} 2px, transparent 2px)`,
            backgroundSize: '28px 28px',
          }}/>
      );

    case 'halftone':
      return (
        <div className={`${D} inset-0 overflow-hidden`}>
          <div className="absolute inset-0 opacity-[0.11]"
            style={{
              backgroundImage: `radial-gradient(circle, ${accent} 2.5px, transparent 2.5px)`,
              backgroundSize: '18px 18px',
              backgroundPosition: '0 0, 9px 9px',
              maskImage: 'linear-gradient(to top, black 30%, transparent 80%)',
              WebkitMaskImage: 'linear-gradient(to top, black 30%, transparent 80%)',
            }}/>
        </div>
      );

    case 'diagonal-stripes':
      return (
        <div className={`${D} inset-0 opacity-[0.06]`}
          style={{
            backgroundImage: `repeating-linear-gradient(55deg, ${accent} 0, ${accent} 2px, transparent 0, transparent 26px)`,
          }}/>
      );

    case 'hexagon-mesh':
      return (
        <div className={`${D} inset-0 overflow-hidden opacity-[0.08]`}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hex-mesh-pattern" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
                <polygon points="30,2 58,17 58,47 30,62 2,47 2,17" fill="none" stroke={accent} strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hex-mesh-pattern)"/>
          </svg>
        </div>
      );

    // ── ORGÁNICO / FLUJO ────────────────────────────────────────────────────

    case 'blob':
      return (
        <>
          <div className={`${D} -top-40 -right-40 w-[460px] h-[460px] opacity-[0.18] blur-[80px] rounded-[60%_40%_55%_45%/50%_60%_40%_50%]`}
            style={{ backgroundColor: accent }}/>
          <div className={`${D} -bottom-32 -left-32 w-80 h-80 opacity-[0.13] blur-[60px] rounded-[40%_60%_50%_50%/60%_40%_60%_40%]`}
            style={{ backgroundColor: secondary }}/>
        </>
      );

    case 'waves':
      return (
        <div className={`${D} inset-0 overflow-hidden`}>
          <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMax slice">
            <path d="M-20 480 Q60 420 140 480 Q220 540 300 480 Q380 420 460 480 L460 660 L-20 660 Z" fill={accent} opacity="0.14"/>
            <path d="M-20 530 Q80 460 160 530 Q240 600 320 530 Q400 460 460 530 L460 660 L-20 660 Z" fill={accent} opacity="0.09"/>
            <path d="M-20 580 Q100 510 180 580 Q260 650 340 580 Q400 520 460 580 L460 660 L-20 660 Z" fill={secondary} opacity="0.07"/>
            <path d="M-20 60 Q80 0 160 60 Q240 120 320 60 Q400 0 460 60 L460 0 L-20 0 Z" fill={secondary} opacity="0.06"/>
          </svg>
        </div>
      );

    case 'brush':
      return (
        <div className={`${D} inset-0 overflow-hidden`}>
          <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-full">
            <path d="M-30 120 Q80 60 180 130 Q280 200 350 100 Q400 60 420 90"
              fill="none" stroke={accent} strokeWidth="28" strokeLinecap="round" opacity="0.12"/>
            <path d="M-30 180 Q80 120 160 190 Q260 260 340 160"
              fill="none" stroke={accent} strokeWidth="12" strokeLinecap="round" opacity="0.08"/>
            <path d="M20 480 Q140 420 240 500 Q320 560 420 480"
              fill="none" stroke={secondary} strokeWidth="40" strokeLinecap="round" opacity="0.09"/>
            <path d="M30 540 Q140 480 260 550"
              fill="none" stroke={secondary} strokeWidth="18" strokeLinecap="round" opacity="0.06"/>
          </svg>
        </div>
      );

    case 'radial-glow':
      return (
        <>
          <div className={`${D} top-1/4 right-1/4 w-[120%] aspect-square opacity-[0.22] blur-[100px] rounded-full`}
            style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 60%)` }}/>
          <div className={`${D} -bottom-20 -left-20 w-72 h-72 opacity-[0.15] blur-[70px] rounded-full`}
            style={{ background: `radial-gradient(circle, ${secondary} 0%, transparent 65%)` }}/>
        </>
      );

    // ── EDITORIAL / COMPOSICIONAL ──────────────────────────────────────────

    case 'corner-frame':
      return (
        <div className={`${D} inset-0`}>
          {([
            'top-6 left-6 border-t-2 border-l-2',
            'top-6 right-6 border-t-2 border-r-2',
            'bottom-6 left-6 border-b-2 border-l-2',
            'bottom-6 right-6 border-b-2 border-r-2',
          ]).map((cls, i) => (
            <div key={i} className={`absolute ${cls} w-10 h-10 opacity-30`}
              style={{ borderColor: accent }}/>
          ))}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border opacity-[0.06] rounded-sm"
            style={{ borderColor: accent }}/>
        </div>
      );

    case 'lines':
      return (
        <div className={`${D} inset-0 overflow-hidden`}>
          {[15, 30, 50, 70, 85].map((pct, i) => (
            <div key={i}
              className="absolute top-0 h-full"
              style={{
                left: `${pct}%`,
                width: i === 2 ? '2px' : '1px',
                backgroundColor: accent,
                opacity: i === 2 ? 0.18 : 0.07,
              }}/>
          ))}
          <div className="absolute top-[15%] left-0 right-0 h-[1px] opacity-10"
            style={{ backgroundColor: accent }}/>
          <div className="absolute bottom-[15%] left-0 right-0 h-[1px] opacity-10"
            style={{ backgroundColor: accent }}/>
        </div>
      );

    case 'arrows':
      return (
        <div className={`${D} inset-0 overflow-hidden`}>
          <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-full" fill="none">
            <path d="M40 300 L200 140 M200 140 L160 180 M200 140 L240 180"
              stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.20"/>
            <path d="M60 320 L220 160 M220 160 L180 200 M220 160 L260 200"
              stroke={accent} strokeWidth="1" strokeLinecap="round" opacity="0.10"/>
            <path d="M300 500 L400 380 M400 380 L370 410 M400 380 L400 420"
              stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.18"/>
            <path d="M0 0 L120 0 M120 0 L90 -20 M120 0 L90 20"
              stroke={secondary} strokeWidth="1.5" strokeLinecap="round" opacity="0.12"/>
          </svg>
        </div>
      );

    case 'floating-shapes':
      return (
        <div className={`${D} inset-0 overflow-hidden`}>
          <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-full" fill="none">
            <circle cx="340" cy="100" r="80" stroke={accent} strokeWidth="1" opacity="0.12"/>
            <circle cx="340" cy="100" r="6" fill={accent} opacity="0.40"/>
            <rect x="20" y="200" width="60" height="60" rx="4"
              transform="rotate(20 50 230)" stroke={accent} strokeWidth="1.5" opacity="0.14"/>
            <polygon points="200,440 240,520 160,520"
              stroke={secondary} strokeWidth="1.5" opacity="0.16" fill={secondary} fillOpacity="0.04"/>
            <circle cx="60" cy="500" r="40" stroke={secondary} strokeWidth="1" opacity="0.10"/>
            <rect x="300" y="380" width="120" height="3"
              transform="rotate(-30 360 381)" fill={accent} opacity="0.20"/>
            <circle cx="180" cy="60" r="12" fill="none" stroke={accent} strokeWidth="2" opacity="0.25"/>
            <circle cx="180" cy="60" r="3" fill={accent} opacity="0.40"/>
          </svg>
        </div>
      );

    case 'typographic': {
      // Dynamic: uses first letter of brandName, falls back to 'K'
      const letter = brandName ? brandName.trim().charAt(0).toUpperCase() : 'K';
      return (
        <div className={`${D} inset-0 overflow-hidden flex items-center justify-end pr-4`}>
          <span
            className="text-[340px] font-black leading-none select-none"
            style={{
              color: accent,
              opacity: 0.06,
              fontFamily: "'Montserrat', 'Arial Black', sans-serif",
              letterSpacing: '-0.05em',
            }}>
            {letter}
          </span>
        </div>
      );
    }

    case 'none':
    default:
      return null;
  }
}
