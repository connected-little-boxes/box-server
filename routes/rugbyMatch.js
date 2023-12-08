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

async function buildRugbyMatchNameList() {

    let nameList = [];

    let matches = await RugbyMatch.find();

    matches.sort((a, b) => {
        let textA = (a.friendlyName ? a.friendlyName : a.name).toUpperCase();
        let textB = (b.friendlyName ? b.friendlyName : b.name).toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });

    for (let i = 0; i < matches.length; i++) {
        let match = matches[i];
        let name = match.name;
        nameList.push(name);
    };
    return nameList;
}

router.get('/openMatch', authenticateToken, authenticateAdmin, async function (req, res) {

    let matchNameList = await  buildRugbyMatchNameList();

    res.render("rugbyCreateMatch.ejs", { matchNameList: matchNameList});
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
