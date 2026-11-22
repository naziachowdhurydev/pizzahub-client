export function todayForDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isValidDeliveryDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateDeliveryDate(value: string): string | null {
  if (!isValidDeliveryDate(value)) return "Choose a valid delivery date.";
  if (value < todayForDateInput()) return "Delivery date cannot be in the past.";
  return null;
}
