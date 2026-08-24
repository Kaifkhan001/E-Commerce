export function ContentPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="container-brand py-14 md:py-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display mb-8 text-3xl">{title}</h1>
        <div className="space-y-5 text-sm leading-relaxed text-charcoal-soft [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-lg [&_h2]:text-charcoal">
          {children}
        </div>
      </div>
    </div>
  );
}
