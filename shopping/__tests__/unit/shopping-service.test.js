jest.mock('../../src/database/models/order', () => ({
    create: jest.fn()
}));

const Order = require('../../src/database/models/order');
const ShoppingService = require('../../src/services/shopping-service');
const { APIError, BadRequestError } = require('../../src/utils/app-errors');

describe('Shopping Service', () => {

    let service;

    beforeEach(() => {
        service = new ShoppingService();
        global.fetch = jest.fn();
        Order.create.mockClear();
    });

    afterEach(() => {
        delete global.fetch;
    });

    describe('AddToCart', () => {

        test('debe devolver el carrito actualizado', async () => {

            const cart = {
                cart: [
                    {
                        product: { _id: 'p1', price: 10000 },
                        unit: 2
                    }
                ]
            };

            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => cart
            });

            const result = await service.AddToCart('c1', 'p1', 2, 'token');

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ data: cart });
        });

        test('debe lanzar APIError cuando la respuesta falla', async () => {

            global.fetch.mockResolvedValue({
                ok: false,
                status: 500,
                text: async () => 'DB error'
            });

            await expect(
                service.AddToCart('c1', 'p1', 2, 'token')
            ).rejects.toBeInstanceOf(APIError);
        });

    });

    describe('RemoveFromCart', () => {

        test('debe devolver el carrito actualizado', async () => {

            const cart = { cart: [] };

            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => cart
            });

            const result = await service.RemoveFromCart('c1', 'p1', 'token');

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ data: cart });
        });

        test('debe lanzar APIError cuando la respuesta falla', async () => {

            global.fetch.mockResolvedValue({
                ok: false,
                status: 404,
                text: async () => 'Not found'
            });

            await expect(
                service.RemoveFromCart('c1', 'p1', 'token')
            ).rejects.toBeInstanceOf(APIError);
        });

    });

    describe('PlaceOrder', () => {

        test('debe crear una orden con el total del carrito', async () => {

            const cart = [
                {
                    product: { _id: 'p1', price: 10000 },
                    unit: 2
                }
            ];

            const order = {
                _id: 'order-1',
                customerId: 'c1',
                amount: 20000,
                txnId: 'tx-1',
                status: 'received',
                items: cart
            };

            jest.spyOn(service, 'GetCart').mockResolvedValue({ data: cart });
            Order.create.mockResolvedValue(order);
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => order
            });

            const result = await service.PlaceOrder('c1', 'tx-1', 'token');

            expect(Order.create).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledWith(
                'http://c-customers:8003/customer/order/c1',
                expect.objectContaining({ method: 'POST' })
            );
            expect(result).toEqual({ data: order });
        });

        test('debe lanzar APIError si customers rechaza la orden', async () => {

            const cart = [
                {
                    product: { _id: 'p1', price: 10000 },
                    unit: 2
                }
            ];

            jest.spyOn(service, 'GetCart').mockResolvedValue({ data: cart });
            Order.create.mockResolvedValue({ _id: 'order-1' });
            global.fetch.mockResolvedValue({
                ok: false,
                status: 400,
                text: async () => 'bad request'
            });

            await expect(
                service.PlaceOrder('c1', 'tx-1', 'token')
            ).rejects.toBeInstanceOf(APIError);
        });

        test('debe lanzar BadRequestError cuando el carrito está vacío', async () => {

            jest.spyOn(service, 'GetCart').mockResolvedValue({ data: [] });

            await expect(
                service.PlaceOrder('c1', 'tx-1', 'token')
            ).rejects.toBeInstanceOf(BadRequestError);

            expect(Order.create).not.toHaveBeenCalled();
        });

    });

});