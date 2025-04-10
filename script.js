// API Configuration
const API_KEY = '8c0db6121a69ae3a6c1412fa5829b719'; // This is my Open weather API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentLocationBtn = document.getElementById('currentLocationBtn');
const recentCitiesDropdown = document.getElementById('recentCitiesDropdown');
const currentWeather = document.getElementById('currentWeather');
const forecastContainer = document.getElementById('forecastContainer');
const errorContainer = document.getElementById('errorContainer');
const errorMessage = document.getElementById('errorMessage');

// State
let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

// Initialize the Website
document.addEventListener('DOMContentLoaded', () => {
    // Load recent cities
    if (recentCities.length > 0) {
        updateRecentCitiesDropdown();
    }

    // Event listeners
    searchBtn.addEventListener('click', handleCitySearch);
    currentLocationBtn.addEventListener('click', handleCurrentLocation);
    cityInput.addEventListener('focus', showRecentCitiesDropdown);
    cityInput.addEventListener('blur', () => {
        // Hide dropdown after a small delay to allow click events
        setTimeout(() => {
            recentCitiesDropdown.classList.add('hidden');
        }, 200);
    });
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCitySearch();
        }
    });
});

// Handle city search
function handleCitySearch() {
    const cityName = cityInput.value.trim();
    
    if (!cityName) {
        showError('Please enter a city name');
        return;
    }

    fetchWeatherByCity(cityName);
}

// Handle current location
function handleCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoords(latitude, longitude);
        },
        (error) => {
            showError('Unable to retrieve your location. Please try again or search by city name.');
            console.error('Geolocation error:', error);
        }
    );
}

// Fetch weather by city name
async function fetchWeatherByCity(cityName) {
    try {
        // Show loading state
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Searching...';
        
        // Fetch current weather
        const currentWeatherUrl = `${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=metric`;
        const currentResponse = await fetch(currentWeatherUrl);
        
        if (!currentResponse.ok) {
            throw new Error('City not found. Please check the spelling and try again.');
        }
        
        const currentData = await currentResponse.json();
        
        // Fetch forecast
        const forecastUrl = `${BASE_URL}/forecast?q=${cityName}&appid=${API_KEY}&units=metric`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();
        
        // Update UI
        updateCurrentWeather(currentData);
        updateForecast(forecastData);
        
        // Add to recent cities
        addToRecentCities(cityName);
        
        // Hide error if any
        hideError();
    } catch (error) {
        showError(error.message);
    } finally {
        // Reset button
        searchBtn.innerHTML = '<i class="fas fa-search mr-2"></i>Search';
    }
}

// Fetch weather by coordinates
async function fetchWeatherByCoords(lat, lon) {
    try {
        // Show loading state
        currentLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Locating...';
        
        // Fetch current weather
        const currentWeatherUrl = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const currentResponse = await fetch(currentWeatherUrl);
        const currentData = await currentResponse.json();
        
        // Fetch forecast
        const forecastUrl = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();
        
        // Update UI
        updateCurrentWeather(currentData);
        updateForecast(forecastData);
        
        // Add to recent cities
        addToRecentCities(currentData.name);
        
        // Hide error if any
        hideError();
    } catch (error) {
        showError('Failed to fetch weather data. Please try again.');
        console.error('Fetch error:', error);
    } finally {
        // Reset button
        currentLocationBtn.innerHTML = '<i class="fas fa-location-arrow mr-2"></i>Use Current Location';
    }
}

