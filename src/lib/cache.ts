import NodeCache from 'node-cache';

// Alerts cache: 1-second TTL
export const alertCache = new NodeCache({ stdTTL: 1, checkperiod: 2 });

// News cache: 30-second TTL
export const newsCache = new NodeCache({ stdTTL: 30, checkperiod: 60 });
