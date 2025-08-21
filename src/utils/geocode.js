const axios=require('axios');


async function geocodeAddress(address) {
  const apiKey = process.env.OPENCAGE_API_KEY;
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await axios.get(url);

  if (!res.data.results.length) throw new Error("Address not found");

  const loc = res.data.results[0].geometry;
  return [loc.lng, loc.lat]; 
}



module.exports=geocodeAddress;