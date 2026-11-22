import { DashboardAccess } from "@/components/dashboard-access";
import { PaymentView } from "@/components/payment/payment-view";

function toIdArray(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string | string[]; orderIds?: string | string[] }>;
}) {
  const params = await searchParams;
  const orderIds = [
    ...toIdArray(params.orderIds),
    ...toIdArray(params.orderId),
  ];

  return (
    <DashboardAccess role="customer">
      <PaymentView orderIds={orderIds} />
    </DashboardAccess>
  );
}
