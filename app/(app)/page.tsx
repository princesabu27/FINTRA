import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile, accounts, and recent transactions in parallel
  const [
    { data: profile },
    { data: accounts },
    { data: expenses },
    { data: incomes },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, profile_pic")
      .eq("user_id", user?.id ?? "")
      .single(),
    supabase
      .from("accounts")
      .select("account_id, account_name, balance_amount, account_type, currency_code, is_active")
      .eq("user_id", user?.id ?? "")
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("expense_records")
      .select(
        "expense_record_id, expense_name, expense_amount, currency_code, transaction_date, account_id, description, expense_categories(expense_category_name)"
      )
      .eq("user_id", user?.id ?? "")
      .order("transaction_date", { ascending: false })
      .limit(15),
    supabase
      .from("income_records")
      .select(
        "income_record_id, income_name, income_amount, currency_code, transaction_date, account_id, income_description, income_categories(income_catagory_name)"
      )
      .eq("user_id", user?.id ?? "")
      .order("transaction_date", { ascending: false })
      .limit(15),
  ]);

  const transactions = [
    ...(expenses ?? []).map((e) => ({
      id: e.expense_record_id,
      name: e.expense_name,
      amount: Number(e.expense_amount),
      type: "expense" as const,
      category_name:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e.expense_categories as any)?.expense_category_name ?? "Other",
      currency_code: e.currency_code,
      transaction_date: e.transaction_date,
      account_id: e.account_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      description: (e as any).description ?? null,
    })),
    ...(incomes ?? []).map((i) => ({
      id: i.income_record_id,
      name: i.income_name,
      amount: Number(i.income_amount),
      type: "income" as const,
      category_name:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (i.income_categories as any)?.income_catagory_name ?? "Other",
      currency_code: i.currency_code,
      transaction_date: i.transaction_date,
      account_id: i.account_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      description: (i as any).income_description ?? null,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.transaction_date).getTime() -
        new Date(a.transaction_date).getTime()
    )
    .slice(0, 20);

  return (
    <DashboardClient
      firstName={profile?.first_name ?? "there"}
      lastName={profile?.last_name ?? ""}
      profilePic={profile?.profile_pic ?? null}
      initialAccounts={accounts ?? []}
      initialTransactions={transactions}
    />
  );
}
