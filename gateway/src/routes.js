const proxy = require('express-http-proxy');
const {
    CUSTOMERS_URL,
    PRODUCTS_URL,
    SHOPPING_URL
} = require('./config');

const composeProfile = require('./compose-profile');
const { APIError } = require('./utils/app-errors');

const proxyErrorHandler = (name) => (err, res, next) => {
    console.error(`${name} unreachable: ${err.message}`);

    next(
        new APIError(
            'ServiceUnavailable',
            503,
            `${name} service unavailable`
        )
    );
};

const forward = (
    name,
    baseUrl,
    pathResolver = (req) => req.originalUrl
) =>
    proxy(baseUrl, {
        proxyReqPathResolver: pathResolver,
        proxyErrorHandler: proxyErrorHandler(name)
    });

module.exports = (app) => {

    // ==========================================
    // CUSTOMER PROFILE
    // ==========================================

    app.get(
        '/customer/profile',
        composeProfile
    );


    // ==========================================
    // SHOPPING DETAILS
    // ==========================================

    app.use(
        '/customer/shopping-details',
        forward(
            'shopping',
            SHOPPING_URL
        )
    );


    // ==========================================
    // CUSTOMER WISHLIST
    // ==========================================

    app.use(
        '/customer/wishlist',
        forward(
            'customers',
            CUSTOMERS_URL
        )
    );


    // ==========================================
    // CUSTOMER
    // ==========================================

    app.use(
        '/customer',
        forward(
            'customers',
            CUSTOMERS_URL
        )
    );


    // ==========================================
    // WISHLIST
    // ==========================================

    // GET /wishlist
    //     ↓
    // GET /customer/wishlist

    app.get(
        '/wishlist',
        forward(
            'customers',
            CUSTOMERS_URL,
            () => '/customer/wishlist'
        )
    );


    // PUT /wishlist
    //     ↓
    // PUT /customer/wishlist

    app.put(
        '/wishlist',
        forward(
            'customers',
            CUSTOMERS_URL,
            () => '/customer/wishlist'
        )
    );


    // DELETE /wishlist/:productId
    //     ↓
    // DELETE /customer/wishlist/:productId

    app.delete(
        '/wishlist/:productId',
        forward(
            'customers',
            CUSTOMERS_URL,
            (req) =>
                `/customer/wishlist/${req.params.productId}`
        )
    );


    // ==========================================
    // CART
    // ==========================================

    app.use(
        '/cart',
        forward(
            'shopping',
            SHOPPING_URL
        )
    );


    // ==========================================
    // SHOPPING
    // ==========================================

    app.use(
        '/shopping',
        forward(
            'shopping',
            SHOPPING_URL
        )
    );


    // ==========================================
    // PRODUCTS
    // ==========================================

    app.get(
        '/',
        forward(
            'products',
            PRODUCTS_URL,
            () => '/products'
        )
    );


    app.get(
        '/:id',
        forward(
            'products',
            PRODUCTS_URL,
            (req) =>
                `/products/${req.params.id}`
        )
    );
};

