"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Edit3, Check, X, LogOut, ChevronRight,
  BarChart2, Wallet, Target, PieChart, Shield, Sparkles, Tag, Sun, Moon,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAccounts, useTotalBalance } from "@/hooks/useAccounts";
import { useGoals } from "@/hooks/useGoals";
import { useBudgets } from "@/hooks/useBudgets";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const { data: accounts = [] } = useAccounts();
  const { data: goals = [] } = useGoals();
  const { data: budgets = [] } = useBudgets();
  const totalBalance = useTotalBalance(accounts);

  const { theme, toggle: toggleTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const { mutateAsync: updateProfile, isPending: saving } = useUpdateProfile();

  const startEdit = useCallback(() => {
    if (!profile) return;
    setFirstName(profile.first_name);
    setLastName(profile.last_name);
    setUsername(profile.username);
    setEditing(true);
  }, [profile]);

  const saveEdit = useCallback(async () => {
    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      toast.error("All fields are required");
      return;
    }
    try {
      await updateProfile({ first_name: firstName.trim(), last_name: lastName.trim(), username: username.trim() });
      toast.success("Profile updated");
      setEditing(false);
    } catch (err) {
      toast.error(String(err));
    }
  }, [firstName, lastName, username, updateProfile]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/sign-in");
  }, [router]);

  const activeGoals = goals.filter((g) => !g.is_achieved).length;
  const achievedGoals = goals.filter((g) => g.is_achieved).length;
  const activeBudgets = budgets.length;
  const overBudget = budgets.filter((b) => b.monthly && b.monthly.used_amount > b.monthly.amount).length;

  const initials = profile
    ? `${profile.first_name[0] ?? ""}${profile.last_name[0] ?? ""}`.toUpperCase()
    : "?";

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-6">

        {/* Hero section */}
        <div className="px-4 pt-8 pb-5 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-3xl bg-brand/20 border-2 border-brand/40 flex items-center justify-center">
              {profile?.profile_pic ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.profile_pic} alt="avatar" className="w-full h-full rounded-3xl object-cover" />
              ) : (
                <span className="text-brand text-2xl font-bold">{initials}</span>
              )}
            </div>
            {!editing && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={startEdit}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand flex items-center justify-center shadow-lg"
              >
                <Edit3 size={13} className="text-white" />
              </motion.button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="w-full flex flex-col gap-3"
              >
                <div className="flex gap-2">
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand transition-colors"
                  />
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand transition-colors"
                  />
                </div>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand transition-colors"
                />
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={saveEdit}
                    disabled={saving}
                    className="flex-1 bg-brand py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    <Check size={15} />
                    {saving ? "Saving…" : "Save"}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditing(false)}
                    className="flex-1 bg-surface border border-border py-2.5 rounded-xl text-pale text-sm font-semibold flex items-center justify-center gap-1.5"
                  >
                    <X size={15} />
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <h2 className="text-white text-xl font-bold">
                  {profile ? `${profile.first_name} ${profile.last_name}` : "—"}
                </h2>
                <p className="text-pale text-sm mt-0.5">@{profile?.username ?? "—"}</p>
                <p className="text-muted text-xs mt-1">{profile?.default_currency ?? "INR"}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Net worth banner */}
        <div className="mx-4 bg-brand/10 border border-brand/20 rounded-2xl px-4 py-4 flex items-center justify-between mb-4">
          <div>
            <p className="text-pale text-xs uppercase tracking-wide mb-1">Net Worth</p>
            <p className="text-white text-2xl font-bold">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand/20 flex items-center justify-center">
            <Wallet size={22} className="text-brand" />
          </div>
        </div>

        {/* Stats grid */}
        <div className="mx-4 grid grid-cols-2 gap-3 mb-4">
          <StatCard
            icon={<Wallet size={16} className="text-brand" />}
            label="Accounts"
            value={String(accounts.length)}
            sub="active"
            href="/accounts"
          />
          <StatCard
            icon={<Target size={16} className="text-income" />}
            label="Goals"
            value={String(activeGoals)}
            sub={achievedGoals > 0 ? `${achievedGoals} achieved` : "active"}
            href="/goals"
          />
          <StatCard
            icon={<PieChart size={16} className="text-warning" />}
            label="Budgets"
            value={String(activeBudgets)}
            sub={overBudget > 0 ? `${overBudget} over limit` : "on track"}
            href="/budgets"
          />
          <StatCard
            icon={<BarChart2 size={16} className="text-pale" />}
            label="Statistics"
            value="View"
            sub="charts & trends"
            href="/statistics"
          />
        </div>

        {/* Menu sections */}
        <div className="mx-4 flex flex-col gap-3">
          <MenuSection title="Features">
            <MenuItem icon={<Sparkles size={16} className="text-brand" />} label="AI Insights" href="/insights" />
            <MenuItem icon={<BarChart2 size={16} className="text-pale" />} label="Statistics" href="/statistics" />
            <MenuItem icon={<Tag size={16} className="text-pale" />} label="Categories" href="/categories" />
          </MenuSection>

          <MenuSection title="Account">
            <MenuItem icon={<User size={16} className="text-pale" />} label="Edit Profile" onPress={startEdit} />
            <MenuItem icon={<Shield size={16} className="text-pale" />} label="Currency" value={profile?.default_currency ?? "INR"} />
            <MenuItemToggle
              icon={theme === "dark"
                ? <Moon size={16} className="text-pale" />
                : <Sun size={16} className="text-warning" />}
              label={theme === "dark" ? "Dark Mode" : "Light Mode"}
              value={theme === "dark" ? "Dark" : "Light"}
              onPress={toggleTheme}
            />
          </MenuSection>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-3 px-4 py-4 bg-expense/10 border border-expense/20 rounded-2xl text-expense font-semibold text-sm disabled:opacity-60"
          >
            <LogOut size={18} />
            {signingOut ? "Signing out…" : "Sign Out"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, href }: {
  icon: React.ReactNode; label: string; value: string; sub: string; href: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="bg-card border border-border rounded-2xl px-4 py-3.5 flex flex-col gap-2"
      >
        <div className="flex items-center justify-between">
          {icon}
          <ChevronRight size={14} className="text-muted" />
        </div>
        <div>
          <p className="text-white text-xl font-bold leading-none">{value}</p>
          <p className="text-pale text-[10px] mt-1 uppercase tracking-wide">{label}</p>
          <p className="text-muted text-[10px]">{sub}</p>
        </div>
      </motion.div>
    </Link>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <p className="text-pale text-[10px] uppercase tracking-wide px-4 pt-3 pb-1">{title}</p>
      {children}
    </div>
  );
}

