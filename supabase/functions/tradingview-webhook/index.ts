import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TradingViewAlert {
  symbol: string;
  timeframe: string;
  direction?: "LONG" | "SHORT";
  side?: "LONG" | "SHORT";
  entry?: number;
  entry_min?: number;
  entry_max?: number;
  sl?: number;
  stop_loss?: number;
  tp1?: number;
  tp2?: number;
  take_profit_1?: number;
  take_profit_2?: number;
  user_id?: string;
  platform?: string;
  market?: string;
  timestamp?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: TradingViewAlert = await req.json();

    const direction = payload.direction || payload.side;
    const entry = payload.entry || payload.entry_min || payload.entry_max;
    const sl = payload.sl || payload.stop_loss;
    const tp1 = payload.tp1 || payload.take_profit_1;
    const tp2 = payload.tp2 || payload.take_profit_2;

    if (!payload.symbol || !payload.timeframe || !direction || !entry || !sl) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          required: ["symbol", "timeframe", "direction/side", "entry", "sl/stop_loss"],
          received: payload
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!["LONG", "SHORT"].includes(direction)) {
      return new Response(
        JSON.stringify({ error: "Invalid direction. Must be LONG or SHORT" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const isLong = direction === "LONG";
    const validPrice = isLong
      ? (tp1 ? tp1 > entry && entry > sl : entry > sl)
      : (tp1 ? sl > entry && entry > tp1 : sl > entry);

    if (!validPrice) {
      return new Response(
        JSON.stringify({
          error: "Invalid price logic",
          message: isLong
            ? "For LONG: TP must be above Entry, Entry must be above SL"
            : "For SHORT: SL must be above Entry, Entry must be above TP",
          received: { direction, entry, sl, tp1 }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data, error } = await supabase
      .from("tradingview_alerts")
      .insert({
        user_id: payload.user_id || null,
        symbol: payload.symbol,
        timeframe: payload.timeframe,
        side: direction,
        entry: entry,
        sl: sl,
        tp1: tp1 || null,
        tp2: tp2 || null,
        status: "pending",
        raw_payload: payload,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to store alert", details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("TradingView alert received:", {
      id: data.id,
      symbol: payload.symbol,
      direction: direction,
      entry: entry,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Alert received and stored",
        alert_id: data.id,
        data: {
          symbol: payload.symbol,
          timeframe: payload.timeframe,
          direction: direction,
          entry: entry,
          sl: sl,
          tp1: tp1,
          tp2: tp2,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
