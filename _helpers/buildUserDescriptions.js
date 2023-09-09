const User = require('../models/user');

async function buildUserDescriptions(owner_id, owner_name) {

    let userDescriptions = [];


    let users = await User.find();

    for (let i = 0; i < users.length; i++) {
        let user = users[i];
        if (user._id.equals(owner_id)) {
            continue;
        }
        userDescriptions.push({ _id: String(user._id), name: user.name });
    };

    userDescriptions.sort((a, b) => {
        let textA = (a.name).toUpperCase();
        let textB = (b.name).toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });

    userDescriptions.unshift({ _id: owner_id, name: owner_name });

    return userDescriptions;
}

module.exports = buildUserDescriptions;