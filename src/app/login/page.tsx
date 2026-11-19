import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-[75vh] place-items-center bg-[#F8F7F3] px-5 py-14">
      <AuthForm mode="login" />
    </main>
  );
}
