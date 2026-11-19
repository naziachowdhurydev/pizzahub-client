import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="grid min-h-[75vh] place-items-center bg-background px-5 py-14">
      <AuthForm mode="register" />
    </main>
  );
}
