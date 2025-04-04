const { getPrefix } = require('./prefixHandler');
const axios = require('axios');

// Weather code descriptions with emojis
const WEATHER_CODES = {
    0: '☀️ Clear sky',
    1: '🌤️ Mainly clear',
    2: '⛅ Partly cloudy',
    3: '☁️ Overcast',
    45: '🌫️ Fog',
    48: '🌫️ Rime fog',
    51: '🌧️ Light drizzle',
    53: '🌧️ Moderate drizzle',
    55: '🌧️ Dense drizzle',
    56: '🌨️ Light freezing drizzle',
    57: '🌨️ Dense freezing drizzle',
    61: '🌧️ Slight rain',
    63: '🌧️ Moderate rain',
    65: '🌧️ Heavy rain',
    66: '🌨️ Light freezing rain',
    67: '🌨️ Heavy freezing rain',
    71: '❄️ Slight snow',
    73: '❄️ Moderate snow',
    75: '❄️ Heavy snow',
    77: '❄️ Snow grains',
    80: '🌦️ Slight rain showers',
    81: '🌦️ Moderate rain showers',
    82: '🌦️ Violent rain showers',
    85: '🌨️ Slight snow showers',
    86: '🌨️ Heavy snow showers',
    95: '⛈️ Thunderstorm',
    96: '⛈️ Thunderstorm with hail',
    99: '⛈️ Thunderstorm with heavy hail'
};

// Wind direction compass
const WIND_DIRECTIONS = [
    '↓ N', '↙ NE', '← E', '↖ SE', 
    '↑ S', '↗ SW', '→ W', '↘ NW'
];

module.exports = async (sock, sender, text, msg) => {
    try {
        const location = text.split(' ').slice(1).join(' ').trim();
        if (!location) {
            await sock.sendMessage(sender, { 
                text: '```❌ Please specify a location!\nExample: .weather Tokyo``` ☘️Ⓜ️' 
            });
            return;
        }

        // Get coordinates
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
        const geoResponse = await axios.get(geoUrl);
        
        if (!geoResponse.data.results?.length) {
            await sock.sendMessage(sender, { 
                text: '```❌ Location not found!\nTry: .weather London``` ☘️Ⓜ️' 
            });
            return;
        }

        const { latitude, longitude, name, country, admin1 } = geoResponse.data.results[0];
        const region = admin1 ? `, ${admin1}` : '';

        // Get weather data
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,apparent_temperature,precipitation_probability,visibility&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;
        const weatherResponse = await axios.get(weatherUrl);
        
        const current = weatherResponse.data.current_weather;
        const daily = weatherResponse.data.daily;
        const hourly = weatherResponse.data.hourly;
        
        // Format wind direction
        const windDirIndex = Math.round(current.winddirection / 45) % 8;
        const windDirection = WIND_DIRECTIONS[windDirIndex];

        // Create formatted message
        const weatherMessage = 
`\`\`\`🌍 ${name}${region}, ${country}

🌡️ ${current.temperature}°C (Feels like ${hourly.apparent_temperature[0]}°C)
${WEATHER_CODES[current.weathercode] || '🌈 Unknown weather'}

📊 Today:
   ↑ ${daily.temperature_2m_max[0]}°C  ↓ ${daily.temperature_2m_min[0]}°C
   💧 ${hourly.relativehumidity_2m[0]}% humidity
   🌧️ ${hourly.precipitation_probability[0]}% rain chance
   👀 ${hourly.visibility[0]/1000}km visibility

💨 Wind: ${current.windspeed} km/h ${windDirection}

⏰ Sunrise: ${new Date(daily.sunrise[0]).toLocaleTimeString()}
🌇 Sunset: ${new Date(daily.sunset[0]).toLocaleTimeString()}

🕒 Last update: ${new Date(current.time).toLocaleTimeString()}
\`\`\` ☘️Ⓜ️`;

        await sock.sendMessage(sender, { text: weatherMessage });

    } catch (error) {
        console.error('Weather error:', error);
        await sock.sendMessage(sender, { 
            text: '```❌ Weather service unavailable!\nTry again later.``` ☘️Ⓜ️' 
        });
    }
};