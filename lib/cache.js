const {
  implementHook,
} = require('@owo/lib/hook');

// TODO: impelment a system of hooks/reducers that
// build/invalidate caches. here are some thoughts:
//
// each cache should be a Map and should be stored under
// caches using a unique generated key.
//
// creating a new cache returns the unique key to the calling
// plugin such that only the plugin would reasonably know how
// to invalidate/rebuild (makes sense)
//
// caching should be written in such away that allows the caching
// mechanism to be swapped out (inMemory, redis, memcached)
const caches = new Map()

class Cache {

  constructor(name, strategyNames) {

    for (const strategyName of strategyNames) {
      if (!cacheStrategies.has(strategyName)) {
        throw new Error(`Cache strategy ${strategyName} is not implemented`);
      }
      const strategy = cacheStrategies.get(strategyName);
      strategy.createCache(name);
    }

    this.name = name;
    this.strategyNames = strategyNames;

    caches[name] = this;

  }
  getValue(key) {
    for(const name of this.strategyNames) {
      const cacheStrategy = cacheStrategies.get(name);
      const value = cacheStrategy.getValue(this.name, key);
      if (value !== undefined) {
        return value;
      }
    }
    return undefined;
  }
  setValue(key, value) {
    for(const name of this.strategyNames) {
      const cacheStrategy = cacheStrategies.get(name);
      cacheStrategy.setValue(this.name, key, value);
    }
  }
  invalidate(key) {
    for(const name of this.strategyNames) {
      const cacheStrategy = cacheStrategies.get(name);
      cacheStrategy.invalidate(this.name, key);
    }
  }
  flush() {
    for(const name of this.strategyNames) {
      const cacheStrategy = cacheStrategies.get(name);
      cacheStrategy.flush(this.name);
    }
  }
}

implementHook('defineCache', (name, strategies = []) => {
  new Cache(name, strategies);
});

implementHook('invalidateCacheKey', (name, key) => {
  if (caches.has(name)) {
    const cache = caches.get(name);
    cache.invalidate(key);
  }
});

implementHook('flushCache', (name) => {
  if (caches.has(name)) {
    const cache = caches.get(name);
    cache.flush();
  }
});

const cacheStrategies = new Map();

// your cache should implement these methods
class CacheStrategy {
  constructor(name) {
    cacheStrategies.set(name, this);
  }
  createCache(cacheName) { /*stub*/ }
  getValue(cacheName, key) { /*stub*/ }
  setValue(cacheName, key, value) { /*stub*/ }
  flush(cacheName) { /*stub*/ }
  invalidate(cacheName, key) { /*stub*/ }
}

class MemoryCacheStrategy extends CacheStrategy {
  constructor(name) {
    super(name);
    this.memoryCache = new Map();
  }
  createCache(cacheName) {
    this.memoryCache.set(cacheName, new Map());
  }
  getValue(cacheName, key) {
    const cache = this.memoryCache.get(cacheName);
    return cache.get(key);
  }
  setValue(cacheName, key, value) {
    const cache = this.memoryCache.get(cacheName);
    return cache.set(key, value);
  }
  invalidate(cacheName, key) {
    const cache = this.memoryCache.get(cacheName);
    return cache.delete(key);
  }
  flush(cacheName) {
    const cache = this.memoryCache.get(cacheName);
    cache.clear();
  }
}

const memoryCacheStrategy = new MemoryCacheStrategy('memoryCache');

module.exports = {
  Cache,
  CacheStrategy,
  MemoryCacheStrategy,
};
