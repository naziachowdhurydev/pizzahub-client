import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const params = await searchParams;
  const callbackUrl = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0]
    : params.callbackUrl;

  return (
    <main className="grid min-h-[75vh] place-items-center bg-background px-5 py-14">
      <AuthForm callbackUrl={callbackUrl} />
    </main>
  );
}
