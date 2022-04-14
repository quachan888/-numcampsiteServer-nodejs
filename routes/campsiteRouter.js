const express = require('express');
const Campsite = require('../models/campsite');

const campsiteRouter = express.Router();

campsiteRouter
    .route('/')
    .get((req, res, next) =>
        Campsite.find()
            .then((campsite) => res.status(200).json(campsite))
            .catch((err) => next(err))
    )
    .post((req, res, next) =>
        Campsite.create(req.body)
            .then((campsite) => res.status(200).json(campsite))
            .catch((err) => next(err))
    )
    .put((req, res, next) => res.status(403).end(`PUT operation not supported on /campsites`))
    .delete((req, res, next) =>
        Campsite.deleteMany()
            .then((response) => res.status(200).json(response))
            .catch((err) => next(err))
    );

campsiteRouter
    .route('/:campsiteId')
    .get((req, res, next) =>
        Campsite.findById(req.params.campsiteId)
            .then((campsite) => res.status(200).json(campsite))
            .catch((err) => next(err))
    )
    .post((req, res) => res.status(403).end(`POST operation not supported on /campsites/${req.params.campsiteId}`))
    .put((req, res, next) =>
        Campsite.findByIdAndUpdate(req.params.campsiteId, { $set: req.body }, { new: true })
            .then((campsite) => res.status(200).json(campsite))
            .catch((err) => next(err))
    )
    .delete((req, res, next) =>
        Campsite.findByIdAndDelete(req.params.campsiteId)
            .then((response) => res.status(200).json(response))
            .catch((err) => next(err))
    );

campsiteRouter
    .route('/:campsiteId/comments')
    .get((req, res, next) => {
        Campsite.findById(req.params.campsiteId)
            .then((campsite) => {
                if (campsite) res.status(200).json(campsite.comments);
                else {
                    err = new Error(`Campsite ${req.params.campsiteId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch((err) => next(err));
    })
    .post((req, res, next) => {
        Campsite.findById(req.params.campsiteId).then((campsite) => {
            if (campsite) {
                campsite.comments.push(req.body);
                campsite
                    .save()
                    .then((campsite) => res.status(200).json(campsite))
                    .catch((err) => next(err));
            } else {
                err = new Error(`Campsite ${req.params.campsiteId} not found`);
                err.status = 400;
                return next(err);
            }
        });
    })
    .put((req, res, next) =>
        res.status(403).end(`PUT operation not supported on /campsite/${req.params.campsiteId}/comments`)
    )
    .delete((req, res, next) => {
        Campsite.findById(req.params.campsiteId).then((campsite) => {
            if (campsite) {
                for (let i = campsite.comments.length - 1; i >= 0; i--) {
                    console.log(campsite.comments);
                }
                campsite
                    .save()
                    .then((campsite) => res.status(200).json(campsite))
                    .catch((err) => next(err));
            } else {
                err = new Error(`Campsite ${req.params.campsiteId} not found`);
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
            .then((campsite) => {
                if (campsite && campsite.comments.id(commentId)) res.status(200).json(campsite.comments.id(commentId));
                else if (!campsite) {
                    err = new Error(`Campsite ${campsiteId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`comment ${commentId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch((err) => next(err));
    })
    .post((req, res) =>
        res
            .status(403)
            .end(`POST operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`)
    )
    .put((req, res, next) => {
        const { campsiteId, commentId } = req.params;
        Campsite.findById(campsiteId).then((campsite) => {
            if (campsite && campsite.comments.id(commentId)) {
                if (req.body.rating) campsite.comments.id(commentId).rating = req.body.rating;
                if (req.body.text) campsite.comments.id(commentId).text = req.body.text;
                campsite
                    .save()
                    .then((campsite) => res.status(200).json(campsite))
                    .catch((err) => next(err));
            } else if (!campsite) {
                err = new Error(`Campsite ${campsiteId} not found`);
                err.status = 404;
                return next(err);
            } else {
                err = new Error(`Comment ${commentId} not found`).status(404);
                return next(err);
            }
        });
    })
    .delete((req, res, next) => {
        const { campsiteId, commentId } = req.params;
        Campsite.findById(campsiteId)
            .then((campsite) => {
                if (campsite && campsite.comments.id(commentId)) {
                    campsite.commend.id(commentId).remove();
                    campsite
                        .save()
                        .then((campsite) => res.status(200).json(campsite))
                        .catch((err) => next(err));
                } else if (!campsite) {
                    err = new Error(`Campsite ${campsiteId} not found`).status(400);
                    return next(err);
                } else {
                    err = new Error(`Comment ${commentId} not found`).status(400);
                    return next(err);
                }
            })
            .catch((err) => next(err));
    });

module.exports = campsiteRouter;
