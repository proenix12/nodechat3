const express = require('express');
const router = express.Router();

router.get('/app', function (req, res) {

    if (req.user) { // if user is login
        let test = {
            'id': req.user._id,
            'name': req.user.userName,
            'email': req.user.email
        };

        res.render('app', { data:test } );
    } else {
        //  if user is not login
        // send message and redirect user
        req.flash('success', 'Please login');
        res.redirect('/users/login');
    }
});

module.exports = router;