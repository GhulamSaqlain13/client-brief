/* Decorative artwork from the Projects redesign. Colors come from il-* classes in redesign.css. */
const text = { fontFamily: "inherit" };

export function HeroIllustration() {
  return (
    <svg
      className="illustration hero-art"
      viewBox="0 0 440 260"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="cb-dots"
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <circle className="il-dot" cx="2" cy="2" r="1.3" />
        </pattern>
      </defs>
      <rect
        x="10"
        y="10"
        width="420"
        height="240"
        rx="24"
        fill="url(#cb-dots)"
      />
      <circle className="il-halo" cx="330" cy="120" r="96" />
      <circle
        className="il-ring"
        cx="330"
        cy="120"
        r="62"
        strokeDasharray="4 5"
      />
      <rect
        className="il-card"
        x="24"
        y="36"
        width="170"
        height="150"
        rx="16"
      />
      <circle className="il-peach" cx="46" cy="60" r="10" />
      <rect className="il-bar2" x="62" y="54" width="70" height="7" rx="3.5" />
      <rect className="il-bar3" x="62" y="64" width="40" height="5" rx="2.5" />
      <rect
        className="il-bubble"
        x="38"
        y="84"
        width="128"
        height="26"
        rx="10"
      />
      <rect className="il-bar" x="48" y="93" width="92" height="7" rx="3.5" />
      <rect
        className="il-accent"
        x="62"
        y="118"
        width="118"
        height="26"
        rx="10"
      />
      <rect
        className="il-accent-soft"
        x="74"
        y="127"
        width="80"
        height="7"
        rx="3.5"
      />
      <rect
        className="il-bubble"
        x="38"
        y="152"
        width="96"
        height="22"
        rx="10"
      />
      <rect className="il-bar" x="48" y="160" width="58" height="6" rx="3" />
      <path
        className="il-flow"
        d="M196 112 C 222 112, 220 96, 246 96"
        strokeWidth="2"
        strokeDasharray="5 5"
        strokeLinecap="round"
      />
      <circle className="il-accent" cx="220" cy="104" r="13" />
      <path
        className="il-white"
        d="M220 97 l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z"
      />
      <rect
        className="il-card"
        x="256"
        y="30"
        width="160"
        height="196"
        rx="16"
      />
      <rect
        className="il-deep"
        x="256"
        y="30"
        width="160"
        height="40"
        rx="16"
      />
      <rect className="il-deep" x="256" y="54" width="160" height="16" />
      <rect
        className="il-flow-fill"
        x="272"
        y="45"
        width="64"
        height="8"
        rx="4"
      />
      <rect
        className="il-deep2"
        x="370"
        y="43"
        width="30"
        height="13"
        rx="6.5"
      />
      <text
        className="il-deep-text"
        x="385"
        y="52.5"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        style={text}
      >
        v1
      </text>
      {[92, 118].map((y, i) => (
        <g key={y}>
          <circle className="il-green-bg" cx="280" cy={y} r="8" />
          <path
            className="il-green-stroke"
            d={`M276.5 ${y} l2.5 2.5 4.5-4.5`}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            className="il-bar"
            x="294"
            y={y - 4}
            width={i ? 72 : 90}
            height="7"
            rx="3.5"
          />
          <rect
            className="il-soft"
            x="388"
            y={y - 6}
            width="14"
            height="11"
            rx="3"
          />
        </g>
      ))}
      <circle className="il-amber-bg" cx="280" cy="144" r="8" />
      <rect className="il-amber" x="277" y="140" width="6" height="2" rx="1" />
      <rect className="il-amber" x="277" y="145" width="6" height="2" rx="1" />
      <rect className="il-bar" x="294" y="140" width="84" height="7" rx="3.5" />
      <rect className="il-soft" x="388" y="138" width="14" height="11" rx="3" />
      <line className="il-rule" x1="272" y1="170" x2="400" y2="170" />
      <rect
        className="il-green-bg"
        x="272"
        y="184"
        width="70"
        height="24"
        rx="12"
      />
      <text
        className="il-green-text"
        x="307"
        y="200"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        style={text}
      >
        Approved
      </text>
      <circle className="il-peach" cx="390" cy="196" r="10" />
      <circle
        className="il-lilac il-cutout"
        cx="376"
        cy="196"
        r="10"
        strokeWidth="2"
      />
      <rect
        className="il-card"
        x="150"
        y="196"
        width="122"
        height="34"
        rx="12"
      />
      <circle className="il-soft" cx="170" cy="213" r="8" />
      <path
        className="il-accent-stroke"
        d="M166.5 213h7M170 209.5v7"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <text
        className="il-text"
        x="184"
        y="217"
        fontSize="10.5"
        fontWeight="600"
        style={text}
      >
        Source-linked
      </text>
      <rect className="il-card" x="356" y="4" width="74" height="26" rx="13" />
      <path
        className="il-green-bg il-green-stroke"
        d="M372 11l5 2v3.5c0 3-2 5.2-5 6.5-3-1.3-5-3.5-5-6.5V13z"
        strokeWidth="1.2"
      />
      <text
        className="il-text"
        x="384"
        y="21"
        fontSize="10"
        fontWeight="600"
        style={text}
      >
        Local
      </text>
    </svg>
  );
}

