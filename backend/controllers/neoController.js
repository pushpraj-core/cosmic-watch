const axios = require('axios');
const NEO = require('../models/NEO');
const User = require('../models/User');
const Alert = require('../models/Alert');

const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const NASA_NEO_API_URL = 'https://api.nasa.gov/neo/rest/v1';

// Risk scoring algorithm
const calculateRiskScore = (neo) => {
  let score = 0;

  // Hazardous status: 50 points
  if (neo.isPotentiallyHazardous) {
    score += 50;
  }

  // Diameter: up to 25 points
  const diameter = neo.estimatedDiameter?.max || 0;
  if (diameter > 1000) score += 25;
  else if (diameter > 500) score += 20;
  else if (diameter > 200) score += 15;
  else if (diameter > 100) score += 10;
  else if (diameter > 50) score += 5;

  // Close approach distance: up to 25 points
  if (neo.closeApproachDates && neo.closeApproachDates.length > 0) {
    const nextApproach = neo.closeApproachDates[0];
    const missDistance = nextApproach.missDistance?.astronomical || 1;
    
    if (missDistance < 0.01) score += 25;
    else if (missDistance < 0.02) score += 20;
    else if (missDistance < 0.05) score += 15;
    else if (missDistance < 0.1) score += 10;
    else if (missDistance < 0.2) score += 5;
  }

  return Math.min(score, 100);
};

const getRiskLevel = (score) => {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
};

// Fetch NEOs from NASA API
exports.fetchNEOsFromNASA = async (req, res) => {
  try {
    const response = await axios.get(
      `${NASA_NEO_API_URL}/neo/browse?api_key=${NASA_API_KEY}&page=0&size=20`
    );

    const neos = response.data.near_earth_objects || [];
    const savedNEOs = [];

    for (const neo of neos) {
      // Map close approach data from NASA
      const closeApproachDates = (neo.close_approach_data || []).map((ca) => ({
        date: ca.close_approach_date_full || ca.close_approach_date,
        relativeVelocity: {
          kmPerSecond: parseFloat(ca.relative_velocity?.kilometers_per_second) || 0,
          kmPerHour: parseFloat(ca.relative_velocity?.kilometers_per_hour) || 0,
          milesPerHour: parseFloat(ca.relative_velocity?.miles_per_hour) || 0,
        },
        missDistance: {
          astronomical: parseFloat(ca.miss_distance?.astronomical) || 0,
          km: parseFloat(ca.miss_distance?.kilometers) || 0,
          miles: parseFloat(ca.miss_distance?.miles) || 0,
        },
        orbitingBody: ca.orbiting_body || 'Earth',
      }));

      const riskScore = calculateRiskScore({
        isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
        estimatedDiameter: { max: neo.estimated_diameter?.meters?.estimated_diameter_max },
        closeApproachDates,
      });
      
      const neoDoc = await NEO.findOneAndUpdate(
        { neoId: neo.id },
        {
          neoId: neo.id,
          name: neo.name,
          isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
          estimatedDiameter: {
            min: neo.estimated_diameter?.meters?.estimated_diameter_min,
            max: neo.estimated_diameter?.meters?.estimated_diameter_max,
            unit: 'meters'
          },
          closeApproachDates,
          absoluteMagnitude: neo.absolute_magnitude_h,
          riskScore,
          riskLevel: getRiskLevel(riskScore),
          nasaUrl: neo.nasa_jpl_url,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );

      savedNEOs.push(neoDoc);
    }

    res.json({
      message: 'NEOs fetched and stored successfully',
      count: savedNEOs.length,
      neos: savedNEOs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all NEOs with filters
exports.getNEOs = async (req, res) => {
  try {
    const { hazardous, riskLevel, sort = '-riskScore' } = req.query;
    let query = {};

    if (hazardous === 'true') {
      query.isPotentiallyHazardous = true;
    }
    if (riskLevel) {
      query.riskLevel = riskLevel;
    }

    const neos = await NEO.find(query).sort(sort).limit(50);
    res.json(neos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get specific NEO details
exports.getNEOById = async (req, res) => {
  try {
    const neo = await NEO.findOne({ neoId: req.params.neoId });
    if (!neo) {
      return res.status(404).json({ error: 'NEO not found' });
    }
    res.json(neo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Watch an asteroid
exports.watchAsteroid = async (req, res) => {
  try {
    const { neoId, neoName } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $addToSet: {
          watchedAsteroids: {
            neoId,
            name: neoName,
            addedAt: new Date()
          }
        }
      },
      { new: true }
    );

    res.json({ message: 'Asteroid added to watch list', watchedAsteroids: user.watchedAsteroids });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's watched asteroids
exports.getWatchedAsteroids = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const watchedNeoIds = user.watchedAsteroids.map(a => a.neoId);
    
    const neos = await NEO.find({ neoId: { $in: watchedNeoIds } });
    res.json(neos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unwatch asteroid
exports.unwatchAsteroid = async (req, res) => {
  try {
    const { neoId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $pull: {
          watchedAsteroids: { neoId }
        }
      },
      { new: true }
    );

    res.json({ message: 'Asteroid removed from watch list', watchedAsteroids: user.watchedAsteroids });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get upcoming close approaches
exports.getUpcomingApproaches = async (req, res) => {
  try {
    const now = new Date();
    const neos = await NEO.find({
      'closeApproachDates.date': { $gte: now }
    }).sort({ 'closeApproachDates.date': 1 }).limit(10);

    res.json(neos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
