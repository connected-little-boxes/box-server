const { response } = require('express');
const express = require('express');
const router = express.Router();
const Device = require('../models/device');
const Manager = require('../manager');
const User = require('../models/user');
const RugbyMatch = require('../models/RugbyMatch');
const authenticateToken = require('../_helpers/authenticateToken');
const authenticateAdmin = require('../_helpers/authenticateAdmin');
const getDeviceByDeviceName = require('../_helpers/getDeviceByDeviceName');
const menuPage = require('../_helpers/menuPage');
const validateFriendlyName = require('../_helpers/validateFriendlyName');
const generateQRCode = require('../_helpers/generateQRCode');
const { ProcessManagerCommandItems, ProcessManagerCommands, ProcessManagerMessageItems, ProcessManagerMessages, ProcessManagers } = require('../models/ProcessManager');
const buildUserDescriptions = require('../_helpers/buildUserDescriptions');
const tinyLog = require('../_helpers/tinyLog');

router.get('/index', authenticateToken, authenticateAdmin, async function (req, res) {
    res.render('rubgyIndex.ejs');
});

router.get('/openMatch', authenticateToken, authenticateAdmin, async function (req, res) {
    menuPage(
        "Robot Rugby",
        `Coming Soon`,
        [
            { description: "Continue", route: "/" }
        ],
        res
    );
});

router.post('/openMatch', authenticateToken, authenticateAdmin, async (req, res) => {
    menuPage(
        "Robot Rugby",
        `Coming Soon`,
        [
            { description: "Continue", route: "/" }
        ],
        res
    );
})

router.get('/closeMatch', authenticateToken, authenticateAdmin, async function (req, res) {
    menuPage(
        "Robot Rugby",
        `Coming Soon`,
        [
            { description: "Continue", route: "/" }
        ],
        res
    );
});

router.get('/startPlay', authenticateToken, authenticateAdmin, async function (req, res) {
    menuPage(
        "Robot Rugby",
        `Coming Soon`,
        [
            { description: "Continue", route: "/" }
        ],
        res
    );
});

router.get('/endPlay', authenticateToken, authenticateAdmin, async function (req, res) {
    menuPage(
        "Robot Rugby",
        `Coming Soon`,
        [
            { description: "Continue", route: "/" }
        ],
        res
    );
});


module.exports = router;
