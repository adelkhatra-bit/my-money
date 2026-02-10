import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TradingViewAlert {
  symbol: string;
  timeframe: string;
  side: "LONG" | "SHORT";
  entry: number;
  sl: number;
  tp1?: number;
  tp2?: number;
  user_id?: string;
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

    if (!payload.symbol || !payload.timeframe || !payload.side || !payload.entry || !payload.sl) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          required: ["symbol", "timeframe", "side", "entry", "sl"]
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!["LONG", "SHORT"].includes(payload.side)) {
      return new Response(
        JSON.stringify({ error: "Invalid side. Must be LONG or SHORT" }),
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
        side: payload.side,
        entry: payload.entry,
        sl: payload.sl,
        tp1: payload.tp1 || null,
        tp2: payload.tp2 || null,
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
      side: payload.side,
      entry: payload.entry,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Alert received and stored",
        alert_id: data.id,
        data: {
          symbol: payload.symbol,
          timeframe: payload.timeframe,
          side: payload.side,
          entry: payload.entry,
          sl: payload.sl,
          tp1: payload.tp1,
          tp2: payload.tp2,
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
