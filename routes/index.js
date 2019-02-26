var express = require('express');
var router = express.Router();
let Users = require('../models/users');

/* GET home page. */
router.get('/', function(req, res, next) {
  Users.find({}, function (err, users) {

      res.render('index', {
        users: users,
        title: 'Index'
      });

  });
});

module.exports = router;
