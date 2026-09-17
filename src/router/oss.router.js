const express = require('express');
const router = express.Router();
const { getReposForInterest, getTrendingRepos, getOSSContributors } = require('../controllers/repo.controller');
const {userAuth}=require('../middleware/auth')

router.get('/repos', userAuth, getReposForInterest);
router.get('/trending', userAuth, getTrendingRepos);
router.get('/contributors', userAuth, getOSSContributors);

module.exports = router;


