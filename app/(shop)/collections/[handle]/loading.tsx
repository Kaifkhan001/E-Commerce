export default function Loading() {
  return (
    <div className="container-brand py-10 md:py-14">
      <div className="mb-8 h-8 w-40 animate-pulse bg-ivory-deep" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[4/5] animate-pulse bg-ivory-deep" />
            <div className="mt-3 h-3 w-3/4 animate-pulse bg-ivory-deep" />
            <div className="mt-2 h-3 w-1/3 animate-pulse bg-ivory-deep" />
          </div>
        ))}
      </div>
    </div>
  );
}
