# 🌌 Cosmic Watch - Interstellar Asteroid Tracker & Risk Analyzer

> **Real-time Near-Earth Object (NEO) monitoring platform with risk analysis, community discussions, and Docker deployment**


## 🎯 Project Overview

Cosmic Watch is a full-stack web application that transforms complex asteroid data from NASA into actionable insights. Users can track potentially hazardous asteroids, analyze collision risks, receive alerts about close approaches, and participate in community discussions.

**Mission**: Make space data accessible and understandable for researchers, enthusiasts, and the general public.

---

## ✨ Key Features

### 🔐 User Management
- Secure registration and login with JWT authentication
- Personal watch lists for tracking asteroids
- Customizable alert thresholds and preferences
- User profile management

### 🛰️ Real-Time Data Integration
- Live asteroid data from NASA NeoWs API
- Hazard classification and orbital information
- Close approach predictions
- Last updated timestamps

### 🎯 Intelligent Risk Analysis
- **Multi-factor scoring algorithm**:
  - Hazardous status (50 points)
  - Estimated diameter (0-25 points)
  - Close approach distance (0-25 points)
- **Risk levels**: CRITICAL, HIGH, MEDIUM, LOW
- **User customization**: Set your own thresholds

### 📊 Interactive Dashboard
- Overview statistics (total NEOs, hazardous count, critical risk count)
- Advanced filtering by risk level, hazard status
- Real-time search by asteroid name
- Risk indicators with color coding
- Quick access to detailed information

### 📝 Community Features
- Real-time chat discussions per asteroid (WebSocket)
- Share observations and insights
- Collaborate with researchers worldwide
- Message persistence and threading

### 🚀 Production Ready
- Docker containerization with multi-stage builds
- Docker Compose orchestration
- Comprehensive API documentation (Postman)
- Security best practices throughout

---

## 🚀 Quick Start

### Option 1: Local Development

**Prerequisites**: Node.js 16+, MongoDB

```bash
# Terminal 1: Backend
cd backend
npm install && npm run dev

# Terminal 2: Frontend
cd frontend
npm install && npm run dev
```

Visit: http://localhost:3000

### Option 2: Docker (Recommended)

**Prerequisites**: Docker Desktop

```bash
docker-compose up
```

Visit: http://localhost:3000  
API: http://localhost:5000/api

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **PROJECT_SUMMARY.md** | Complete project overview & submission |
| **SETUP_GUIDE.md** | Detailed setup & troubleshooting |
| **FEATURES.md** | Complete feature list & specifications |
| **QUICK_REFERENCE.md** | Quick guide for judges & testers |
| **AI-LOG.md** | Transparency on AI usage |
| **Cosmic-Watch-API.postman_collection.json** | API testing suite (16 endpoints) |

---

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↓
API Gateway (Express + Node.js)
    ↓
Database (MongoDB)
    ↕
Real-Time (Socket.io)
    ↕
External API (NASA NeoWs)
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 18, Vite | Fast dev, modern UX |
| **Backend** | Node.js, Express | JavaScript full-stack |
| **Database** | MongoDB | Flexible schema |
| **Real-Time** | Socket.io | Live community chat |
| **Container** | Docker, Compose | Production deployment |
| **Auth** | JWT, bcryptjs | Secure & standard |

---

## 🔌 API Endpoints Overview

### Authentication (4 endpoints)
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login & get token
- `GET /api/auth/profile` - User profile
- `PUT /api/auth/settings` - Update preferences

### NEO Data (6 endpoints)
- `POST /api/neo/fetch` - Fetch from NASA
- `GET /api/neo/list` - List asteroids
- `GET /api/neo/:neoId` - Asteroid details
- `GET /api/neo/upcoming` - Close approaches

### Watch Management (3 endpoints)
- `POST /api/neo/watch` - Add to watch list
- `GET /api/neo/watched/all` - Watched asteroids
- `DELETE /api/neo/watch/:neoId` - Remove watch

### Community (2 endpoints)
- `GET /api/chat/:neoId` - Chat messages
- `POST /api/chat` - Post message

**Full API docs**: Import `Cosmic-Watch-API.postman_collection.json` into Postman

---

## 🎨 UI Features

