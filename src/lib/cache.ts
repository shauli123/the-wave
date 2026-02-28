import NodeCache from 'node-cache';

// Declare global scope to prevent multiple instances during development (HMR)
/* eslint-disable no-var */
declare global {
    var _alertCache: NodeCache | undefined;
    var _newsCache: NodeCache | undefined;
}

// Alerts cache: 1-second default TTL
export const alertCache = global._alertCache || new NodeCache({ stdTTL: 1, checkperiod: 2 });
if (process.env.NODE_ENV !== 'production') global._alertCache = alertCache;

// News cache: 30-second TTL
export const newsCache = global._newsCache || new NodeCache({ stdTTL: 30, checkperiod: 60 });
if (process.env.NODE_ENV !== 'production') global._newsCache = newsCache;
