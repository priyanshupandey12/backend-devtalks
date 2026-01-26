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
    const finalRepos = await Promise.all(repos.map(async (repo) => {
      const [owner, repoName] = repo.full_name.split('/');
      
      const gfiCount = await countGoodFirstIssues(owner, repoName);

      return {
        full_name: repo.full_name,
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        pushed_at: repo.pushed_at,
        goodFirstIssues: gfiCount, // This should now show the correct number
        owner: repo.owner
      };
    }));

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

 
    const cleanRepos = await Promise.all(top10.map(async (repo) => {
      
      const [owner, repoName] = repo.full_name.split('/');
    
      const gfiCount = await countGoodFirstIssues(owner, repoName);


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