### Space-Themed Design
- 🌑 Dark mode by default
- 🔵 Cyan (#00d4ff) accents
- 🎭 Glassmorphism effects
- 📱 Fully responsive
- ⚡ Smooth animations

### Key Screens
1. **Login/Register** - Secure authentication
2. **Dashboard** - Overview & filtering
3. **Details Page** - Full asteroid info
4. **Chat Interface** - Real-time discussions

---

## 📊 Database Schema

### Collections
- **Users** - Accounts, watch lists, preferences
- **NEOs** - Asteroid data, risk scores, orbital info
- **Alerts** - Notification system
- **Chat** - Community discussions

See `SETUP_GUIDE.md` for complete schema documentation.

---

## 🐳 Docker Deployment

### Single Command
```bash
docker-compose up
```

### Services
- **Frontend** (port 3000) - React UI
- **Backend** (port 5000) - Express API
- **MongoDB** (port 27017) - Database

### Features
- ✅ Multi-stage builds (optimize size)
- ✅ Health checks (reliability)
- ✅ Volume persistence (data safety)
- ✅ Network isolation
- ✅ Non-root users (security)

---

## 🔒 Security

✅ Password hashing with bcryptjs (10 rounds)  
✅ JWT token authentication (7-day expiration)  
✅ CORS configuration  
✅ Input validation  
✅ SQL injection prevention  
✅ XSS protection  
✅ Non-root Docker execution  
✅ Environment variable protection  

---

## 📈 Risk Analysis Algorithm

### Scoring Breakdown

**Hazardous Status** (50 points)
- Classified as potentially hazardous: +50

**Estimated Diameter** (0-25 points)
- >1000m: 25 | >500m: 20 | >200m: 15 | >100m: 10 | >50m: 5 | ≤50m: 0

**Close Approach Distance** (0-25 points)
- <0.01 AU: 25 | <0.02 AU: 20 | <0.05 AU: 15 | <0.1 AU: 10 | <0.2 AU: 5 | ≥0.2 AU: 0

### Risk Levels
- **CRITICAL**: Score ≥ 75 (Red)
- **HIGH**: 50-74 (Orange)
- **MEDIUM**: 25-49 (Yellow)
- **LOW**: < 25 (Green)

---

## 🎯 Features Checklist

### Core Requirements ✅
- [x] User Authentication & Verification
- [x] Real-Time Data Feed (NASA API)
- [x] Risk Analysis Engine
- [x] Alert & Notification System
- [x] Containerized Deployment (Docker)

### Deliverables ✅
- [x] Full-Stack Application
- [x] API Documentation (Postman)
- [x] Docker & Docker Compose
- [x] AI Usage Log (Transparency)
- [x] Comprehensive Documentation

### Bonus Features ✅
- [x] Real-time Chat (WebSocket)
- [x] Advanced Filtering & Search
- [x] Professional UI Design
- [x] Production-Ready Code

### Not Implemented
- 3D Asteroid Visualization (Focus on core)

---

## 📝 How to Test

### With Postman
1. Import `Cosmic-Watch-API.postman_collection.json`
2. Click "Register User"
3. Click "Login User" (auto-saves token)
4. Try any endpoint with examples

### Manual Testing
1. Open http://localhost:3000
2. Register new account
3. Login
4. Click "View Details" on any asteroid
5. Try chat, filters, watch button

### Docker Health Check
```bash
curl http://localhost:5000/api/health
```

---

## 🛠️ Development

### Project Structure
```
HACKATHON/
├── backend/            # Express server
│   ├── models/         # Mongoose schemas
│   ├── controllers/    # Business logic
│   ├── routes/         # API routing
│   └── server.js       # Entry point
├── frontend/           # React app
│   ├── src/pages/      # Page components
│   ├── src/hooks/      # State management
│   └── src/styles/     # Component styles
└── docker-compose.yml  # Container config
```

### Available Scripts

**Backend**
```bash
npm run dev    # Start with auto-reload
npm start      # Production mode
```

**Frontend**
```bash
npm run dev     # Dev server with HMR
npm run build   # Production build
npm run preview # Preview build
```

---

## 🚀 Deployment

### Production Checklist
- [ ] Set strong `JWT_SECRET`
- [ ] Use real NASA API key
- [ ] Configure MongoDB credentials
- [ ] Enable HTTPS
- [ ] Set `NODE_ENV=production`
- [ ] Configure domain/IP
- [ ] Set up monitoring
- [ ] Enable backup strategy

### Hosting Options
- **Backend**: Heroku, Railway, Render, AWS (recommended: Railway)
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Database**: MongoDB Atlas (recommended)
- **All-in-One**: AWS ECS, DigitalOcean, Linode

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Solution: Install local MongoDB or use MongoDB Atlas
MongoDB Atlas: https://www.mongodb.com/cloud/atlas
```

### Port Already in Use
```bash
# Change PORT in .env, or:
# Windows: netstat -ano | findstr :5000 → taskkill /PID <PID> /F
# Mac/Linux: lsof -i :5000 → kill -9 <PID>
```

### CORS Error
```
Solution: Verify FRONTEND_URL in backend .env matches frontend port
```

For more help, see `SETUP_GUIDE.md`

---

## 📖 Learn More

- **NASA API**: https://api.nasa.gov
- **MongoDB**: https://docs.mongodb.com
- **Express.js**: https://expressjs.com
- **React**: https://react.dev
- **Socket.io**: https://socket.io
- **Docker**: https://docker.com

---

## 📄 License

MIT License - Free to use and modify

---

## 👨‍💻 Author

**Solo Development** with AI assistance (documented in AI-LOG.md)

---

## 🙏 Acknowledgments

- **NASA** for the NeoWs API
- **Open Source Community** for amazing tools
- **Hackathon Organizers** for the opportunity

---

## 📞 Support

### Quick Help
- Check `QUICK_REFERENCE.md` for fast answers
- Review `SETUP_GUIDE.md` for detailed instructions
- Import Postman collection for API examples
- Read `FEATURES.md` for complete specs

### Common Questions
- "Does it really connect to NASA?" → Yes!
- "Can I test without MongoDB?" → Yes, use Docker
- "Is the chat real-time?" → Yes, WebSocket-powered
- "Is it production-ready?" → Yes, fully containerized

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: February 7, 2026

---

🌌 **Made with passion for space and cutting-edge technology!**

**Let's explore the cosmos together!**

#
