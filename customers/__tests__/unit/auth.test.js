const jwt = require('jsonwebtoken');

const { UnauthorizedError } = require('../../src/utils/app-errors');

const auth = require('../../src/api/middlewares/auth');

const { APP_SECRET } = require('../../src/config');

describe('Auth Middleware', () => {

    test('debe rechazar la petición cuando no existe Authorization', () => {
        const req = {
            headers: {}
        };

        const res = {};

        const next = jest.fn();

        auth(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);

        const error = next.mock.calls[0][0];

        expect(error).toBeInstanceOf(UnauthorizedError);
        expect(error.message).toBe('Missing authorization token');
    });


    test('debe rechazar la petición cuando Authorization no usa Bearer', () => {
        const req = {
            headers: {
                authorization: 'Basic 123456'
            }
        };

        const res = {};

        const next = jest.fn();

        auth(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);

        const error = next.mock.calls[0][0];

        expect(error).toBeInstanceOf(UnauthorizedError);
        expect(error.message).toBe('Missing authorization token');
    });


    test('debe rechazar la petición cuando el token es inválido', () => {
        const req = {
            headers: {
                authorization: 'Bearer token-invalido'
            }
        };

        const res = {};

        const next = jest.fn();

        auth(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);

        const error = next.mock.calls[0][0];

        expect(error).toBeInstanceOf(UnauthorizedError);
        expect(error.message).toBe('Invalid or expired token');
    });


    test('debe permitir la petición cuando el token es válido', () => {

        const payload = {
            _id: '123',
            email: 'juan@gmail.com'
        };

        const token = jwt.sign(payload, APP_SECRET);

        const req = {
            headers: {
                authorization: `Bearer ${token}`
            }
        };

        const res = {};

        const next = jest.fn();

        auth(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);

        expect(next).toHaveBeenCalledWith();

        expect(req.user).toBeDefined();

        expect(req.user._id).toBe(payload._id);
        expect(req.user.email).toBe(payload.email);
    });

});