const Device = require('../models/device');

async function validateFriendlyName(editedFriendlyName, owner_id) {

    let proposedFriendlyName;

    // Check to make sure that the user hasn't entered a name that
    // clashes with an existing one

    proposedFriendlyName = editedFriendlyName;

    let friendlyNameIndex = 1;

    while (true) {

        // search for a device with the friendly name

        let device = await Device.findOne({
            $and:
                [
                    { owner: { $eq: owner_id } },
                    { friendlyName: { $eq: proposedFriendlyName } }
                ]
        });

        if (device) {
            proposedFriendlyName = `${editedFriendlyName}(${friendlyNameIndex})`;
            friendlyNameIndex++;
        }
        else {
            break;
        }
    }
    return proposedFriendlyName;
}

module.exports = validateFriendlyName;

