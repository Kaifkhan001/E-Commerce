export type ServiceabilityResult =
  | {
      configured: true;
      serviceable: boolean;
      estimatedDays: number | null;
      codAvailable: boolean;
      courierName: string | null;
    }
  | {
      configured: false;
      // Set when a provider IS configured but the live check itself failed
      // (network/auth error) — distinct from "no provider configured at all".
      error?: string;
    };
