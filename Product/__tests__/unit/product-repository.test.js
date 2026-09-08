jest.mock('../../src/database/models', () => {
    const ProductModel = jest.fn((data) => {
        return {
            ...data,
            save: jest.fn()
        };
    });

    ProductModel.find = jest.fn();
    ProductModel.findById = jest.fn();

    return { ProductModel };
});

const { ProductModel } = require('../../src/database/models');
const ProductRepository = require('../../src/database/repository/product-repository');
const { NotFoundError } = require('../../src/utils/app-errors');

describe('Product Repository', () => {

    let repository;

    beforeEach(() => {
        jest.clearAllMocks();
        repository = new ProductRepository();
    });

    test('FindAll debe devolver los productos', async () => {

        const products = [
            { _id: '1', name: 'Mouse', type: 'Accesorios', price: 20000 }
        ];

        ProductModel.find.mockResolvedValue(products);

        const result = await repository.FindAll();

        expect(ProductModel.find).toHaveBeenCalledWith({});
        expect(result).toEqual(products);
    });

    test('FindById debe devolver un producto', async () => {

        const product = {
            _id: 'abc',
            name: 'Teclado',
            type: 'Accesorios',
            price: 50000
        };

        ProductModel.findById.mockResolvedValue(product);

        const result = await repository.FindById('abc');

        expect(ProductModel.findById).toHaveBeenCalledWith('abc');
        expect(result).toEqual(product);
    });

    test('FindById debe lanzar NotFoundError cuando el producto no existe', async () => {

        ProductModel.findById.mockResolvedValue(null);

        await expect(
            repository.FindById('nope')
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    test('Create debe crear y guardar un producto', async () => {

        const data = {
            name: 'Laptop',
            type: 'Computadores',
            price: 2000000
        };

        const saved = {
            _id: 'n1',
            ...data
        };

        const instance = {
            ...data,
            save: jest.fn().mockResolvedValue(saved)
        };

        ProductModel.mockReturnValue(instance);

        const result = await repository.Create(data);

        expect(ProductModel).toHaveBeenCalledWith(data);
        expect(instance.save).toHaveBeenCalled();
        expect(result).toEqual(saved);
    });

});