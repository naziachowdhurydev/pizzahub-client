import { DashboardAccess } from "@/components/dashboard-access";
import { PaymentView } from "@/components/payment/payment-view";

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string | string[] }>;
}) {
  const params = await searchParams;
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;

  return (
    <DashboardAccess role="customer">
      <PaymentView orderId={orderId} />
    </DashboardAccess>
  );
}
