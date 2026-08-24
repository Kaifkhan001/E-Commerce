"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const [value, setValue] = useState(initialQuery);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(value.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative">
      <label htmlFor="search-input" className="sr-only">
        Search bags
      </label>
      <input
        id="search-input"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search bags…"
        autoFocus
        className="w-full border border-border bg-ivory py-3 pl-4 pr-11 text-sm focus:border-charcoal"
      />
      <button type="submit" aria-label="Search" className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-60">
        <Search size={18} />
      </button>
    </form>
  );
}
