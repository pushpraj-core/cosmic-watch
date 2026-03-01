const axios = require('axios');
const NEO = require('../models/NEO');
const cron = require('node-cron');

const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const NASA_NEO_API_URL = 'https://api.nasa.gov/neo/rest/v1';

// Risk scoring algorithm
const calculateRiskScore = (neo) => {
  let score = 0;

  if (neo.is_potentially_hazardous_asteroid) {
    score += 50;
  }

  const diameter = neo.estimated_diameter?.meters?.estimated_diameter_max || 0;
  if (diameter > 1000) score += 25;
  else if (diameter > 500) score += 20;
  else if (diameter > 200) score += 15;
  else if (diameter > 100) score += 10;
  else if (diameter > 50) score += 5;

  if (neo.close_approach_data && neo.close_approach_data.length > 0) {
    const nextApproach = neo.close_approach_data[0];
    const missDistance = parseFloat(nextApproach.miss_distance?.astronomical) || 1;
    
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

// Fetch data from NASA API
const fetchNEOData = async () => {
  try {
    const randomPage = Math.floor(Math.random() * 676); // NASA has ~676 pages of NEO data
    
    const response = await axios.get(
      `${NASA_NEO_API_URL}/neo/browse?api_key=${NASA_API_KEY}&page=${randomPage}&size=20`
    );

    const neos = response.data.near_earth_objects || [];

    for (const neo of neos) {
      const riskScore = calculateRiskScore(neo);
      
      await NEO.findOneAndUpdate(
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
          absoluteMagnitude: neo.absolute_magnitude_h,
          riskScore,
          riskLevel: getRiskLevel(riskScore),
          nasaUrl: neo.nasa_jpl_url,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
    }

    console.log(`[${new Date().toISOString()}] Successfully fetched ${neos.length} NEOs from page ${randomPage}`);
    return true;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching NEO data:`, error.message);
    return false;
  }
};

// Schedule tasks to achieve 900 requests per hour
// 900 requests/hour ≈ 1 request every 4 seconds
let requestCount = 0;
let lastResetTime = Date.now();

const initializeScheduler = () => {
  console.log('🔄 Initializing NASA NEO API scheduler for 900 requests/hour...');

  // Run every 4 seconds (approximately 900 requests per hour)
  const scheduleInterval = setInterval(async () => {
    requestCount++;
    await fetchNEOData();
  }, 4000); // 3600000ms / 900 = 4000ms

  // Monitor request rate every minute
  setInterval(() => {
    const now = Date.now();
    if (now - lastResetTime >= 3600000) {
      console.log(`📊 Completed ${requestCount} API requests in the last hour`);
      requestCount = 0;
      lastResetTime = now;
    }
  }, 60000); // Check every minute

  // Also run a cron job at the start of every hour for a full refresh
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Hourly full refresh triggered');
    await fetchNEOData();
  });

  console.log('✓ NASA NEO API scheduler started (900 requests/hour)');
};

// Export for use in server
module.exports = { initializeScheduler, fetchNEOData };
