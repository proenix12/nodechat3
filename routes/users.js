const express = require('express');
let Users = require('../models/users');
let router = express.Router();
const bodyParser = require("body-parser");
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');

/* GET users listing. */
router.get('/login', function(req, res, next) {
  res.render('login', { title:"Login" });
});

router.get('/register', function (req, res, next) {
  res.render('register', { title:"Register", success: false, errors: req.session.errors });
  req.session.errors = null;
});

router.post('/register', function (req, res, next) {
  const username = req.body.username;
  const password = req.body.password;

  req.checkBody('username', 'Name is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();

  let errors = req.validationErrors();

  if(errors) {
    req.session.errors = errors;
    res.redirect('/users/register');
    console.log(errors);

  }else{
    console.log('test2');
    let users = new Users({
        userName : username,
        password : password,
    });
    console.log(users);
    const saltRounds = 10;
    const myPlaintextPassword = 's0/\/\P4$$w0rD';
    const someOtherPlaintextPassword = 'not_bacon';

    bcrypt.genSalt(saltRounds, function(err, salt) {
      bcrypt.hash(myPlaintextPassword, salt, function(err, hash) {
        if(err){
          console.log(err);
        }
        users.password = hash;
        users.save();
        res.redirect('/users/register');
      })
    });
  }

});

module.exports = router;
