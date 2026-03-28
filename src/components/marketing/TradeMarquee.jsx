const TRADES = [
  'General contractors',
  'Landscaping & lawn care',
  'Plumbing & HVAC',
  'Electrical',
  'Painting & drywall',
  'Roofing',
  'Cleaning & janitorial',
  'Tutoring & coaching',
  'Pet services',
  'Handyman',
  'Pool & spa',
  'Property management',
  'Remodeling',
  'Flooring',
  'Appliance repair',
]

export default function TradeMarquee() {
  const doubled = [...TRADES, ...TRADES]
  return (
    <div className="relative overflow-hidden py-3 border-y border-white/10 bg-black/20">
      <div className="marketing-marquee-track flex gap-3 w-max">
        {doubled.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="inline-flex shrink-0 items-center rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-indigo-100/90 backdrop-blur-sm"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