// Update current weather display
function updateCurrentWeather(data) {
    const date = new Date(data.dt * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    document.getElementById('currentLocation').textContent = `${data.name} (${date})`;
    document.getElementById('currentTemp').textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById('windSpeed').textContent = `${data.wind.speed} M/S`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    
    // Set weather icon
    const weatherIcon = document.getElementById('weatherIcon');
    const weatherDescription = document.getElementById('weatherDescription');
    weatherDescription.textContent = data.weather[0].description;
    
    // Clear previous classes
    weatherIcon.className = 'text-5xl mr-4';
    
    // Add appropriate icon based on weather condition
    const weatherMain = data.weather[0].main.toLowerCase();
    if (weatherMain.includes('cloud')) {
        weatherIcon.innerHTML = '<i class="fas fa-cloud"></i>';
        weatherIcon.classList.add('text-gray-400');
    } else if (weatherMain.includes('rain')) {
        weatherIcon.innerHTML = '<i class="fas fa-cloud-rain"></i>';
        weatherIcon.classList.add('text-blue-400');
    } else if (weatherMain.includes('snow')) {
        weatherIcon.innerHTML = '<i class="far fa-snowflake"></i>';
        weatherIcon.classList.add('text-blue-200');
    } else if (weatherMain.includes('thunderstorm')) {
        weatherIcon.innerHTML = '<i class="fas fa-bolt"></i>';
        weatherIcon.classList.add('text-yellow-400');
    } else if (weatherMain.includes('clear')) {
        weatherIcon.innerHTML = '<i class="fas fa-sun"></i>';
        weatherIcon.classList.add('text-yellow-500');
    } else {
        weatherIcon.innerHTML = '<i class="fas fa-smog"></i>';
        weatherIcon.classList.add('text-gray-500');
    }
    
    // Show current weather section
    currentWeather.classList.remove('hidden');
}



// Update 5-day forecast
function updateForecast(data) {
    const forecastElement = document.querySelector('#forecastContainer .grid');
    forecastElement.innerHTML = '';
    
    // Group forecasts by day
    const dailyForecasts = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit'
        });
        
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = item;
        }
    });
    
    // Get the next 5 days
    const next5Days = Object.keys(dailyForecasts).slice(0, 5);
    
    // Create forecast cards
    next5Days.forEach(date => {
        const dayData = dailyForecasts[date];
        const dayName = new Date(dayData.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
        
        const card = document.createElement('div');
        card.className = 'forecast-card bg-white rounded-lg shadow-md p-4 text-center';
        card.innerHTML = `
            <p class="font-semibold text-gray-700">${date} (${dayName})</p>
            <div class="my-3 text-3xl">
                ${getWeatherIcon(dayData.weather[0].main)}
            </div>
            <p class="text-xl font-bold">${Math.round(dayData.main.temp)}°C</p>
            <div class="mt-3 text-sm text-gray-600">
                <p><i class="fas fa-wind mr-1"></i> ${dayData.wind.speed} M/S</p>
                <p><i class="fas fa-tint mr-1"></i> ${dayData.main.humidity}%</p>
            </div>
        `;
        
        forecastElement.appendChild(card);
    });
    
    // Show forecast container
    forecastContainer.classList.remove('hidden');
}

// Get appropriate weather icon
function getWeatherIcon(weatherMain) {
    weatherMain = weatherMain.toLowerCase();
    if (weatherMain.includes('cloud')) {
        return '<i class="fas fa-cloud text-gray-400"></i>';
    } else if (weatherMain.includes('rain')) {
        return '<i class="fas fa-cloud-rain text-blue-400"></i>';
    } else if (weatherMain.includes('snow')) {
        return '<i class="far fa-snowflake text-blue-200"></i>';
    } else if (weatherMain.includes('thunderstorm')) {
        return '<i class="fas fa-bolt text-yellow-400"></i>';
    } else if (weatherMain.includes('clear')) {
        return '<i class="fas fa-sun text-yellow-500"></i>';
    } else {
        return '<i class="fas fa-smog text-gray-500"></i>';
    }
}

// Add city to recent searches
function addToRecentCities(cityName) {
    // Avoid duplicates
    recentCities = recentCities.filter(city => city.toLowerCase() !== cityName.toLowerCase());
    
    // Add to beginning of array
    recentCities.unshift(cityName);
    
    // Keep only last 5 cities
    if (recentCities.length > 5) {
        recentCities.pop();
    }
    
    // Save to localStorage
    localStorage.setItem('recentCities', JSON.stringify(recentCities));
    
    // Update dropdown
    updateRecentCitiesDropdown();
}

// Update recent cities dropdown
function updateRecentCitiesDropdown() {
    recentCitiesDropdown.innerHTML = '';
    
    if (recentCities.length === 0) {
        recentCitiesDropdown.classList.add('hidden');
        return;
    }
    
    recentCities.forEach(city => {
        const item = document.createElement('div');
        item.className = 'px-4 py-2 hover:bg-blue-50 cursor-pointer';
        item.textContent = city;
        item.addEventListener('click', () => {
            cityInput.value = city;
            fetchWeatherByCity(city);
            recentCitiesDropdown.classList.add('hidden');
        });
        recentCitiesDropdown.appendChild(item);
    });
}

// Show recent cities dropdown
function showRecentCitiesDropdown() {
    if (recentCities.length > 0) {
        recentCitiesDropdown.classList.remove('hidden');
    }
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorContainer.classList.remove('hidden');
    
    // Hide weather displays
    currentWeather.classList.add('hidden');
    forecastContainer.classList.add('hidden');
}

// Hide error message
function hideError() {
    errorContainer.classList.add('hidden');
}