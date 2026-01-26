const github = require('./githubApi'); 


function buildQuery(topics = [], languages = []) {

  const topicQuery =
    topics.length > 0
      ? topics.map(t => `topic:${t}`).join(' ')
      : '';

 
  const langQuery =
    languages.length > 0
      ? languages.map(l => `language:${l}`).join(' ')
      : '';

 
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];


  const queryParts = [];

  if (topicQuery) queryParts.push(topicQuery); 
  if (langQuery) queryParts.push(langQuery);

 
  queryParts.push(`pushed:>${last30Days}`);

  
  return queryParts.join(' ').trim();
}


async function searchRepos(query, limit = 20, sortBy = 'stars') {
  try {
    const response = await github.get('/search/repositories', {
      params: {
        q: query,
        per_page: limit
      }
    });

    let repos = response.data.items || [];


    repos = repos.filter(r => r.pushed_at);

   
    repos = repos.sort((a, b) => {
      if (sortBy === 'updated') {
        return new Date(b.pushed_at) - new Date(a.pushed_at);
      } else {
        return b.stargazers_count - a.stargazers_count;
      }
    });

    return repos;

  } catch (error) {
    console.error('GitHub Search Error:', error.response?.data || error.message);
    throw new Error('GitHub search failed');
  }
}


async function countGoodFirstIssues(owner, repo) {
  try {
    const response = await github.get(`/repos/${owner}/${repo}/issues`, {
      params: {
        state: 'open',
        labels: 'good first issue',
        per_page: 100
      }
    });

  
    return response.data.length;

  } catch (error) {
    console.error('Good First Issue Error:', error.response?.data || error.message);
    return 0; 
  }
}

function buildTrendingQuery(topics = [], languages = []) {
  const topicQuery =
    topics.length > 0
      ? topics.map(t => `topic:${t}`).join(' ')
      : '';

  const langQuery =
    languages.length > 0
      ? languages.map(l => `language:${l}`).join(' ')
      : '';

  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const queryParts = [];

  if (topicQuery) queryParts.push(topicQuery);
  if (langQuery) queryParts.push(langQuery);

  queryParts.push(`pushed:>${last7Days}`);

  return queryParts.join(' ').trim();
}


module.exports={countGoodFirstIssues,searchRepos,buildQuery,buildTrendingQuery}


