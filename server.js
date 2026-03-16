const http = require('http');
const fs = require('fs');
const path = require('path');
const { FlightRadar24API } = require('flightradarapi');

/* ═══ CONFIG ═══ */
const PORT = 3000;
const CACHE_TTL = 5 * 60 * 1000; /* 5 min */
const FR_LIMIT = 100; /* flights per page */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

/* ═══ FR24 API ═══ */
const frApi = new FlightRadar24API();
const cache = {};

/* Convert FR24 flight object → AviationStack-compatible format */
function transformFlight(f, type) {
  const fl = f.flight || f;
  const ident = fl.identification || {};
  const status = fl.status || {};
  const airline = fl.airline || {};
  const airport = fl.airport || {};
  const time = fl.time || {};
  const sched = time.scheduled || {};
  const real = time.real || {};
  const est = time.estimated || {};

  const origin = airport.origin || {};
  const dest = airport.destination || {};

  /* Map FR24 status → AviationStack-like status */
  const genericStatus = status.generic?.status?.text || '';
  let flightStatus = 'scheduled';
  if (genericStatus === 'landed') flightStatus = 'landed';
  else if (genericStatus === 'departed') flightStatus = 'active';
  else if (genericStatus === 'canceled') flightStatus = 'cancelled';
  else if (genericStatus === 'estimated') flightStatus = 'scheduled';
  else if (genericStatus === 'delayed') flightStatus = 'scheduled';

  /* Extract flight number parts */
  const flNum = ident.number?.default || '';
  const alCode = airline.code?.iata || '';
  const numPart = flNum.replace(/^[A-Z]{2,3}/i, '');

  /* Build timestamps from unix → ISO strings */
  const depSched = sched.departure ? new Date(sched.departure * 1000).toISOString() : null;
  const arrSched = sched.arrival ? new Date(sched.arrival * 1000).toISOString() : null;
  const depActual = real.departure ? new Date(real.departure * 1000).toISOString() : null;
  const arrActual = real.arrival ? new Date(real.arrival * 1000).toISOString() : null;

  /* Delay (minutes) */
  let depDelay = null;
  if (sched.departure && est.departure) {
    depDelay = Math.round((est.departure - sched.departure) / 60);
    if (depDelay < 0) depDelay = 0;
  }
  let arrDelay = null;
  if (sched.arrival && est.arrival) {
    arrDelay = Math.round((est.arrival - sched.arrival) / 60);
    if (arrDelay < 0) arrDelay = 0;
  }

  return {
    flight_status: flightStatus,
    airline: { iata: alCode, name: airline.name || '' },
    flight: { number: numPart, iata: flNum },
    departure: {
      iata: origin.code?.iata || '',
      airport: origin.name || '',
      scheduled: depSched,
      actual: depActual,
      gate: origin.info?.gate || null,
      terminal: origin.info?.terminal || null,
      delay: depDelay,
    },
    arrival: {
      iata: dest.code?.iata || '',
      airport: dest.name || '',
      scheduled: arrSched,
      actual: arrActual,
      gate: dest.info?.gate || null,
      terminal: dest.info?.terminal || null,
      delay: arrDelay,
    },
  };
}

async function getFlights(airport, type) {
  const key = `${airport}_${type}`;
  const cached = cache[key];
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  try {
    /* Fetch up to 3 pages (300 flights) */
    const allFlights = [];
    for (let page = 1; page <= 3; page++) {
      const details = await frApi.getAirportDetails(airport, FR_LIMIT, page);
      const plugin = details?.airport?.pluginData;
      if (!plugin?.schedule) break;

      const schedule = type === 'arr' ? plugin.schedule.arrivals : plugin.schedule.departures;
      const raw = schedule?.data || [];
      if (!raw.length) break;

      raw.forEach(entry => {
        const transformed = transformFlight(entry, type);
        if (transformed.airline.iata) allFlights.push(transformed);
      });

      const totalPages = schedule?.page?.total || 1;
      if (page >= totalPages) break;
    }

    const result = { data: allFlights };
    cache[key] = { data: result, ts: Date.now() };
    console.log(`[FR24] ${allFlights.length} ${type} flights for ${airport}`);
    return result;
  } catch (e) {
    console.error(`[FR24] Error for ${key}:`, e.message);
    return null;
  }
}

/* ═══ SERVER ═══ */
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  /* API proxy endpoint */
  if (url.pathname === '/api/flights') {
    const airport = (url.searchParams.get('airport') || '').toUpperCase();
    const type = url.searchParams.get('type') || 'dep';

    if (!airport || airport.length !== 3) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid airport IATA code' }));
      return;
    }

    const data = await getFlights(airport, type);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300'
    });
    res.end(JSON.stringify(data || { data: null }));
    return;
  }

  /* API status — FR24 always available (no key needed) */
  if (url.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ hasKey: true }));
    return;
  }

  /* Static files */
  const filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
  console.log('FlightRadar24 real-time data enabled — no API key required');
});
