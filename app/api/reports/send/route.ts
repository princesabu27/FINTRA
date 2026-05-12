import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { Resend } from "resend";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const BRAND   = { argb: "FF6C63FF" };
const INCOME  = { argb: "FF00E5A0" };
const EXPENSE = { argb: "FFFF5C7A" };
const HEADER_FONT = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
const THIN_BORDER: ExcelJS.Border = { style: "thin", color: { argb: "FFE2E8F0" } };
const ALL_BORDERS = { top: THIN_BORDER, left: THIN_BORDER, bottom: THIN_BORDER, right: THIN_BORDER };

function headerFill(argb: ExcelJS.Color): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: argb };
}

function applyHeaderRow(row: ExcelJS.Row, fill: ExcelJS.Fill) {
  row.font = HEADER_FONT;
  row.fill = fill;
  row.alignment = { vertical: "middle", horizontal: "center" };
  row.eachCell((cell) => { cell.border = ALL_BORDERS; });
}

function styleDataRow(row: ExcelJS.Row) {
  row.eachCell((cell) => { cell.border = ALL_BORDERS; cell.alignment = { vertical: "middle" }; });
}

async function buildWorkbook(data: ReportData, monthLabel: string): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Fintra";
  wb.created = new Date();

  // ── Summary ──────────────────────────────────────────────────────────────
  const summary = wb.addWorksheet("Summary");
  summary.columns = [
    { header: "Metric", key: "metric", width: 28 },
    { header: "Value",  key: "value",  width: 22 },
  ];
  applyHeaderRow(summary.getRow(1), headerFill(BRAND));

  const totalIncome  = data.income.reduce((s, r) => s + r.amount, 0);
  const totalExpense = data.expenses.reduce((s, r) => s + r.amount, 0);
  const netSavings   = totalIncome - totalExpense;
  const savingsRate  = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) + "%" : "N/A";

  const summaryRows = [
    ["Report Period",   monthLabel],
    ["Total Income",    totalIncome],
    ["Total Expenses",  totalExpense],
    ["Net Savings",     netSavings],
    ["Savings Rate",    savingsRate],
    ["No. of Accounts", data.accounts.length],
    ["Transactions",    data.income.length + data.expenses.length],
  ];

  summaryRows.forEach(([metric, value], i) => {
    const row = summary.addRow({ metric, value });
    if (typeof value === "number") {
      row.getCell("value").numFmt = `"${data.currency} "#,##0.00`;
      const color = i === 1 ? INCOME : i === 2 ? EXPENSE : i === 3 ? (netSavings >= 0 ? INCOME : EXPENSE) : undefined;
      if (color) row.getCell("value").font = { bold: true, color };
    }
    styleDataRow(row);
  });

  // ── Transactions ──────────────────────────────────────────────────────────
  const txSheet = wb.addWorksheet("Transactions");
  txSheet.columns = [
    { header: "Date",     key: "date",     width: 14 },
    { header: "Name",     key: "name",     width: 28 },
    { header: "Type",     key: "type",     width: 10 },
    { header: "Category", key: "category", width: 20 },
    { header: "Amount",   key: "amount",   width: 16 },
    { header: "Currency", key: "currency", width: 10 },
    { header: "Account",  key: "account",  width: 22 },
  ];
  applyHeaderRow(txSheet.getRow(1), headerFill(BRAND));

  const allTx = [
    ...data.income.map(r => ({ ...r, type: "Income" })),
    ...data.expenses.map(r => ({ ...r, type: "Expense" })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  allTx.forEach((tx) => {
    const row = txSheet.addRow(tx);
    row.getCell("amount").numFmt = "#,##0.00";
    row.getCell("type").font = { bold: true, color: tx.type === "Income" ? INCOME : EXPENSE };
    styleDataRow(row);
  });

  // ── Accounts ──────────────────────────────────────────────────────────────
  const accSheet = wb.addWorksheet("Accounts");
  accSheet.columns = [
    { header: "Account Name", key: "name",     width: 28 },
    { header: "Type",         key: "type",     width: 16 },
    { header: "Balance",      key: "balance",  width: 18 },
    { header: "Currency",     key: "currency", width: 10 },
  ];
  applyHeaderRow(accSheet.getRow(1), headerFill(BRAND));

  data.accounts.forEach((acc) => {
    const row = accSheet.addRow(acc);
    row.getCell("balance").numFmt = "#,##0.00";
    const isNeg = acc.balance < 0;
    row.getCell("balance").font = { bold: true, color: isNeg ? EXPENSE : INCOME };
    styleDataRow(row);
  });

  // ── Category Breakdown ────────────────────────────────────────────────────
  const catSheet = wb.addWorksheet("Category Breakdown");
  catSheet.columns = [
    { header: "Category",   key: "category", width: 24 },
    { header: "Total Spent", key: "total",    width: 18 },
    { header: "% of Total",  key: "pct",      width: 14 },
  ];
  applyHeaderRow(catSheet.getRow(1), headerFill(EXPENSE));

  const catMap: Record<string, number> = {};
  data.expenses.forEach((e) => { catMap[e.category] = (catMap[e.category] ?? 0) + e.amount; });
  const catRows = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  catRows.forEach(([category, total]) => {
    const pct = totalExpense > 0 ? ((total / totalExpense) * 100).toFixed(1) + "%" : "0%";
    const row = catSheet.addRow({ category, total, pct });
    row.getCell("total").numFmt = "#,##0.00";
    styleDataRow(row);
  });

  return wb.xlsx.writeBuffer();
}

// ── Data types ────────────────────────────────────────────────────────────────

interface TxRow { date: string; name: string; category: string; amount: number; currency: string; account: string; }
interface AccRow { name: string; type: string; balance: number; currency: string; }
interface ReportData { income: TxRow[]; expenses: TxRow[]; accounts: AccRow[]; currency: string; }

async function fetchUserData(supabase: ReturnType<typeof createSupabaseClient>, userId: string, start: string, end: string): Promise<ReportData> {
  const [{ data: expenses }, { data: incomes }, { data: accounts }] = await Promise.all([
    supabase
      .from("expense_records")
      .select("expense_name, expense_amount, currency_code, transaction_date, account_id, expense_categories(expense_category_name)")
      .eq("user_id", userId)
      .gte("transaction_date", start)
      .lt("transaction_date", end),
    supabase
      .from("income_records")
      .select("income_name, income_amount, currency_code, transaction_date, account_id, income_categories(income_catagory_name)")
      .eq("user_id", userId)
      .gte("transaction_date", start)
      .lt("transaction_date", end),
    supabase
      .from("accounts")
      .select("account_name, account_type, balance_amount, currency_code")
      .eq("user_id", userId)
      .eq("is_active", true),
  ]);

  const accountMap: Record<string, string> = {};
  (accounts ?? []).forEach((a: { account_name: string }) => { accountMap[(a as any).account_id] = a.account_name; });

  const expenseRows: TxRow[] = (expenses ?? []).map((e: any) => ({
    date: e.transaction_date,
    name: e.expense_name,
    category: e.expense_categories?.expense_category_name ?? "Other",
    amount: Number(e.expense_amount),
    currency: e.currency_code,
    account: accountMap[e.account_id] ?? "—",
  }));

  const incomeRows: TxRow[] = (incomes ?? []).map((i: any) => ({
    date: i.transaction_date,
    name: i.income_name,
    category: i.income_categories?.income_catagory_name ?? "Other",
    amount: Number(i.income_amount),
    currency: i.currency_code,
    account: accountMap[i.account_id] ?? "—",
  }));

  const accountRows: AccRow[] = (accounts ?? []).map((a: any) => ({
    name: a.account_name,
    type: a.account_type.replace(/_/g, " "),
    balance: Number(a.balance_amount),
    currency: a.currency_code,
  }));

  const currency = accountRows[0]?.currency ?? "INR";
  return { income: incomeRows, expenses: expenseRows, accounts: accountRows, currency };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const now   = new Date();
  // Report covers the previous month
  const reportDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const start = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, "0")}-01`;
  const end   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthLabel = reportDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const fileMonth  = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, "0")}`;

  const isCron = req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;

  // ── Admin client (service role) ───────────────────────────────────────────
  const adminSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let userIds: string[] = [];

  if (isCron) {
    // Send to all active users
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("user_id")
      .eq("is_active", true);
    userIds = (profiles ?? []).map((p: any) => p.user_id);
  } else {
    // Manual trigger — get current session user
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    userIds = [user.id];
  }

  if (userIds.length === 0) {
    return NextResponse.json({ message: "No users to report" });
  }

  const results: { userId: string; status: string }[] = [];

  for (const userId of userIds) {
    try {
      // Get auth email
      const { data: { user: authUser } } = await adminSupabase.auth.admin.getUserById(userId);
      const email = authUser?.email;
      if (!email) { results.push({ userId, status: "no email" }); continue; }

      // Get display name
      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", userId)
        .single();
      const name = profile ? `${profile.first_name} ${profile.last_name}` : "there";

      // Fetch data
      const data = await fetchUserData(adminSupabase, userId, start, end);

      // Build Excel
      const buffer = await buildWorkbook(data, monthLabel);
      const base64 = Buffer.from(buffer as ArrayBuffer).toString("base64");

      const totalIncome  = data.income.reduce((s, r) => s + r.amount, 0);
      const totalExpense = data.expenses.reduce((s, r) => s + r.amount, 0);
      const netSavings   = totalIncome - totalExpense;

      const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: data.currency, maximumFractionDigits: 0 }).format(n);

      // Send email
      const { error: emailError } = await resend.emails.send({
        from: "Fintra Reports <onboarding@resend.dev>",
        to: email,
        subject: `Your Fintra Monthly Report — ${monthLabel}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0B0F1A;color:#fff;border-radius:16px">
            <h2 style="color:#6C63FF;margin-bottom:4px">Fintra Monthly Report</h2>
            <p style="color:#9AADCC;margin-top:0">${monthLabel}</p>
            <p>Hi ${name},</p>
            <p>Your financial report for <strong>${monthLabel}</strong> is attached.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr>
                <td style="padding:10px;background:#1a1f2e;border-radius:8px 8px 0 0;color:#9AADCC">Total Income</td>
                <td style="padding:10px;background:#1a1f2e;border-radius:8px 8px 0 0;color:#00E5A0;font-weight:bold;text-align:right">${fmt(totalIncome)}</td>
              </tr>
              <tr>
                <td style="padding:10px;background:#161b28;color:#9AADCC">Total Expenses</td>
                <td style="padding:10px;background:#161b28;color:#FF5C7A;font-weight:bold;text-align:right">${fmt(totalExpense)}</td>
              </tr>
              <tr>
                <td style="padding:10px;background:#1a1f2e;border-radius:0 0 8px 8px;color:#9AADCC">Net Savings</td>
                <td style="padding:10px;background:#1a1f2e;border-radius:0 0 8px 8px;color:${netSavings >= 0 ? "#00E5A0" : "#FF5C7A"};font-weight:bold;text-align:right">${fmt(netSavings)}</td>
              </tr>
            </table>
            <p style="color:#5B6A8A;font-size:12px">Open the attached Excel file for the full breakdown including all transactions, account balances, and category analysis.</p>
          </div>
        `,
        attachments: [{
          filename: `fintra-report-${fileMonth}.xlsx`,
          content: base64,
        }],
      });

      if (emailError) {
        results.push({ userId, status: `email error: ${emailError.message}` });
      } else {
        results.push({ userId, status: "sent" });
      }
    } catch (err) {
      results.push({ userId, status: `error: ${String(err)}` });
    }
  }

  return NextResponse.json({ results });
}
