import { supabase } from '../lib/supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function getTopstepConnection(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('topstep_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_connected', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching Topstep connection:', error);
    return null;
  }

  return data;
}

export async function connectTopstep(userId, credentials) {
  if (!userId) {
    throw new Error('User ID required');
  }

  const { username, password, cid, deviceId, broker } = credentials;

  if (!username || !password || !cid) {
    throw new Error('Username, password, and CID are required');
  }

  try {
    const url = `${SUPABASE_URL}/functions/v1/topstep-live-provider/auth`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        cid,
        deviceId: deviceId || 'trading-platform',
        broker: broker || 'tradovate'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Connection failed');
    }

    const authData = await response.json();

    const { data, error } = await supabase
      .from('topstep_connections')
      .upsert({
        user_id: userId,
        platform: 'topstep',
        broker: broker || 'tradovate',
        is_connected: true,
        credentials_encrypted: {
          username,
          cid,
          deviceId: deviceId || 'trading-platform',
        },
        last_connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving connection:', error);
      throw new Error('Failed to save connection');
    }

    console.log('✅ [Topstep Auth] Connected successfully:', authData);
    return data;
  } catch (error) {
    console.error('❌ [Topstep Auth] Connection failed:', error);
    throw error;
  }
}

export async function disconnectTopstep(userId) {
  if (!userId) return;

  const { error } = await supabase
    .from('topstep_connections')
    .update({
      is_connected: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error disconnecting Topstep:', error);
    throw error;
  }

  console.log('✅ [Topstep Auth] Disconnected successfully');
}

export async function isTopstepConnected(userId) {
  const connection = await getTopstepConnection(userId);
  return connection && connection.is_connected;
}
