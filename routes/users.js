const express = require('express');
const User = require('../models/user');
const passport = require('passport');
const authenticate = require('../authenticate');

const router = express.Router();

/* GET users listing. */
router.get('/', authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    User.find()
        .then((users) => res.status(200).json(users))
        .catch((err) => next(err));
});

router.post('/signup', (req, res) => {
    User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
        if (err) {
            res.status(500).json({ err: err });
        } else {
            if (req.body.firstname) {
                user.firstname = req.body.firstname;
            }
            if (req.body.lastname) {
                user.lastname = req.body.lastname;
            }
            user.save((err) => {
                if (err) res.status(500).json({ err: err });
                passport.authenticate('local')(req, res, () => {
                    res.status(200).json({ success: true, status: 'Registration Successful!' });
                });
            });
        }
    });
});

router.post('/login', passport.authenticate('local'), (req, res) => {
    const token = authenticate.getToken({ _id: req.user._id });
    res.status(200).json({
        success: true,
        token: token,
        status: 'You are successfully logged in!'
    });
});

router.get('/logout', (req, res, next) => {
    if (req.session) {
        req.session.destroy();
        res.clearCookie('session-id');
        res.redirect('/');
    } else {
        const err = new Error('You are not logged in!');
        err.status = 401;
        return next(err);
    }
});

module.exports = router;
