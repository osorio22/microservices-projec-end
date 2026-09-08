const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

describe('Shopping Integration (API real + MongoDB real)', () => {

    let mongoServer;
    let app;

    const cartConCamaro = [
        {
            product: { _id: 'p1', name: 'Chevrolet Camaro SS', price: 10000 },
            unit: 2
        }
    ];

    const cartConBmw = [
        {
            product: { _id: 'p2', name: 'BMW M4', price: 5000 },
            unit: 1
        }
    ];

    beforeAll(async () => {
        process.env.APP_SECRET = 'integration-test-secret';

        mongoServer = await MongoMemoryServer.create();
        process.env.DB_URL = mongoServer.getUri();

        const connectDatabase = require('../../src/database/models/connection');
        await connectDatabase();

        const expressApp = require('../../src/express-app');
        app = express();
        await expressApp(app);
    });

    beforeEach(async () => {
        const Order = require('../../src/database/models/order');
        await Order.deleteMany({});

        global.fetch = jest.fn((url, options = {}) => {
            const method = options.method || 'GET';

            if (url.includes('/customer/order/') && method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    status: 201,
                    json: async () => ({ id: 'order-ok', amount: 20000 })
                });
            }

            if (url.includes('/customer/cart/') && method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: async () => cartConBmw
                });
            }

            if (url.includes('/customer/cart/') && method === 'DELETE') {
                return Promise.resolve({
                    ok: true,
                    json: async () => cartConCamaro
                });
            }

            if (url.includes('/customer/cart/')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => cartConCamaro
                });
            }

            return Promise.resolve({
                ok: false,
                status: 404,
                text: async () => 'Not found'
            });
        });
    });

    afterEach(async () => {
        delete global.fetch;
    });

    afterAll(async () => {
        const mongoose = require('mongoose');
        await mongoose.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
        }
    });

    const token = () => {
        const config = require('../../src/config');
        return jwt.sign(
            { _id: 'customer-1', email: 'juan@example.com' },
            config.APP_SECRET,
            { expiresIn: '1d' }
        );
    };

    test('debe rechazar las rutas del carrito sin token', async () => {
        const res = await request(app).get('/customer/shopping-details');

        expect(res.status).toBe(401);
    });

    test('PUT /cart agrega un producto reenviándolo a customers', async () => {
        const res = await request(app)
            .put('/cart')
            .set('Authorization', `Bearer ${token()}`)
            .send({ _id: 'p2', qty: 1 });

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].product._id).toBe('p2');

        expect(global.fetch).toHaveBeenCalledWith(
            'http://c-customers:8003/customer/cart/customer-1',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ product: 'p2', qty: 1 })
            })
        );
    });

    test('PUT /cart rechaza la petición sin id de producto', async () => {
        const res = await request(app)
            .put('/cart')
            .set('Authorization', `Bearer ${token()}`)
            .send({ qty: 1 });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Product id is required');
    });

    test('PUT /cart rechaza la petición con cantidad inválida', async () => {
        const res = await request(app)
            .put('/cart')
            .set('Authorization', `Bearer ${token()}`)
            .send({ _id: 'p2', qty: 0 });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Quantity must be at least 1');
    });

    test('DELETE /cart/:productId elimina un producto del carrito', async () => {
        const res = await request(app)
            .delete('/cart/p1')
            .set('Authorization', `Bearer ${token()}`);

        expect(res.status).toBe(200);
        expect(res.body[0].product._id).toBe('p1');

        expect(global.fetch).toHaveBeenCalledWith(
            'http://c-customers:8003/customer/cart/customer-1/p1',
            expect.objectContaining({ method: 'DELETE' })
        );
    });

    test('GET /customer/shopping-details devuelve el carrito de customers', async () => {
        const res = await request(app)
            .get('/customer/shopping-details')
            .set('Authorization', `Bearer ${token()}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].product._id).toBe('p1');
    });

    test('POST /shopping/order crea la orden en la BD y la reenvía a customers', async () => {
        const res = await request(app)
            .post('/shopping/order')
            .set('Authorization', `Bearer ${token()}`)
            .send({ txnId: 'tx-1' });

        expect(res.status).toBe(201);
        expect(res.body.amount).toBe(20000);
        expect(res.body.status).toBe('received');
        expect(res.body.txnId).toBe('tx-1');

        const Order = require('../../src/database/models/order');
        const orders = await Order.find();

        expect(orders).toHaveLength(1);
        expect(orders[0].amount).toBe(20000);
        expect(orders[0].customerId).toBe('customer-1');

        expect(global.fetch).toHaveBeenCalledWith(
            'http://c-customers:8003/customer/order/customer-1',
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"txnId":"tx-1"')
            })
        );
    });

    test('POST /shopping/order rechaza el carrito vacío', async () => {
        global.fetch.mockImplementation((url, options = {}) => {
            const method = options.method || 'GET';

            if (url.includes('/customer/order/') && method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    status: 201,
                    json: async () => ({ id: 'order-ok' })
                });
            }

            return Promise.resolve({
                ok: true,
                json: async () => []
            });
        });

        const res = await request(app)
            .post('/shopping/order')
            .set('Authorization', `Bearer ${token()}`)
            .send({ txnId: 'tx-vacio' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Cart is empty');

        const Order = require('../../src/database/models/order');
        const orders = await Order.find();
        expect(orders).toHaveLength(0);
    });

});