function MenuItem({ icon, label, href, value, onPress }: {
  icon: React.ReactNode; label: string; href?: string; value?: string; onPress?: () => void;
}) {
  const inner = (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 px-4 py-3.5 border-t border-border/50"
    >
      <div className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="flex-1 text-white text-sm">{label}</span>
      {value ? (
        <span className="text-pale text-xs">{value}</span>
      ) : (
        <ChevronRight size={15} className="text-muted" />
      )}
    </motion.div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  if (onPress) return <button onClick={onPress} className="w-full text-left">{inner}</button>;
  return inner;
}

function MenuItemToggle({ icon, label, value, onPress }: {
  icon: React.ReactNode; label: string; value: string; onPress: () => void;
}) {
  return (
    <button onClick={onPress} className="w-full text-left">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-3 px-4 py-3.5 border-t border-border/50"
      >
        <div className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className="flex-1 text-white text-sm">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-pale text-xs">{value}</span>
          <div
            className="w-10 h-5 rounded-full relative transition-colors duration-300"
            style={{ background: value === "Dark" ? "rgba(108,99,255,0.4)" : "rgba(255,182,39,0.4)" }}
          >
            <motion.div
              animate={{ x: value === "Dark" ? 2 : 22 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
            />
          </div>
        </div>
      </motion.div>
    </button>
  );
}

function ProfileSkeleton() {
  return (
    <div className="h-full flex flex-col items-center pt-12 px-4 gap-4">
      <div className="w-20 h-20 rounded-3xl bg-surface animate-pulse" />
      <div className="h-5 w-40 rounded bg-surface animate-pulse" />
      <div className="h-3 w-24 rounded bg-surface animate-pulse" />
      <div className="w-full h-20 rounded-2xl bg-surface animate-pulse mt-2" />
      <div className="w-full grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-surface animate-pulse" />
        ))}
      </div>
    </div>
  );
}
