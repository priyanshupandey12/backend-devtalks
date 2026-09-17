require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const connectDB = require('../config/database');

const DIVERSE_LOCATIONS = [
  { city: 'Delhi', state: 'Delhi NCR', lng: 77.1025, lat: 28.7041 },
  { city: 'Gurugram', state: 'Haryana', lng: 77.0266, lat: 28.4595 },
  { city: 'Noida', state: 'Uttar Pradesh', lng: 77.3910, lat: 28.5355 },
  { city: 'Chandigarh', state: 'Punjab', lng: 76.7794, lat: 30.7333 },
  { city: 'Hyderabad', state: 'Telangana', lng: 78.4867, lat: 17.3850 },
  { city: 'Pune', state: 'Maharashtra', lng: 73.8567, lat: 18.5204 },
  { city: 'Mumbai', state: 'Maharashtra', lng: 72.8777, lat: 19.0760 },
  { city: 'Bengaluru', state: 'Karnataka', lng: 77.5946, lat: 12.9716 },
  { city: 'Jaipur', state: 'Rajasthan', lng: 75.7873, lat: 26.9124 },
  { city: 'Kolkata', state: 'West Bengal', lng: 88.3639, lat: 22.5726 },
  { city: 'Ahmedabad', state: 'Gujarat', lng: 72.5714, lat: 23.0225 },
  { city: 'Chennai', state: 'Tamil Nadu', lng: 80.2707, lat: 13.0827 },
];

const seedLocations = async () => {
  try {
    await connectDB();
    console.log('Database connected successfully.');

    const users = await User.find({});
    console.log(`Found ${users.length} total users to distribute across locations.`);

    for (let i = 0; i < users.length; i++) {
      const loc = DIVERSE_LOCATIONS[i % DIVERSE_LOCATIONS.length];
      const jitterLng = ((i % 7) - 3) * 0.04;
      const jitterLat = (((i * 3) % 7) - 3) * 0.04;

      const finalLng = Number((loc.lng + jitterLng).toFixed(4));
      const finalLat = Number((loc.lat + jitterLat).toFixed(4));
      const fullAddress = `${loc.city}, ${loc.state}`;

      await User.findByIdAndUpdate(users[i]._id, {
        $set: {
          'location.type': 'Point',
          'location.coordinates': [finalLng, finalLat],
          'location.address': fullAddress
        }
      });
    }

    console.log(`Successfully updated ${users.length} users with diverse Indian city locations!`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed locations:', error);
    process.exit(1);
  }
};

seedLocations();