export function EmptyIllustration() {
  const requirement = (y: number, tone: string, w1: number, w2: number) => (
    <g key={y}>
      <rect
        className={`il-${tone}-tint`}
        x="294"
        y={y}
        width="168"
        height="36"
        rx="10"
      />
      <rect
        className={`il-${tone}-mid`}
        x="294"
        y={y}
        width="4"
        height="36"
        rx="2"
      />
      <rect
        className="il-bar"
        x="308"
        y={y + 10}
        width={w1}
        height="6"
        rx="3"
      />
      <rect
        className="il-bar3"
        x="308"
        y={y + 20}
        width={w2}
        height="5"
        rx="2.5"
      />
    </g>
  );
  return (
    <svg
      className="illustration empty-art-large"
      viewBox="0 0 500 320"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="cb-grid"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path className="il-grid" d="M20 0H0V20" strokeWidth="1" />
        </pattern>
      </defs>
      <rect className="il-canvas" width="500" height="320" rx="20" />
      <rect width="500" height="320" rx="20" fill="url(#cb-grid)" />
      <rect
        className="il-card"
        x="28"
        y="40"
        width="200"
        height="240"
        rx="16"
      />
      <text
        className="il-text"
        x="46"
        y="68"
        fontSize="11"
        fontWeight="700"
        style={text}
      >
        Client call
      </text>
      <rect
        className="il-bubble"
        x="160"
        y="57"
        width="52"
        height="16"
        rx="8"
      />
      <text
        className="il-text-muted"
        x="186"
        y="68.5"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="600"
        style={text}
      >
        Transcript
      </text>
      <line className="il-rule" x1="44" y1="84" x2="212" y2="84" />
      <circle className="il-peach" cx="54" cy="106" r="9" />
      <rect className="il-bar2" x="70" y="100" width="130" height="6" rx="3" />
      <rect className="il-bar2" x="70" y="110" width="40" height="6" rx="3" />
      <rect
        className="il-lilac-soft"
        x="114"
        y="109"
        width="70"
        height="8"
        rx="3"
      />
      <circle className="il-lilac" cx="54" cy="146" r="9" />
      <rect className="il-bar2" x="70" y="140" width="110" height="6" rx="3" />
      <rect className="il-bar2" x="70" y="150" width="96" height="6" rx="3" />
      <circle className="il-peach" cx="54" cy="186" r="9" />
      <rect
        className="il-green-tint"
        x="70"
        y="179"
        width="56"
        height="8"
        rx="3"
      />
      <rect className="il-bar2" x="130" y="180" width="74" height="6" rx="3" />
      <rect className="il-bar2" x="70" y="190" width="100" height="6" rx="3" />
      <circle className="il-lilac" cx="54" cy="226" r="9" />
      <rect className="il-bar2" x="70" y="220" width="84" height="6" rx="3" />
      <rect
        className="il-amber-tint"
        x="70"
        y="229"
        width="80"
        height="8"
        rx="3"
      />
      <rect className="il-bar3" x="70" y="252" width="120" height="6" rx="3" />
      <path
        className="il-flow"
        d="M184 113 C 250 113, 240 104, 290 104"
        strokeWidth="1.6"
        strokeDasharray="4 4"
      />
      <path
        className="il-green-line"
        d="M126 183 C 250 183, 236 150, 290 150"
        strokeWidth="1.6"
        strokeDasharray="4 4"
      />
      <path
        className="il-amber-line"
        d="M150 233 C 250 233, 240 196, 290 196"
        strokeWidth="1.6"
        strokeDasharray="4 4"
      />
      <circle className="il-flow-fill" cx="184" cy="113" r="3" />
      <circle className="il-green-mid" cx="126" cy="183" r="3" />
      <circle className="il-amber-mid" cx="150" cy="233" r="3" />
      <rect
        className="il-card"
        x="280"
        y="64"
        width="196"
        height="218"
        rx="16"
      />
      <rect
        className="il-accent"
        x="296"
        y="80"
        width="26"
        height="26"
        rx="7"
      />
      <path
        className="il-white-stroke"
        d="M304 87h6l4 4v8h-10z"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <text
        className="il-text"
        x="330"
        y="91"
        fontSize="11"
        fontWeight="700"
        style={text}
      >
        Project brief
      </text>
      <text
        className="il-text-muted"
        x="330"
        y="103"
        fontSize="8.5"
        style={text}
      >
        3 requirements
      </text>
      <line className="il-rule" x1="296" y1="118" x2="460" y2="118" />
      {requirement(126, "lilac", 96, 60)}
      {requirement(170, "green", 110, 70)}
      {requirement(214, "amber", 88, 52)}
      <circle className="il-deep" cx="470" cy="62" r="18" />
      <path
        className="il-deep-label"
        d="M470 52 l2.6 6.4 6.4 2.6-6.4 2.6-2.6 6.4-2.6-6.4-6.4-2.6 6.4-2.6z"
      />
      <rect
        className="il-card"
        x="360"
        y="262"
        width="118"
        height="30"
        rx="15"
      />
      <circle
        className="il-accent-stroke"
        cx="378"
        cy="277"
        r="7"
        strokeWidth="1.5"
      />
      <path
        className="il-accent-stroke"
        d="M378 273.5v3.5l2.5 1.5"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <text
        className="il-text"
        x="392"
        y="281"
        fontSize="10"
        fontWeight="600"
        style={text}
      >
        Version history
      </text>
    </svg>
  );
}

