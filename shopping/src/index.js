const express = require('express');

const { PORT, requireVars } = require('./config');

const expressApp = require('./express-app');

const StartServer = async () => {

    const app = express();

    await expressApp(app);

    app.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
    }).on('error', (err) => {
        console.log(err);
        process.exit(1);
    });
};

StartServer();
