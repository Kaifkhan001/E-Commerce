import Image from "next/image";

// Real product photography for the lifestyle strip.
const photoFiles = [
  "Product-Image-01.jpeg",
  "Product-Image-02.jpeg",
  "Product-Image-03.jpeg",
  "Product-Image-04.jpeg",
  "Product-Image-05.jpeg",
  "Product-Image-06.jpeg",
  "Product-Image-07.jpeg",
];

export function Marquee() {
  // Duplicate the strip once so the CSS animation (translateX -50%) loops seamlessly.
  const strip = [...photoFiles, ...photoFiles];

  return (
    <section aria-label="Bag lifestyle gallery" className="overflow-hidden border-y border-border bg-ivory-deep py-6">
      <div className="flex w-max animate-marquee gap-4">
        {strip.map((file, i) => (
          <div key={`${file}-${i}`} className="relative h-48 w-36 shrink-0 overflow-hidden md:h-64 md:w-48">
            <Image
              src={`/images/${file}`}
              alt=""
              aria-hidden="true"
              fill
              sizes="200px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
