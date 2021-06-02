const { response } = require('express');
const express = require('express');
const router = express.Router();

router.get('/',async function(req,res){
    res.render('terminal.ejs');
})

module.exports = router;