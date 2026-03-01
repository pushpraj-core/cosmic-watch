# 🚀 Cosmic Watch - Setup & Deployment Guide

## Quick Start (Local Development)

### Prerequisites
- Node.js 16+ 
- MongoDB running locally OR MongoDB Atlas account
- Git
- npm or yarn

### Step 1: Clone/Setup Workspace
```bash
cd HACKATHON
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
cp .env.example .env
```

**Edit `.backend/.env`:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hackathon
JWT_SECRET=your_super_secret_key_change_in_production
NASA_API_KEY=DEMO_KEY  # Get free key from https://api.nasa.gov
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Step 3: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### Step 4: Run Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Backend runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### Step 5: Access Application
- Open `http://localhost:3000` in your browser
- Register or login with your account
- Start tracking asteroids!

---

## Docker Deployment (Production)

### Prerequisites
- Docker Desktop installed and running
- Docker Compose

### Step 1: Configure Environment
```bash
cd HACKATHON
cp backend/.env.example backend/.env
```

**Edit `backend/.env`:**
```env
MONGODB_URI=mongodb://admin:admin@mongo:27017/hackathon?authSource=admin
JWT_SECRET=your_production_secret_key
NASA_API_KEY=your_actual_nasa_api_key
```

### Step 2: Build & Run with Docker Compose
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Step 3: Access Application
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- MongoDB: `localhost:27017` (internal)

**First-time setup:**
```bash
# Verify services are running
docker-compose ps

# View backend logs
docker-compose logs backend

# Check MongoDB connection
docker-compose exec mongo mongosh -u admin -p admin
```

### Step 4: Verify Health
```bash
# Backend health check
curl http://localhost:5000/api/health

# Should return:
# {"status":"Backend is running!","timestamp":"2026-02-07T..."}
```

---

## API Testing with Postman

### Import Collection
1. Open Postman
2. Click "Import" → "Upload Files"
3. Select `Cosmic-Watch-API.postman_collection.json`
4. Collection is imported with all endpoints

### Test Workflow
1. **Register**: POST `/auth/register` with new credentials
2. **Login**: POST `/auth/login` - saves token automatically
3. **Fetch NEOs**: POST `/neo/fetch` - loads NASA data
4. **Browse**: GET `/neo/list` - view all asteroids
5. **Watch**: POST `/neo/watch` - add to watch list
6. **Chat**: GET `/chat/:neoId` - view discussions

### Environment Variables
- `base_url`: http://localhost:5000/api (default)
- `token`: Auto-set after login

---

## Available npm Scripts

### Backend
```bash
npm run dev   # Start with nodemon (auto-reload)
npm start     # Start production server
```

### Frontend
```bash
npm run dev     # Start Vite dev server with auto-reload
npm run build   # Build for production
npm run preview # Preview production build
```

---

## Project Structure

```
HACKATHON/
├── backend/
│   ├── models/
│   │   ├── User.js          # User authentication & profiles
│   │   ├── NEO.js           # Asteroid data & risk scores
│   │   ├── Alert.js         # Notification system
│   │   └── Chat.js          # Community discussions
│   ├── controllers/
│   │   ├── authController.js  # Auth logic & user management
│   │   ├── neoController.js   # NEO data & risk analysis
│   │   └── chatController.js  # Chat functionality
│   ├── routes/
│   │   ├── authRoutes.js    # /api/auth endpoints
│   │   ├── neoRoutes.js     # /api/neo endpoints
│   │   └── chatRoutes.js    # /api/chat endpoints
│   ├── middleware/
│   │   └── auth.js          # JWT verification
│   ├── server.js            # Express & Socket.io setup
│   ├── package.json         # Dependencies
│   ├── Dockerfile           # Docker image config
│   └── .env.example         # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx        # Authentication page
│   │   │   ├── Register.jsx     # Registration page
│   │   │   ├── Dashboard.jsx    # Main dashboard with list
│   │   │   └── NEODetails.jsx   # Asteroid detail view
│   │   ├── hooks/
│   │   │   ├── useAuth.js       # Auth state (Zustand)
│   │   │   └── useNEO.js        # NEO data (Zustand)
│   │   ├── styles/
│   │   │   ├── Auth.css         # Login/register styles
│   │   │   ├── Dashboard.css    # Dashboard styles
│   │   │   └── NEODetails.css   # Details page styles
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Global styles
│   ├── vite.config.js       # Vite configuration
│   ├── index.html           # HTML template
│   ├── Dockerfile           # Docker image config
│   └── package.json         # Dependencies
│
├── docker-compose.yml       # Multi-container orchestration
├── Cosmic-Watch-API.postman_collection.json  # API tests
├── AI-LOG.md               # AI usage documentation
├── README.md               # Project documentation
└── .gitignore             # Git exclusions
```

