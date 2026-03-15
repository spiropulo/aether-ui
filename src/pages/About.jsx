const team = [
  { name: 'Alex Rivera', role: 'CEO & Co-founder', initials: 'AR' },
  { name: 'Jordan Lee', role: 'CTO & Co-founder', initials: 'JL' },
  { name: 'Sam Chen', role: 'Head of Design', initials: 'SC' },
  { name: 'Morgan Davis', role: 'Head of Engineering', initials: 'MD' },
]

const values = [
  {
    title: 'Transparency first',
    description:
      'We believe in open communication — with our team, our customers, and our community. No black boxes.',
  },
  {
    title: 'Craft over speed',
    description:
      'We take the time to do things right. Quality is not a feature — it is the foundation.',
  },
  {
    title: 'User obsession',
    description:
      'Every decision starts with the user. We listen closely and ship what actually makes a difference.',
  },
  {
    title: 'Bias to action',
    description:
      'We move fast, take ownership, and iterate. Waiting for perfect is the enemy of better.',
  },
]

export default function About() {
  return (
    <main className="pt-16">
      {/* Header */}
      <section className="bg-gradient-to-br from-indigo-950 to-gray-900 py-28 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
            Our story
          </h1>
          <p className="mt-6 text-lg text-indigo-200/80 leading-relaxed">
            Aether was founded in 2022 by a team of engineers frustrated with the state of developer
            infrastructure. We set out to build the platform we always wished existed.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Our mission
            </h2>
            <p className="mt-5 text-gray-500 leading-relaxed">
              We&apos;re on a mission to democratize world-class infrastructure. The tools that power
              the internet&apos;s largest companies should be accessible to every team — from a solo
              developer to a Fortune 500.
            </p>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Aether abstracts away the hard parts of building, deploying, and scaling software so
              you can focus on creating value for your users.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {values.map(({ title, description }) => (
              <div
                key={title}
                className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100"
              >
                <h3 className="text-sm font-semibold text-indigo-700 mb-2">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Meet the team
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            We&apos;re a small, focused team that cares deeply about craft.
          </p>
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-8">
            {team.map(({ name, role, initials }) => (
              <div key={name} className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {initials}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{name}</p>
                  <p className="text-sm text-gray-500">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
