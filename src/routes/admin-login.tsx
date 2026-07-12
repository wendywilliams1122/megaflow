import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

const ADMIN_EMAIL = "minusflowofficial@gmail.com";

export const Route = createFileRoute("/admin-login")({
  component: AdminLoginPage,
  head: () => ({
    meta: [
      { title: "Admin Login — MegaFlow" },
      { name: "description", content: "Secure OTP admin sign-in." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"send" | "verify">("send");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: ADMIN_EMAIL,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      toast.success(`Code sent to ${ADMIN_EMAIL}`);
      setStep("verify");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: ADMIN_EMAIL,
        token: otp.trim(),
        type: "email",
      });
      if (error) throw error;
      if (!data.session) throw new Error("No session returned");
      toast.success("Signed in as admin");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="mt-3 text-xl font-extrabold">Admin Login</h1>
          <p className="text-center text-sm text-muted-foreground">
            One-time code will be sent to<br />
            <span className="font-medium text-foreground">{ADMIN_EMAIL}</span>
          </p>
        </div>

        {step === "send" ? (
          <button
            onClick={sendCode}
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send OTP to admin email"}
          </button>
        ) : (
          <form onSubmit={verify} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Enter 6-digit code</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoFocus
                required
                minLength={6}
                maxLength={6}
                placeholder="123456"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-center text-lg font-mono tracking-widest"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Sign in"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("send"); setOtp(""); }}
              className="w-full text-xs text-muted-foreground hover:underline"
            >
              Resend code
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
