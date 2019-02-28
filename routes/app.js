const express = require('express');
const router = express.Router();

router.get('/app', function (req, res) {

    if (req.user) { // if user is login
        let newUser = {
            'id': req.user._id,
            'name': req.user.userName,
            'email': req.user.email
        };
        res.render('app', {title: "Blog"} );
    } else {
        //  if user is not login
        // send message and redirect user
        req.flash('success', 'Please login');
        res.redirect('/users/login');
    }
});

module.exports = router;