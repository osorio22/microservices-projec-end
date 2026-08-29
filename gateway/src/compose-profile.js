const { CUSTOMER_URL, SHOPPING_URL } = require('./config');
const { APIError } = require('./utils/app-errors');
const TIMEOUT_MS = 5000;

const fetchJson = (url, authorization) =>
    fetch(url, {
        headers: authorization ? { Authorization: authorization } : {},
        signal: AbortSignal.timeout(TIMEOUT_MS)
    });

const EMPTY_SHOPPING = { cart: [], wishlist: [], orders: [] };

const fetchShopping = async (authorization) => {
    try {
        const res = await fetchJson(`${SHOPPING_URL}/customer/shopping-details`, authorization);

        if (!res.ok) {
            console.error(`shopping responded HTTP ${res.status} composing profile`);
            return EMPTY_SHOPPING;
        }

        return await res.json();
    } catch (err) {
        console.error(`shopping unreachable composing profile: ${err.message}`);
        return EMPTY_SHOPPING;
    }
};

module.exports = async (req, res, next) => {
    const authorization = req.headers.authorization;

    const [profileResult, shopping] = await Promise.all([
        fetchJson(`${CUSTOMER_URL}/customer/profile`, authorization).catch((err) => err),
        fetchShopping(authorization)
    ]);

    if (profileResult instanceof Error) {
        return next(new APIError('CustomersUnavailable', 503, 'Customers service unavailable'));
    }

    if (!profileResult.ok) {
        const body = await profileResult.json().catch(() => ({}));

        return next(new APIError(
            'CustomersError',
            profileResult.status,
            body.message || 'Customers service error'
        ));
    }

    const profile = await profileResult.json();

    return res.json({ ...profile, ...shopping });
};
