const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

jest.setTimeout(120000);

describe('Customers Integration (API real + MongoDB real)', () => {

    let mongoServer;
    let app;

    beforeAll(async () => {
        process.env.APP_SECRET = 'integration-test-secret';

        mongoServer = await MongoMemoryServer.create();
        process.env.DB_URL = mongoServer.getUri();

        await mongoose.connect(process.env.DB_URL);

        const expressApp = require('../../src/express-app');
        app = express();
        await expressApp(app);
    });

    afterEach(async () => {
        delete global.fetch;
    });

    afterAll(async () => {
        await mongoose.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
        }
    });

    const signupUser = async (email = 'juan@example.com') => {
        const res = await request(app)
            .post('/customer/signup')
            .send({ email, password: '123456', phone: '3001234567' });

        expect(res.status).toBe(201);
        return res.body;
    };

    const addToCart = async (customerId, token, productId = 'p1') => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                _id: productId,
                name: 'BMW M3 Competition',
                desc: 'Sedán deportivo',
                type: 'sedan',
                banner: 'https://example.com/bmw.png',
                price: 18000,
                available: true
            })
        });

        return request(app)
            .post(`/customer/cart/${customerId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ product: productId, qty: 2 });
    };

    test('debe permitir registrarse y devolver un token válido', async () => {
        const { id, token } = await signupUser('registro@example.com');

        expect(id).toBeDefined();
        expect(token).toBeDefined();

        const decoded = jwt.verify(token, process.env.APP_SECRET);
        expect(decoded._id).toBe(id);
    });

    test('debe permitir iniciar sesión con credenciales válidas', async () => {
        const email = 'login@example.com';
        await signupUser(email);

        const res = await request(app)
            .post('/customer/login')
            .send({ email, password: '123456' });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    test('debe rechazar el login con credenciales inválidas', async () => {
        const email = 'login-error@example.com';
        await signupUser(email);

        const res = await request(app)
            .post('/customer/login')
            .send({ email, password: 'incorrecta' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid credentials');
    });

    test('debe rechazar el registro con un email duplicado', async () => {
        const email = 'duplicado@example.com';
        await signupUser(email);

        const res = await request(app)
            .post('/customer/signup')
            .send({ email, password: '123456', phone: '3000000000' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Email already registered');
    });

    test('debe rechazar /customer/profile sin token', async () => {
        const res = await request(app).get('/customer/profile');

        expect(res.status).toBe(401);
    });

    test('debe devolver el perfil con un token válido', async () => {
        const email = 'perfil@example.com';
        const { token } = await signupUser(email);

        const res = await request(app)
            .get('/customer/profile')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.email).toBe(email);
        expect(Array.isArray(res.body.cart)).toBe(true);
        expect(Array.isArray(res.body.wishlist)).toBe(true);
    });

    test('debe agregar y luego eliminar productos de la wishlist', async () => {
        const { token } = await signupUser('wishlist@example.com');

        const add = await request(app)
            .put('/customer/wishlist')
            .set('Authorization', `Bearer ${token}`)
            .send({ product: { _id: 'p1', name: 'Chevrolet Camaro SS', price: 45000 } });

        expect(add.status).toBe(200);
        expect(add.body).toHaveLength(1);
        expect(add.body[0]._id).toBe('p1');
        expect(add.body[0].name).toBe('Chevrolet Camaro SS');

        const get = await request(app)
            .get('/customer/wishlist')
            .set('Authorization', `Bearer ${token}`);

        expect(get.status).toBe(200);
        expect(get.body).toHaveLength(1);

        const del = await request(app)
            .delete('/customer/wishlist/p1')
            .set('Authorization', `Bearer ${token}`);

        expect(del.status).toBe(200);
        expect(del.body).toHaveLength(0);
    });

    test('debe agregar un producto al carrito (obteniéndolo desde catálogo)', async () => {
        const email = 'carrito@example.com';
        const { id, token } = await signupUser(email);

        const res = await addToCart(id, token, 'p1');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].product._id).toBe('p1');
        expect(res.body[0].unit).toBe(2);

        const details = await request(app)
            .get('/customer/shopping-details')
            .set('Authorization', `Bearer ${token}`);

        expect(details.status).toBe(200);
        expect(details.body.cart).toHaveLength(1);
        expect(details.body.wishlist).toHaveLength(0);
        expect(details.body.orders).toHaveLength(0);
    });

    test('debe registrar una orden y vaciar el carrito', async () => {
        const email = 'orden@example.com';
        const { id, token } = await signupUser(email);

        await addToCart(id, token, 'p1');

        const res = await request(app)
            .post(`/customer/order/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                _id: 'order-1',
                amount: 36000,
                txnId: 'tx-1',
                status: 'received',
                items: []
            });

        expect(res.status).toBe(201);
        expect(res.body._id).toBe('order-1');

        const details = await request(app)
            .get('/customer/shopping-details')
            .set('Authorization', `Bearer ${token}`);

        expect(details.body.cart).toHaveLength(0);
        expect(details.body.orders).toHaveLength(1);
        expect(details.body.orders[0]._id).toBe('order-1');
    });

    test('debe agregar una dirección y reflejarla en el perfil', async () => {
        const email = 'direccion@example.com';
        const { token } = await signupUser(email);

        const res = await request(app)
            .post('/customer/address')
            .set('Authorization', `Bearer ${token}`)
            .send({ street: 'Calle 1', postalCode: '11001', city: 'Bogotá', country: 'CO' });

        expect(res.status).toBe(201);
        expect(res.body.street).toBe('Calle 1');

        const profile = await request(app)
            .get('/customer/profile')
            .set('Authorization', `Bearer ${token}`);

        expect(profile.status).toBe(200);
        expect(profile.body.address).toHaveLength(1);
        expect(profile.body.address[0].street).toBe('Calle 1');
    });

});