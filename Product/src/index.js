const express = require('express');

const { PORT, requireVars } = require('./config');
const { databaseConnection } = require('./database');

const expressApp = require('./express-app');

const StartServer = async () => {
    requireVars('DB_URL');

    const app = express();

    await databaseConnection();
    await expressApp(app);

    app.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
    }).on('error', (err) => {
        console.log(err);
        process.exit(1);
    });
};

StartServer();
