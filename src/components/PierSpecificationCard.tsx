import type { PierSpecificationSheet } from '../types/port';

interface PierSpecificationCardProps {
  sheet: PierSpecificationSheet;
  fallbackBannerUrl?: string;
}

function ParameterIcon({ index }: { index: number }) {
  switch (index) {
    case 0: // Maximum design deadweight tonnage (ship bow)
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14l-1.5 6.5a2 2 0 0 1-1.95 1.5H8.45a2 2 0 0 1-1.95-1.5L5 12Z" />
          <path d="M7.5 12V7.5h9V12" />
          <path d="M12 4v3.5" />
        </svg>
      );
    case 1: // Maximum accepted displacement (weight)
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 8a3 3 0 0 1 6 0" />
          <path d="M6.5 9h11l1.5 10.5H5L6.5 9Z" fill="currentColor" stroke="none" />
          <circle cx="12" cy="14" r="1.4" fill="#042447" stroke="none" />
          <path d="M12 14.5v2" stroke="#042447" strokeWidth="1.6" />
        </svg>
      );
    case 2: // Berthing velocity (speedometer)
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5a8.5 8.5 0 1 1 15 0" />
          <path d="M12 15l4-5" />
          <circle cx="12" cy="15" r="1.5" fill="currentColor" />
        </svg>
      );
    case 3: // Transverse windage
    case 4: // Longitudinal windage
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8h11.5a2.5 2.5 0 1 0-2.5-2.5" />
          <path d="M3 12h15a2.5 2.5 0 1 1-2.5 2.5" />
          <path d="M3 16h9.5a2 2 0 1 1-2 2" />
        </svg>
      );
    case 5: // Operating draft (down arrow + wave)
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4v10" />
          <path d="M8.5 10.5 12 14l3.5-3.5" />
          <path d="M4 17.5c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0" />
          <path d="M4 20.5c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0" />
        </svg>
      );
    case 6: // LOA (side profile + horizontal arrow)
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12h16l-1.5 3.5h-13L4 12Z" fill="currentColor" stroke="none" />
          <path d="M8 12V9.5h5V12" fill="currentColor" stroke="none" />
          <path d="M4 19h16" />
          <path d="M6.5 17 4 19l2.5 2" />
          <path d="M17.5 17 20 19l-2.5 2" />
        </svg>
      );
    default: // Beam (ship bow + width arrow)
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4.5 7 9.5v4l2 2h6l2-2v-4l-5-5Z" fill="currentColor" stroke="none" />
          <path d="M4 19.5h16" />
          <path d="M6.5 17.5 4 19.5l2.5 2" />
          <path d="M17.5 17.5 20 19.5l-2.5 2" />
        </svg>
      );
  }
}

