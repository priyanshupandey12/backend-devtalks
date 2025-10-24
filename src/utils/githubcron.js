const axios=require('axios');
const cron = require("node-cron");
const User=require('../models/user.model')
const logger = require('../utils/logger');


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
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
        timeout: 10000
      }
    );
logger.debug(`Successfully fetched GitHub activity for ${username}`);
    return res.data.data.user.contributionsCollection;
  } catch (err) {
  const errorMsg = err.response?.data?.message || err.response?.data || err.message;
    logger.error(`GitHub API error for user ${username}: ${errorMsg}`, {
      username: username,
      statusCode: err.response?.status
    });
    return null;
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


const startGithubActivityCron = () => {
  cron.schedule("0 2 * * *", async () => {
  
logger.info("GitHub activity cron job STARTING...");
    try {
      const users = await User.find({ 
        "links.githubUsername": { $exists: true, $ne: "" } 
      });

    logger.info(`Found ${users.length} users with GitHub usernames to process.`);

      let processedUsers = 0;
      let activeUsers7d = 0;
      let activeUsers3m = 0;

      for (const user of users) {
        try {
          const now = new Date();
  
         
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);

          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(now.getMonth() - 3);

        
          const contrib7d = await getGithubActivity(
            user.links.githubUsername, 
            sevenDaysAgo.toISOString()
          );
          
          const contrib3m = await getGithubActivity(
            user.links.githubUsername, 
            threeMonthsAgo.toISOString()
          );
      logger.debug(`Processing GitHub activity for user: ${user.emailId}`);
      
          const score7d = calculateActivityScore(contrib7d);
          const score3m = calculateActivityScore(contrib3m);

       
      await User.findByIdAndUpdate(user._id, {
  $set: {
    "githubActivity.last7dScore": score7d,
    "githubActivity.last3mScore": score3m,
    "githubActivity.last7dCommits": contrib7d?.totalCommitContributions || 0,
    "githubActivity.last3mCommits": contrib3m?.totalCommitContributions || 0,
    "githubActivity.lastChecked": now,
    isGithubActive7d: score7d > 5,
    isGithubActive3m: score3m > 15,
  },
});

          

          if (score7d > 5) activeUsers7d++;
          if (score3m > 15) activeUsers3m++;
          
          processedUsers++;
          
         
          
       
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (userError) {
          logger.warn(`Error processing GitHub data for user ${user.emailId} (ID: ${user._id}): ${userError.message}`, {
            userId: user._id,
            stack: userError.stack 
          });
        }
      }

    

    } catch (err) {
      logger.error("Fatal error in GitHub activity cron job:", err);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
logger.info("GitHub activity cron job scheduled successfully.");
};

module.exports={startGithubActivityCron,getGithubActivity,calculateActivityScore}