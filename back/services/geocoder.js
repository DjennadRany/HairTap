import pLimit from 'p-limit';
import { logger } from '../utils/logger.js';

class SimpleLRUCache {
  constructor({ max = 500, ttl = 1000 * 60 * 10 } = {}) {
    this.max = max;
    this.ttl = ttl;
    this.cache = new Map();
  }

  _isExpired(entry) {
    if (!entry) return true;
    return Date.now() > entry.expiresAt;
  }

  get(key) {
    const entry = this.cache.get(key);

    if (!entry || this._isExpired(entry)) {
      if (entry) {
        this.cache.delete(key);
      }
      return null;
    }

    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    if (this.cache.size >= this.max) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl
    });
  }
}

class GeocoderService {
  constructor(options = {}) {
    const concurrency = Number.parseInt(process.env.GEOCODER_CONCURRENCY ?? '', 10);
    const cacheMax = Number.parseInt(process.env.GEOCODER_CACHE_MAX_ENTRIES ?? '', 10);
    const cacheTtl = Number.parseInt(process.env.GEOCODER_CACHE_TTL_MS ?? '', 10);

    this.limit = pLimit(Number.isNaN(concurrency) ? options.concurrency || 2 : concurrency);
    this.cache = new SimpleLRUCache({
      max: Number.isNaN(cacheMax) ? options.cacheMax || 500 : cacheMax,
      ttl: Number.isNaN(cacheTtl) ? options.cacheTtl || 1000 * 60 * 10 : cacheTtl
    });
    this.userAgent = options.userAgent || 'TapHair/1.0 (https://taphair.com)';
    this.timeoutMs = options.timeoutMs || 8000;

    this.providers = options.providers || [
      {
        name: 'nominatim',
        buildUrl: (address) => {
          const params = new URLSearchParams({
            q: address,
            format: 'json',
            limit: '1',
            addressdetails: '1'
          });
          return `https://nominatim.openstreetmap.org/search?${params.toString()}`;
        },
        parse: (data) => {
          if (Array.isArray(data) && data.length > 0) {
            return {
              lat: Number.parseFloat(data[0].lat),
              lng: Number.parseFloat(data[0].lon)
            };
          }
          return null;
        }
      },
      {
        name: 'adresse.data.gouv',
        buildUrl: (address) => {
          const params = new URLSearchParams({
            q: address,
            limit: '1'
          });
          return `https://api-adresse.data.gouv.fr/search/?${params.toString()}`;
        },
        parse: (data) => {
          if (data?.features?.length) {
            const [lng, lat] = data.features[0]?.geometry?.coordinates || [];
            if (typeof lat === 'number' && typeof lng === 'number') {
              return { lat, lng };
            }
          }
          return null;
        }
      }
    ];
  }

  normalizeAddress(address) {
    return address.trim().toLowerCase();
  }

  async geocode(address) {
    if (!address || typeof address !== 'string') {
      logger.warn('[GeocoderService] Adresse invalide reçue pour géocodage.', { address });
      return null;
    }

    const normalizedAddress = this.normalizeAddress(address);
    const cached = this.cache.get(normalizedAddress);

    if (cached) {
      logger.debug('[GeocoderService] Résultat récupéré depuis le cache.', { address: normalizedAddress });
      return cached;
    }

    logger.info('[GeocoderService] Démarrage du géocodage.', { address: normalizedAddress });

    for (const provider of this.providers) {
      try {
        const result = await this.limit(() => this.fetchFromProvider(provider, normalizedAddress));

        if (result) {
          this.cache.set(normalizedAddress, result);
          logger.info('[GeocoderService] Géocodage réussi.', {
            address: normalizedAddress,
            provider: provider.name,
            result
          });
          return result;
        }

        logger.warn('[GeocoderService] Aucun résultat pour cette adresse.', {
          address: normalizedAddress,
          provider: provider.name
        });
      } catch (error) {
        logger.error('[GeocoderService] Erreur lors du géocodage.', {
          address: normalizedAddress,
          provider: provider.name,
          error: error.message
        });
      }
    }

    logger.error('[GeocoderService] Tous les fournisseurs ont échoué pour cette adresse.', {
      address: normalizedAddress
    });

    return null;
  }

  async fetchFromProvider(provider, address) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(provider.buildUrl(address), {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/json'
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return provider.parse(data);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export default new GeocoderService();
