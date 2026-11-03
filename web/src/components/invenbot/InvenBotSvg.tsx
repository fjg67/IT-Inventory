import { forwardRef, useId } from 'react';

/**
 * InvenBot articulé. Chaque pièce est un groupe nommé avec un pivot défini
 * dans invenbot.css (repère du viewBox 200×220, `transform-box: view-box`).
 * Les groupes `ib-track-*` portent le suivi du regard, les groupes intérieurs
 * portent les animations CSS / Web Animations : les deux transforms se cumulent.
 */
export const InvenBotSvg = forwardRef<SVGSVGElement>(function InvenBotSvg(_props, ref) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (name: string) => `ib-${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <svg ref={ref} className="ib-svg" viewBox="0 0 200 220" focusable="false" aria-hidden="true">
      <defs>
        <linearGradient id={id('head')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5bb4ff" />
          <stop offset="1" stopColor="#1d64d1" />
        </linearGradient>
        <linearGradient id={id('body')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9e3ee" />
        </linearGradient>
        <linearGradient id={id('visor')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2b45" />
          <stop offset="1" stopColor="#0a1322" />
        </linearGradient>
        <radialGradient id={id('eye')} cx=".4" cy=".35" r=".7">
          <stop offset="0" stopColor="#e6fdff" />
          <stop offset=".45" stopColor="#6fe6ff" />
          <stop offset="1" stopColor="#1fb6f0" />
        </radialGradient>
        <radialGradient id={id('ball')} cx=".38" cy=".35" r=".7">
          <stop offset="0" stopColor="#ffe3a3" />
          <stop offset=".55" stopColor="#ff9f2e" />
          <stop offset="1" stopColor="#e86a12" />
        </radialGradient>
        <radialGradient id={id('eye-glow')}>
          <stop offset="0" stopColor="#5fe3ff" stopOpacity=".55" />
          <stop offset="1" stopColor="#5fe3ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('ball-glow')}>
          <stop offset="0" stopColor="#ffa53a" stopOpacity=".7" />
          <stop offset="1" stopColor="#ffa53a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('jet')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9fbff" />
          <stop offset=".45" stopColor="#5fd3ff" />
          <stop offset="1" stopColor="#2f8cff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id('scan')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7ff3ff" stopOpacity="0" />
          <stop offset=".5" stopColor="#bdf9ff" stopOpacity=".85" />
          <stop offset="1" stopColor="#7ff3ff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={id('progress-clip')}>
          <rect x="82" y="145" width="36" height="4" rx="2" />
        </clipPath>
        <clipPath id={id('visor-clip')}>
          <rect x="58" y="52" width="84" height="50" rx="24" />
        </clipPath>
      </defs>

      <g className="ib-shadow">
        <ellipse cx="100" cy="210" rx="44" ry="6.5" />
      </g>

      <g className="ib-float">
        <g className="ib-actor">
          <g className="ib-jets">
            <path className="ib-jet ib-jet--left" d="M74 196 Q80 214 80 214 Q80 214 86 196 Z" fill={url('jet')} />
            <path className="ib-jet ib-jet--right" d="M114 196 Q120 214 120 214 Q120 214 126 196 Z" fill={url('jet')} />
          </g>

          <g className="ib-base">
            <rect x="68" y="171" width="64" height="19" rx="9.5" fill="#2a6fd8" />
            <circle cx="80" cy="190" r="9" fill="#1d55ad" stroke="#123e85" strokeWidth="2" />
            <circle cx="120" cy="190" r="9" fill="#1d55ad" stroke="#123e85" strokeWidth="2" />
            <circle cx="80" cy="190" r="3.4" fill="#9fd3ff" />
            <circle cx="120" cy="190" r="3.4" fill="#9fd3ff" />
          </g>

          <g className="ib-arm ib-arm--left">
            <g transform="rotate(20 67 122)">
              <rect x="60" y="116" width="14" height="36" rx="7" fill={url('body')} stroke="#c3cfdc" strokeWidth="1.5" />
              <g id={id('prop-thermometer')} className="ib-prop ib-prop--thermometer" data-prop="thermometer">
                <rect x="48" y="137" width="14" height="40" rx="7" fill="#eefaff" stroke="#7199bd" strokeWidth="2" />
                <circle cx="55" cy="176" r="8" fill="#eefaff" stroke="#7199bd" strokeWidth="2" />
                <circle cx="55" cy="176" r="4.5" fill="#f3714d" />
                <rect className="ib-thermometer-level" x="53" y="144" width="4" height="32" rx="2" fill="#f3714d" />
              </g>
              <circle cx="67" cy="155" r="8.5" fill="#2a6fd8" />
            </g>
          </g>

          <g className="ib-body">
            <rect x="91" y="102" width="18" height="12" rx="4" fill="#9fb1c6" />
            <rect x="64" y="109" width="72" height="68" rx="24" fill={url('body')} stroke="#c3cfdc" strokeWidth="1.5" />
            <rect x="78" y="123" width="44" height="29" rx="8" fill="#12213a" />
            <polyline
              className="ib-pulse"
              points="82,138 92,138 96,131 101,145 105,135 109,138 118,138"
              fill="none"
              stroke="#3ee0a8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <g className="ib-progress">
              <rect x="82" y="145" width="36" height="4" rx="2" fill="#24385a" />
              <g clipPath={url('progress-clip')}>
                <rect className="ib-progress-bar" x="70" y="145" width="14" height="4" rx="2" fill="#3ee0a8" />
              </g>
            </g>
            <circle cx="85" cy="164" r="3" fill="#3ee0a8" />
            <rect x="93" y="162.5" width="22" height="3" rx="1.5" fill="#c3cfdc" />
          </g>

          <g id={id('prop-laptop')} className="ib-prop ib-prop--laptop" data-prop="laptop">
            <rect x="63" y="151" width="74" height="33" rx="4" fill="#304d6b" stroke="#92b9d8" strokeWidth="2" />
            <rect x="69" y="156" width="62" height="23" rx="2" fill="#b9ecf5" />
            <path d="m63 184-8 7h90l-8-7Z" fill="#b4cadb" stroke="#7899b4" strokeWidth="1.5" />
          </g>
          <g className="ib-arm ib-arm--right">
            <g transform="rotate(-20 133 122)">
              <rect x="126" y="116" width="14" height="36" rx="7" fill={url('body')} stroke="#c3cfdc" strokeWidth="1.5" />
              <rect className="ib-tool" x="125" y="153" width="18" height="12" rx="3.5" fill="#1d55ad" />
              <rect x="128" y="156" width="8" height="2.6" rx="1.3" fill="#7fe3ff" />
              <g id={id('prop-magnifier')} className="ib-prop ib-prop--magnifier" data-prop="magnifier">
                <rect x="130" y="158" width="6" height="12" rx="3" fill="#7b4a1f" />
                <circle cx="133" cy="182" r="12" fill="#bfefff" fillOpacity=".35" stroke="#e7eef6" strokeWidth="4" />
                <circle cx="133" cy="182" r="12" fill="none" stroke="#8fa3b8" strokeWidth="1.2" />
                <path d="M126 178 Q128 173 134 172" fill="none" stroke="#ffffff" strokeOpacity=".85" strokeWidth="2" strokeLinecap="round" />
              </g>
              <g id={id('prop-wrench')} className="ib-prop ib-prop--wrench" data-prop="wrench">
                <rect x="129" y="153" width="8" height="33" rx="4" fill="#a5bbd0" stroke="#526e89" strokeWidth="1.3" />
                <path d="M124 183v8l9 6 9-6v-8l-5 5h-8Z" fill="#d3e2ef" stroke="#526e89" strokeWidth="1.5" strokeLinejoin="round" />
              </g>
              <circle cx="133" cy="155" r="8.5" fill="#2a6fd8" />
              <rect className="ib-thumb" x="138" y="151.5" width="13" height="7" rx="3.5" fill="#2a6fd8" stroke="#1d55ad" strokeWidth="1.2" />
            </g>
          </g>
          <g className="ib-repair-sparks" fill="none" stroke="#ffc24f" strokeWidth="2.5" strokeLinecap="round">
            <path d="m75 157-8-7m18 2-1-9m-17 20-9 1" />
            <path d="m90 157 6-7m-1 16 8 2" />
          </g>
          <g id={id('prop-first-aid')} className="ib-prop ib-prop--first-aid" data-prop="first-aid">
            <path d="M89 156v-8h22v8" fill="none" stroke="#cc6259" strokeWidth="4" />
            <rect x="63" y="155" width="74" height="31" rx="6" fill="#fff5ee" stroke="#cf7367" strokeWidth="2" />
            <path d="M100 162v16m-8-8h16" stroke="#d75c52" strokeWidth="5" strokeLinecap="round" />
            <circle cx="64" cy="166" r="7" fill="#2a6fd8" /><circle cx="136" cy="166" r="7" fill="#2a6fd8" />
          </g>
          <g id={id('prop-paper-plane')} className="ib-prop ib-prop--paper-plane" data-prop="paper-plane">
            <path d="m137 137 42-11-25 34-1-16-16-7Z" fill="#f5fcff" stroke="#5b97bb" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="m153 144 26-18" fill="none" stroke="#5b97bb" strokeWidth="1.5" />
          </g>
          <path className="ib-ready-glint" d="m159 59 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#43d49e" />
          <g id={id('prop-crate')} className="ib-prop ib-prop--crate" data-prop="crate">
            <rect x="66" y="153" width="68" height="26" rx="3.5" fill="#c98c4a" stroke="#9a6127" strokeWidth="1.6" />
            <path d="M66 161 H134" stroke="#9a6127" strokeWidth="1.4" />
            <rect x="93" y="153" width="14" height="8" fill="#e3b77e" />
            <rect x="80" y="166" width="20" height="9" rx="1.5" fill="#fff8ec" />
            <path d="M83 169 H96.5 M83 172 H92" stroke="#9a6127" strokeWidth="1.1" strokeLinecap="round" />
            <circle cx="66" cy="163" r="7.5" fill="#2a6fd8" />
            <circle cx="134" cy="163" r="7.5" fill="#2a6fd8" />
          </g>

          <g className="ib-track-head">
            <g className="ib-head">
              <g className="ib-antenna">
                <line x1="100" y1="40" x2="100" y2="20" stroke="#9fb1c6" strokeWidth="4" strokeLinecap="round" />
                <g className="ib-antenna-ball">
                  <circle className="ib-antenna-glow" cx="100" cy="15" r="14" fill={url('ball-glow')} />
                  <circle cx="100" cy="15" r="7" fill={url('ball')} />
                  <circle cx="97.6" cy="12.6" r="2" fill="#fff6dc" />
                </g>
              </g>
              <g className="ib-question">
                <text x="126" y="26" textAnchor="middle">?</text>
              </g>

              <rect x="37" y="64" width="13" height="28" rx="6.5" fill="#b8c4d2" />
              <rect x="150" y="64" width="13" height="28" rx="6.5" fill="#b8c4d2" />
              <rect x="46" y="35" width="108" height="81" rx="36" fill={url('head')} />
              <path d="M62 50 Q76 39 96 39" fill="none" stroke="#ffffff" strokeOpacity=".4" strokeWidth="4" strokeLinecap="round" />
              <g id={id('prop-helmet')} className="ib-prop ib-prop--helmet" data-prop="helmet">
                <path d="M48 47c0-17 21-25 43-25h18c22 0 43 8 43 25Z" fill="#ffd367" stroke="#ca922b" strokeWidth="2" />
                <path d="M90 24v20m20-20v20" stroke="#e9ac36" strokeWidth="3" />
                <rect x="42" y="44" width="116" height="9" rx="4.5" fill="#f6bd42" stroke="#ca922b" strokeWidth="1.5" />
                <path d="M58 39c6-7 14-10 23-11" fill="none" stroke="#fff1ba" strokeWidth="3" strokeLinecap="round" />
              </g>
              <path className="ib-sweat" d="M153 56c0 0-5 7-5 10a5 5 0 0 0 10 0c0-3-5-10-5-10Z" fill="#71dbf4" />

              <g className="ib-visor">
                <rect x="58" y="52" width="84" height="50" rx="24" fill={url('visor')} />
                <g clipPath={url('visor-clip')}>
                  <rect className="ib-visor-scan" x="40" y="52" width="22" height="50" fill={url('scan')} />
                  <path d="M66 60 Q74 55 86 55" fill="none" stroke="#ffffff" strokeOpacity=".12" strokeWidth="3" strokeLinecap="round" />
                </g>
              </g>

              <g className="ib-track-eyes">
                <g className="ib-eye ib-eye--left">
                  <circle className="ib-eye-glow" cx="82" cy="73" r="14" fill={url('eye-glow')} />
                  <g className="ib-eye-open">
                    <ellipse cx="82" cy="73" rx="7" ry="9" fill={url('eye')} />
                    <circle cx="79.6" cy="69.6" r="2.2" fill="#ffffff" />
                  </g>
                  <path className="ib-eye-happy" d="M74 76 Q82 64 90 76" />
                  <path className="ib-eye-closed" d="M74 74 Q82 80 90 74" />
                </g>
                <g className="ib-eye ib-eye--right">
                  <circle className="ib-eye-glow" cx="118" cy="73" r="14" fill={url('eye-glow')} />
                  <g className="ib-eye-open">
                    <ellipse cx="118" cy="73" rx="7" ry="9" fill={url('eye')} />
                    <circle cx="115.6" cy="69.6" r="2.2" fill="#ffffff" />
                  </g>
                  <path className="ib-eye-happy" d="M110 76 Q118 64 126 76" />
                  <path className="ib-eye-closed" d="M110 74 Q118 80 126 74" />
                </g>
                <g className="ib-eye-dots">
                  <circle cx="88" cy="74" r="3.6" />
                  <circle cx="100" cy="74" r="3.6" />
                  <circle cx="112" cy="74" r="3.6" />
                </g>
              </g>

              <g className="ib-mouth">
                <path className="ib-mouth-smile" d="M90 89 Q100 97 110 89" />
                <ellipse className="ib-mouth-open" cx="100" cy="91" rx="6" ry="4.5" />
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
});
