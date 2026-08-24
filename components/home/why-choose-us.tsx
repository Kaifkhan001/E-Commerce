const points = [
  { title: "In-house manufacturing", body: "We build every bag ourselves, so quality control happens at the source." },
  { title: "Considered materials", body: "Fabrics and hardware chosen for how they hold up, not just how they photograph." },
  { title: "Easy returns", body: "Straightforward returns and exchanges — see our returns policy for details." },
  { title: "Real support", body: "A team that actually answers when something needs fixing." },
];

export function WhyChooseUs() {
  return (
    <section className="border-y border-border bg-ivory-deep py-16 md:py-24">
      <div className="container-brand">
        <h2 className="font-display mb-10 text-2xl md:text-3xl">Why Aramis</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((p) => (
            <div key={p.title}>
              <h3 className="mb-2 text-sm font-medium tracking-wide">{p.title}</h3>
              <p className="text-sm text-charcoal-soft">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
