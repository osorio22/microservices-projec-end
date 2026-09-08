const { FormateData } = require('../utils');
const { APIError, BadRequestError } = require('../utils/app-errors');
const crypto = require('crypto');
const Order = require('../database/models/order');

class ShoppingService {

    // ==========================================
    // ADD TO CART
    // ==========================================

    async AddToCart(customerId, product, qty, token) {
        try {

            const response = await fetch(
                `http://c-customers:8003/customer/cart/${customerId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        product,
                        qty
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();

                throw new APIError(
                    'AddToCartError',
                    response.status,
                    errorText || 'Could not add product to cart'
                );
            }

            const result = await response.json();

            return FormateData(result);

        } catch (err) {

            if (err instanceof APIError) {
                throw err;
            }

            throw new APIError(
                'AddToCartError',
                500,
                err.message
            );
        }
    }


    // ==========================================
    // REMOVE FROM CART
    // ==========================================

    async RemoveFromCart(customerId, productId, token) {
        try {

            const response = await fetch(
                `http://c-customers:8003/customer/cart/${customerId}/${productId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();

                throw new APIError(
                    'RemoveFromCartError',
                    response.status,
                    errorText || 'Could not remove product from cart'
                );
            }

            const result = await response.json();

            return FormateData(result);

        } catch (err) {

            if (err instanceof APIError) {
                throw err;
            }

            throw new APIError(
                'RemoveFromCartError',
                500,
                err.message
            );
        }
    }


    // ==========================================
    // GET CART
    // ==========================================

    async GetCart(customerId, token) {
        try {

            const response = await fetch(
                `http://c-customers:8003/customer/cart/${customerId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new APIError(
                    'GetCartError',
                    response.status,
                    'Could not get customer cart'
                );
            }

            const result = await response.json();

            return FormateData(result);

        } catch (err) {

            if (err instanceof APIError) {
                throw err;
            }

            throw new APIError(
                'GetCartError',
                500,
                err.message
            );
        }
    }


    // ==========================================
    // PLACE ORDER
    // ==========================================

    async PlaceOrder(customerId, txnId, token) {
        try {

            const cartResponse = await this.GetCart(
                customerId,
                token
            );

            const cart = cartResponse.data;

            if (!cart || cart.length === 0) {
                throw new BadRequestError('Cart is empty');
            }

            const amount = cart.reduce(
                (total, item) => {
                    return total + (item.product.price * item.unit);
                },
                0
            );

            const order = await Order.create({
                _id: crypto.randomUUID(),
                customerId: customerId,
                amount: amount,
                txnId: txnId,
                status: 'received',
                items: cart,
                date: new Date()
            });

            const response = await fetch(
                `http://c-customers:8003/customer/order/${customerId}`,
                {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(order)
                }
            );

            if (!response.ok) {
                throw new APIError(
                    'PlaceOrderError',
                    response.status,
                    'Could not record order in customers'
                );
            }

            return FormateData(order);

        } catch (err) {

            if (err instanceof APIError) {
                throw err;
            }

            throw new APIError(
                'PlaceOrderError',
                500,
                err.message
            );
        }
    }
}

module.exports = ShoppingService;