const storageService = require('../services/storage.service');

const PROFILE_IMAGES_BUCKET = process.env.SUPABASE_PROFILE_IMAGES_BUCKET;

// profileImage values that predate Supabase (legacy local uploads) are left untouched.
const isLegacyLocalPath = (value) => value.startsWith('/uploads/') || value.startsWith('http');

const resolveValue = async (value, cache) => {
    if (Array.isArray(value)) {
        return Promise.all(value.map(item => resolveValue(item, cache)));
    }

    if (!value || typeof value !== 'object' || value instanceof Date) {
        return value;
    }

    const entries = await Promise.all(
        Object.entries(value).map(async ([key, val]) => {
            if (key === 'profileImage' && typeof val === 'string' && val && !isLegacyLocalPath(val)) {
                if (!cache.has(val)) {
                    cache.set(val, storageService
                        .signedUrl(PROFILE_IMAGES_BUCKET, val, 3600)
                        .catch(error => {
                            console.error('[profileImageUrl]', error.message);
                            return null;
                        }));
                }
                return [key, await cache.get(val)];
            }

            return [key, await resolveValue(val, cache)];
        })
    );

    return Object.fromEntries(entries);
};

const attachProfileImageUrls = (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = (body) => {
        resolveValue(body, new Map())
            .then(originalJson)
            .catch(error => {
                console.error('[attachProfileImageUrls]', error.message);
                originalJson(body);
            });

        return res;
    };

    next();
};

module.exports = attachProfileImageUrls;
