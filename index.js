import express from "express";
import fetch from "node-fetch";

const app = express();
const apiKey = "2616e2c5565cf813cb3594ae4716a8ce";

async function fetchWeatherForecast(city) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data;
  } catch (error) {
    console.log("Error fetching weather data: ", error);
    return null;
  }
}

function calculateAverageProperties(data) {
  if (!data || !data.list) {
    return null;
  }

  const averages = {};

  data.list.forEach((item) => {
    const date = item.dt_txt.split(" ")[0];

    const main = item.weather[0].main; // Extract main weather description
    const description = item.weather[0].description; // Extract detailed weather description
    const icon = item.weather[0].icon; // Extract weather icon code

    if (!averages[date]) {
      averages[date] = {
        count: 0,
        total: {
          main: {},
          wind: {},
          clouds: {},
          visibility: 0,
          pop: 0,
        },
        main: {},
        description: {},
        icon: {},
      };
    }

    // Calculate average for main properties
    for (const prop in item.main) {
      if (typeof item.main[prop] === "number") {
        if (!averages[date].total.main[prop]) {
          averages[date].total.main[prop] = 0;
        }
        averages[date].total.main[prop] += item.main[prop];
      }
    }

    // Calculate average for wind properties
    for (const prop in item.wind) {
      if (typeof item.wind[prop] === "number") {
        if (!averages[date].total.wind[prop]) {
          averages[date].total.wind[prop] = 0;
        }
        averages[date].total.wind[prop] += item.wind[prop];
      }
    }

    // Calculate average for cloud properties
    for (const prop in item.clouds) {
      if (typeof item.clouds[prop] === "number") {
        if (!averages[date].total.clouds[prop]) {
          averages[date].total.clouds[prop] = 0;
        }
        averages[date].total.clouds[prop] += item.clouds[prop];
      }
    }

    // Calculate average for visibility
    averages[date].total.visibility += item.visibility;

    // Calculate average for pop (probability of precipitation)
    averages[date].total.pop += item.pop;

    averages[date].count++;

    averages[date].main[main] = (averages[date].main[main] || 0) + 1;
    averages[date].description[description] =
      (averages[date].description[description] || 0) + 1;
    averages[date].icon[icon] = (averages[date].icon[icon] || 0) + 1;
  });

  const result = [];
  for (const date in averages) {
    const averageProperties = {
      date: date,
      main: {},
      wind: {},
      clouds: {},
      visibility: averages[date].total.visibility / averages[date].count,
      pop: averages[date].total.pop / averages[date].count,
    };

    // Calculate average for main properties
    for (const prop in averages[date].total.main) {
      averageProperties.main[prop] =
        averages[date].total.main[prop] / averages[date].count;
    }

    // Calculate average for wind properties
    for (const prop in averages[date].total.wind) {
      averageProperties.wind[prop] =
        averages[date].total.wind[prop] / averages[date].count;
    }

    // Calculate average for cloud properties
    for (const prop in averages[date].total.clouds) {
      averageProperties.clouds[prop] =
        averages[date].total.clouds[prop] / averages[date].count;
    }

    const main = Object.keys(averages[date].main).reduce((a, b) =>
      averages[date].main[a] > averages[date].main[b] ? a : b
    );

    const description = Object.keys(averages[date].description).reduce((a, b) =>
      averages[date].description[a] > averages[date].description[b] ? a : b
    );

    const icon = Object.keys(averages[date].icon).reduce((a, b) =>
      averages[date].icon[a] > averages[date].icon[b] ? a : b
    );

    result.push(averageProperties, {
      weather: {
        main,
        description,
        icon,
      },
    });
  }

  return result;
}

app.get("/weather", async (req, res) => {
  const city = "tamilnadu";
  const weatherData = await fetchWeatherForecast(city);

  if (weatherData) {
    const averageProperties = calculateAverageProperties(weatherData);
    res.json(averageProperties);
  } else {
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
