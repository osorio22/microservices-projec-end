jest.mock('../../src/database', () => {
    return {
        CustomerRepository: jest.fn(() => ({
            GetAllCustomers: jest.fn(),
            GetCustomers: jest.fn(),
            FindCustomer: jest.fn(),
            CreateCustomer: jest.fn(),
            AddNewAddress: jest.fn(),
            GetProfile: jest.fn(),
            GetWishList: jest.fn(),
            AddToWishlist: jest.fn(),
            RemoveFromWishlist: jest.fn(),
            AddToCart: jest.fn(),
            RemoveFromCart: jest.fn(),
            GetCart: jest.fn(),
            PlaceOrder: jest.fn()
        }))
    };
});

jest.mock('../../src/utils', () => {
    const actual = jest.requireActual('../../src/utils');

    return {
        ...actual,
        GenerateSalt: jest.fn(),
        GeneratePassword: jest.fn(),
        GenerateSignature: jest.fn(),
        ValidatePassword: jest.fn()
    };
});

const CustomerService = require('../../src/services/customer-service');
const { CustomerRepository } = require('../../src/database');
const {
    GenerateSalt,
    GeneratePassword,
    GenerateSignature,
    ValidatePassword
} = require('../../src/utils');
const { APIError, BadRequestError } = require('../../src/utils/app-errors');

