import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-brand flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-display text-6xl text-sand">404</p>
      <h1 className="font-display mt-4 text-2xl">We couldn&apos;t find that page.</h1>
      <p className="mt-2 max-w-sm text-charcoal-soft">
        The page you&apos;re looking for may have moved or no longer exists.
      </p>
      <LinkButton href="/shop" className="mt-8">
        Shop Bags
      </LinkButton>
    </div>
  );
}
