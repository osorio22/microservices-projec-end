jest.mock('../../src/services/customer-service', () => {
    return jest.fn(() => {
        mockCustomerService = {
            GetAllCustomers: jest.fn(),
            GetCustomers: jest.fn(),
            SignUp: jest.fn(),
            SignIn: jest.fn(),
            GetProfile: jest.fn(),
            GetShopingDetails: jest.fn(),
            GetWishList: jest.fn(),
            AddToWishlist: jest.fn(),
            RemoveFromWishlist: jest.fn(),
            AddToCart: jest.fn(),
            RemoveFromCart: jest.fn(),
            GetCart: jest.fn(),
            PlaceOrder: jest.fn(),
            AddNewAddress: jest.fn()
        };
        return mockCustomerService;
    });
});

jest.mock('../../src/api/middlewares/auth', () => {
    return jest.fn((req, res, next) => {
        req.user = { _id: 'c1' };
        next();
    });
});

let mockCustomerService;

const express = require('express');
const request = require('supertest');

const customer = require('../../src/api/customer');
const HandleErrors = require('../../src/utils/error-handler');
const { NotFoundError } = require('../../src/utils/app-errors');

const app = express();
app.use(express.json());
customer(app);
app.use(HandleErrors);

describe('Customer API', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('GET /customer debe devolver los clientes', async () => {

        const customers = [
            { _id: '1', email: 'juan@gmail.com' }
        ];

        mockCustomerService.GetAllCustomers.mockResolvedValue({ data: customers });

        const res = await request(app).get('/customer');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(customers);
    });

    test('GET /customer/all debe devolver total y clientes', async () => {

        const customers = [
            { _id: '1', email: 'juan@gmail.com' }
        ];

        mockCustomerService.GetAllCustomers.mockResolvedValue({ data: customers });

        const res = await request(app).get('/customer/all');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            total: 1,
            customers
        });
    });

    test('POST /customer/signup debe crear un cliente', async () => {

        const data = {
            id: 'c1',
            token: 'jwt-token'
        };

        mockCustomerService.SignUp.mockResolvedValue({ data });

        const res = await request(app)
            .post('/customer/signup')
            .send({
                email: 'juan@gmail.com',
                password: '123456',
                phone: '3001234567'
            });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(data);
        expect(mockCustomerService.SignUp).toHaveBeenCalledWith({
            email: 'juan@gmail.com',
            password: '123456',
            phone: '3001234567'
        });
    });

    test('POST /customer/login debe devolver el token', async () => {

        const data = {
            id: 'c1',
            token: 'jwt-token'
        };

        mockCustomerService.SignIn.mockResolvedValue({ data });

        const res = await request(app)
            .post('/customer/login')
            .send({
                email: 'juan@gmail.com',
                password: '123456'
            });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(data);
        expect(mockCustomerService.SignIn).toHaveBeenCalledWith({
            email: 'juan@gmail.com',
            password: '123456'
        });
    });

    test('GET /customer/profile debe devolver el perfil autenticado', async () => {

        const profile = {
            _id: 'c1',
            email: 'juan@gmail.com'
        };

        mockCustomerService.GetProfile.mockResolvedValue({ data: profile });

        const res = await request(app)
            .get('/customer/profile')
            .set('Authorization', 'Bearer token-valido');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(profile);
        expect(mockCustomerService.GetProfile).toHaveBeenCalledWith({ _id: 'c1' });
    });

    test('GET /customer/cart/:customerId debe devolver el carrito', async () => {

        const cart = [{ product: { _id: 'p1' }, unit: 2 }];

        mockCustomerService.GetCart.mockResolvedValue({ data: cart });

        const res = await request(app)
            .get('/customer/cart/c1')
            .set('Authorization', 'Bearer token-valido');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(cart);
        expect(mockCustomerService.GetCart).toHaveBeenCalledWith('c1');
    });

    test('POST /customer/cart/:customerId debe agregar un producto al carrito', async () => {

        const cart = [{ product: { _id: 'p1' }, unit: 2 }];

        mockCustomerService.AddToCart.mockResolvedValue({ data: cart });

        const res = await request(app)
            .post('/customer/cart/c1')
            .set('Authorization', 'Bearer token-valido')
            .send({
                product: 'p1',
                qty: 2
            });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(cart);
        expect(mockCustomerService.AddToCart).toHaveBeenCalledWith('c1', 'p1', 2);
    });

    test('POST /customer/order/:customerId debe crear una orden', async () => {

        const order = {
            _id: 'o1',
            amount: 40000,
            txnId: 'tx-1'
        };

        mockCustomerService.PlaceOrder.mockResolvedValue({ data: order });

        const res = await request(app)
            .post('/customer/order/c1')
            .set('Authorization', 'Bearer token-valido')
            .send(order);

        expect(res.status).toBe(201);
        expect(res.body).toEqual(order);
        expect(mockCustomerService.PlaceOrder).toHaveBeenCalledWith('c1', order);
    });

    test('POST /customer/address debe agregar una dirección', async () => {

        const address = {
            _id: 'ad1',
            street: 'Calle 1',
            city: 'Medellín',
            country: 'Colombia'
        };

        mockCustomerService.AddNewAddress.mockResolvedValue({ data: address });

        const res = await request(app)
            .post('/customer/address')
            .set('Authorization', 'Bearer token-valido')
            .send({
                street: 'Calle 1',
                postalCode: '050001',
                city: 'Medellín',
                country: 'Colombia'
            });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(address);
        expect(mockCustomerService.AddNewAddress).toHaveBeenCalledWith('c1', {
            street: 'Calle 1',
            postalCode: '050001',
            city: 'Medellín',
            country: 'Colombia'
        });
    });

    test('debe responder 404 cuando el servicio lanza NotFoundError', async () => {

        mockCustomerService.GetProfile.mockRejectedValue(
            new NotFoundError('Data Not Found')
        );

        const res = await request(app)
            .get('/customer/profile')
            .set('Authorization', 'Bearer token-valido');

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ message: 'Data Not Found' });
    });

});