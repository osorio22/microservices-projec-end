jest.mock('../../src/database/models', () => {
    const CustomerModel = jest.fn();
    CustomerModel.find = jest.fn();
    CustomerModel.findById = jest.fn();
    CustomerModel.findOne = jest.fn();
    CustomerModel.create = jest.fn();

    const AddressModel = jest.fn();
    AddressModel.create = jest.fn();

    return {
        CustomerModel,
        AddressModel
    };
});

const {
    CustomerModel,
    AddressModel
} = require('../../src/database/models');
const CustomerRepository = require('../../src/database/repository/customer-repository');
const { APIError, BadRequestError } = require('../../src/utils/app-errors');

const makeCustomer = () => ({
    _id: 'c1',
    email: 'juan@gmail.com',
    address: [],
    cart: [],
    wishlist: [],
    orders: [],
    save: jest.fn().mockResolvedValue(true)
});

describe('Customer Repository', () => {

    let repository;

    beforeEach(() => {
        jest.clearAllMocks();
        repository = new CustomerRepository();
    });

    test('GetAllCustomers debe devolver los clientes sin password ni salt', async () => {

        const customers = [
            { _id: '1', email: 'juan@gmail.com' }
        ];

        const query = {
            select: jest.fn().mockResolvedValue(customers)
        };

        CustomerModel.find.mockReturnValue(query);

        const result = await repository.GetAllCustomers();

        expect(CustomerModel.find).toHaveBeenCalled();
        expect(query.select).toHaveBeenCalledWith('-password -salt');
        expect(result).toEqual(customers);
    });

    describe('CreateCustomer', () => {

        test('debe crear un cliente', async () => {

            const customer = {
                _id: 'c1',
                email: 'juan@gmail.com',
                password: 'hash',
                salt: 'salt',
                phone: '3001234567'
            };

            CustomerModel.create.mockResolvedValue(customer);

            const result = await repository.CreateCustomer({
                email: 'juan@gmail.com',
                password: 'hash',
                salt: 'salt',
                phone: '3001234567'
            });

            expect(CustomerModel.create).toHaveBeenCalled();
            expect(result).toEqual(customer);
        });

        test('debe lanzar BadRequestError cuando el email ya existe', async () => {

            const duplicate = new Error('Duplicate key');
            duplicate.code = 11000;

            CustomerModel.create.mockRejectedValue(duplicate);

            await expect(
                repository.CreateCustomer({
                    email: 'juan@gmail.com',
                    password: 'hash',
                    salt: 'salt',
                    phone: '3001234567'
                })
            ).rejects.toBeInstanceOf(BadRequestError);
        });

        test('debe lanzar APIError para otros errores', async () => {

            CustomerModel.create.mockRejectedValue(new Error('DB down'));

            await expect(
                repository.CreateCustomer({
                    email: 'juan@gmail.com',
                    password: 'hash',
                    salt: 'salt',
                    phone: '3001234567'
                })
            ).rejects.toBeInstanceOf(APIError);
        });

    });

    test('FindCustomer debe buscar por email', async () => {

        const customer = makeCustomer();

        CustomerModel.findOne.mockResolvedValue(customer);

        const result = await repository.FindCustomer({ email: 'juan@gmail.com' });

        expect(CustomerModel.findOne).toHaveBeenCalledWith({
            email: 'juan@gmail.com'
        });
        expect(result).toEqual(customer);
    });

    describe('AddNewAddress', () => {

        test('debe agregar una dirección y guardar el cliente', async () => {

            const customer = makeCustomer();
            const address = {
                _id: 'ad1',
                street: 'Calle 1',
                city: 'Medellín',
                country: 'Colombia'
            };

            CustomerModel.findById.mockResolvedValue(customer);
            AddressModel.create.mockResolvedValue(address);

            const result = await repository.AddNewAddress('c1', {
                street: 'Calle 1',
                postalCode: '050001',
                city: 'Medellín',
                country: 'Colombia'
            });

            expect(AddressModel.create).toHaveBeenCalled();
            expect(customer.address).toEqual(['ad1']);
            expect(customer.save).toHaveBeenCalled();
            expect(result).toEqual(address);
        });

        test('debe lanzar BadRequestError cuando el cliente no existe', async () => {

            CustomerModel.findById.mockResolvedValue(null);

            await expect(
                repository.AddNewAddress('nope', {
                    street: 'Calle 1',
                    city: 'Medellín',
                    country: 'Colombia'
                })
            ).rejects.toBeInstanceOf(BadRequestError);
        });

    });

    describe('GetWishList', () => {

        test('debe devolver la wishlist del cliente', async () => {

            const customer = makeCustomer();
            customer.wishlist = [{ _id: 'p1', name: 'Mouse' }];

            CustomerModel.findById.mockResolvedValue(customer);

            const result = await repository.GetWishList('c1');

            expect(result).toEqual(customer.wishlist);
        });

        test('debe lanzar BadRequestError cuando el cliente no existe', async () => {

            CustomerModel.findById.mockResolvedValue(null);

            await expect(
                repository.GetWishList('nope')
            ).rejects.toBeInstanceOf(BadRequestError);
        });

    });

    describe('AddToWishlist', () => {

        test('debe agregar un producto a la wishlist', async () => {

            const customer = makeCustomer();

            CustomerModel.findById.mockResolvedValue(customer);

            const result = await repository.AddToWishlist('c1', {
                _id: 'p1',
                name: 'Mouse',
                price: 20000
            });

            expect(customer.wishlist).toHaveLength(1);
            expect(customer.wishlist[0]).toEqual({
                _id: 'p1',
                name: 'Mouse',
                price: 20000
            });
            expect(customer.save).toHaveBeenCalled();
            expect(result).toEqual(customer.wishlist);
        });

        test('no debe duplicar un producto que ya está en la wishlist', async () => {

            const customer = makeCustomer();
            customer.wishlist = [{ _id: 'p1', name: 'Mouse' }];

            CustomerModel.findById.mockResolvedValue(customer);

            await repository.AddToWishlist('c1', {
                _id: 'p1',
                name: 'Mouse',
                price: 20000
            });

            expect(customer.wishlist).toHaveLength(1);
            expect(customer.save).not.toHaveBeenCalled();
        });

    });

    describe('RemoveFromWishlist', () => {

        test('debe eliminar un producto de la wishlist', async () => {

            const customer = makeCustomer();
            customer.wishlist = [
                { _id: 'p1', name: 'Mouse' },
                { _id: 'p2', name: 'Teclado' }
            ];

            CustomerModel.findById.mockResolvedValue(customer);

            const result = await repository.RemoveFromWishlist('c1', 'p1');

            expect(result).toEqual([{ _id: 'p2', name: 'Teclado' }]);
            expect(customer.save).toHaveBeenCalled();
        });

    });

    describe('AddToCart', () => {

        test('debe agregar un producto nuevo al carrito', async () => {

            const customer = makeCustomer();

            CustomerModel.findById.mockResolvedValue(customer);

            const result = await repository.AddToCart(
                'c1',
                { _id: 'p1', name: 'Mouse', price: 20000 },
                2
            );

            expect(customer.cart).toHaveLength(1);
            expect(customer.cart[0]).toEqual({
                product: { _id: 'p1', name: 'Mouse', price: 20000 },
                unit: 2
            });
            expect(customer.save).toHaveBeenCalled();
            expect(result).toEqual(customer.cart);
        });

        test('debe actualizar la cantidad de un producto existente', async () => {

            const customer = makeCustomer();
            customer.cart = [
                {
                    product: { _id: 'p1', name: 'Mouse', price: 20000 },
                    unit: 1
                }
            ];

            CustomerModel.findById.mockResolvedValue(customer);

            const result = await repository.AddToCart(
                'c1',
                { _id: 'p1', name: 'Mouse', price: 20000 },
                5
            );

            expect(customer.cart).toHaveLength(1);
            expect(customer.cart[0].unit).toBe(5);
            expect(result).toEqual(customer.cart);
        });

        test('debe lanzar BadRequestError si el producto no tiene _id', async () => {

            const customer = makeCustomer();

            CustomerModel.findById.mockResolvedValue(customer);

            await expect(
                repository.AddToCart('c1', { name: 'Mouse' }, 2)
            ).rejects.toBeInstanceOf(BadRequestError);
        });

    });

    describe('RemoveFromCart', () => {

        test('debe eliminar un producto del carrito', async () => {

            const customer = makeCustomer();
            customer.cart = [
                { product: { _id: 'p1' }, unit: 2 },
                { product: { _id: 'p2' }, unit: 1 }
            ];

            CustomerModel.findById.mockResolvedValue(customer);

            const result = await repository.RemoveFromCart('c1', 'p1');

            expect(result).toEqual([
                { product: { _id: 'p2' }, unit: 1 }
            ]);
            expect(customer.save).toHaveBeenCalled();
        });

    });

    describe('GetCart', () => {

        test('debe devolver el carrito del cliente', async () => {

            const customer = makeCustomer();
            customer.cart = [{ product: { _id: 'p1' }, unit: 2 }];

            CustomerModel.findById.mockResolvedValue(customer);

            const result = await repository.GetCart('c1');

            expect(result).toEqual(customer.cart);
        });

        test('debe lanzar BadRequestError cuando el cliente no existe', async () => {

            CustomerModel.findById.mockResolvedValue(null);

            await expect(
                repository.GetCart('nope')
            ).rejects.toBeInstanceOf(BadRequestError);
        });

    });

    describe('PlaceOrder', () => {

        test('debe registrar la orden y vaciar el carrito', async () => {

            const customer = makeCustomer();
            customer.cart = [{ product: { _id: 'p1' }, unit: 2 }];

            const order = {
                _id: 'o1',
                amount: 40000,
                txnId: 'tx-1'
            };

            CustomerModel.findById.mockResolvedValue(customer);

            const result = await repository.PlaceOrder('c1', order);

            expect(customer.orders).toEqual([order]);
            expect(customer.cart).toEqual([]);
            expect(customer.save).toHaveBeenCalled();
            expect(result).toEqual(order);
        });

        test('debe lanzar BadRequestError cuando el cliente no existe', async () => {

            CustomerModel.findById.mockResolvedValue(null);

            await expect(
                repository.PlaceOrder('nope', {})
            ).rejects.toBeInstanceOf(BadRequestError);
        });

    });

});