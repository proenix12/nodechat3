const express = require('express');
const router = express.Router();
const Users = require('../models/users');
const passport = require('passport');
const bcrypt = require('bcryptjs');

/* GET users listing. */

router.get('/login', function(req, res) {
  res.render('login');
});

router.post('/login', function(req, res, next){
  passport.authenticate('local', {
    successRedirect:'/',
    failureRedirect:'/users/login',
    failureFlash: true
  })(req, res, next);
});

router.get('/register', function (req, res, next) {
  let success = req.flash('info');
  let successMsg;

  if(success){successMsg = success }else{ successMsg = false; }
  res.render('register', { title:"Register", success:successMsg, errors:false });
});

router.post('/register', function (req, res, next) {
  const username = req.body.username;
  const password = req.body.password;

  req.checkBody('username', 'Name is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();

  let errors = req.validationErrors();

  if(errors) {
    res.render('register', { errors:errors });

  }else{
    let users = new Users({
        userName : username,
        password : password,
    });
    const saltRounds = 10;
    const myPlaintextPassword = password;

    bcrypt.genSalt(saltRounds, function(err, salt) {
      bcrypt.hash(myPlaintextPassword, salt, function(err, hash) {
        if(err){
          console.log(err);
        }
        users.password = hash;
        users.save();
        req.flash('info', 'This is a flash message using the express-flash module.');
        res.redirect('/users/register');
      })
    });
  }

});

router.get('/logout', function(req, res){
  req.logout();
  req.flash('success', 'You are logged out');
  res.redirect('/users/login');
});

module.exports = router;