export function StepIllustration({ step }: { step: 1 | 2 | 3 }) {
  return (
    <svg
      className={`illustration step-art step-art-${step}`}
      viewBox="0 0 320 130"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {step === 1 && (
        <>
          <circle className="il-lilac-soft" cx="270" cy="20" r="46" />
          <rect
            className="il-card il-card-lilac"
            x="70"
            y="30"
            width="150"
            height="30"
            rx="12"
          />
          <rect className="il-bar" x="84" y="42" width="96" height="6" rx="3" />
          <circle className="il-peach" cx="56" cy="45" r="11" />
          <rect
            className="il-accent"
            x="110"
            y="70"
            width="150"
            height="30"
            rx="12"
          />
          <rect
            className="il-accent-soft"
            x="124"
            y="82"
            width="80"
            height="6"
            rx="3"
          />
          <circle className="il-lilac" cx="274" cy="85" r="11" />
          <rect
            className="il-deep"
            x="226"
            y="40"
            width="40"
            height="18"
            rx="9"
          />
          {[236, 244, 252].map((x) => (
            <rect
              className="il-deep-label"
              key={x}
              x={x}
              y="47"
              width="4"
              height="4"
              rx="2"
            />
          ))}
        </>
      )}
      {step === 2 && (
        <>
          <circle className="il-green-tint" cx="40" cy="110" r="50" />
          <rect
            className="il-card il-card-green"
            x="60"
            y="24"
            width="90"
            height="82"
            rx="12"
          />
          <rect
            className="il-bar"
            x="72"
            y="38"
            width="60"
            height="5"
            rx="2.5"
          />
          <rect
            className="il-green-chip"
            x="72"
            y="50"
            width="34"
            height="7"
            rx="3"
          />
          <rect
            className="il-bar"
            x="72"
            y="64"
            width="54"
            height="5"
            rx="2.5"
          />
          <rect
            className="il-green-chip"
            x="72"
            y="76"
            width="44"
            height="7"
            rx="3"
          />
          <path
            className="il-green-line"
            d="M106 53 C 150 53, 160 42, 190 42"
            strokeWidth="1.6"
            strokeDasharray="4 4"
          />
          <path
            className="il-green-line"
            d="M116 79 C 150 79, 160 82, 190 82"
            strokeWidth="1.6"
            strokeDasharray="4 4"
          />
          {[28, 68].map((y, i) => (
            <g key={y}>
              <rect
                className="il-card il-card-green"
                x="190"
                y={y}
                width="94"
                height="28"
                rx="9"
              />
              <circle className="il-green-bg" cx="204" cy={y + 14} r="6" />
              <rect
                className="il-bar"
                x="216"
                y={y + 11}
                width={i ? 44 : 54}
                height="6"
                rx="3"
              />
            </g>
          ))}
        </>
      )}
      {step === 3 && (
        <>
          <circle className="il-amber-tint" cx="280" cy="112" r="52" />
          <rect
            className="il-card il-card-amber"
            x="96"
            y="20"
            width="128"
            height="94"
            rx="12"
          />
          <rect
            className="il-heading-bar"
            x="110"
            y="34"
            width="70"
            height="7"
            rx="3.5"
          />
          <rect
            className="il-bar2"
            x="110"
            y="50"
            width="96"
            height="5"
            rx="2.5"
          />
          <rect
            className="il-bar2"
            x="110"
            y="60"
            width="80"
            height="5"
            rx="2.5"
          />
          <rect
            className="il-bar2"
            x="110"
            y="70"
            width="88"
            height="5"
            rx="2.5"
          />
          <rect
            className="il-green-bg"
            x="110"
            y="86"
            width="56"
            height="18"
            rx="9"
          />
          <path
            className="il-green-stroke"
            d="M120 95l3 3 5-5"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            className="il-green-chip-strong"
            x="132"
            y="92"
            width="26"
            height="5"
            rx="2.5"
          />
          <circle className="il-amber-dot" cx="232" cy="28" r="16" />
          <path
            className="il-white-stroke"
            d="M225 28l5 5 9-9"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            className="il-card il-card-amber"
            x="48"
            y="62"
            width="40"
            height="22"
            rx="11"
          />
          <text
            className="il-amber-text"
            x="68"
            y="77"
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            style={text}
          >
            v2
          </text>
        </>
      )}
    </svg>
  );
}
