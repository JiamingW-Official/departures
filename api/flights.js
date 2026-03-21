const { FlightRadar24API } = require('flightradarapi');

const frApi = new FlightRadar24API();
const cache = {};
const CACHE_TTL = 5 * 60 * 1000;
const FR_LIMIT = 100;

function transformFlight(f) {
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

  const genericStatus = (status.generic?.status?.text || '').toLowerCase();
  let flightStatus = 'scheduled';
  if (genericStatus === 'landed') flightStatus = 'landed';
  else if (genericStatus === 'departed') flightStatus = 'active';
  else if (genericStatus === 'canceled' || genericStatus === 'cancelled') flightStatus = 'cancelled';
  else if (genericStatus === 'diverted') flightStatus = 'diverted';
  else if (genericStatus === 'delayed') flightStatus = 'delayed';

  const flNum = ident.number?.default || '';
  const alCode = airline.code?.iata || '';
  let numPart = flNum;
  if (alCode && flNum.toUpperCase().startsWith(alCode.toUpperCase())) {
    numPart = flNum.substring(alCode.length);
  } else {
    numPart = flNum.replace(/^[A-Z0-9]{2,3}(?=\d)/i, '');
  }

  const depSched = sched.departure ? new Date(sched.departure * 1000).toISOString() : null;
  const arrSched = sched.arrival ? new Date(sched.arrival * 1000).toISOString() : null;
  const depActual = real.departure ? new Date(real.departure * 1000).toISOString() : null;
  const arrActual = real.arrival ? new Date(real.arrival * 1000).toISOString() : null;

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

module.exports = async (req, res) => {
  const airport = (req.query.airport || '').toUpperCase();
  const type = req.query.type || 'dep';

  if (!airport || airport.length !== 3) {
    return res.status(400).json({ error: 'Invalid airport IATA code' });
  }

  const key = `${airport}_${type}`;
  const cached = cache[key];
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json(cached.data);
  }

  try {
    const allFlights = [];
    for (let page = 1; page <= 3; page++) {
      const details = await frApi.getAirportDetails(airport, FR_LIMIT, page);
      const plugin = details?.airport?.pluginData;
      if (!plugin?.schedule) break;

      const schedule = type === 'arr' ? plugin.schedule.arrivals : plugin.schedule.departures;
      const raw = schedule?.data || [];
      if (!raw.length) break;

      raw.forEach(entry => {
        const transformed = transformFlight(entry);
        if (transformed.airline.iata) allFlights.push(transformed);
      });

      const totalPages = schedule?.page?.total || 1;
      if (page >= totalPages) break;
    }

    const result = { data: allFlights };
    cache[key] = { data: result, ts: Date.now() };

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json(result);
  } catch (e) {
    console.error(`[FR24] Error for ${key}:`, e.message);
    return res.status(500).json({ data: null, error: e.message });
  }
};
