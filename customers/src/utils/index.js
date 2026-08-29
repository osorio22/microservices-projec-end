const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { APP_SECRET } = require('../config');

module.exports = {

    FormateData: (data) => {
        return { data };
    },

    GenerateSalt: async () => {
        return await bcrypt.genSalt();
    },

    GeneratePassword: async (password, salt) => {
        return await bcrypt.hash(password, salt);
    },

    ValidatePassword: async (
        enteredPassword,
        savedPassword,
        salt
    ) => {
        const hashedPassword = await bcrypt.hash(
            enteredPassword,
            salt
        );

        return hashedPassword === savedPassword;
    },

    GenerateSignature: async (payload) => {
        return jwt.sign(payload, APP_SECRET, {
            expiresIn: '1d'
        });
    },

    ValidateSignature: async (req) => {
        try {
            const signature = req.get('Authorization');

            if (!signature) {
                return false;
            }

            const token = signature.split(' ')[1];

            return jwt.verify(token, APP_SECRET);

        } catch (error) {
            return false;
        }
    }
};