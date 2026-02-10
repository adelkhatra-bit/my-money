import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const POLYGON_API_KEY = Deno.env.get('POLYGON_API_KEY') || '';

interface CandleRequest {
  symbol: string;
  timeframe: string;
  limit?: number;
  from?: string;
  to?: string;
}

interface PolygonBar {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  t: number;
}

function mapSymbolToPolygon(symbol: string): string {
  const mapping: Record<string, string> = {
    'MNQ': 'X:MNQH26',
    'NQ': 'X:NQH26',
    'MES': 'X:MESH26',
    'ES': 'X:ESH26',
    'MYM': 'X:MYMH26',
    'YM': 'X:YMH26',
    'M2K': 'X:M2KH26',
    'RTY': 'X:RTYH26',
    'MGC': 'X:MGCJ26',
    'GC': 'X:GCJ26',
  };

  return mapping[symbol] || `X:${symbol}H26`;
}

async function fetchHistoricalCandles(symbol: string, timeframe: string, limit: number): Promise<any[]> {
  const polygonSymbol = mapSymbolToPolygon(symbol);

  const multiplier = timeframe === '1m' ? 1 : timeframe === '5m' ? 5 : 15;
  const timespan = 'minute';

  const to = Date.now();
  const from = to - (limit * multiplier * 60 * 1000 * 2);

  const url = `https://api.polygon.io/v2/aggs/ticker/${polygonSymbol}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=${limit}&apiKey=${POLYGON_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Polygon API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    return [];
  }

  return data.results.map((bar: PolygonBar) => ({
    time: Math.floor(bar.t / 1000),
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
  }));
}

async function fetchLatestPrice(symbol: string): Promise<number> {
  const polygonSymbol = mapSymbolToPolygon(symbol);

  const url = `https://api.polygon.io/v2/last/trade/${polygonSymbol}?apiKey=${POLYGON_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Polygon API error: ${response.status}`);
  }

  const data = await response.json();

  return data.results?.p || 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path.includes('/candles')) {
      const symbol = url.searchParams.get('symbol') || 'MNQ';
      const timeframe = url.searchParams.get('timeframe') || '1m';
      const limit = parseInt(url.searchParams.get('limit') || '200');

      if (!POLYGON_API_KEY) {
        return new Response(
          JSON.stringify({
            error: 'POLYGON_API_KEY not configured',
            isSimulation: true,
          }),
          {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const candles = await fetchHistoricalCandles(symbol, timeframe, limit);

      return new Response(
        JSON.stringify({
          candles,
          symbol,
          timeframe,
          provider: 'POLYGON_LIVE',
          isSimulation: false,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (path.includes('/price')) {
      const symbol = url.searchParams.get('symbol') || 'MNQ';

      if (!POLYGON_API_KEY) {
        return new Response(
          JSON.stringify({
            error: 'POLYGON_API_KEY not configured',
            isSimulation: true,
          }),
          {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const price = await fetchLatestPrice(symbol);

      return new Response(
        JSON.stringify({
          price,
          symbol,
          provider: 'POLYGON_LIVE',
          isSimulation: false,
          timestamp: Date.now(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Market data proxy error:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        isSimulation: true,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
