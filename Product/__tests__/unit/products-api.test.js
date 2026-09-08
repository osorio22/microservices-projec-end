jest.mock('../../src/services/products-service', () => {
    return jest.fn(() => {
        mockService = {
            GetProducts: jest.fn(),
            GetProductById: jest.fn(),
            CreateProduct: jest.fn()
        };
        return mockService;
    });
});

let mockService;

const express = require('express');
const request = require('supertest');

const productsRouter = require('../../src/api/products');
const HandleErrors = require('../../src/utils/error-handler');
const { NotFoundError } = require('../../src/utils/app-errors');

const app = express();
app.use(express.json());
app.use('/products', productsRouter);
app.use(HandleErrors);

describe('Products API', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /products', () => {

        test('debe devolver los productos', async () => {

            const data = {
                products: [
                    { _id: '1', name: 'Mouse', price: 20000 }
                ],
                categories: ['Accesorios']
            };

            mockService.GetProducts.mockResolvedValue({ data });

            const res = await request(app).get('/products');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(data);
        });

        test('debe responder 500 cuando el servicio falla', async () => {

            mockService.GetProducts.mockRejectedValue(new Error('DB down'));

            const res = await request(app).get('/products');

            expect(res.status).toBe(500);
        });

    });

    describe('GET /products/:id', () => {

        test('debe devolver un producto', async () => {

            const data = {
                _id: 'abc',
                name: 'Teclado',
                type: 'Accesorios',
                price: 50000
            };

            mockService.GetProductById.mockResolvedValue({ data });

            const res = await request(app).get('/products/abc');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(data);
            expect(mockService.GetProductById).toHaveBeenCalledWith('abc');
        });

        test('debe responder 404 cuando el producto no existe', async () => {

            mockService.GetProductById.mockRejectedValue(
                new NotFoundError('Product not found')
            );

            const res = await request(app).get('/products/nope');

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ message: 'Product not found' });
        });

    });

    describe('POST /products', () => {

        test('debe crear un producto', async () => {

            const input = {
                name: 'Laptop',
                type: 'Computadores',
                price: 2000000
            };

            const data = {
                _id: 'n1',
                ...input
            };

            mockService.CreateProduct.mockResolvedValue({ data });

            const res = await request(app).post('/products').send(input);

            expect(res.status).toBe(201);
            expect(res.body).toEqual(data);
            expect(mockService.CreateProduct).toHaveBeenCalledWith(input);
        });

    });

});