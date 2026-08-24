import type { BagSpecs } from "@/types/shopify";

const LABELS: Record<keyof BagSpecs, string> = {
  capacityLiters: "Capacity",
  material: "Material",
  weightGrams: "Weight",
  dimensions: "Dimensions",
  laptopCompatibility: "Laptop Compatibility",
  waterResistance: "Water Resistance",
  care: "Care",
  warranty: "Warranty",
  features: "Features",
  useCases: "Best For",
};

function formatValue(key: keyof BagSpecs, specs: BagSpecs): string | null {
  const value = specs[key];
  if (value == null) return null;
  if (key === "capacityLiters") return `${value}L`;
  if (key === "weightGrams") return `${(Number(value) / 1000).toFixed(2)} kg`;
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function ProductSpecs({ specs }: { specs: BagSpecs }) {
  const rows = (Object.keys(LABELS) as (keyof BagSpecs)[])
    .map((key) => ({ key, label: LABELS[key], value: formatValue(key, specs) }))
    .filter((row) => row.value !== null);

  if (rows.length === 0) return null;

  return (
    <div className="border-t border-border pt-6">
      <h2 className="font-display mb-4 text-lg">Specifications</h2>
      <dl className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-[1fr_2fr] gap-4 py-2.5 text-sm">
            <dt className="text-charcoal-soft">{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
