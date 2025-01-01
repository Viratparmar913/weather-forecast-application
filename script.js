

//31b1715eea27e8546c5192709d456eb7
const mainEl = $("#main");

// Default coordinates for initial load (Delhi)
let lat = "28.666668";
let lon = "77.216667";
let apikey = apiKey;
//let url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}&exclude=hourly`;
let url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=alerts&appid=${apikey}`;

let cityName = "Delhi";
let firstLoad = true;

// Selecting DOM elements
const searchBtn = $("#search-btn");
const searchDiv = $("#search");
const selectorDiv = $("#selector");
const prevSearchDiv = $("#previous-searches");

// Convert Kelvin temperature to Celsius
const kevlinToCelsius = (tempKel) => tempKel - 273.15;

// Check if the city is already in the list of previously searched cities
const isInList = (currentId = "") => {
  return $(`[data-city-id="${currentId}"]`).length > 0;
};

// Populate previously searched cities from local storage on initial load
const populatePreviouslySearched = () => {
  let prevCitiesArr = getCitiesFromLocalStorage();
  prevCitiesArr.forEach((city) => {
    addToPreviouslySearched(city);
  });
};

// Clear the previously searched cities from both UI and local storage
const clearPreviouslySearched = () => {
  window.localStorage.setItem("prevCities", "[]");
  $("#previous-searches").empty();
};

// Add a city to the list of previously searched cities in the UI
const addToPreviouslySearched = (cityObj) => {
  const { cityLon, cityLat, cityName, cityCountry, cityId } = cityObj;

  // If the city is already in the list, remove it (to prevent duplicates)
  if (isInList(cityId)) {
    $(`[data-city-id="${cityId}"]`).remove();
  }

  // Prepend the city to the list of previously searched cities
  prevSearchDiv.prepend(
    $(`<span>${cityName}, ${cityCountry}</span>`)
      .attr("data-city-lon", cityLon)
      .attr("data-city-lat", cityLat)
      .attr("data-city-name", cityName)
      .attr("data-city-country", cityCountry)
      .attr("data-city-id", cityId)
      .addClass("prev-searched")
      .on("click", loadNewData) // Load data when clicking on a previously searched city
  );
};

// Save the city to local storage
const addToLocalStorage = (cityObj) => {
  let prevCitiesArr = getCitiesFromLocalStorage();
  prevCitiesArr.push(cityObj);
  window.localStorage.setItem("prevCities", JSON.stringify(prevCitiesArr));
};

// Retrieve previously searched cities from local storage
const getCitiesFromLocalStorage = () => {
  return JSON.parse(window.localStorage.getItem("prevCities")) || [];
};

// Show the list of found cities
const showFoundCities = () => {
  selectorDiv.removeClass("selector-hidden").addClass("selector-visible");
  searchDiv.hide();
};

// Clear and hide the list of found cities
const clearAndHideFoundCities = () => {
  selectorDiv
    .empty()
    .removeClass("selector-visible")
    .addClass("selector-hidden");
  searchDiv.show();
  $("#search-btn").siblings("input").val("");
};

// Construct the API endpoint URL for fetching weather data
const getEndPoint = (cityLat, cityLon) => {
  return `https://api.openweathermap.org/data/2.5/onecall?lat=${cityLat}&lon=${cityLon}&appid=${apiKey}&exclude=hourly`;
};

// Load new weather data for a selected city
const loadNewData = (event) => {
  const target = event.target || event; // Handle both event and direct call
  const curCityLon = $(target).data("city-lon");
  const curCityLat = $(target).data("city-lat");
  const curCityName = $(target).data("city-name");
  cityName = curCityName;
  const curCityCountry = $(target).data("city-country");
  const curCityId = $(target).data("city-id");

  // Fetch and display new weather data
  getDataThenPopulatePage(getEndPoint(curCityLat, curCityLon));

  // Update UI and local storage
  clearAndHideFoundCities();
  const currentCityObj = {
    cityLat: curCityLat,
    cityLon: curCityLon,
    cityName: curCityName,
    cityCountry: curCityCountry,
    cityId: curCityId,
  };

  addToLocalStorage(currentCityObj);
  addToPreviouslySearched(currentCityObj);
};

