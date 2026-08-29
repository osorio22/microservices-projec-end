const { ProductModel } = require('../models');
const { NotFoundError } = require('../../utils/app-errors');

class ProductRepository {

    async FindAll() {
        return await ProductModel.find({});
    }

    async FindById(id) {
        const product = await ProductModel.findById(id);

        if (!product) {
            throw new NotFoundError('Product not found');
        }

        return product;
    }

    async Create(productData) {
        const product = new ProductModel(productData);
        return await product.save();
    }
}

module.exports = ProductRepository;
