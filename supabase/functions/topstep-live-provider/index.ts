import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TOPSTEP_MODE = Deno.env.get('TOPSTEP_DATA_MODE') || 'SIMULATION';
const TRADOVATE_API_KEY = Deno.env.get('TRADOVATE_API_KEY') || '';
const TRADOVATE_API_SECRET = Deno.env.get('TRADOVATE_API_SECRET') || '';
const TRADOVATE_USERNAME = Deno.env.get('TRADOVATE_USERNAME') || '';
const TRADOVATE_PASSWORD = Deno.env.get('TRADOVATE_PASSWORD') || '';
const TRADOVATE_CID = Deno.env.get('TRADOVATE_CID') || '';
const TRADOVATE_DEVICE_ID = Deno.env.get('TRADOVATE_DEVICE_ID') || '';
const TRADOVATE_BASE_URL = Deno.env.get('TRADOVATE_BASE_URL') || 'https://live.tradovateapi.com/v1';

interface TradovateAuthResponse {
  accessToken: string;
  expirationTime: string;
  userId: number;
}

interface TradovateCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

async function authenticateTradovate(): Promise<string> {
  if (cachedAccessToken && Date.now() < tokenExpiry) {
    return cachedAccessToken;
  }

  const authPayload = {
    name: TRADOVATE_USERNAME,
    password: TRADOVATE_PASSWORD,
    appId: TRADOVATE_CID,
    appVersion: '1.0',
    deviceId: TRADOVATE_DEVICE_ID || 'trading-platform',
    cid: TRADOVATE_CID,
  };

  const response = await fetch(`${TRADOVATE_BASE_URL}/auth/accesstokenrequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(authPayload),
  });

  if (!response.ok) {
    throw new Error(`Tradovate auth failed: ${response.status} ${await response.text()}`);
  }

  const authData: TradovateAuthResponse = await response.json();

  cachedAccessToken = authData.accessToken;
  tokenExpiry = new Date(authData.expirationTime).getTime();

  return cachedAccessToken;
}

function mapSymbolToTradovate(symbol: string): string {
  const mapping: Record<string, string> = {
    'MNQ': 'MNQH6',
    'NQ': 'NQH6',
    'MES': 'MESH6',
    'ES': 'ESH6',
    'MYM': 'MYMH6',
    'YM': 'YMH6',
    'M2K': 'M2KH6',
    'RTY': 'RTYH6',
    'MGC': 'MGCJ6',
    'GC': 'GCJ6',
  };

  return mapping[symbol] || symbol;
}

async function fetchTradovateCandles(
  symbol: string,
  timeframe: string,
  limit: number
): Promise<any[]> {
  const accessToken = await authenticateTradovate();
  const tradovateSymbol = mapSymbolToTradovate(symbol);

  const timeUnit = timeframe === '1m' ? 'Min' : timeframe === '5m' ? 'Min' : 'Min';
  const elementSize = timeframe === '1m' ? 1 : timeframe === '5m' ? 5 : 15;

  const url = `${TRADOVATE_BASE_URL}/md/getchart?symbol=${tradovateSymbol}&chartDescription.type=MinuteBar&chartDescription.elementSize=${elementSize}&chartDescription.elementSizeUnit=${timeUnit}&chartDescription.withHistogram=false`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Tradovate chart data failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.bars || data.bars.length === 0) {
    return [];
  }

  const candles = data.bars.slice(-limit).map((bar: TradovateCandle) => ({
    time: Math.floor(new Date(bar.timestamp).getTime() / 1000),
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume || 0,
  }));

  return candles;
}

async function fetchTradovatePrice(symbol: string): Promise<number> {
  const accessToken = await authenticateTradovate();
  const tradovateSymbol = mapSymbolToTradovate(symbol);

  const url = `${TRADOVATE_BASE_URL}/md/getquote?symbol=${tradovateSymbol}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Tradovate quote failed: ${response.status}`);
  }

  const quote = await response.json();

  return quote.last || quote.close || 0;
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

    if (TOPSTEP_MODE !== 'LIVE') {
      return new Response(
        JSON.stringify({
          error: 'Topstep live mode not enabled',
          isSimulation: true,
          message: 'Set TOPSTEP_DATA_MODE=LIVE to enable real Topstep data',
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!TRADOVATE_USERNAME || !TRADOVATE_PASSWORD || !TRADOVATE_CID) {
      return new Response(
        JSON.stringify({
          error: 'Tradovate credentials not configured',
          isSimulation: true,
          message: 'Configure TRADOVATE_USERNAME, TRADOVATE_PASSWORD, TRADOVATE_CID',
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (path.includes('/auth')) {
      if (req.method !== 'POST') {
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const { username, password, cid, deviceId, broker } = body;

      if (!username || !password || !cid) {
        return new Response(
          JSON.stringify({ error: 'Username, password, and CID are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const authPayload = {
          name: username,
          password: password,
          appId: cid,
          appVersion: '1.0',
          deviceId: deviceId || 'trading-platform',
          cid: cid,
        };

        const response = await fetch(`${TRADOVATE_BASE_URL}/auth/accesstokenrequest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(authPayload),
        });

        if (!response.ok) {
          return new Response(
            JSON.stringify({
              error: 'Authentication failed',
              message: 'Invalid credentials or Tradovate API error'
            }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const authData = await response.json();

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Authentication successful',
            expiresAt: authData.expirationTime,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'Authentication error',
            message: error.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (path.includes('/candles')) {
      const symbol = url.searchParams.get('symbol') || 'MNQ';
      const timeframe = url.searchParams.get('timeframe') || '1m';
      const limit = parseInt(url.searchParams.get('limit') || '500');

      const candles = await fetchTradovateCandles(symbol, timeframe, limit);

      return new Response(
        JSON.stringify({
          candles,
          symbol,
          timeframe,
          provider: 'TOPSTEP_TRADOVATE_LIVE',
          dataSource: 'TOPSTEP_LIVE',
          isSimulation: false,
          timestamp: Date.now(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (path.includes('/price')) {
      const symbol = url.searchParams.get('symbol') || 'MNQ';

      const price = await fetchTradovatePrice(symbol);

      return new Response(
        JSON.stringify({
          price,
          symbol,
          provider: 'TOPSTEP_TRADOVATE_LIVE',
          dataSource: 'TOPSTEP_LIVE',
          isSimulation: false,
          timestamp: Date.now(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (path.includes('/contract-specs')) {
      const symbol = url.searchParams.get('symbol') || 'MNQ';

      const specs = {
        symbol,
        tickSize: symbol === 'MNQ' ? 0.25 : symbol === 'NQ' ? 0.25 : 0.25,
        tickValue: symbol === 'MNQ' ? 0.50 : symbol === 'NQ' ? 5.00 : 1.00,
        pointValue: symbol === 'MNQ' ? 2.00 : symbol === 'NQ' ? 20.00 : 5.00,
        contractSize: 1,
        currency: 'USD',
        exchange: 'CME',
      };

      return new Response(
        JSON.stringify({
          specs,
          provider: 'TOPSTEP_TRADOVATE_LIVE',
          dataSource: 'TOPSTEP_LIVE',
          isSimulation: false,
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
    console.error('Topstep provider error:', error);

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
