const mongoose = require('mongoose');
const { DB_URL } = require('../../config');
const { ProductModel } = require('../models');
const products = require('./products');

const force = process.argv.includes('--force');

(async () => {
    try {
        await mongoose.connect(DB_URL);

        for (const product of products) {
            const update = force
                ? { $set: product }
                : { $setOnInsert: product };

            await ProductModel.updateOne(
                { name: product.name },
                update,
                { upsert: true }
            );
        }

        console.log(
            `Seeded ${products.length} products${
                force ? ' (existing documents overwritten)' : ''
            }`
        );

    } catch (err) {
        console.error('Seeding failed', err);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
})();