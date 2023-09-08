const { ProcessManagers } = require('../models/ProcessManager');



async function getProcessManagerByName(req, res, next) {
    let manager;
  
    try {

      manager = await ProcessManagers.findOne({ name: req.params.name });

      if (manager === null) {
        return res.status(404).json({ message: `Cannot find process manager ${req.params.name}` });
      }
    }
    catch (err) {
      res.status(500).json({ message: err.message });
      return;
    }
  
    res.processManager = manager;
  
    next();
  }

  module.exports = getProcessManagerByName;