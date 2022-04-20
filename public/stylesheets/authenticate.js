const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
const FacebookTokenStrategy = require('passport-facebook-token');

// JWT
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const config = require('./config.js');

//adds the specific stratgy plugin, this checks the username and login
//the authenticate method comes from the passport local mongoose
exports.local = passport.use(new LocalStrategy(User.authenticate()));

//When using sessions, we recieve data from request that needs to be added to session.  It needs to be serialized before that happens.
// passport.serializeUser(User.serializeUser());

//When using sessions, the user objest has to be grabbed from the session to be added to req.  It needs to be deserialized for that to happen.
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// JWT
exports.getToken = (user) => {
    //json web token has a hearder, payload, signature
    //the user object becaomes the payload of the json web token
    return jwt.sign(user, config.secretKey, { expiresIn: 3600 });
};

const opts = {};
//states how the token should be sent In the Auth Header, in this case, as a Bearer token
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {
        ///JWT payload is the decoded JWT payload
        //done is a callback that is written into jwt-passport
        console.log('JWT payload: ', jwt_payload);
        User.findOne({ _id: jwt_payload._id }, (err, user) => {
            if (err) {
                return done(err, false);
            } else if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        });
    })
);
//jwt says we want to use the jasonwebt token stratagy (above) ,
exports.verifyUser = passport.authenticate('jwt', { session: false });

// Verify Admin
const verifyAdmin = (req, res, next) => {
    console.log(req.user.admin);

    if (req.user.admin) {
        return next();
    } else {
        const err = new Error(`You are not authorized to perform this operation!`);
        err.status = 403;
        return next(err);
    }
};

exports.verifyAdmin = verifyAdmin;

exports.facebookPassport = passport.use(
    new FacebookTokenStrategy(
        {
            clientID: config.facebook.clientId,
            clientSecret: config.facebook.clientSecret
        },
        (accessToken, refreshToken, profile, done) => {
            User.findOne({ facebookId: profile.id }, (err, user) => {
                if (err) {
                    return done(err, false);
                }
                if (!err && user) {
                    return done(null, user);
                } else {
                    user = new User({ username: profile.displayName });
                    user.facebookId = profile.id;
                    user.firstname = profile.name.givenName;
                    user.lastname = profile.name.familyName;
                    user.save((err, user) => {
                        if (err) {
                            return done(err, false);
                        } else {
                            return done(null, user);
                        }
                    });
                }
            });
        }
    )
);

const GoogleStrategy = require('passport-google-oauth2').Strategy;

passport.use(
    new GoogleStrategy(
        {
            clientID: config.google.client_id,
            clientSecret: config.google.client_secret,
            callbackURL: config.google.redirect_uris[0],
            passReqToCallback: true
        },
        (accessToken, refreshToken, profile, done) => {
            User.findOne({ googleId: profile.id }, (err, user) => {
                if (err) {
                    return done(err, false);
                }
                if (!err && user) {
                    return done(null, user);
                } else {
                    user = new User({ username: profile.displayName });
                    user.facebookId = profile.id;
                    user.firstname = profile.name.name;
                    user.lastname = profile.name.emails;
                    user.save((err, user) => {
                        if (err) {
                            return done(err, false);
                        } else {
                            return done(null, user);
                        }
                    });
                }
            });
        }
    )
);
