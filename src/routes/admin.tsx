import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminPanel } from "@/components/generated/AdminPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";

const ADMIN_EMAIL = "minusflowofficial@gmail.com";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel - MegaFlow" },
      { name: "description", content: "Administration dashboard for MegaFlow." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminGate,
});

function AdminGate() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { data: sess } = await supabase.auth.getSession();
      const email = sess.session?.user.email?.toLowerCase();
      const uid = sess.session?.user.id;
      let ok = false;
      if (email === ADMIN_EMAIL && uid) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid)
          .eq("role", "admin")
          .maybeSingle();
        ok = !!data;
      }
      if (!mounted) return;
      setIsAdmin(ok);
      setReady(true);
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin) return <AdminOtpLogin />;
  return <AdminPanel />;
}

function AdminOtpLogin() {
  const [method, setMethod] = useState<"password" | "otp">("password");
  const [step, setStep] = useState<"send" | "verify">("send");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password,
      });
      if (error) throw error;
      if (!data.session) throw new Error("No session returned");
      toast.success("Signed in as admin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid password");
    } finally {
      setLoading(false);
    }
  };

  const sendCode = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: ADMIN_EMAIL,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      toast.success(`OTP sent to ${ADMIN_EMAIL}`);
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="mt-3 text-xl font-extrabold">Admin Access</h1>
          <p className="text-sm text-muted-foreground">
            Sign in as<br />
            <span className="font-medium text-foreground">{ADMIN_EMAIL}</span>
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-xs font-bold">
          <button
            onClick={() => { setMethod("password"); }}
            className={`rounded-md py-1.5 transition-colors ${method === "password" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Password
          </button>
          <button
            onClick={() => { setMethod("otp"); setStep("send"); }}
            className={`rounded-md py-1.5 transition-colors ${method === "otp" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Email OTP
          </button>
        </div>

        {method === "password" ? (
          <form onSubmit={passwordLogin} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoFocus
                placeholder="Admin password"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading || password.length < 6}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : step === "send" ? (
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
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-center font-mono text-lg tracking-widest"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Enter Admin"}
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
      </div>
    </div>
  );
}
