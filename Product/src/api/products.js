const express = require('express');
const ProductsService = require('../services/products-service');

const router = express.Router();
const service = new ProductsService();

router.post('/', async (req, res, next) => {
    try {
        const { data } = await service.CreateProduct(req.body);
        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
});

router.get('/', async (req, res, next) => {
    try {
        const { data } = await service.GetProducts();
        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const { data } = await service.GetProductById(req.params.id);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
