const axios = require('axios');

const github = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    'User-Agent': 'DevTalks-OSS-Client'
  }
});


github.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403 || error.response?.status === 429) {
      console.error('GitHub Rate Limit Hit:', error.response?.data?.message);
    }
    return Promise.reject(error);
  }
);

module.exports = github;
