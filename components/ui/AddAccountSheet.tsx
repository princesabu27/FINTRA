"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Loader2, Wallet, CreditCard, PiggyBank, Building2, TrendingUp, Banknote, Check, ChevronDown } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { useAccountTypes } from "@/hooks/useAccountTypes";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useCountries } from "@/hooks/useCountries";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const TYPE_META: Record<string, { icon: React.ElementType; color: string }> = {
  savings:       { icon: PiggyBank,   color: "#1B4FFF" },
  checking:      { icon: Building2,   color: "#3B82F6" },
  credit_card:   { icon: CreditCard,  color: "#EF4444" },
  investment:    { icon: TrendingUp,  color: "#22C55E" },
  fixed_deposit: { icon: Banknote,    color: "#F59E0B" },
  cash:          { icon: Wallet,      color: "#8B5CF6" },
  wallet:        { icon: Wallet,      color: "#8B5CF6" },
  loan:          { icon: CreditCard,  color: "#F97316" },
};

function getTypeMeta(type: string) {
  return TYPE_META[type.toLowerCase()] ?? { icon: Wallet, color: "#4A6FA5" };
}

interface AddAccountSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddAccountSheet({ isOpen, onClose }: AddAccountSheetProps) {
  const [name, setName]                   = useState("");
  const [balance, setBalance]             = useState("");
  const [selectedType, setSelectedType]   = useState<string | null>(null);
  const [currencyCode, setCurrencyCode]   = useState("");
  const [countryCode, setCountryCode]     = useState("");
  const [isBudgetable, setIsBudgetable]   = useState(false);
  const [loading, setLoading]             = useState(false);

  const { data: accountTypes,  isLoading: loadingTypes      } = useAccountTypes();
  const { data: currencies = [], isLoading: loadingCurrencies } = useCurrencies();
  const { data: countries  = [], isLoading: loadingCountries  } = useCountries();
  const queryClient = useQueryClient();

  // Set defaults once data loads
  useEffect(() => {
    if (currencies.length > 0 && !currencyCode) {
      setCurrencyCode(currencies.find((c) => c.currency_code === "INR")?.currency_code ?? currencies[0].currency_code);
    }
  }, [currencies, currencyCode]);

  useEffect(() => {
    if (countries.length > 0 && !countryCode) {
      setCountryCode(countries.find((c) => c.country_code === "IN")?.country_code ?? countries[0].country_code);
    }
  }, [countries, countryCode]);

  const selectedCurrency = currencies.find((c) => c.currency_code === currencyCode);

  const reset = useCallback(() => {
    setName("");
    setBalance("");
    setSelectedType(null);
    setCurrencyCode("");
    setCountryCode("");
    setIsBudgetable(false);
  }, []);

  const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim())   { toast.error("Enter an account name"); return; }
    if (!selectedType)  { toast.error("Select an account type"); return; }
    if (!currencyCode)  { toast.error("Select a currency"); return; }
    if (!countryCode)   { toast.error("Select the account holding country"); return; }

    const numBalance = parseFloat(balance || "0");

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); setLoading(false); return; }

    const { error } = await supabase.from("accounts").insert({
      user_id: user.id,
      account_name: name.trim(),
      balance_amount: numBalance,
      account_type: selectedType,
      currency_code: currencyCode,
      account_holding_country: countryCode,
      is_budgetable: isBudgetable,
      is_active: true,
    });

    setLoading(false);
    if (error) { toast.error(error.message); return; }

    toast.success("Account added!");
    await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    reset();
    onClose();
  }, [name, balance, selectedType, currencyCode, countryCode, isBudgetable, queryClient, reset, onClose]);

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="New Account" fullHeight={false}>
      <div className="flex flex-col gap-5 px-5 pt-2 pb-10">

        {/* Account name */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">Account Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. HDFC Savings"
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Currency + Country row */}
        <div className="flex gap-3">
          {/* Currency */}
          <div className="flex-1">
            <label className="text-pale text-xs mb-2 block uppercase tracking-wide">Currency</label>
            {loadingCurrencies ? (
              <div className="h-12 rounded-2xl bg-surface animate-pulse" />
            ) : (
              <div className="relative">
                <select
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full bg-surface border border-border rounded-2xl px-3 py-3.5 text-white text-sm focus:outline-none focus:border-brand appearance-none transition-colors"
                >
                  {currencies.map((c) => (
                    <option key={c.currency_code} value={c.currency_code} className="bg-card">
                      {c.currency_code} ({c.currency_symbol})
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
            )}
            {selectedCurrency && (
              <p className="text-muted text-[10px] mt-1 px-1 truncate">{selectedCurrency.currency_name}</p>
            )}
          </div>

          {/* Account holding country */}
          <div className="flex-1">
            <label className="text-pale text-xs mb-2 block uppercase tracking-wide">Country</label>
            {loadingCountries ? (
              <div className="h-12 rounded-2xl bg-surface animate-pulse" />
            ) : (
              <div className="relative">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full bg-surface border border-border rounded-2xl px-3 py-3.5 text-white text-sm focus:outline-none focus:border-brand appearance-none transition-colors"
                >
                  {countries.map((c) => (
                    <option key={c.country_code} value={c.country_code} className="bg-card">
                      {c.country_code} — {c.country_name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
            )}
            <p className="text-muted text-[10px] mt-1 px-1">Holding country</p>
          </div>
        </div>

        {/* Opening balance */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">Opening Balance</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pale font-semibold text-sm">
              {selectedCurrency?.currency_symbol ?? "₹"}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0"
              className="w-full bg-surface border border-border rounded-2xl pl-9 pr-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        {/* Account type */}
        <div>
          <label className="text-pale text-xs mb-3 block uppercase tracking-wide">Account Type</label>
          {loadingTypes ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-surface animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {(accountTypes ?? []).map((t) => {
                const { icon: Icon, color } = getTypeMeta(t.account_type);
                const isSelected = selectedType === t.account_type;
                return (
                  <motion.button
                    key={t.account_type}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setSelectedType(t.account_type)}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all",
                      isSelected ? "border-white bg-white/5" : "border-border bg-surface"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand flex items-center justify-center"
                      >
                        <Check size={10} className="text-white" />
                      </motion.div>
                    )}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: color + "25", color }}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="text-[11px] font-medium text-white capitalize text-center leading-tight">
                      {t.account_type.replace(/_/g, " ")}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Budgetable toggle */}
        <div className="flex items-center justify-between bg-surface border border-border rounded-2xl px-4 py-3.5">
          <div>
            <p className="text-white text-sm font-medium">Include in budgets</p>
            <p className="text-pale text-xs mt-0.5">Count this account's spending toward budgets</p>
          </div>
          <button
            onClick={() => setIsBudgetable((b) => !b)}
            className={cn(
              "w-12 h-6 rounded-full transition-colors duration-200 relative shrink-0",
              isBudgetable ? "bg-brand" : "bg-border"
            )}
          >
            <motion.div
              animate={{ x: isBudgetable ? 24 : 2 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
            />
          </button>
        </div>

        {/* Submit */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-brand py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 shadow-lg shadow-brand/30 disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Add Account"}
        </motion.button>
      </div>
    </BottomSheet>
  );
}
