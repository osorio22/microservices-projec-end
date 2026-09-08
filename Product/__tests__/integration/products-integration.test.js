const request = require('supertest');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

jest.setTimeout(120000);

describe('Products Integration (API real + MongoDB real)', () => {

    let mongoServer;
    let app;

    const productData = {
        name: 'BMW Serie 5',
        desc: 'Sedán alemán de lujo',
        type: 'sedan',
        banner: 'https://images.unsplash.com/photo-1747868329766-3f63cb760bb0',
        price: 18000,
        available: true
    };

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        process.env.DB_URL = mongoServer.getUri();

        await mongoose.connect(process.env.DB_URL);

        const expressApp = require('../../src/express-app');
        app = express();
        await expressApp(app);
    });

    beforeEach(async () => {
        const { ProductModel } = require('../../src/database/models');
        await ProductModel.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
        }
    });

    test('GET /products devuelve la lista vacía al inicio', async () => {
        const res = await request(app).get('/products');

        expect(res.status).toBe(200);
        expect(res.body.products).toHaveLength(0);
        expect(res.body.categories).toHaveLength(0);
    });

    test('POST /products crea un producto', async () => {
        const res = await request(app)
            .post('/products')
            .send(productData);

        expect(res.status).toBe(201);
        expect(res.body._id).toBeDefined();
        expect(res.body.name).toBe('BMW Serie 5');
        expect(res.body.price).toBe(18000);
    });

    test('GET /products devuelve los productos y sus categorías', async () => {
        await request(app).post('/products').send(productData);
        await request(app).post('/products').send({
            ...productData,
            name: 'Chevrolet Camaro SS',
            type: 'sport',
            price: 45000
        });

        const res = await request(app).get('/products');

        expect(res.status).toBe(200);
        expect(res.body.products).toHaveLength(2);
        expect(res.body.categories.sort()).toEqual(['sedan', 'sport']);
    });

    test('GET /products/:id devuelve un producto por su id', async () => {
        const created = await request(app).post('/products').send(productData);
        const id = created.body._id;

        const res = await request(app).get(`/products/${id}`);

        expect(res.status).toBe(200);
        expect(res.body._id).toBe(id);
        expect(res.body.name).toBe('BMW Serie 5');
    });

    test('GET /products/:id devuelve 404 con un id inexistente', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();

        const res = await request(app).get(`/products/${fakeId}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Product not found');
    });

});