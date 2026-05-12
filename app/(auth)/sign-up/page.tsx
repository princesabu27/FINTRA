"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "", lastName: "", username: "", email: "", password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error || !data.user) {
      setLoading(false);
      toast.error(error?.message ?? "Sign up failed");
      return;
    }

    // Insert profile
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: data.user.id,
      first_name: form.firstName,
      last_name: form.lastName,
      username: form.username,
      default_currency: "INR",
    });

    setLoading(false);

    if (profileError) {
      toast.error("Account created but profile setup failed. Please sign in.");
    } else {
      toast.success("Account created!");
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center shadow-lg shadow-brand/40">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
        <p className="text-pale text-sm mb-6">Start tracking your finances with Auro</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-pale text-xs mb-1.5 block">First name</label>
              <input
                type="text" value={form.firstName} onChange={set("firstName")}
                placeholder="John" required
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="text-pale text-xs mb-1.5 block">Last name</label>
              <input
                type="text" value={form.lastName} onChange={set("lastName")}
                placeholder="Doe" required
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-pale text-xs mb-1.5 block">Username</label>
            <input
              type="text" value={form.username} onChange={set("username")}
              placeholder="johndoe" required
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          <div>
            <label className="text-pale text-xs mb-1.5 block">Email</label>
            <input
              type="email" value={form.email} onChange={set("email")}
              placeholder="you@example.com" required
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          <div>
            <label className="text-pale text-xs mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} value={form.password} onChange={set("password")}
                placeholder="Min 6 characters" required minLength={6}
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors pr-12"
              />
              <button type="button" onClick={() => setShowPw((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
            className="mt-2 w-full bg-brand text-white font-semibold rounded-2xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-brand/30 disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : (<>Create account <ChevronRight size={18} /></>)}
          </motion.button>
        </form>

        <p className="text-center text-pale text-sm mt-6">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-brand font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