describe('Customer Service', () => {

    let service;

    beforeEach(() => {
        CustomerRepository.mockClear();
        jest.clearAllMocks();
        service = new CustomerService();
    });

    describe('GetAllCustomers', () => {

        test('debe devolver todos los clientes', async () => {

            const customers = [
                { _id: '1', email: 'juan@gmail.com' }
            ];

            service.repository.GetAllCustomers.mockResolvedValue(customers);

            const result = await service.GetAllCustomers();

            expect(service.repository.GetAllCustomers).toHaveBeenCalled();
            expect(result).toEqual({ data: customers });
        });

        test('debe lanzar APIError 404 si el repositorio falla', async () => {

            service.repository.GetAllCustomers.mockRejectedValue(
                new Error('DB down')
            );

            await expect(
                service.GetAllCustomers()
            ).rejects.toBeInstanceOf(APIError);
        });

    });

    describe('GetCustomers', () => {

        test('debe devolver los clientes con su dirección', async () => {

            const customers = [
                { _id: '1', email: 'juan@gmail.com', address: [] }
            ];

            service.repository.GetCustomers.mockResolvedValue(customers);

            const result = await service.GetCustomers();

            expect(result).toEqual({ data: customers });
        });

    });

    describe('SignUp', () => {

        test('debe crear un cliente y devolver id y token', async () => {

            const existingCustomer = {
                _id: 'c1',
                email: 'juan@gmail.com'
            };

            GenerateSalt.mockResolvedValue('salt');
            GeneratePassword.mockResolvedValue('password-hash');
            GenerateSignature.mockResolvedValue('jwt-token');

            service.repository.CreateCustomer.mockResolvedValue(existingCustomer);

            const result = await service.SignUp({
                email: 'juan@gmail.com',
                password: '123456',
                phone: '3001234567'
            });

            expect(GenerateSalt).toHaveBeenCalled();
            expect(GeneratePassword).toHaveBeenCalledWith('123456', 'salt');
            expect(service.repository.CreateCustomer).toHaveBeenCalledWith({
                email: 'juan@gmail.com',
                password: 'password-hash',
                phone: '3001234567',
                salt: 'salt'
            });
            expect(result).toEqual({
                data: {
                    id: 'c1',
                    token: 'jwt-token'
                }
            });
        });

        test('debe lanzar APIError si el repositorio falla', async () => {

            GenerateSalt.mockResolvedValue('salt');
            GeneratePassword.mockResolvedValue('hash');

            service.repository.CreateCustomer.mockRejectedValue(
                new Error('DB down')
            );

            await expect(
                service.SignUp({
                    email: 'a@a.com',
                    password: '123',
                    phone: '1'
                })
            ).rejects.toBeInstanceOf(APIError);
        });

    });

    describe('SignIn', () => {

        test('debe devolver id y token con credenciales válidas', async () => {

            const existingCustomer = {
                _id: 'c1',
                email: 'juan@gmail.com',
                password: 'hash',
                salt: 'salt'
            };

            ValidatePassword.mockResolvedValue(true);
            GenerateSignature.mockResolvedValue('jwt-token');

            service.repository.FindCustomer.mockResolvedValue(existingCustomer);

            const result = await service.SignIn({
                email: 'juan@gmail.com',
                password: '123456'
            });

            expect(service.repository.FindCustomer).toHaveBeenCalledWith({
                email: 'juan@gmail.com'
            });
            expect(result).toEqual({
                data: {
                    id: 'c1',
                    token: 'jwt-token'
                }
            });
        });

        test('debe lanzar BadRequestError con credenciales inválidas', async () => {

            const existingCustomer = {
                _id: 'c1',
                email: 'juan@gmail.com',
                password: 'hash',
                salt: 'salt'
            };

            ValidatePassword.mockResolvedValue(false);

            service.repository.FindCustomer.mockResolvedValue(existingCustomer);

            await expect(
                service.SignIn({
                    email: 'juan@gmail.com',
                    password: 'incorrecta'
                })
            ).rejects.toBeInstanceOf(BadRequestError);
        });

        test('debe lanzar BadRequestError cuando el cliente no existe', async () => {

            service.repository.FindCustomer.mockResolvedValue(null);

            await expect(
                service.SignIn({
                    email: 'noexiste@mail.com',
                    password: '123456'
                })
            ).rejects.toBeInstanceOf(BadRequestError);
        });

    });

    describe('AddNewAddress', () => {

        test('debe agregar una dirección al cliente', async () => {

            const address = {
                _id: 'ad1',
                street: 'Calle 1',
                city: 'Medellín',
                country: 'Colombia'
            };

            service.repository.AddNewAddress.mockResolvedValue(address);

            const result = await service.AddNewAddress('c1', {
                street: 'Calle 1',
                postalCode: '050001',
                city: 'Medellín',
                country: 'Colombia'
            });

            expect(service.repository.AddNewAddress).toHaveBeenCalledWith('c1', {
                street: 'Calle 1',
                postalCode: '050001',
                city: 'Medellín',
                country: 'Colombia'
            });
            expect(result).toEqual({ data: address });
        });

    });

    describe('GetProfile', () => {

        test('debe devolver el perfil del cliente', async () => {

            const profile = {
                _id: 'c1',
                email: 'juan@gmail.com'
            };

            service.repository.GetProfile.mockResolvedValue(profile);

            const result = await service.GetProfile({ _id: 'c1' });

            expect(service.repository.GetProfile).toHaveBeenCalledWith('c1');
            expect(result).toEqual({ data: profile });
        });

    });

    describe('GetShopingDetails', () => {

        test('debe devolver carrito, wishlist y órdenes', async () => {

            const profile = {
                cart: [{ product: { _id: 'p1' }, unit: 1 }],
                wishlist: [],
                orders: []
            };

            service.repository.GetProfile.mockResolvedValue(profile);

            const result = await service.GetShopingDetails('c1');

            expect(result).toEqual({
                data: {
                    cart: profile.cart,
                    wishlist: profile.wishlist,
                    orders: profile.orders
                }
            });
        });

    });

    describe('GetWishList', () => {

        test('debe devolver la wishlist del cliente', async () => {

            const wishlist = [{ _id: 'p1', name: 'Mouse' }];

            service.repository.GetWishList.mockResolvedValue(wishlist);

            const result = await service.GetWishList('c1');

            expect(result).toEqual({ data: wishlist });
        });

    });

    describe('AddToWishlist', () => {

        test('debe agregar un producto a la wishlist', async () => {

            const wishlist = [{ _id: 'p1', name: 'Mouse' }];

            service.repository.AddToWishlist.mockResolvedValue(wishlist);

            const result = await service.AddToWishlist(
                'c1',
                { _id: 'p1', name: 'Mouse' }
            );

            expect(service.repository.AddToWishlist).toHaveBeenCalledWith(
                'c1',
                { _id: 'p1', name: 'Mouse' }
            );
            expect(result).toEqual({ data: wishlist });
        });

    });

    describe('RemoveFromWishlist', () => {

        test('debe eliminar un producto de la wishlist', async () => {

            service.repository.RemoveFromWishlist.mockResolvedValue([]);

            const result = await service.RemoveFromWishlist('c1', 'p1');

            expect(service.repository.RemoveFromWishlist).toHaveBeenCalledWith(
                'c1',
                'p1'
            );
            expect(result).toEqual({ data: [] });
        });

    });

    describe('AddToCart', () => {

        test('debe consultar el producto en Products y agregarlo al carrito', async () => {

            const cart = [{ product: { _id: 'p1' }, unit: 2 }];

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ _id: 'p1', name: 'Mouse', price: 20000 })
            });

            service.repository.AddToCart.mockResolvedValue(cart);

            const result = await service.AddToCart('c1', 'p1', 2);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://c-products:8002/products/p1'
            );
            expect(service.repository.AddToCart).toHaveBeenCalledWith(
                'c1',
                { _id: 'p1', name: 'Mouse', price: 20000 },
                2
            );
            expect(result).toEqual({ data: cart });

            delete global.fetch;
        });

        test('debe lanzar APIError si el producto no existe', async () => {

            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 404
            });

            await expect(
                service.AddToCart('c1', 'p1', 2)
            ).rejects.toBeInstanceOf(APIError);

            expect(service.repository.AddToCart).not.toHaveBeenCalled();

            delete global.fetch;
        });

    });

    describe('RemoveFromCart', () => {

        test('debe eliminar un producto del carrito', async () => {

            service.repository.RemoveFromCart.mockResolvedValue([]);

            const result = await service.RemoveFromCart('c1', 'p1');

            expect(result).toEqual({ data: [] });
        });

    });

    describe('GetCart', () => {

        test('debe devolver el carrito del cliente', async () => {

            const cart = [{ product: { _id: 'p1' }, unit: 1 }];

            service.repository.GetCart.mockResolvedValue(cart);

            const result = await service.GetCart('c1');

            expect(result).toEqual({ data: cart });
        });

    });

    describe('PlaceOrder', () => {

        test('debe crear una orden', async () => {

            const order = {
                _id: 'o1',
                amount: 40000,
                txnId: 'tx-1'
            };

            service.repository.PlaceOrder.mockResolvedValue(order);

            const result = await service.PlaceOrder('c1', order);

            expect(service.repository.PlaceOrder).toHaveBeenCalledWith('c1', order);
            expect(result).toEqual({ data: order });
        });

    });

});