import Memcached from "memcached";

const memcached = new Memcached(process.env.MEMCACHED_ENDPOINT);

export function cacheGet(key) {
  return new Promise((resolve, reject) => {
    memcached.get(key, (err, data) => {
      if (err) return reject(err);
      resolve(data ? JSON.parse(data) : null);
    });
  });
}

export function cacheSet(key, value, ttl = 120) {
  return new Promise((resolve, reject) => {
    memcached.set(key, JSON.stringify(value), ttl, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function cacheDel(key) {
  return new Promise((resolve, reject) => {
    memcached.del(key, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