---

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  watchedAsteroids: [{
    neoId: String,
    name: String,
    addedAt: Date
  }],
  alertSettings: {
    maxDistance: Number (AU),
    minDiameter: Number (meters),
    enableNotifications: Boolean
  },
  createdAt: Date
}
```

### NEOs Collection
```javascript
{
  _id: ObjectId,
  neoId: String (unique),
  name: String,
  isPotentiallyHazardous: Boolean,
  estimatedDiameter: {
    min: Number (meters),
    max: Number (meters),
    unit: String
  },
  closeApproachDates: [{
    date: Date,
    relativeVelocity: {
      kmPerSecond: Number,
      kmPerHour: Number,
      milesPerHour: Number
    },
    missDistance: {
      astronomical: Number (AU),
      km: Number,
      miles: Number
    },
    orbitingBody: String
  }],
  riskScore: Number (0-100),
  riskLevel: String (LOW|MEDIUM|HIGH|CRITICAL),
  lastUpdated: Date
}
```

---

## Key Features

### ✅ Core Features
- **User Authentication**: JWT-based secure login/registration
- **NEO Database**: Real-time data from NASA API
- **Risk Analysis**: Intelligent scoring algorithm (hazard, size, distance)
- **Watch List**: Users can track specific asteroids
- **Dashboard**: Filter by risk level, search, view statistics
- **Detailed View**: Complete asteroid information with orbital data
- **Community Chat**: Discuss asteroids with other users

### 🎯 UI/UX Features
- **Space-Themed Design**: Dark mode with cyan accents
- **Responsive Layout**: Mobile, tablet, and desktop support
- **Real-time Updates**: WebSocket for live chat
- **Risk Visualization**: Color-coded severity indicators
- **Smooth Animations**: Transitions and hover effects

### 🚀 DevOps Features
- **Docker**: Multi-stage builds, optimized images
- **Docker Compose**: Single-command deployment
- **Health Checks**: Service readiness verification
- **Environment Config**: Flexible configuration management
- **Non-root Users**: Security best practices

---

## Risk Analysis Algorithm

The risk score is calculated from three factors:

### 1. Hazardous Status (50 points)
- Potentially hazardous asteroid = +50
- Non-hazardous = 0

### 2. Estimated Diameter (0-25 points)
- > 1000m = 25 points
- > 500m = 20 points
- > 200m = 15 points  
- > 100m = 10 points
- > 50m = 5 points
- ≤ 50m = 0 points

### 3. Close Approach Distance (0-25 points)
- < 0.01 AU = 25 points
- < 0.02 AU = 20 points
- < 0.05 AU = 15 points
- < 0.1 AU = 10 points
- < 0.2 AU = 5 points
- ≥ 0.2 AU = 0 points

### Risk Level Thresholds
- **CRITICAL**: Score ≥ 75
- **HIGH**: Score ≥ 50 and < 75
- **MEDIUM**: Score ≥ 25 and < 50
- **LOW**: Score < 25

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login & get token
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/settings` - Update alert settings (protected)

### NEO Data
- `POST /api/neo/fetch` - Fetch from NASA API
- `GET /api/neo/list` - List all NEOs with filters
- `GET /api/neo/:neoId` - Get specific NEO details
- `GET /api/neo/upcoming` - Get asteroids with upcoming approaches

### User Management
- `POST /api/neo/watch` - Add asteroid to watch list (protected)
- `GET /api/neo/watched/all` - Get user's watched asteroids (protected)
- `DELETE /api/neo/watch/:neoId` - Remove from watch list (protected)

### Community
- `GET /api/chat/:neoId` - Get messages for asteroid
- `POST /api/chat` - Post new message (protected)

### Health
- `GET /api/health` - Backend status check

---

## Environment Variables Reference

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGODB_URI | Database connection | mongodb://localhost:27017/hackathon |
| JWT_SECRET | Secret for token signing | your_secret_key |
| NASA_API_KEY | NASA API key | Get from https://api.nasa.gov |
| NODE_ENV | Environment | development/production |
| FRONTEND_URL | Frontend origin | http://localhost:3000 |

### Frontend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:5000/api |

---

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: Ensure MongoDB is running
```bash
# Check if MongoDB is running
docker ps | grep mongo

# Or start local MongoDB
mongod
```

### Port Already in Use  
```
Error: listen EADDRINUSE :::5000
```
**Solution**: Kill process on port or change PORT in .env
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Ensure CORS is enabled in server.js and env variables match

### Docker Build Fails
```bash
# Clear cache and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

---

## Performance Tips

1. **Database Indexing**: NEO queries are indexed on neoId for speed
2. **Caching**: Frontend state uses Zustand for efficient updates
3. **Lazy Loading**: React Router code splitting built-in
4. **Image Optimization**: Vite handles asset optimization
5. **API Batching**: Fetch multiple NEOs in single NASA request

---

## Security Checklist

- [ ] Change `JWT_SECRET` in production
- [ ] Use real NASA API key (not DEMO_KEY)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS in production
- [ ] Configure firewall rules
- [ ] Use strong MongoDB passwords
- [ ] Regular security updates for dependencies
- [ ] Monitor error logs

---

## Next Steps

### Bonus Features to Implement
1. **3D Asteroid Visualization** (Three.js)
   - Render orbital paths
   - Interactive 3D models
   - Real-time position updates

2. **Advanced Notifications**
   - Email alerts
   - SMS notifications
   - Push notifications

3. **Analytics**
   - User engagement metrics
   - Most watched asteroids
   - Close approach statistics

4. **Machine Learning**
   - Impact probability prediction
   - Anomaly detection
   - Recommendation engine

---

## Support & Resources

- **NASA API Docs**: https://api.nasa.gov
- **MongoDB Documentation**: https://docs.mongodb.com
- **Express.js Guide**: https://expressjs.com
- **React Documentation**: https://react.dev
- **Docker Guide**: https://docker.com

---

**Last Updated**: February 7, 2026  
**Version**: 1.0.0  
**Status**: Production Ready

Happy tracking! 🌌
