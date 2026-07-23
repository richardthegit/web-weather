
/**
 * Return the forecast for the specified location. This is unpacked such that an
 * array of dictionaries is returned.
 */
async function fetchWeather(latitude, longitude) {
  const baseUrl = 'https://api.open-meteo.com/v1/forecast';
  
  const params = {
    latitude: latitude,
    longitude: longitude,
    hourly: 'temperature_2m,relative_humidity_2m,precipitation,cloud_cover_low,cloud_cover_mid,cloud_cover_high,wind_speed_10m,is_day',
    wind_speed_unit: 'ms',
    timezone: 'UTC',
    forecast_days: '2'
  };

  const url = new URL(baseUrl);
  url.search = new URLSearchParams(params).toString();

  const response = await fetch(url);
  const data = await response.json();
  const hourly = data.hourly;
  const now = new Date();

  return hourly.time.flatMap((timeStr, index) => {
    // Append 'Z' to tell JS "this is UTC time"
    const forecastDate = new Date(`${timeStr}Z`);
    const isCurrentHour = forecastDate.getUTCDate() === now.getUTCDate() &&
                          forecastDate.getUTCHours() === now.getUTCHours();

    if (forecastDate > now || isCurrentHour) {
      return {
        timeUTC: timeStr,
        time: forecastDate.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        temp: hourly.temperature_2m[index],
        humid: hourly.relative_humidity_2m[index],
        precip: hourly.precipitation[index],
        cloud_low: hourly.cloud_cover_low[index],
        cloud_mid: hourly.cloud_cover_mid[index],
        cloud_high: hourly.cloud_cover_high[index],
        wind_10m: hourly.wind_speed_10m[index],
        is_day: hourly.is_day[index],
      };
    }

    /* In the past - don't return it. */
    return [];
  });
}


/**
 * Return 'arg' if it's not undefined, otherwise 'def'.
 */
function defaultArg(arg, def) {
  return typeof arg !== 'undefined' ? arg : def;
}


/**
 * Sensible version of setInterval; this class calls 'callback' immediately, 
 * then in intervals.
 *
 * This automatically stops/restarts updates if the document becomes hidden
 * (i.e. it's tab enters the background). Call the terminate() method to
 * permanently stop the callback.
 */
function ManagedInterval(seconds, callback, startImmediately) {
  var self = this;
  var intervalId = undefined;

  self.startUpdates = function() {
    if (intervalId == undefined) {
      intervalId = setInterval(callback, seconds * 1000);
    }
  }

  self.stopUpdates = function() {
    if (intervalId != undefined) {
      clearInterval(intervalId);
    }
    intervalId = undefined;
  }

  function visibilityChanged() {
    if (document.hidden) {
      self.stopUpdates();
    }
    else {
      self.startUpdates();
    }
  }

  self.terminate = function() {
    document.removeEventListener("visibilitychange", visibilityChanged, false);
    self.stopUpdates();
  }

  document.addEventListener("visibilitychange", visibilityChanged, false);
  if (defaultArg(startImmediately, true)) {
    callback();
    self.startUpdates();
  }
}