const express = require("express");
const { isLoggedIn, isNotLoggedIn } = require("../middlewares");
const { Post, User, Hashtag } = require("../models");
const {
  renderJoin,
  renderMain,
  renderProfile,
  renderHashtag,
} = require("../controllers/page");
const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.followerCount = req.user ? req.user.Followers.length : 0;
  res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  res.locals.followerIdList = req.user
    ? req.user.Followings.map((f) => f.id)
    : [];
  next();
});

router.get("/profile", isLoggedIn, renderProfile);
router.get("/join", isNotLoggedIn, renderJoin);
router.get("/", renderMain);
router.get("/hashtag", renderHashtag);

module.exports = router;
