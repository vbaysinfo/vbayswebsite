import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="card w-full max-w-sm p-8">
        <p className="eyebrow">Admin</p>
        <h1 className="mt-3 text-3xl font-medium">Sign in</h1>
        <p className="mt-2 text-sm text-muted">Leads, social content and campaigns.</p>
        <LoginForm />
      </div>
    </div>
  );
}
