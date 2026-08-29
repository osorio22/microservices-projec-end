const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const HandleErrors = require('./utils/error-handler');
const { NotFoundError } = require('./utils/app-errors');

module.exports = async (app) => {
    app.use(cors());

    app.get('/health', (req, res) => res.json({ status: 'ok' }));

    routes(app);

    app.use((req, res, next) => {
        next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
    });

    app.use(HandleErrors);
}