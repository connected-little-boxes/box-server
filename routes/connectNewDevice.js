const { response } = require('express');
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('connectNewDevice.ejs',{ 
        configAccessPoint: process.env.CONFIG_ACCESS_POINT,
        configHostAddress: process.env.CONFIG_HOST_ADDRESS });
});

router.post('/', async (req, res) => {
    res.render('connectNewDevice.ejs',{ host: process.env.HOST_ADDRESS});
})

module.exports = router;
