import clock from "clock";
import { display } from "display";
import document from "document";
import { HeartRateSensor } from "heart-rate";
import * as messaging from "messaging";
import { goals, today } from "user-activity";
import Arc from "../common/arc";
import { State, StateManager } from "../common/state";
import { addComma, getDay3, getForecastIcon, monoDigits, zeroPad } from "../common/utils";

// clock stuff
clock.granularity = "seconds";

// Duration in frames
const TICK_DUR = 3;
const SHORT_DUR = 10;
const MEDIUM_DUR = 12;
const LONG_DUR = 14;

const POLL_TIME = 2000; // ms

let smallArc = new Arc("smallArc");
let mediumArc = new Arc("mediumArc");
let largeArc = new Arc("largeArc");

let hrm = new HeartRateSensor();

let sm = new StateManager();

let $ = id => document.getElementById(id);

// weather stuff
// Request weather data from the companion
function fetchWeather(command) {

  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the companion
    messaging.peerSocket.send({
      command: command
    });
  }
}

// Display the weather data received from the companion
function processWeatherData(data) {
  console.log("The temperature is: " + data.temperature);
  console.log("The location is : " + data.location);
  console.log("The icon is: " + data.icon);
  $("weatherLoc").text = data.location;
  $("weatherTemp").text = Math.floor(data.temperature) + "º";
  $("weatherIcon").href = getForecastIcon(data.icon);
}

// Listen for the onopen event
messaging.peerSocket.onopen = function() {
  // Fetch weather when the connection opens
  fetchWeather("weather");
};

// Listen for messages from the companion
messaging.peerSocket.onmessage = function(evt) {
  if (evt.data) {
    processWeatherData(evt.data);
  }
};

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
};

sm.addState(
  new State({
    element: $("clock"),
    mainText: $("digits"),
    subText: $("date"),
    arcs: [smallArc, mediumArc, largeArc],
    customStart: function() {
      clock.granularity = "seconds";
      this.event();
    },
    customStop: function() {
      clock.granularity = "off";
    },
    event: function() {
      let time = new Date();
      let seconds = time.getSeconds();
      let minutes = time.getMinutes();
      console.log( time.getHours() % 12);
      let hours = time.getHours() % 12;

      let hoursStr = monoDigits(hours ? hours : 12);
      console.log(hoursStr);
      let minutesStr = monoDigits(zeroPad(minutes));
      let dayStr = getDay3(time.getDay());
      let dateStr = time.getDate();

      this.mainText.text = `${hoursStr}:${minutesStr}`;
      this.subText.text = `${dayStr} ${dateStr}`;

      let [secondsArc, minutesArc, hoursArc] = this.arcs;

      let secondsAngle = seconds * 6;
      let minutesAngle = Math.floor((minutes + seconds / 60) * 6);
      let hoursAngle = Math.floor((hours + (minutes + seconds / 60) / 60) * 30);

      secondsArc.tween(secondsArc.angle, secondsAngle, secondsAngle - secondsArc.angle > 6 ? SHORT_DUR : TICK_DUR);
      minutesArc.tween(minutesArc.angle, minutesAngle, MEDIUM_DUR);
      hoursArc.tween(hoursArc.angle, hoursAngle, LONG_DUR);

      if (seconds !== 0) return;
      secondsArc.tween(-360, 0, SHORT_DUR + 4, "inOutQuart");

      if (minutes !== 0) return;
      minutesArc.tween(-360, 0, MEDIUM_DUR + 4, "inOutQuart");

      if (hours !== 0) return;
      hoursArc.tween(-360, 0, LONG_DUR + 4, "inOutQuart");
    }
  })
);

sm.addState(
  new State({
    element: $("steps"),
    mainText: $("stepCount"),
    arcs: [smallArc],
    customStart: function() {
      this.event();
      this.poll = setInterval(() => this.event(), POLL_TIME);
    },
    customStop: function() {
      clearInterval(this.poll);
    },
    event: function() {
      let [stepsArc] = this.arcs;
      stepsArc.tween(stepsArc.angle, today.local.steps < goals.steps ? (today.local.steps / goals.steps) * 360 : 360, SHORT_DUR);
      this.mainText.text = addComma(today.local.steps);

      if (this.mainText.text.length > 5) {
        this.mainText.style.fontSize = 64;
      } else {
        this.mainText.style.fontSize = 75;
      }
    }
  })
);

sm.addState(
  new State({
    element: $("calories"),
    mainText: $("calorieCount"),
    arcs: [mediumArc],
    customStart: function() {
      this.event();
      this.poll = setInterval(() => this.event(), POLL_TIME);
    },
    customStop: function() {
      clearInterval(this.poll);
    },
    event: function() {
      let [caloriesArc] = this.arcs;
      caloriesArc.tween(caloriesArc.angle, today.local.calories < goals.calories ? (today.local.calories / goals.calories) * 360 : 360, SHORT_DUR);
      this.mainText.text = addComma(today.local.calories);
    }
  })
);

sm.addState(
  new State({
    element: $("heartRate"),
    mainText: $("bpm"),
    arcs: [largeArc],
    customStart: function() {
      hrm.start();
      this.lastBeat = null;
      this.mainText.text = "--";

      this.poll = setInterval(() => {
        if (hrm.timestamp - this.lastBeat === 0) {
          let [heartRateArc] = this.arcs;

          heartRateArc.tween(heartRateArc.angle, 0, SHORT_DUR + 15);
          this.mainText.text = "--";
        }
        this.lastBeat = hrm.timestamp;
      }, POLL_TIME);
    },
    customStop: function() {
      clearInterval(this.poll);
      hrm.stop();
    },
    event: function() {
      let [heartRateArc] = this.arcs;

      heartRateArc.tween(heartRateArc.angle, (hrm.heartRate / 200) * 360, SHORT_DUR);
      this.mainText.text = hrm.heartRate;
    }
  })
);

let screenButton = $("screenButton");

function updateState() {
  sm.currState.event();
}

function nextState() {
  sm.switchState("next");
}

function resetState() {
  if (!display.on) sm.switchState("default");
}

function updateArcs() {
  sm.currState.update();

  requestAnimationFrame(updateArcs);
}

requestAnimationFrame(updateArcs);

// Update the clock when a tick occurs
clock.ontick = () => updateState();

// Update heart rate when a reading occurs
hrm.onreading = () => updateState();

// Switch to the next state when the user taps the screen
screenButton.onactivate = () => nextState();

// Switch to the clock when the screen turns off
display.onchange = () => {
  if (display.on) {
    fetchWeather("refresh");
  }
  return resetState();
};
