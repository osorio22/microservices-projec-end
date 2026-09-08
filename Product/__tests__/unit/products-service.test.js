jest.mock('../../src/database', () => {
    return {
        ProductRepository: jest.fn(() => ({
            FindAll: jest.fn(),
            FindById: jest.fn(),
            Create: jest.fn()
        }))
    };
});

const ProductsService = require('../../src/services/products-service');
const { ProductRepository } = require('../../src/database');
const { APIError, NotFoundError } = require('../../src/utils/app-errors');

describe('Products Service', () => {

    let service;

    beforeEach(() => {
        ProductRepository.mockClear();
        service = new ProductsService();
    });

    describe('GetProducts', () => {

        test('debe devolver los productos y sus categorías', async () => {

            const products = [
                { _id: '1', name: 'Mouse', type: 'Accesorios' },
                { _id: '2', name: 'Teclado', type: 'Accesorios' },
                { _id: '3', name: 'Laptop', type: 'Computadores' }
            ];

            service.repository.FindAll.mockResolvedValue(products);

            const result = await service.GetProducts();

            expect(service.repository.FindAll).toHaveBeenCalled();
            expect(result).toEqual({
                data: {
                    products,
                    categories: ['Accesorios', 'Computadores']
                }
            });
        });

        test('debe lanzar APIError si el repositorio falla', async () => {

            service.repository.FindAll.mockRejectedValue(
                new Error('DB down')
            );

            await expect(
                service.GetProducts()
            ).rejects.toBeInstanceOf(APIError);
        });

    });

    describe('GetProductById', () => {

        test('debe devolver un producto', async () => {

            const product = {
                _id: 'abc',
                name: 'Mouse',
                type: 'Accesorios',
                price: 20000
            };

            service.repository.FindById.mockResolvedValue(product);

            const result = await service.GetProductById('abc');

            expect(service.repository.FindById).toHaveBeenCalledWith('abc');
            expect(result).toEqual({ data: product });
        });

        test('debe propagar los errores NotFoundError', async () => {

            service.repository.FindById.mockRejectedValue(
                new NotFoundError('Product not found')
            );

            await expect(
                service.GetProductById('nope')
            ).rejects.toBeInstanceOf(NotFoundError);
        });

        test('debe lanzar APIError si el repositorio falla', async () => {

            service.repository.FindById.mockRejectedValue(
                new Error('DB down')
            );

            await expect(
                service.GetProductById('abc')
            ).rejects.toBeInstanceOf(APIError);
        });

    });

    describe('CreateProduct', () => {

        test('debe crear un producto', async () => {

            const input = {
                name: 'Teclado',
                type: 'Accesorios',
                price: 50000
            };

            const saved = {
                _id: 'n1',
                ...input
            };

            service.repository.Create.mockResolvedValue(saved);

            const result = await service.CreateProduct(input);

            expect(service.repository.Create).toHaveBeenCalledWith(input);
            expect(result).toEqual({ data: saved });
        });

        test('debe lanzar APIError si el repositorio falla', async () => {

            service.repository.Create.mockRejectedValue(
                new Error('Validation error')
            );

            await expect(
                service.CreateProduct({})
            ).rejects.toBeInstanceOf(APIError);
        });

    });

});