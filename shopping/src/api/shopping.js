const ShoppingService = require('../services/shopping-service');
const UserAuth = require('./middlewares/auth');

module.exports = (app) => {

    const service = new ShoppingService();


    // ==========================================
    // ADD TO CART
    // ==========================================

    app.put(
        '/cart',
        UserAuth,
        async (req, res, next) => {

            try {

                const { _id: customerId } = req.user;

                const { _id: product, qty } = req.body;

                const token = req.headers.authorization
                    ?.replace('Bearer ', '');

                if (!product) {
                    return res.status(400).json({
                        message: 'Product id is required'
                    });
                }

                if (!qty || qty < 1) {
                    return res.status(400).json({
                        message: 'Quantity must be at least 1'
                    });
                }

                const { data } = await service.AddToCart(
                    customerId,
                    product,
                    qty,
                    token
                );

                return res.status(200).json(data);

            } catch (err) {
                next(err);
            }
        }
    );


    // ==========================================
    // REMOVE FROM CART
    // ==========================================

    app.delete(
        '/cart/:productId',
        UserAuth,
        async (req, res, next) => {

            try {

                const { _id: customerId } = req.user;

                const { productId } = req.params;

                const token = req.headers.authorization
                    ?.replace('Bearer ', '');

                const { data } = await service.RemoveFromCart(
                    customerId,
                    productId,
                    token
                );

                return res.status(200).json(data);

            } catch (err) {
                next(err);
            }
        }
    );


    // ==========================================
    // PLACE ORDER
    // ==========================================

    app.post(
        '/shopping/order',
        UserAuth,
        async (req, res, next) => {

            try {

                const { _id } = req.user;

                const { txnId } = req.body;

                const token = req.headers.authorization
                    ?.replace('Bearer ', '');

                const { data } = await service.PlaceOrder(
                    _id,
                    txnId,
                    token
                );

                return res.status(201).json(data);

            } catch (err) {
                next(err);
            }
        }
    );
};  