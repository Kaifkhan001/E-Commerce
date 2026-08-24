export default function Loading() {
  return (
    <div className="container-brand py-8 md:py-14">
      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <div className="aspect-[4/5] animate-pulse bg-ivory-deep" />
        <div>
          <div className="h-8 w-2/3 animate-pulse bg-ivory-deep" />
          <div className="mt-4 h-5 w-1/4 animate-pulse bg-ivory-deep" />
          <div className="mt-8 h-12 w-full animate-pulse bg-ivory-deep" />
        </div>
      </div>
    </div>
  );
}
