# 💬 DevTalks

<div align="center">

**A networking platform designed to connect engineering students and developers**

Find collaborators, mentors, and peers based on your skills, goals, and location.

[Getting Started](#-getting-started) • [Features](#-key-features) • [Tech Stack](#-tech-stack) • [Documentation](#-environment-variables)

</div>

---

## ✨ Key Features

### 🟢 Live GitHub Activity Status
User profiles display an activity ring (🟢, 🟡, ⚪️) indicating their recent GitHub commit history. This helps you find currently active developers.

### 🔍 Advanced Skill & Role Search
Find the exact person you need. Search by specific programming languages (e.g., Python, React) or by development roles (e.g., "Frontend Developer," "UI/UX Designer," "Data Analyst").

### 📍 Geospatial Radius Search
Discover developers within a specific geographic radius. Find collaborators in your city or within a 500km range, powered by MongoDB's geospatial queries.

### 💬 Real-Time Chat
Instantly connect and collaborate with other users through a built-in, real-time messaging system (using Socket.io).

### 🎯 Goal-Oriented Matching
Filter users based on their primary goals, such as "Finding project partners," "Looking for a mentor," or "Learning a new skill."

### 🔐 Secure Authentication
Robust user login and registration with Google OAuth (using Passport.js) and secure password handling.

### ☁️ Cloud Image Uploads
User profile pictures are handled efficiently in memory (using Multer) and uploaded directly to Cloudinary, ensuring a stateless and scalable server.

### ⏰ Scheduled Jobs
A node-cron job runs automatically to periodically fetch and update GitHub activity for all users.

---

## 🛠️ Tech Stack

This project is built with the MERN stack and a focus on security, scalability, and performance.

### Core Stack
- **MongoDB** - NoSQL database for flexible data storage
- **Express.js** - Fast, minimalist web framework
- **React** - Component-based UI library
- **Node.js** - JavaScript runtime environment

### Backend & DevOps
- **Socket.io** - Real-time bidirectional communication
- **Redis** - In-memory data store for session management
- **node-cron** - Task scheduler for automated jobs
- **Docker** - Containerization platform

### Security & Logging
- **Passport.js** - Authentication middleware
- **JWT** - Secure token-based authentication
- **bcrypt** - Password hashing
- **Helmet** - Security headers
- **Winston** - Logging library

### Cloud Services
- **Cloudinary** - Image hosting and optimization
- **GitHub API** - Fetch user activity data

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Ensure you have the following installed:

- **Node.js** & npm
- **MongoDB** (local or Atlas cluster)
- **Redis** (local or cloud instance)
- **Docker** (if running Redis locally)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/priyanshupandey12/frontend-devtalks
cd frontend-devtalks
```

2. **Install Backend Dependencies**

```bash
# Navigate to the backend/server folder
npm install
```

3. **Install Frontend Dependencies**

```bash
# Navigate to the frontend/client folder
cd ../frontend
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file in your backend directory with the following configuration:

```env
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

# GitHub API
GITHUB_TOKEN=your_personal_github_access_token
```

> ⚠️ **Important:** Never commit your `.env` file to version control. Add it to `.gitignore`.

---

## 🎮 Running the Application

### Start the Backend Server

```bash
# From the backend directory
npm run dev
```

The server will start on `http://localhost:8000`

### Start the Frontend App

```bash
# From the frontend directory
npm run dev
```

The app will open on `http://localhost:3000`

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/priyanshupandey12/frontend-devtalks/issues).

## 👨‍💻 Author

**Priyanshu Pandey**

- GitHub: [@priyanshupandey12](https://github.com/priyanshupandey12)

---

<div align="center">

**Made with ❤️ for the developer community**

⭐️ Star this repo if you find it helpful!

</div>