// Search for a city based on user input
const searchCity = () => {
  selectorDiv.empty();
  const cityNameInput = $("#search-btn").siblings("input").val().trim();

  // Check if input is empty and alert the user
  if (cityNameInput === "") {
    alert("Please enter a city name.");
    return; // Exit the function if input is empty
  }

  // Find matching cities based on input
  const matchingCities = cities.filter(
    (city) => city.name.toLowerCase() === cityNameInput.toLowerCase()
  );

  if (matchingCities.length > 0) {
    const selectedCity = matchingCities[0];

    // Load data for the selected city
    loadNewData({
      target: $(`<span></span>`).data({
        "city-lon": selectedCity.coord.lon,
        "city-lat": selectedCity.coord.lat,
        "city-name": selectedCity.name,
        "city-country": selectedCity.country,
        "city-id": selectedCity.id,
      }),
    });
  } else {
    // If no matching cities found, show an error message
    showFoundCities();
    selectorDiv.append($("<p>City not found, please search again</p>"));
    selectorDiv.on("click", clearAndHideFoundCities);
  }
};

// Fetch weather data from the API and update the page
const getDataThenPopulatePage = (endpoint) => {
  $.ajax({
    url: endpoint,
    method: "GET",
  }).then((response) => {
    // Populate previously searched cities on first load
    if (firstLoad) {
      populatePreviouslySearched();
      firstLoad = false;
    }
    // Update weather information on the page
    updateWeather(response);
  });
};

// Determine the severity of UV index and return corresponding class
const getUVIndexSeverity = (uvValue) => {
  if (uvValue <= 2) {
    return "low-uv";
  } else if (uvValue <= 5) {
    return "moderate-uv";
  } else if (uvValue <= 7) {
    return "high-uv";
  } else if (uvValue <= 10) {
    return "very-high-uv";
  } else {
    return "severe-uv";
  }
};

// Update the weather display on the page
const updateWeather = (weatherData) => {
  const todaysCard = $("#main-card");
  const fiveDay = $("#container-daily-cards");
  const currentDate = new Date(weatherData.current.dt * 1000);
  const todayImg = $("#today-img");

  // Update today's weather details
  $("#city-name").text(cityName);
  $("#todays-date").text(currentDate.toDateString());
  const todayMinTemp = kevlinToCelsius(weatherData.daily[0].temp.min).toFixed(
    1
  );
  const todayMaxTemp = kevlinToCelsius(weatherData.daily[0].temp.max).toFixed(
    1
  );
  $("#today-min").text(`Min: ${todayMinTemp}°C`);
  $("#today-max").text(`Max: ${todayMaxTemp}°C`);

  $("#today-wind").text(`Wind speed: ${weatherData.daily[0].wind_speed} m/s`);
  $("#today-humidity").text(`Humidity: ${weatherData.daily[0].humidity}%`);

  // Update UV index with appropriate severity class
  $("#today-uv")
    .text(`UV: ${weatherData.daily[0].uvi}`)
    .removeClass()
    .addClass(getUVIndexSeverity(weatherData.daily[0].uvi));

  // Update today's weather icon
  const todayIcon = weatherData.daily[0].weather[0].icon;
  todayImg.attr("src", `http://openweathermap.org/img/wn/${todayIcon}@2x.png`);

  // Update the 5-day weather forecast
  fiveDay.children().each((index, child) => {
    const eachDayData = weatherData.daily[index + 1];
    const eachDayDate = new Date(eachDayData.dt * 1000);
    const eachDayIcon = eachDayData.weather[0].icon;

    $(child).find(".day").text(eachDayDate.toDateString());
    $(child)
      .find(".weather-img")
      .attr("src", `http://openweathermap.org/img/wn/${eachDayIcon}@2x.png`);

    $(child)
      .find(".max")
      .text(`Max: ${kevlinToCelsius(eachDayData.temp.max).toFixed(1)}°C`);
    $(child)
      .find(".min")
      .text(`Min: ${kevlinToCelsius(eachDayData.temp.min).toFixed(1)}°C`);

    $(child).find(".wind").text(`Wind: ${eachDayData.wind_speed} m/s`);
    $(child).find(".humidity").text(`Humidity: ${eachDayData.humidity}%`);
  });
};

// Document ready event
$(document).ready(() => {
  // Fetch initial data for the default city (Delhi)
  getDataThenPopulatePage(url);

  // Set up event listener for search button
  searchBtn.on("click", (event) => {
    event.preventDefault();
    searchCity();
  });

  // Set up event listener for clearing the history of previously searched cities
  const clearHistoryBtn = $("#clear-history");
  clearHistoryBtn.on("click", clearPreviouslySearched);
});
