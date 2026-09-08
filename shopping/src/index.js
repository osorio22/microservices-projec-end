const express = require('express');

const { PORT } = require('./config');

const connectDatabase = require('./database/models/connection');

const expressApp = require('./express-app');

const StartServer = async () => {

    const app = express();

    await connectDatabase();
    await expressApp(app);

    app.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
    }).on('error', (err) => {
        console.log(err);
        process.exit(1);
    });
};

StartServer();
