const User = require('../models/user');
const menuPage = require('../_helpers/menuPage');

async function authenticateAdmin(req, res, next) {

    let user = res.user;

    if(user.role != "admin"){
        menuPage(
            "Command Error",
            "You must be an admin user to perform this command.",
            [
                { description: "Continue", route: "/" }
            ],
            res
        );
   
    }

    next();
}

module.exports = authenticateAdmin;