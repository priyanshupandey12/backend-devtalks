const axios = require('axios');
const cron = require("node-cron");
const User = require('../models/user.model');
const logger = require('./logger');

async function getGithubActivityREST(username, sinceDate) {
  try {
    const headers = { 'User-Agent': 'DevTalks-App' };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const res = await axios.get(`https://api.github.com/users/${username}/events/public`, {
      headers,
      timeout: 8000
    });
    if (Array.isArray(res.data)) {
      const sinceTime = new Date(sinceDate).getTime();
      let commits = 0;
      let prs = 0;
      let issues = 0;
      res.data.forEach(event => {
        const eventTime = new Date(event.created_at).getTime();
        if (eventTime >= sinceTime) {
          if (event.type === 'PushEvent') {
            commits += (event.payload?.commits?.length || 1);
          } else if (event.type === 'PullRequestEvent') {
            prs += 1;
          } else if (event.type === 'IssuesEvent') {
            issues += 1;
          }
        }
      });
      return {
        totalCommitContributions: commits,
        totalPullRequestContributions: prs,
        totalIssueContributions: issues,
        totalRepositoryContributions: 0
      };
    }
  } catch (err) {
    logger.debug(`GitHub REST fallback error for ${username}: ${err.message}`);
  }
  return null;
}

async function getGithubActivity(username, sinceDate) {
  const query = `
    query($login: String!,  $since: DateTime!, $until: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $since, to: $until) {
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          totalRepositoryContributions
        }
      }
    }
  `;

  try {
    logger.debug(`Fetching GitHub activity for ${username} since ${sinceDate}`);
    const headers = { 'User-Agent': 'DevTalks-App' };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const res = await axios.post(
      "https://api.github.com/graphql",
      {
        query,
        variables: { 
          login: username, 
          since: sinceDate, 
          until: new Date().toISOString()   
        }
      },
      {
        headers,
        timeout: 10000
      }
    );
    const contributions = res.data?.data?.user?.contributionsCollection;
    if (contributions) {
      logger.debug(`Successfully fetched GitHub activity for ${username}`);
      return contributions;
    }
    return await getGithubActivityREST(username, sinceDate);
  } catch (err) {
    logger.debug(`GraphQL failed for ${username}, trying REST fallback: ${err.message}`);
    return await getGithubActivityREST(username, sinceDate);
  }
}

function calculateActivityScore(contributions) {
  if (!contributions) return 0;
  
  const {
    totalCommitContributions,
    totalPullRequestContributions,
    totalIssueContributions,
    totalRepositoryContributions
  } = contributions;

  return (
    totalCommitContributions * 1 +          
    totalPullRequestContributions * 3 +     
    totalIssueContributions * 2 +          
    totalRepositoryContributions * 5         
  );
}

async function syncUserGithubActivity(user) {
  if (!user || !user.links?.githubUsername) return null;
  const username = user.links.githubUsername.trim();
  if (!username) return null;

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const contrib7d = await getGithubActivity(username, sevenDaysAgo);
    const contrib3m = await getGithubActivity(username, threeMonthsAgo);

    const score7d = calculateActivityScore(contrib7d);
    const score3m = calculateActivityScore(contrib3m);

    const commits7d = contrib7d?.totalCommitContributions || 0;
    const commits3m = contrib3m?.totalCommitContributions || 0;

    const isActive7d = score7d > 0 || commits7d > 0;
    const isActive3m = score3m > 0 || commits3m > 0;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          "githubActivity.last7dScore": score7d,
          "githubActivity.last3mScore": score3m,
          "githubActivity.last7dCommits": commits7d,
          "githubActivity.last3mCommits": commits3m,
          "githubActivity.lastChecked": now,
          isGithubActive7d: isActive7d,
          isGithubActive3m: isActive3m,
        },
      },
      { new: true }
    );

    return updatedUser;
  } catch (err) {
    logger.error(`Error in syncUserGithubActivity for user ${user._id}: ${err.message}`);
    return null;
  }
}

const startGithubActivityCron = () => {
  cron.schedule("0 2 * * *", async () => {
    logger.info("GitHub activity cron job STARTING...");
    try {
      const users = await User.find({ 
        "links.githubUsername": { $exists: true, $ne: "" } 
      });

      logger.info(`Found ${users.length} users with GitHub usernames to process.`);

      for (const user of users) {
        try {
          await syncUserGithubActivity(user);
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (userError) {
          logger.warn(`Error processing GitHub data for user ${user.emailId} (ID: ${user._id}): ${userError.message}`);
        }
      }
      logger.info("GitHub activity cron job completed successfully.");
    } catch (err) {
      logger.error("Fatal error in GitHub activity cron job:", err);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
  logger.info("GitHub activity cron job scheduled successfully.");
};

module.exports = {
  startGithubActivityCron,
  getGithubActivity,
  calculateActivityScore,
  syncUserGithubActivity
};