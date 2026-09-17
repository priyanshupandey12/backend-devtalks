require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const { getGithubActivity, calculateActivityScore } = require('../src/utils/githubcron');
const connectDB = require('../config/database');

async function syncAllGithub() {
  await connectDB();
  console.log('Using GITHUB_TOKEN:', process.env.GITHUB_TOKEN ? `${process.env.GITHUB_TOKEN.substring(0, 10)}...` : 'NONE');

  const users = await User.find({
    "links.githubUsername": { $exists: true, $ne: "" }
  });

  console.log(`Syncing GitHub activity for ${users.length} users with GitHub usernames...`);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

  let active7dCount = 0;
  let active3mCount = 0;

  for (const user of users) {
    const username = user.links.githubUsername.trim();
    console.log(`\nProcessing: ${user.firstName} ${user.lastName} (@${username})...`);

    const contrib7d = await getGithubActivity(username, sevenDaysAgo);
    const contrib3m = await getGithubActivity(username, threeMonthsAgo);

    const score7d = calculateActivityScore(contrib7d);
    const score3m = calculateActivityScore(contrib3m);

    const commits7d = contrib7d?.totalCommitContributions || 0;
    const commits3m = contrib3m?.totalCommitContributions || 0;

    const isActive7d = score7d > 0 || commits7d > 0;
    const isActive3m = score3m > 0 || commits3m > 0;

    user.githubActivity = {
      last7dScore: score7d,
      last3mScore: score3m,
      last7dCommits: commits7d,
      last3mCommits: commits3m,
      lastChecked: now
    };
    user.isGithubActive7d = isActive7d;
    user.isGithubActive3m = isActive3m;

    await user.save();

    if (isActive7d) active7dCount++;
    if (isActive3m) active3mCount++;

    console.log(`Updated ${user.firstName}: 7d Commits=${commits7d}, Score=${score7d}, Active7d=${isActive7d}`);
  }

  console.log(`\nGitHub Sync Complete! Active 7d: ${active7dCount}, Active 3m: ${active3mCount}`);
  process.exit(0);
}

syncAllGithub();
