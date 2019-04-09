import { settingsStorage } from "settings";

export function initializeSettings() {
  console.log("Initializing settings");
  setDefaultSetting("units", JSON.stringify({ values: [{ name: "ºC", value: "metric" }], selected: [0] }));
  setDefaultSetting("refreshRate", JSON.stringify({ values: [{ name: "On wake", value: "onWake" }], selected: [0] }));
  setDefaultSetting("toggleDeviceLocation", "true");
  setDefaultSetting("cityName", null);

  return getUpdatedSettings();
}

export function setDefaultSetting(key, value) {
  console.log("Setup default values");
  let extantValue = settingsStorage.getItem(key);
  if (extantValue === null) settingsStorage.setItem(key, value);
}

export function getSingleSelectSetting(key, defaultValue) {
  const settingValue = settingsStorage.getItem(key);
  console.log("parsing setting: " + key, settingValue);
  try {
    let _tmp = JSON.parse(settingValue);
    return _tmp.values[0].value;
  } catch (err) {
    return defaultValue;
  }
}

export function getToggleSetting(key, defaultValue) {
  return settingsStorage.getItem(key) ? settingsStorage.getItem(key) === "true" : defaultValue;
}

export function getTextInputSetting(key, defaultValue) {
  try {
    return JSON.parse(settingsStorage.getItem(key)).name;
  } catch (error) {
    console.log("TCL: getTextInputSetting -> error", error);
    return defaultValue;
  }
}

export function getUpdatedSettings() {
  const settings = {
    units: getSingleSelectSetting("units", "metric"),
    refreshRate: getSingleSelectSetting("refreshRate", "onWake"),
    toggleDeviceLocation: getToggleSetting("toggleDeviceLocation", true),
    cityName: getTextInputSetting("cityName", null)
  };

  console.log(settings);

  return settings;
}
