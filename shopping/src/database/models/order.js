const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            required: true
        },

        customerId: {
            type: String,
            required: true
        },

        amount: {
            type: Number,
            required: true
        },

        txnId: {
            type: String,
            required: true
        },

        status: {
            type: String,
            default: 'received'
        },

        items: {
            type: Array,
            required: true
        },

        date: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Order', OrderSchema);
