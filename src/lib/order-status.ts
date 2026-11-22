const labels: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  confirmed: "Accepted",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

export function formatOrderStatus(status?: string | null): string {
  if (!status) return "Pending";
  return labels[status] ?? status.replaceAll("_", " ");
}
