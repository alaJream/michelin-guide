// import { state } from "./state.js";

let restaurants = [];
let markers = [];
let map = null;

let currentSearch = '';
let currentDistinction = '';
let currentCuisine = '';

const itemsPerPage = 10;

const michelinStars = {
    ONE_STAR: "⭐️",
    TWO_STARS: "⭐️⭐️",
    THREE_STARS: "⭐️⭐️⭐️",
};

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Maps~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
async function loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
        window.initMap = function() {
            const center = { lat: 0, lng: 0 };
            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 2,
                center,
            });
            resolve(); 
        }

        let script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAXFflaZpqrPefr108MfriVRficJMiVMTI&callback=initMap`;
        script.async = true;
        script.defer = true;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

window.initMap = function() {
    const center = { lat: 0, lng: 0 };
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 2,
        center,
    });
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Dataset~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
async function fetchData() {
    let response = await fetch("michelin_star.csv");
    let data = await response.text();

    const cuisines = new Set();
    restaurants.forEach(restaurant => cuisines.add(restaurant.cuisine1));
    const cuisineSelect = document.getElementById('cuisine-selected');
    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.value = cuisine;
        option.text = cuisine;
        cuisineSelect.add(option);
    });

    Papa.parse(data, {
        header: true,
        complete: async function(parsedData) {
            restaurants = parsedData.data;

            restaurants = restaurants.map(restaurant => {
                return {
                    name: restaurant.name,
                    michelin_award: restaurant.michelin_award,
                    city: restaurant.city,
                    country: restaurant.country,
                    lat: restaurant.lat,
                    lon: restaurant.lon,
                    image: restaurant.image,
                    chef: restaurant.chef,
                    cuisine1: restaurant.cuisine1,
                }
            });

            console.log('CSV data has loaded.');
            displayRestaurants(restaurants);
        }
    });
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Restaurants Container~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
function displayRestaurants(restaurants, page = 1) {
    const container = document.getElementById('restaurant-cards-container');
    container.innerHTML = '';

    let start = (page - 1) * itemsPerPage;
    let end = start + itemsPerPage;

    let displayedRestaurants = restaurants.slice(start, end);

    displayedRestaurants.forEach((restaurant) => {
        const card = document.createElement('div');
        card.className = 'restaurant-card';

        const img = document.createElement('img');
        img.src = restaurant.image;
        img.className = 'restaurant-image';
        card.appendChild(img);

        const name = document.createElement('h2');
        name.textContent = restaurant.name;
        name.className = 'restaurant-name';
        card.appendChild(name);

        const michelinAward = document.createElement('p');
        michelinAward.textContent = michelinStars[restaurant.michelin_award] || '';
        michelinAward.className = 'restaurant-award';
        card.appendChild(michelinAward);

        const chef = document.createElement('p');
        chef.textContent = `Chef: ${restaurant.chef}`;
        chef.className = 'restaurant-chef';
        card.appendChild(chef);

        const location = document.createElement('p');
        location.textContent = `${restaurant.city}, ${restaurant.country}`;
        location.className = 'restaurant-location';
        card.appendChild(location);

        const cuisine = document.createElement('p');
        cuisine.textContent = `Cuisine: ${restaurant.cuisine1}`;
        cuisine.className = 'restaurant-cuisine';
        card.appendChild(cuisine);

        container.appendChild(card);
    });

    displayPagination(restaurants.length, page);
    updateMarkers(displayedRestaurants);
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Maps Marker~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
function updateMarkers(restaurants) {
    markers.forEach((marker) => {
        marker.setMap(null);
    });
    markers = [];

    restaurants.forEach((restaurant) => {
        const location = new google.maps.LatLng(Number(restaurant.lat), Number(restaurant.lon));
        const marker = new google.maps.Marker({
            position: location,
            map: map,
            title: restaurant.name,
            icon: getMarkerIcon(restaurant.michelin_award),
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `
                <a href="${restaurant.url}" target="_blank" rel="noopener noreferrer"><h3>${restaurant.name}</h3></a>
                <p><b>Chef:</b> ${restaurant.chef}</p>
                <p><b>Cuisine:</b> ${restaurant.cuisine1}</p>
                <p><b>Stars:</b> ${michelinStars[restaurant.michelin_award]}</p>
                <p><b>Location:</b> ${restaurant.city}, ${restaurant.country}</p>
            `,
        });

        marker.addListener("click", () => {
            infoWindow.open(map, marker);
        });

        markers.push(marker);
    });
}

function getMarkerIcon(stars) {
    switch (stars) {
        case 'ONE_STAR':
            return 'https://maps.google.com/mapfiles/kml/paddle/1.png';
        case 'TWO_STARS':
            return 'https://maps.google.com/mapfiles/kml/paddle/2.png';
        case 'THREE_STARS':
            return 'https://maps.google.com/mapfiles/kml/paddle/3.png';
        default:
            console.error('Invalid stars value:', stars);
            return 'https://maps.google.com/mapfiles/kml/paddle/red-stars.png';
    }
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Pagination~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
function displayPagination(totalItems, currentPage) {
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';

    let totalPages = Math.min(10, Math.ceil(totalItems / itemsPerPage));

    let prevButton = document.createElement('button');
    prevButton.textContent = '<';
    prevButton.onclick = () => {
        currentSearch = '';
        currentDistinction = '';
        currentCuisine = '';
        displayRestaurants(restaurants, Math.max(1, currentPage - 1));
    };
    paginationContainer.appendChild(prevButton);

    for (let i = 1; i <= totalPages; i++) {
        let pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.onclick = () => displayRestaurants(restaurants, i);
        if (i === currentPage) {
            pageButton.className = 'current-page';
        }
        paginationContainer.appendChild(pageButton);
    }

    let nextButton = document.createElement('button');
    nextButton.textContent = '>';
    nextButton.onclick = () => {
        currentSearch = '';
        currentDistinction = '';
        currentCuisine = '';
        displayRestaurants(restaurants, Math.min(totalPages, currentPage + 1));
    };
    paginationContainer.appendChild(nextButton);
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Search/Filter Bar~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
function searchRestaurant() {
    currentSearch = document.getElementById('search-bar').value.toLowerCase();
    updateCuisines(filterRestaurants());
    displayRestaurants(filterRestaurants());
}

function changeDistinction() {
    currentDistinction = document.getElementById('distinction-selected').value;
    updateCuisines(filterRestaurants());
    displayRestaurants(filterRestaurants());
}

function changeCuisine() {
    currentCuisine = document.getElementById('cuisine-selected').value;
    displayRestaurants(filterRestaurants());
}

function updateCuisines(restaurants) {
    const cuisines = new Set();
    restaurants.forEach(restaurant => cuisines.add(restaurant.cuisine1));
    const cuisineSelect = document.getElementById('cuisine-selected');
    cuisineSelect.innerHTML = '';
    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.value = cuisine;
        option.text = cuisine;
        cuisineSelect.add(option);
    });
}

function filterRestaurants() {
    return restaurants.filter(restaurant => {
        let matchesSearch = currentSearch === '' 
            || (restaurant.name && restaurant.name.toLowerCase().includes(currentSearch))
            || (restaurant.chef && restaurant.chef.toLowerCase().includes(currentSearch))
            || (restaurant.city && restaurant.city.toLowerCase().includes(currentSearch))
            || (restaurant.country && restaurant.country.toLowerCase().includes(currentSearch))
            || (restaurant.cuisine1 && restaurant.cuisine1.toLowerCase().includes(currentSearch));
        let matchesDistinction = currentDistinction === '' || restaurant.michelin_award === currentDistinction;
        let matchesCuisine = currentCuisine === '' || restaurant.cuisine1 === currentCuisine;
        return matchesSearch && matchesDistinction && matchesCuisine;
    });
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Fetch Data~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
fetchData();

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Event Listener~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
document.addEventListener('DOMContentLoaded', async (event) => {
    document.getElementById('search-bar').addEventListener('keyup', searchRestaurant);
    document.getElementById('distinction-selected').addEventListener('change', changeDistinction);
    document.getElementById('cuisine-selected').addEventListener('change', changeCuisine);

    try {
        await loadGoogleMapsAPI();
        console.log('Google Maps API has loaded.');
        await fetchData();
    } catch (error) {
        console.error('Error loading Google Maps API:', error);
    }
});