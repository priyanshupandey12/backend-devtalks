DevTalks
A networking platform designed to connect engineering students and developers. Find collaborators, mentors, and peers based on your skills, goals, and location.

🚀 Key Features
Live GitHub Activity Status: User profiles display an activity ring (🟢, 🟡, ⚪️) indicating their recent GitHub commit history. This helps you find currently active developers.

Advanced Skill & Role Search: Find the exact person you need. Search by specific programming languages (e.g., Python, React) or by development roles (e.g., "Frontend Developer," "UI/UX Designer," "Data Analyst").

Geospatial Radius Search: Discover developers within a specific geographic radius. Find collaborators in your city or within a 500km range, powered by MongoDB's geospatial queries.

Real-Time Chat: Instantly connect and collaborate with other users through a built-in, real-time messaging system (using Socket.io).

Goal-Oriented Matching: Filter users based on their primary goals, such as "Finding project partners," "Looking for a mentor," or "Learning a new skill."

Secure Authentication: Robust user login and registration with Google OAuth (using Passport.js) and secure password handling.

Cloud Image Uploads: User profile pictures are handled efficiently in memory (using Multer) and uploaded directly to Cloudinary, ensuring a stateless and scalable server.

Scheduled Jobs: A node-cron job runs automatically to periodically fetch and update GitHub activity for all users.

🛠️ Tech Stack
This project is built with the MERN stack and a focus on security, scalability, and performance.

Core Stack
Backend & DevOps
Security & Logging
🔧 Getting Started
To get a local copy up and running, follow these simple steps.

Prerequisites
Node.js & npm

MongoDB (local or Atlas cluster)

Redis (local or cloud instance)

Docker (if running Redis locally)

Installation
Clone the repo

Bash

git clone https://github.com/priyanshupandey12/frontend-devtalks
cd your-repo-name
Install Backend Dependencies

Bash

# Navigate to the backend/server folder (if you have one)
npm install
Install Frontend Dependencies

Bash

# Navigate to the frontend/client folder
cd ../frontend
npm install
🔑 Environment Variables
You will need to create a .env file in your backend directory. This file is crucial for storing your secret keys and database URLs.

Code snippet

# Server Configuration
PORT=8000

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

# Google OAuth (Passport)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# GitHub API (for cron job)
GITHUB_TOKEN=your_personal_github_access_token
Running the Application
Start the Backend Server

Bash

# From the backend directory
npm run dev
Start the Frontend App

Bash

# From the frontend directory
npm run dev