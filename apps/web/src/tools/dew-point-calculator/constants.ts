export interface WeatherPreset {
  name: string;
  temperatureC: number;
  humidity: number;
}

export const WEATHER_PRESETS: WeatherPreset[] = [
  { name: '舒适室内 20 °C / 50%', temperatureC: 20, humidity: 50 },
  { name: '闷热盛夏 30 °C / 80%', temperatureC: 30, humidity: 80 },
  { name: '干燥晴冷 5 °C / 30%', temperatureC: 5, humidity: 30 },
  { name: '热带高湿 33 °C / 90%', temperatureC: 33, humidity: 90 },
];
