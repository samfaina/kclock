export { Weather as default };

class Weather {
  temperature = 0;
  humidity = 0;
  location = "...";
  icon = "03dn";

  constructor(data) {
    this.temperature = data["main"]["temp"];
    this.humidity = data["main"]["humidity"];
    this.location = data["name"];
    this.icon = data["weather"][0]["icon"];
  }
}
