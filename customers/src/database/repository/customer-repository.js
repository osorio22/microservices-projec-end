const { CustomerModel, AddressModel } = require('../models');
const { APIError, BadRequestError } = require('../../utils/app-errors');

class CustomerRepository {

    async GetAllCustomers() {
        return CustomerModel.find().select('-password -salt');
    }

    async CreateCustomer({ email, password, phone, salt }) {
        try {
            return await CustomerModel.create({
                email,
                password,
                salt,
                phone
            });
        } catch (err) {

            if (err.code === 11000) {
                throw new BadRequestError('Email already registered');
            }

            throw new APIError(
                'CreateCustomerError',
                500,
                err.message
            );
        }
    }

    async FindCustomer({ email }) {
        return CustomerModel.findOne({ email });
    }

    // ==========================================
    // GET ALL CUSTOMERS
    // ==========================================

    async GetCustomers() {
        return CustomerModel
            .find({})
            .populate('address');
    }

    // ==========================================
    // ADD ADDRESS
    // ==========================================

    async AddNewAddress(
        customerId,
        { street, postalCode, city, country }
    ) {
        const customer = await CustomerModel.findById(customerId);

        if (!customer) {
            throw new BadRequestError('Customer not found');
        }

        const address = await AddressModel.create({
            street,
            postalCode,
            city,
            country
        });

        customer.address.push(address._id);

        await customer.save();

        return address;
    }

    // ==========================================
    // GET PROFILE
    // ==========================================

    async GetProfile(customerId) {
        return CustomerModel
            .findById(customerId)
            .populate('address');
    }

    // ==========================================
    // GET WISHLIST
    // ==========================================

    async GetWishList(customerId) {
        const customer = await CustomerModel.findById(customerId);

        if (!customer) {
            throw new BadRequestError('Customer not found');
        }

        return customer.wishlist;
    }

    // ==========================================
    // ADD TO WISHLIST
    // ==========================================

    async AddToWishlist(customerId, product) {
        const customer = await CustomerModel.findById(customerId);

        if (!customer) {
            throw new BadRequestError('Customer not found');
        }

        const productId = product._id.toString();

        const existingItem = customer.wishlist.find(
            (item) => item._id.toString() === productId
        );

        if (!existingItem) {

            // product puede ser un documento Mongoose
            // o un objeto JSON recibido desde otro microservicio
            const productData = product.toObject
                ? product.toObject()
                : product;

            customer.wishlist.push({
                ...productData,
                _id: productId
            });

            await customer.save();
        }

        return customer.wishlist;
    }

    // ==========================================
    // REMOVE FROM WISHLIST
    // ==========================================

    async RemoveFromWishlist(customerId, productId) {
        const customer = await CustomerModel.findById(customerId);

        if (!customer) {
            throw new BadRequestError('Customer not found');
        }

        customer.wishlist = customer.wishlist.filter(
            (item) => item._id.toString() !== productId.toString()
        );

        await customer.save();

        return customer.wishlist;
    }

    // ==========================================
    // ADD TO CART
    // ==========================================

    async AddToCart(customerId, product, qty) {
        const customer = await CustomerModel.findById(customerId);

        if (!customer) {
            throw new BadRequestError('Customer not found');
        }

        if (!product || !product._id) {
            throw new BadRequestError('Product is required');
        }

        const productId = product._id.toString();

        const existingItem = customer.cart.find(
            (item) =>
                item.product &&
                item.product._id &&
                item.product._id.toString() === productId
        );

        if (existingItem) {

            // Si el producto ya existe, actualizamos la cantidad
            existingItem.unit = qty;

        } else {

            // product puede ser un documento Mongoose
            // o un objeto JSON recibido desde Shopping
            const productData = product.toObject
                ? product.toObject()
                : product;

            customer.cart.push({
                product: {
                    ...productData,
                    _id: productId
                },
                unit: qty
            });
        }

        await customer.save();

        return customer.cart;
    }

    // ==========================================
    // REMOVE FROM CART
    // ==========================================

    async RemoveFromCart(customerId, productId) {
        const customer = await CustomerModel.findById(customerId);

        if (!customer) {
            throw new BadRequestError('Customer not found');
        }

        customer.cart = customer.cart.filter(
            (item) =>
                !item.product ||
                item.product._id.toString() !== productId.toString()
        );

        await customer.save();

        return customer.cart;
    }

    // ==========================================
    // GET CART
    // ==========================================

    async GetCart(customerId) {
        const customer = await CustomerModel.findById(customerId);

        if (!customer) {
            throw new BadRequestError('Customer not found');
        }

        return customer.cart;
    }

    // ==========================================
    // PLACE ORDER
    // ==========================================

    async PlaceOrder(customerId, order) {
        const customer = await CustomerModel.findById(customerId);

        if (!customer) {
            throw new BadRequestError('Customer not found');
        }

        customer.orders.push(order);
        customer.cart = [];

        await customer.save();

        return order;
    }
}

module.exports = CustomerRepository;

