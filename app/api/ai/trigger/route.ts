import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const FUNCTION_MAP: Record<string, string> = {
  monthly_summary: "ai-monthly-insight",
  goal_forecast: "ai-goal-forecast",
  budget_optimization: "ai-budget-optimize",
};

export async function POST(req: NextRequest) {
  try {
    const { type, payload } = await req.json();

    const fnName = FUNCTION_MAP[type];
    if (!fnName) {
      return NextResponse.json({ error: "Unknown insight type" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase.functions.invoke(fnName, {
      body: { user_id: user.id, ...payload },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
