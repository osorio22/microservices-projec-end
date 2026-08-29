const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { DB_URL } = require('../../config');
const { CustomerModel } = require('../models');

const customers = require('./customers');

(async () => {
    try {
        await mongoose.connect(DB_URL);

        for (const customer of customers) {

            const salt = await bcrypt.genSalt(10);

            const password = await bcrypt.hash(
                customer.password,
                salt
            );

            await CustomerModel.updateOne(
                { email: customer.email },
                {
                    $set: {
                        ...customer,
                        password,
                        salt
                    }
                },
                { upsert: true }
            );
        }

        console.log(`Seeded ${customers.length} customers`);

    } catch (err) {
        console.error('Seeding failed:', err);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
})();