import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 });

//middleware
export const cacheMiddleware = (duration: number) => {
    return (req: any, res: any, next: any) => {
        if (req.method !== 'GET') {
            return next();
        }

        const key = req.originalUrl;
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            console.log('Serving from cache:', key);
            return res.send(cachedResponse);
        } else {
            console.log('Cache miss:', key);
            //Store the original send function
            const originalSend = res.send;
            
            res.send = function (body: any): any {
                console.log('Storing in cache:', key);
                cache.set(key, body, duration);
                return originalSend.call(this, body);
            };
            next();
        }
    };
};

//Function to manually clear cache
export const clearCache = (key?: string) => {
    if (key) {
        cache.del(key);
    } else {
        cache.flushAll();
    }
}; 