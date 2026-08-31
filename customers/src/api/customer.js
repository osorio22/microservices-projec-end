const CustomerService = require('../services/customer-service');
const UserAuth = require('./middlewares/auth');

module.exports = (app) => {

    const service = new CustomerService();

    // ==========================================
    // GET ALL CUSTOMERS
    // ==========================================

    app.get('/customer', async (req, res, next) => {
        try {
            const { data } = await service.GetAllCustomers();

            return res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    });

    // ==========================================
    // GET ALL CUSTOMERS
    // ==========================================

    app.get('/customer/all', async (req, res, next) => {
        try {
            const { data } = await service.GetAllCustomers();

            return res.status(200).json({
                total: data.length,
                customers: data
            });
        } catch (err) {
            next(err);
        }
    });

    // ==========================================
    // SIGN UP
    // ==========================================

    app.post('/customer/signup', async (req, res, next) => {
        try {

            const {
                email,
                password,
                phone
            } = req.body;

            const { data } = await service.SignUp({
                email,
                password,
                phone
            });

            return res
                .status(201)
                .json(data);

        } catch (err) {
            next(err);
        }
    });

    // ==========================================
    // LOGIN
    // ==========================================

    app.post('/customer/login', async (req, res, next) => {
        try {

            const {
                email,
                password
            } = req.body;

            const { data } =
                await service.SignIn({
                    email,
                    password
                });

            return res
                .status(200)
                .json(data);

        } catch (err) {
            next(err);
        }
    });

    // ==========================================
    // PROFILE
    // ==========================================

    app.get(
        '/customer/profile',
        UserAuth,
        async (req, res, next) => {

            try {

                const { _id } = req.user;

                const { data } =
                    await service.GetProfile({
                        _id
                    });

                return res
                    .status(200)
                    .json(data);

            } catch (err) {
                next(err);
            }
        }
    );

    // ==========================================
    // SHOPPING DETAILS
    // ==========================================

    app.get(
        '/customer/shopping-details',
        UserAuth,
        async (req, res, next) => {

            try {

                const { _id } = req.user;

                const { data } =
                    await service.GetShopingDetails(_id);

                return res
                    .status(200)
                    .json(data);

            } catch (err) {
                next(err);
            }
        }
    );

    // ==========================================
    // WISHLIST - GET
    // ==========================================

    app.get(
        '/customer/wishlist',
        UserAuth,
        async (req, res, next) => {

            try {

                const { _id } = req.user;

                const { data } =
                    await service.GetWishList(_id);

                return res
                    .status(200)
                    .json(data);

            } catch (err) {
                next(err);
            }
        }
    );

    // ==========================================
    // WISHLIST - ADD
    // ==========================================

    app.put(
        '/customer/wishlist',
        UserAuth,
        async (req, res, next) => {

            try {

                const { _id } = req.user;
                const { product } = req.body;

                const { data } =
                    await service.AddToWishlist(
                        _id,
                        product
                    );

                return res
                    .status(200)
                    .json(data);

            } catch (err) {
                next(err);
            }
        }
    );

    // ==========================================
    // WISHLIST - REMOVE
    // ==========================================

    app.delete(
        '/customer/wishlist/:productId',
        UserAuth,
        async (req, res, next) => {

            try {

                const { _id } = req.user;
                const { productId } = req.params;

                const { data } =
                    await service.RemoveFromWishlist(
                        _id,
                        productId
                    );

                return res
                    .status(200)
                    .json(data);

            } catch (err) {
                next(err);
            }
        }
    );

    // ==========================================
    // CART - GET
    // ==========================================

    app.get(
        '/customer/cart/:customerId',
        UserAuth,
        async (req, res, next) => {

            try {

                const { customerId } = req.params;

                const { data } =
                    await service.GetCart(customerId);

                return res
                    .status(200)
                    .json(data);

            } catch (err) {
                next(err);
            }
        }
    );

    // ==========================================
    // CART - ADD
    // ==========================================

    app.post(
        '/customer/cart/:customerId',
        UserAuth,
        async (req, res, next) => {

            try {

                const { customerId } = req.params;

                const {
                    product,
                    qty
                } = req.body;

                const { data } =
                    await service.AddToCart(
                        customerId,
                        product,
                        qty
                    );

                return res
                    .status(200)
                    .json(data);

            } catch (err) {
                next(err);
            }
        }
    );

    // ==========================================
    // PLACE ORDER
    // ==========================================

    app.post(
        '/customer/order/:customerId',
        UserAuth,
        async (req, res, next) => {

            try {

                const { customerId } = req.params;

                const order = req.body;

                const { data } =
                    await service.PlaceOrder(
                        customerId,
                        order
                    );

                return res
                    .status(201)
                    .json(data);

            } catch (err) {
                next(err);
            }
        }
    );

    // ==========================================
    // CART - REMOVE
    // ==========================================

    app.delete(
        '/customer/cart/:customerId/:productId',
        UserAuth,
        async (req, res, next) => {

            try {

                const {
                    customerId,
                    productId
                } = req.params;

                const { data } =
                    await service.RemoveFromCart(
                        customerId,
                        productId
                    );

                return res
                    .status(200)
                    .json(data);

            } catch (err) {
                next(err);
            }
        }
    );

    // ==========================================
    // ADDRESS
    // ==========================================

    app.post(
        '/customer/address',
        UserAuth,
        async (req, res, next) => {

            try {

                const { _id } = req.user;

                const {
                    street,
                    postalCode,
                    city,
                    country
                } = req.body;

                const { data } =
                    await service.AddNewAddress(
                        _id,
                        {
                            street,
                            postalCode,
                            city,
                            country
                        }
                    );

                return res
                    .status(201)
                    .json(data);

            } catch (err) {
                next(err);
            }
        }
    );

};