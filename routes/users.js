const express = require('express');
let Users = require('../models/users');
let router = express.Router();
const bodyParser = require("body-parser");


/* GET users listing. */
router.get('/login', function(req, res, next) {
  res.render('login', { title:"Login" });
});

router.get('/register', function (req, res, next) {
  res.render('register', { title:"Register" })
});

router.post('/register', function (req, res, next) {
  const username = req.body.username;
  const password = req.body.password;

  req.checkBody('Name', 'Name is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();

  let users = new Users();
  users.userName = username;
  users.password = password;


  
  users.save(function (err) {
    if(err) {
      console.log(err);
      return;
    }else {
      req.flash('success', 'New user added');
      res.redirect('/');
    }
  });

  //res.render('register', { title:"Register" })
});

module.exports = router;
