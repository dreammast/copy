// Global variables
let isOnline = navigator.onLine;
let currentLocation = null;
let map = null;
let markers = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initializeMap();
  setupEventListeners();
  checkOnlineStatus();
});

// Initialize Leaflet Map
function initializeMap() {
  // Create map centered on a default location (e.g., Bangalore)
  map = L.map('map').setView([12.9716, 77.5946], 14);

  // Add OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Initialize map with current location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      currentLocation = { latitude: lat, longitude: lng };
      
      // Center map on user's location
      map.setView([lat, lng], 15);
      
      // Add marker for user's location
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup('Your Location')
        .openPopup();
    });
  }
}

// Setup event listeners
function setupEventListeners() {
  // Chat form submission
  const chatForm = document.getElementById('chat-form');
  if (chatForm) {
    chatForm.addEventListener('submit', handleChatSubmit);
  }

  // File upload handling
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(input => {
    input.addEventListener('change', handleFileUpload);
  });

  // Online/offline status
  window.addEventListener('online', () => {
    isOnline = true;
    updateOnlineStatus();
  });
  window.addEventListener('offline', () => {
    isOnline = false;
    updateOnlineStatus();
  });
}

// Handle chat form submission
async function handleChatSubmit(event) {
  event.preventDefault();
  const messageInput = document.getElementById('message-input');
  const message = messageInput.value.trim();
  
  if (!message) return;

  // Add user message to chat
  addMessage(message, 'user');
  messageInput.value = '';

  try {
    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message
      }),
    });

    const data = await response.json();
    addMessage(data.response, 'bot');
  } catch (error) {
    console.error('Error:', error);
    addMessage('Sorry, there was an error processing your request.', 'bot');
  }
}

// Handle file upload
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    addMessage(`File uploaded successfully: ${data.filename}`, 'bot');
  } catch (error) {
    console.error('Error:', error);
    addMessage('Sorry, there was an error uploading your file.', 'bot');
  }
}

// Add message to chat
function addMessage(message, sender) {
  const chatMessages = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;
  messageDiv.innerHTML = message;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Check online status
function checkOnlineStatus() {
  isOnline = navigator.onLine;
  updateOnlineStatus();
}

// Update online status display
function updateOnlineStatus() {
  const statusElement = document.getElementById('online-status');
  if (statusElement) {
    statusElement.textContent = isOnline ? 'Online' : 'Offline';
    statusElement.className = isOnline ? 'online' : 'offline';
  }
}

// Show nearby stores
function showNearbyStores(type) {
  if (!map) return;

  if (isOnline) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Center map on user's location
        map.setView([lat, lng], 15);
        
        // Clear existing markers
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
        
        // Use Overpass API to find nearby places
        const query = getOverpassQuery(type, lat, lng);
        try {
          const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query
          });
          
          const data = await response.json();
          const bounds = L.latLngBounds();
          
          data.elements.forEach(element => {
            if (element.type === 'node' && element.lat && element.lon) {
              const marker = L.marker([element.lat, element.lon])
                .addTo(map)
                .bindPopup(`
                  <strong>${element.tags.name || 'Unnamed Location'}</strong><br>
                  ${element.tags['addr:street'] || ''} ${element.tags['addr:housenumber'] || ''}<br>
                  ${element.tags['addr:city'] || ''}<br>
                  <a href="https://www.openstreetmap.org/?mlat=${element.lat}&mlon=${element.lon}" 
                     target="_blank">View on OpenStreetMap</a>
                `);
              
              markers.push(marker);
              bounds.extend([element.lat, element.lon]);
            }
          });
          
          if (markers.length > 0) {
            map.fitBounds(bounds);
            addMessage(`Found ${markers.length} nearby ${type} locations. Click on markers for details.`, 'bot');
          } else {
            addMessage(`No ${type} locations found nearby. Try a different location.`, 'bot');
          }
        } catch (error) {
          console.error('Error:', error);
          addMessage('Sorry, there was an error finding nearby locations.', 'bot');
        }
      });
    } else {
      addMessage('Geolocation is not supported by your browser.', 'bot');
    }
  } else {
    // Show offline map
    document.getElementById('map').style.display = 'none';
    document.getElementById('offline-map').style.display = 'block';
    
    const stores = offlineStores[type] || [];
    
    if (stores.length > 0) {
      const mapFrame = document.getElementById('mapFrame');
      let markers = '';
      
      stores.forEach((store, index) => {
        const coordinates = getCoordinatesFromAddress(store.address);
        if (coordinates) {
          markers += `&marker${index}=${coordinates.lat},${coordinates.lng}`;
        }
      });
      
      const bbox = getBoundingBox(stores[0].address);
      const url = "https://www.openstreetmap.org/export/embed.html?bbox=" + 
        encodeURIComponent(bbox) + 
        "&layer=mapnik" + markers;
      mapFrame.src = url;
    }
    
    let message = `Here are some ${type} locations in your area:\n\n`;
    
    if (type === 'books') {
      const libraries = stores.filter(store => store.type === 'library');
      const bookStores = stores.filter(store => store.type === 'book_store');
      const bookStalls = stores.filter(store => store.type === 'book_stall');
      
      if (libraries.length > 0) {
        message += "📚 Libraries:\n";
        libraries.forEach(store => {
          message += `• ${store.name}\n  ${store.address}\n  Rating: ${store.rating}\n\n`;
        });
      }
      
      if (bookStores.length > 0) {
        message += "📖 Book Stores:\n";
        bookStores.forEach(store => {
          message += `• ${store.name}\n  ${store.address}\n  Rating: ${store.rating}\n\n`;
        });
      }
      
      if (bookStalls.length > 0) {
        message += "📗 Book Stalls:\n";
        bookStalls.forEach(store => {
          message += `• ${store.name}\n  ${store.address}\n  Rating: ${store.rating}\n\n`;
        });
      }
    } else {
      stores.forEach(store => {
        message += `${store.name}\n${store.address}\nRating: ${store.rating}\n\n`;
      });
    }
    
    addMessage(message, 'bot');
  }
}

// Helper function to generate Overpass API query
function getOverpassQuery(type, lat, lng) {
  const radius = 5000; // 5km radius
  let amenity = '';
  
  switch(type) {
    case 'books':
      amenity = 'library|book_store';
      break;
    case 'stationery':
      amenity = 'stationery';
      break;
    case 'xerox':
      amenity = 'copy_shop';
      break;
    default:
      amenity = 'shop';
  }
  
  return `
    [out:json][timeout:25];
    (
      node["amenity"~"${amenity}"](around:${radius},${lat},${lng});
      way["amenity"~"${amenity}"](around:${radius},${lat},${lng});
      relation["amenity"~"${amenity}"](around:${radius},${lat},${lng});
    );
    out body;
    >;
    out skel qt;
  `;
}

// Helper function to get coordinates from address
function getCoordinatesFromAddress(address) {
  // This is a simplified version. In a real application, you would use a geocoding service
  const cityCoordinates = {
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Delhi': { lat: 28.6139, lng: 77.2090 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 }
  };
  
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (address.toLowerCase().includes(city.toLowerCase())) {
      return coords;
    }
  }
  
  return null;
}

// Helper function to get bounding box for an address
function getBoundingBox(address) {
  const coords = getCoordinatesFromAddress(address);
  if (!coords) return '-180,-90,180,90';
  
  const lat = coords.lat;
  const lng = coords.lng;
  const offset = 0.01; // approximately 1km
  
  return `${lng - offset},${lat - offset},${lng + offset},${lat + offset}`;
} 