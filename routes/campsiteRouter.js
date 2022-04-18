const express = require('express');
const Campsite = require('../models/campsite');
const authenticate = require('../authenticate');

const campsiteRouter = express.Router();

campsiteRouter
    .route('/')
    .get((req, res, next) => {
        console.log(req.user);
        Campsite.find()
            .populate('comments.author')
            .then((campsite) => res.status(200).json(campsite))
            .catch((err) => next(err));
    })
    .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
        Campsite.create(req.body)
            .then((campsite) => res.status(200).json(campsite))
            .catch((err) => next(err))
    )
    .put(authenticate.verifyUser, (req, res, next) =>
        res.status(403).end(`PUT operation not supported on /campsites`)
    )
    .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
        Campsite.deleteMany()
            .then((response) => res.status(200).json(response))
            .catch((err) => next(err))
    );

campsiteRouter
    .route('/:campsiteId')
    .get((req, res, next) =>
        Campsite.findById(req.params.campsiteId)
            .populate('comments.author')
            .then((campsite) => res.status(200).json(campsite))
            .catch((err) => next(err))
    )
    .post(authenticate.verifyUser, (req, res) =>
        res.status(403).end(`POST operation not supported on /campsites/${req.params.campsiteId}`)
    )
    .put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
        Campsite.findByIdAndUpdate(req.params.campsiteId, { $set: req.body }, { new: true })
            .then((campsite) => res.status(200).json(campsite))
            .catch((err) => next(err))
    )
    .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>
        Campsite.findByIdAndDelete(req.params.campsiteId)
            .then((response) => res.status(200).json(response))
            .catch((err) => next(err))
    );

campsiteRouter
    .route('/:campsiteId/comments')
    .get((req, res, next) => {
        Campsite.findById(req.params.campsiteId)
            .populate('comments.author')
            .then((campsite) => {
                if (campsite) res.status(200).json(campsite.comments);
                else {
                    const err = new Error(`Campsite ${req.params.campsiteId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch((err) => next(err));
    })
    .post(authenticate.verifyUser, (req, res, next) => {
        Campsite.findById(req.params.campsiteId).then((campsite) => {
            if (campsite) {
                req.body.author = req.user._id;
                campsite.comments.push(req.body);
                campsite
                    .save()
                    .then((campsite) => res.status(200).json(campsite))
                    .catch((err) => next(err));
            } else {
                const err = new Error(`Campsite ${req.params.campsiteId} not found`);
                err.status = 400;
                return next(err);
            }
        });
    })
    .put(authenticate.verifyUser, (req, res, next) =>
        res
            .status(403)
            .end(`PUT operation not supported on /campsite/${req.params.campsiteId}/comments`)
    )
    .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Campsite.findById(req.params.campsiteId).then((campsite) => {
            if (campsite) {
                for (let i = campsite.comments.length - 1; i >= 0; i--) {
                    campsite.comments.id(campsite.comments[i]._id).remove();
                }
                campsite
                    .save()
                    .then((campsite) => res.status(200).json(campsite))
                    .catch((err) => next(err));
            } else {
                const err = new Error(`Campsite ${req.params.campsiteId} not found`);
                err.status = 400;
                return next(err);
            }
        });
    });

campsiteRouter
    .route('/:campsiteId/comments/:commentId')
    .get((req, res, next) => {
        const { campsiteId, commentId } = req.params;
        Campsite.findById(campsiteId)
            .populate('comments.author')
            .then((campsite) => {
                if (campsite && campsite.comments.id(commentId))
                    res.status(200).json(campsite.comments.id(commentId));
                else if (!campsite) {
                    const err = new Error(`Campsite ${campsiteId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    const err = new Error(`comment ${commentId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch((err) => next(err));
    })
    .post(authenticate.verifyUser, (req, res) =>
        res
            .status(403)
            .end(
                `POST operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`
            )
    )
    .put(authenticate.verifyUser, (req, res, next) => {
        const { campsiteId, commentId } = req.params;
        Campsite.findById(campsiteId).then((campsite) => {
            if (campsite && campsite.comments.id(commentId)) {
                // if ((campsite.comments.id(commentId).author._id).equals(req.user._id)) {
                if (campsite.comments.id(commentId).author.equals(req.user._id)) {
                    if (req.body.rating) campsite.comments.id(commentId).rating = req.body.rating;
                    if (req.body.text) campsite.comments.id(commentId).text = req.body.text;
                    campsite
                        .save()
                        .then((campsite) => res.status(200).json(campsite))
                        .catch((err) => next(err));
                } else {
                    const err = new Error(`You're not the author of this comment`);
                    err.status = 403;
                    return next(err);
                }
            } else if (!campsite) {
                const err = new Error(`Campsite ${campsiteId} not found`);
                err.status = 404;
                return next(err);
            } else {
                const err = new Error(`Comment ${commentId} not found`);
                err.status = 404;
                return next(err);
            }
        });
    })
    .delete(authenticate.verifyUser, (req, res, next) => {
        const { campsiteId, commentId } = req.params;
        Campsite.findById(campsiteId)
            .then((campsite) => {
                if (campsite && campsite.comments.id(commentId)) {
                    if (campsite.comments.id(commentId).author.equals(req.user._id)) {
                        campsite.comments.id(commentId).remove();
                        campsite
                            .save()
                            .then((campsite) => res.status(200).json(campsite))
                            .catch((err) => next(err));
                    } else {
                        const err = new Error(`You're not the author of this comment`);
                        err.status = 403;
                        return next(err);
                    }
                } else if (!campsite) {
                    const err = new Error(`Campsite ${campsiteId} not found`);
                    err.status = 400;
                    return next(err);
                } else {
                    const err = new Error(`Comment ${commentId} not found`);
                    err.status = 400;
                    return next(err);
                }
            })
            .catch((err) => next(err));
    });

module.exports = campsiteRouter;
