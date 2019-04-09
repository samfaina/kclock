// Import the messaging module
import { geolocation } from "geolocation";
import * as messaging from "messaging";
import { settingsStorage } from "settings";
import { API_KEY } from "../common/openweather_apikey";
import { getIntervalValue } from "../common/utils";
import Weather from "../common/weather";
import * as settingUtils from "./settings-utils";

let savedSettings = settingUtils.initializeSettings();

let weatherInterval = null;

// Fetch the weather from OpenWeather
function queryOpenWeather() {
  if (!savedSettings.toggleDeviceLocation && savedSettings.cityName && savedSettings.cityName.length > 0) {
    console.log("queryOpenWeather on: ");
    fetchWeatherData("q=" + savedSettings.cityName);
  } else {
    geolocation.getCurrentPosition(locationSuccess, locationError);
  }
}

function locationSuccess(position) {
  const lat = position.coords.latitude;
  const long = position.coords.longitude;

  console.log("queryOpenWeather on: ", { lat, long });
  const locationParam = "lat=" + lat + "&lon=" + long;
  fetchWeatherData(locationParam);
}

function fetchWeatherData(locationParam) {
  console.log("Weather units: ", savedSettings.units);
  const linkApi = "https://api.openweathermap.org/data/2.5/weather?" + locationParam + "&units=" + savedSettings.units + "&APPID=" + API_KEY;
  fetch(linkApi)
    .then(function(response) {
      response.json().then(data => {
        if (data.cod === 200) {
          // We just want some data
          var weather = new Weather(data);
          // Send the weather data to the device
          returnWeatherData(weather);
        } else {
          console.log("Error fetching weather", data);
        }
      });
    })
    .catch(function(err) {
      console.log("Error fetching weather: " + err);
    });
}

function locationError(error) {
  console.log("Error: " + error.code, "Message: " + error.message);
}

// Send the weather data to the device
function returnWeatherData(data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the device
    messaging.peerSocket.send(data);
  } else {
    console.log("Error: Connection is not open");
  }
}

// Listen for messages from the device
messaging.peerSocket.onmessage = function(evt) {
  // const refreshRate = settingUtils.getSingleSelectSetting("refreshRate", "onWake");
  if (evt.data && (evt.data.command == "weather" || evt.data.command == "refresh")) {
    // The device requested weather data
    setupInterval();
  }
};

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
};

// Listen for the on settings change event
settingsStorage.onchange = function(evt) {
  // Which setting changed
  console.log("key: " + evt.key);

  // What was the old value
  console.log("old value: " + evt.oldValue);

  // What is the new value
  console.log("new value: " + evt.newValue);

  savedSettings = settingUtils.getUpdatedSettings();
  setupInterval();
};

function setupInterval() {
  const intValue = getIntervalValue(savedSettings.refreshRate);

  if (weatherInterval) {
    console.log("Cleaning interval");
    weatherInterval = undefined;
    clearInterval(weatherInterval);
  }

  if (intValue) {
    console.log("Setup new interval: ", intValue);
    weatherInterval = setInterval(() => {
      queryOpenWeather();
    }, intValue);
  } else {
    console.log("Single query");
    queryOpenWeather();
  }
}