export function PierSpecificationCard({
  sheet,
  fallbackBannerUrl,
}: PierSpecificationCardProps) {
  const bannerUrl = sheet.bannerImageUrl || fallbackBannerUrl || '';
  const mottoWords = (
    sheet.motto || 'LEADERS IN CONNECTIONS THAT MOVE THE WORLD'
  )
    .trim()
    .split(/\s+/);

  const mottoLines =
    mottoWords.length >= 6
      ? [
          mottoWords[0],
          mottoWords.slice(1, 3).join(' '),
          mottoWords.slice(3, 5).join(' '),
          mottoWords.slice(5).join(' '),
        ]
      : [sheet.motto || 'LEADERS IN CONNECTIONS THAT MOVE THE WORLD'];

  const parameters = [
    {
      label: 'Maximum design deadweight tonnage',
      value: sheet.maxDwt,
    },
    {
      label: 'Maximum accepted displacement',
      value: sheet.maxDisplacement,
    },
    {
      label: 'Berthing velocity',
      value: sheet.berthingVelocity,
    },
    {
      label: 'Maximum transverse windage area',
      value: sheet.maxTransverseWindage,
    },
    {
      label: 'Maximum longitudinal windage area',
      value: sheet.maxLongitudinalWindage,
    },
    {
      label: 'Operating draft',
      value: sheet.operatingDraftDisplay,
    },
    {
      label: 'Maximum accepted LOA',
      value: sheet.maxAcceptedLoa,
    },
    {
      label: 'Maximum accepted beam',
      value: sheet.maxAcceptedBeam,
    },
  ];

  const minRows = 4;
  const fillerCount = Math.max(0, minRows - sheet.conditions.length);

  return (
    <article
      className="bg-white rounded-2xl overflow-hidden border border-[#b9e3f9] shadow-[0_20px_50px_rgba(4,36,71,0.14)] text-[#042447] select-text"
      aria-label={`${sheet.pierNumber} ${sheet.pierTitle} ${sheet.pierSide}`}
    >
      {/* HERO BANNER WITH CURVED NAVY SWEEP */}
      <div className="relative bg-[#042447] overflow-hidden min-h-[250px] sm:min-h-[285px] flex flex-col justify-between">
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt={`${sheet.pierTitle} ${sheet.pierSide}`}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        )}

        {/* Curved Deep Navy Left Scrim + Right Legibility Gradient */}
        <svg
          viewBox="0 0 1200 320"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            <linearGradient id={`navy-sweep-${sheet.pierNumber}-${sheet.pierTitle.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="100%" y2="25%">
              <stop offset="0%" stopColor="#031b38" stopOpacity="0.98" />
              <stop offset="68%" stopColor="#072d56" stopOpacity="0.93" />
              <stop offset="100%" stopColor="#0d4985" stopOpacity="0.62" />
            </linearGradient>
            <linearGradient id={`navy-rim-${sheet.pierNumber}-${sheet.pierTitle.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#031b38" stopOpacity="0" />
              <stop offset="100%" stopColor="#031b38" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path
            d="M0,0 L430,0 C405,130 530,245 710,320 L0,320 Z"
            fill={`url(#navy-sweep-${sheet.pierNumber}-${sheet.pierTitle.replace(/\s+/g, '')})`}
          />
          <path
            d="M360,0 L490,0 C465,125 600,240 800,320 L650,320 C515,240 400,130 360,0 Z"
            fill="#0c5291"
            fillOpacity="0.38"
          />
          <rect
            x="900"
            y="0"
            width="300"
            height="320"
            fill={`url(#navy-rim-${sheet.pierNumber}-${sheet.pierTitle.replace(/\s+/g, '')})`}
          />
        </svg>

        {/* Hero Foreground Content */}
        <div className="relative z-10 px-6 sm:px-9 pt-5 pb-11 flex flex-col sm:flex-row sm:items-stretch justify-between gap-4">
          <div className="max-w-2xl">
            <div className="w-24 h-[2.5px] bg-[#f59e0b] mb-2.5" />

            <div className="text-[11px] sm:text-[12px] font-medium tracking-[0.18em] text-[#dbeafe] uppercase">
              {sheet.subtitle}
            </div>

            {/* Giant Ice-Blue Number + Serif Title */}
            <div className="mt-1.5 flex items-baseline gap-3 sm:gap-4 flex-wrap">
              <span className="font-serif text-[64px] sm:text-[86px] font-extrabold leading-[0.88] text-[#8ce0f6] tracking-tight">
                {sheet.pierNumber}
              </span>
              <div>
                <h3 className="font-serif text-[36px] sm:text-[50px] font-bold leading-[0.95] text-white tracking-tight">
                  {sheet.pierTitle}
                </h3>
                {sheet.pierSide && (
                  <div className="font-serif text-[26px] sm:text-[38px] font-bold leading-none text-[#9be7f9] mt-0.5">
                    {sheet.pierSide}
                  </div>
                )}
              </div>
            </div>

            <div className="w-24 h-[2.5px] bg-[#f59e0b] my-2.5" />

            {sheet.bcmMaxHeightNote && (
              <div className="text-[12.5px] sm:text-[13.5px] text-[#e0f2fe] leading-snug">
                {sheet.bcmMaxHeightNote}
              </div>
            )}
            <div className="text-[12.5px] sm:text-[13.5px] text-[#e0f2fe] leading-snug">
              {sheet.measurementNote}
            </div>
          </div>

          {/* Top-Right Integrated Brand Emblem + Bottom-Right Motto */}
          <div className="flex sm:flex-col justify-between items-start sm:items-end shrink-0 gap-3 mb-1">
            <svg
              viewBox="0 0 240 78"
              aria-label={`${sheet.brandPrimary || 'INCHCAPE'} ${sheet.brandSecondary || 'SHIPPING SERVICES'}`}
              className="w-44 sm:w-52 h-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
            >
              <text
                x="12"
                y="48"
                fontFamily="Plus Jakarta Sans, Arial, sans-serif"
                fontWeight="800"
                fontSize="25"
                fill="#ffffff"
                letterSpacing="1"
              >
                {sheet.brandPrimary || 'INCHCAPE'}
              </text>
              <polygon points="103,29 109,43 97,43" fill="#e11d48" />
              <text
                x="42"
                y="64"
                fontFamily="Plus Jakarta Sans, Arial, sans-serif"
                fontWeight="700"
                fontSize="9.5"
                fill="#e11d48"
                letterSpacing="2.4"
              >
                {sheet.brandSecondary || 'SHIPPING SERVICES'}
              </text>
              <path
                d="M164 26 A31 31 0 1 1 196 68"
                fill="none"
                stroke="#ffffff"
                strokeWidth="4.2"
                strokeLinecap="round"
              />
              <path
                d="M169 29 A24 24 0 1 1 194 62"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M174 33 A18 18 0 1 1 191 56"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <polygon points="215,10 203,20 207,24" fill="#e11d48" />
              <path d="M180 34 L204 20 L195 45 L193 33 Z" fill="#ffffff" />
            </svg>

            <div className="hidden sm:block text-right mt-auto">
              <div className="text-[10.5px] font-semibold tracking-[0.14em] text-white uppercase leading-[1.45] drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]">
                {mottoLines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
              <div className="w-16 h-[2.5px] bg-[#f59e0b] ml-auto mt-2" />
            </div>
          </div>
        </div>

        {/* Bottom White Swooping Wave Mask */}
        <svg
          viewBox="0 0 1200 54"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute bottom-[-1px] left-0 w-full h-8 sm:h-10 z-10 pointer-events-none"
        >
          <path
            d="M0,22 C310,-6 740,48 1200,14 L1200,54 L0,54 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* BODY SECTIONS */}
      <div className="px-5 sm:px-9 pt-2 pb-6 space-y-5">
        {/* SECTION 1: NAVIGATION PARAMETERS */}
        <section>
          <h4 className="font-serif text-[20px] sm:text-[23px] font-bold text-[#042447] tracking-tight mb-3">
            Navigation Parameters
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {parameters.map((param, idx) => (
              <div
                key={param.label}
                className="bg-[#eef8fd] border border-[#b9e3f9] rounded-xl px-2.5 py-3 flex flex-col justify-between min-h-[124px]"
              >
                <div className="flex justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#042447] flex items-center justify-center shadow-xs">
                    <ParameterIcon index={idx} />
                  </div>
                </div>
                <div className="my-2 border-l-[2.5px] border-[#f59e0b] pl-2 text-[10.5px] leading-[1.28] text-[#1e3a5f] font-medium">
                  {param.label}
                </div>
                <div className="text-[14px] sm:text-[15px] font-extrabold text-[#042447] tracking-tight tabular-nums leading-tight">
                  {param.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: PRODUCTS AND OPERATING CONDITIONS TABLE */}
        <section>
          <h4 className="font-serif text-[20px] sm:text-[23px] font-bold text-[#042447] tracking-tight mb-2.5">
            Products and Operating Conditions
          </h4>
          <div className="rounded-xl border border-[#b9e3f9] overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[660px]">
              <thead>
                <tr className="bg-[#042447] text-white text-[12px] font-semibold">
                  <th className="py-2.5 px-4 w-[36%]">Product</th>
                  <th className="py-2.5 px-3 text-center w-[10%]">Line</th>
                  <th className="py-2.5 px-3 text-center w-[15%]">Connection type</th>
                  <th className="py-2.5 px-3 text-center w-[11%]">Connection</th>
                  <th className="py-2.5 px-3 text-center w-[14%]">Max. avg./hour</th>
                  <th className="py-2.5 px-3 text-center w-[14%]">Min. avg./hour</th>
                </tr>
              </thead>
              <tbody className="text-[12.5px] text-[#0c2d52]">
                {sheet.conditions.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`${
                      idx % 2 === 0 ? 'bg-[#e3f4fc]' : 'bg-[#f4fbff]'
                    } border-b border-[#cdebfd]`}
                  >
                    <td className="py-2 px-4 font-medium">{row.product}</td>
                    <td className="py-2 px-3 text-center border-l border-[#bae6fd] tabular-nums">
                      {row.line || '—'}
                    </td>
                    <td className="py-2 px-3 text-center border-l border-[#bae6fd]">
                      {row.connectionType || '—'}
                    </td>
                    <td className="py-2 px-3 text-center border-l border-[#bae6fd] tabular-nums">
                      {row.connection || '—'}
                    </td>
                    {row.mergedRateNote ? (
                      <td
                        colSpan={2}
                        className="py-2 px-3 text-center border-l border-[#bae6fd] font-medium"
                      >
                        {row.mergedRateNote}
                      </td>
                    ) : (
                      <>
                        <td className="py-2 px-3 text-center border-l border-[#bae6fd] tabular-nums">
                          {row.maxAvgPerHour || '—'}
                        </td>
                        <td className="py-2 px-3 text-center border-l border-[#bae6fd] tabular-nums">
                          {row.minAvgPerHour || '—'}
                        </td>
                      </>
                    )}
                  </tr>
                ))}

                {/* Filler striped rows matching original sheet proportions */}
                {Array.from({ length: fillerCount }).map((_, fIdx) => {
                  const rowIdx = sheet.conditions.length + fIdx;
                  return (
                    <tr
                      key={`filler-${fIdx}`}
                      className={`${
                        rowIdx % 2 === 0 ? 'bg-[#e3f4fc]' : 'bg-[#f4fbff]'
                      } border-b border-[#cdebfd] last:border-b-0 h-8`}
                    >
                      <td className="py-2 px-4">&nbsp;</td>
                      <td className="py-2 px-3 border-l border-[#bae6fd]">&nbsp;</td>
                      <td className="py-2 px-3 border-l border-[#bae6fd]">&nbsp;</td>
                      <td className="py-2 px-3 border-l border-[#bae6fd]">&nbsp;</td>
                      <td className="py-2 px-3 border-l border-[#bae6fd]">&nbsp;</td>
                      <td className="py-2 px-3 border-l border-[#bae6fd]">&nbsp;</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* NAVY FOOTER STRIP */}
      <footer className="pier-print-footer bg-[#042447] text-white px-5 sm:px-9 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
        <div className="border-l-[3px] border-[#f59e0b] pl-3">
          <div className="font-semibold tracking-[0.09em] text-[#dbeafe] uppercase">
            {sheet.footerLocation || 'PORT OF COATZACOALCOS, VERACRUZ'}
          </div>
          <div className="font-serif text-[12.5px] text-white">
            {sheet.footerOffice ||
              'ISS Marine Services Mexico SA de CV. / Coatzacoalcos Office'}
          </div>
        </div>
        <div className="sm:text-right text-[#cbd5e1] text-[10px] tracking-[0.06em] uppercase leading-snug">
          <div className="font-semibold text-white">
            {sheet.footerNoticeTitle ||
              'INFORMATION RESERVED FOR STRATEGIC CLIENTS.'}
          </div>
          <div>
            {sheet.footerNoticeBody ||
              'ALL OPERATIONS MUST BE CONFIRMED WITH CURRENT CONDITIONS AND PRIOR OPERATIONAL COORDINATION.'}
          </div>
        </div>
      </footer>
    </article>
  );
}
