"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

export function SortSelect({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "featured";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value === "featured") params.delete("sort");
    else params.set("sort", e.target.value);
    router.push(`${basePath}${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="text-sm">
      <label htmlFor="sort" className="mr-2 text-charcoal-soft">
        Sort
      </label>
      <select id="sort" value={current} onChange={handleChange} className="border border-border bg-ivory px-3 py-2">
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
