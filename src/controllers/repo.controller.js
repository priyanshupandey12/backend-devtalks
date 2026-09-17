const CachedRepo = require('../models/repo.model');
const interests = require('../../config/interest');
const { buildQuery, searchRepos, countGoodFirstIssues ,buildTrendingQuery} = require('../utils/githubapiHelpers');

exports.getReposForInterest = async (req, res) => {
  try {
   
    const { interest, languages = '', sort = 'updated' } = req.query;

    let langArray = languages
      ? languages.split(',').map(l => l.trim().toLowerCase())
      : [];

    langArray.sort();

  
    const searchInterest = interest || 'general';

    // 2. Check Cache
    const cached = await CachedRepo.findOne({
      interest: searchInterest,
      languages: langArray
    });

    const CACHE_HOURS = 12;
    const isFresh =
      cached &&
      (Date.now() - new Date(cached.lastRefreshed)) <
        CACHE_HOURS * 60 * 60 * 1000;

    if (cached && isFresh) {
      return res.json({
        fromCache: true,
        repos: cached.repos
      });
    }

 
    let topics = [];
    
 
   if (interest && interest !== 'general') {
      const matchedInterest = interests.find(i => i.key === interest);
      if (!matchedInterest) {
        return res.status(400).json({ error: 'Invalid interest key' });
      }
      topics = matchedInterest.githubTopics;
    }

    const query = buildQuery(topics, langArray);
    
    // 4. Search GitHub
    let repos = await searchRepos(query, 20, sort);

    // 5. Count Issues (Parallel Processing)
    // We use Promise.all to fetch counts for all 20 repos simultaneously
    // This is much faster than a standard for-loop
    const settledRepos = await Promise.allSettled(repos.map(async (repo) => {
      const [owner, repoName] = repo.full_name.split('/');
      let gfiCount = 0;
      try {
        gfiCount = await countGoodFirstIssues(owner, repoName);
      } catch (err) {
        gfiCount = 0;
      }

      return {
        full_name: repo.full_name,
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        pushed_at: repo.pushed_at,
        goodFirstIssues: gfiCount,
        owner: repo.owner
      };
    }));

    const finalRepos = settledRepos
      .filter(res => res.status === 'fulfilled')
      .map(res => res.value);

    // 6. Update Cache
    await CachedRepo.updateOne(
      { interest: searchInterest, languages: langArray },
      {
        interest: searchInterest,
        languages: langArray,
        repos: finalRepos,
        lastRefreshed: new Date()
      },
      { upsert: true }
    );

    res.json({
      fromCache: false,
      repos: finalRepos
    });

  } catch (error) {
    console.error('Controller Error:', error);
    res.status(500).json({ error: 'Failed to fetch repos' });
  }
};


exports.getTrendingRepos = async (req, res) => {
  try {
    const { interest, languages = '' } = req.query;

    let langArray = languages
      ? languages.split(',').map(l => l.trim().toLowerCase())
      : [];
    langArray.sort();

    let topics = [];

   
    if (interest && interest !== 'general') {
      const matchedInterest = interests.find(i => i.key === interest);
      if (!matchedInterest) {
        return res.status(400).json({ error: 'Invalid interest key' });
      }
      topics = matchedInterest.githubTopics;
    }

  
    const query = buildTrendingQuery(topics, langArray);

  
    let rawRepos = await searchRepos(query, 50, 'updated');


    const top10 = rawRepos.slice(0, 10);

 
    const settledRepos = await Promise.allSettled(top10.map(async (repo) => {
      const [owner, repoName] = repo.full_name.split('/');
      let gfiCount = 0;
      try {
        gfiCount = await countGoodFirstIssues(owner, repoName);
      } catch (err) {
        gfiCount = 0;
      }

      return {
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,       
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        total_issues: repo.open_issues_count, 
        good_first_issues: gfiCount,          
        last_activity: repo.pushed_at         
      };
    }));

    const cleanRepos = settledRepos
      .filter(res => res.status === 'fulfilled')
      .map(res => res.value);

    res.json({
      trending: true,
      interestUsed: interest || null,
      languagesUsed: langArray,
      repos: cleanRepos 
    });

  } catch (error) {
    console.error('Trending Error:', error);
    res.status(500).json({ error: 'Failed to fetch trending repos' });
  }
};

exports.getOSSContributors = async (req, res) => {
  try {
    const User = require('../models/user.model');
    const { syncUserGithubActivity } = require('../utils/githubcron');
    const { search = '', skill = '', role = '', timeframe = '3m' } = req.query;

    // Strict filter: ONLY show users with a non-empty githubUsername
    const query = {
      'links.githubUsername': { $exists: true, $ne: '' }
    };

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { userRole: searchRegex },
        { skills: searchRegex },
        { 'links.githubUsername': searchRegex }
      ];
    }

    if (skill.trim()) {
      query.skills = { $in: [new RegExp(skill.trim(), 'i')] };
    }

    if (role.trim()) {
      query.userRole = new RegExp(role.trim(), 'i');
    }

    // Determine sort field based on timeframe (3-month or 7-day commits)
    const sortField = timeframe === '7d' 
      ? { 'githubActivity.last7dCommits': -1, 'githubActivity.last3mCommits': -1, createdAt: -1 }
      : { 'githubActivity.last3mCommits': -1, 'githubActivity.last7dCommits': -1, createdAt: -1 };

    let contributors = await User.find(query)
      .select('-password -refreshToken -loginAttempts -lockUntil')
      .sort(sortField)
      .limit(50);

    // Sync stale or un-checked GitHub user metrics on-the-fly (max 5 concurrently)
    const now = Date.now();
    const THREE_HOURS = 3 * 60 * 60 * 1000;
    const toSync = contributors.filter(u => {
      const lastChecked = u.githubActivity?.lastChecked ? new Date(u.githubActivity.lastChecked).getTime() : 0;
      return (now - lastChecked) > THREE_HOURS;
    }).slice(0, 5);

    if (toSync.length > 0) {
      await Promise.allSettled(toSync.map(u => syncUserGithubActivity(u)));
      // Re-fetch sorted contributors after sync
      contributors = await User.find(query)
        .select('-password -refreshToken -loginAttempts -lockUntil')
        .sort(sortField)
        .limit(50);
    }

    return res.status(200).json({
      success: true,
      contributors
    });
  } catch (error) {
    console.error(`Error in getOSSContributors: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error fetching OSS contributors.' });
  }
};
