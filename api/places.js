const json = (value) => JSON.stringify(value);

function config() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
  return { url, key };
}

function headers(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function toClient(row) {
  return {
    ...row,
    id: String(row.id),
    category: row.category || row.cat || 'Lain-lain',
    cat: row.category || row.cat || 'Lain-lain',
    coords: [Number(row.lat), Number(row.lng)],
  };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  const { url, key } = config();
  if (!url || !key) return res.status(500).json({ error: 'Supabase environment variables belum diset.' });
  const endpoint = `${url}/rest/v1/places`;

  try {
    if (req.method === 'GET') {
      const response = await fetch(`${endpoint}?select=*&order=created_at.asc`, { headers: headers(key) });
      const body = await response.text();
      if (!response.ok) return res.status(response.status).send(body);
      const rows = body ? JSON.parse(body) : [];
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ places: rows.map(toClient) });
    }

    if (req.method === 'POST') {
      const input = req.body || {};
      const coords = Array.isArray(input.coords) ? input.coords : [input.lat, input.lng];
      const lat = Number(coords[0]);
      const lng = Number(coords[1]);
      if (!input.name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return res.status(400).json({ error: 'Nama dan koordinat diperlukan.' });
      }
      const row = {
        name: String(input.name),
        category: String(input.category || input.cat || 'Lain-lain'),
        lot: input.lot || null,
        address: input.address || null,
        lat,
        lng,
        service: input.service || null,
        image: input.image || null,
        description: input.description || null,
        icon: input.icon || null,
        source: input.source || 'Admin MeruVerse',
      };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers(key, { Prefer: 'return=representation' }),
        body: json(row),
      });
      const body = await response.text();
      if (!response.ok) return res.status(response.status).send(body);
      const rows = body ? JSON.parse(body) : [row];
      return res.status(201).json(toClient(rows[0]));
    }

    if (req.method === 'DELETE') {
      const id = new URL(req.url, 'http://localhost').searchParams.get('id');
      if (!id) return res.status(400).json({ error: 'ID diperlukan.' });
      const response = await fetch(`${endpoint}?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: headers(key),
      });
      const body = await response.text();
      if (!response.ok) return res.status(response.status).send(body);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method tidak disokong.' });
  } catch (error) {
    console.error('Supabase places error:', error);
    return res.status(500).json({ error: 'Sambungan Supabase gagal.' });
  }
}
