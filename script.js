$(document).ready(function() {
    $("#searchBtn").on("click", bindFirstSuggestion)
    $("#searchInput").on("keyup", detectEnter)
    $("#searchInput").on("input focus", showSuggestions)
    $("#searchInput").on("input focus focusout", changeXStatus)
    $("body").on("click", "#searchInputX", deleteSearchInputText)
    $("body").on("click", "#nextDays div", showHourlyForecastForDay)
    $("body").on("click", "#backBtn", hideHourlyForecastForDay)
    $("select").on("change", changeHourlyProperty)
})

const WeatherApp = {
    localTimeZone: null,
    lastWeatherData: null,
    currentLocalTimeStamp: null
}

function deleteSearchInputText() {
    $("#searchInput").val("")
    $("#searchInputX").hide()
}

function changeXStatus() {
    let input = $(this)
    if(input.val().length) {
        $("#searchInputX").show()
        return
    }
    $("#searchInputX").hide()
}

function detectEnter(e) {
    if(e.key === "Enter" || e.key === 13) {
        e.preventDefault()
        $("#searchBtn").click()
    }
}

function bindFirstSuggestion() {
    let firstSuggestion = $("#suggestions").find("li:first")
    let cityFullName = firstSuggestion.text()
    let cityId = firstSuggestion.attr("data-cityId")
    handleSearch(cityFullName, cityId)
}

function handleSearch(cityFullName, cityId) {
    deleteSearchInputText()
    $.ajax({
        url: "weather_api.php",
        type: "POST",
        data: { 
            cityId: cityId
        },
        success: function(response) {
            response = JSON.parse(response)
            console.log(response)
            $("main").show()
            $("#placeInfos").text(cityFullName)
            WeatherApp.localTimeZone = response.localTimeZone
            WeatherApp.lastWeatherData = response.weather
            formatISODateTimesToLocal(WeatherApp.lastWeatherData.timelines)
            WeatherApp.currentLocalTimeStamp = convertISOToLocalTime(new Date().toISOString(), WeatherApp.localTimeZone)
            $("#currentLocalTime").text(WeatherApp.currentLocalTimeStamp.slice(12,17))
            $("#currentLocalDate").text(WeatherApp.currentLocalTimeStamp.slice(0,10))
            let currentWeather = WeatherApp.lastWeatherData.timelines.hourly[0].values
            $("#currentTemperature").text(Math.round(currentWeather.temperature) + "°C")
            $("#currentWindSpeed").text(currentWeather.windSpeed + "KM/H")
            $("#currentHumidity").text(currentWeather.humidity + "%")
            $("#currentRainProb").text(currentWeather.precipitationProbability + "%")
            $("#currentWeatherImg").attr("src", getCurrentWeatherFromCode(currentWeather.weatherCode, WeatherApp.currentLocalTimeStamp.slice(12,17)))

            formatNextDays()
            //console.log(getHourlyForecastForDay(WeatherApp.lastWeatherData, WeatherApp.currentLocalTimeStamp.slice(0,10)))
        },
        error: () => alert("UH OH STINKYYY")
    })
    console.log(cityFullName)
    console.log(cityId)
}

function showSuggestions() {
    const input = $("#searchInput").val().trim()

    if(input.length < 2) {
        $("#suggestions").empty()
        return
    }

    $("#suggestions").show()

    /*$.ajax({
        url: `https://photon.komoot.io/api/?q=${input}&limit=5&osm_tag=place:city&osm_tag=place:town&osm_tag=place:village`,
        method: "GET",
        success: function(data) {
            let cities = [];
            $("#suggestions").empty()

            data.features.forEach(place => {
                let type = place.properties.osm_value
                let city = place.properties["name:it"] || place.properties.name
                let region = place.properties.state
                let country = place.properties.country
                
                let lat = place.geometry.coordinates[1];
                let lon = place.geometry.coordinates[0];

                if (["city", "town", "village"].includes(type)) {
                    // Evita duplicati
                    if (!cities.some(c => c.city === city && c.region === region && c.country === country)) {
                        cities.push({city, region, country, lat, lon})// lat, lon });
                    }
                }
            })

            //console.log(cities)

            cities.forEach(city => {
                //console.log(`${city.city}, ${city.region}, ${city.country}`)
                let text = city.region ? `${city.city}, ${city.region}, ${city.country}` : `${city.city}, ${city.country}`;

                const listItem = $("<li>")
                    .text(text)
                    .attr("data-lat", city.lat)
                    .attr("data-lon", city.lon)
                    .click(function() {
                        //$("#searchInput").val(text)
                        $("#suggestions").empty()

                        let lat = $(this).attr("data-lat")
                        let lon = $(this).attr("data-lon")
                        let cityInfos = $(this).text()
                        //console.log(`Selezionata: ${lat}, ${lon}`)
                        handleSearch(cityInfos, lat, lon)
                    })
                $("#suggestions").append(listItem)
                $("#suggestions").show()
            })
            //console.log("-------")
        }
    })*/

    $.ajax({
        url: "weather_api.php",
        method: "POST",
        data: {
            userInput : input
        },
        success: function(response) {
            $("#suggestions").empty()
            response = JSON.parse(response)

            response.items.forEach(place => {
                const listItem = $("<li>")
                    .text(place.address.label)
                    .attr("data-cityId", place.id)
                    .click(function() {
                        //$("#searchInput").val(text)
                        $("#suggestions").empty()

                        let cityId = $(this).attr("data-cityId")
                        let cityFullName = $(this).text()
                        handleSearch(cityFullName, cityId)
                    })
                $("#suggestions").append(listItem)
            })
        },
        error: () => alert("NACC' U' CUL")
    })

    
    $(document).click(function (e) {
        if (!$(e.target).closest("#startSearchInput, #suggestions").length) {
            $("#suggestions").hide();
        }
    })
}

function convertISOToLocalTime(isoTimestamp, timeZone) {
    const date = new Date(isoTimestamp)
    return new Intl.DateTimeFormat("it-IT", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    }).format(date)
}

function getCurrentWeatherFromCode(code, time = "07:00") {
    
    let weatherIcon = ""

    switch(code) {
        case 1000 : 
        case 1100 :
            if(time >= "06:00" && time < "18:00") {
                weatherIcon = "media/svg/sunny.svg"
            } else {
                weatherIcon = "media/svg/clear_night.svg"
            }
            break;
        case 1101 :
            if(time >= "06:00" && time < "18:00") {
                weatherIcon = "media/svg/few_clouds_day.svg"
            } else {
                weatherIcon = "media/svg/few_clouds_night.svg"
            }
            break;
        case 1101 :
        case 1102 :
        case 1001 :
            weatherIcon = "media/svg/cloudy.svg" 
            break;
        case 2000 :
        case 2100 :
            weatherIcon = "media/svg/foggy.svg"
            break;
        case 4000 :
        case 4001 :
        case 4200 :
        case 4201 :
            weatherIcon = "media/svg/rainy.svg"
            break;
        case 5000 :
        case 5001 :
        case 5100 :
        case 5101 :
            weatherIcon = "media/svg/snowy.svg"
            break;
        case 6000 :
        case 6001 :
        case 6200 :
        case 6201 :
            weatherIcon = "media/svg/hail.svg" //freezing rain
            break;
        case 7000 :
        case 7101 :
        case 7102 :
            weatherIcon = "media/svg/hail.svg"
            break;
        case 8000 :
            weatherIcon = "media/svg/thunderstorm.svg"
            break;
        default :
            weatherIcon = "media/svg/question-mark.svg"
    }
    
    return weatherIcon
}




function formatISODateTimesToLocal(arr) {
    arr.hourly.forEach(hour => {
        hour.time = convertISOToLocalTime(hour.time, WeatherApp.localTimeZone)
    })

    arr.daily.forEach(day => {
        day.time = convertISOToLocalTime(day.time, WeatherApp.localTimeZone).slice(0,10)
    })
}



function getNextDays() {
    const next5Days = []
    const currentDay = WeatherApp.currentLocalTimeStamp.slice(0,10)
    console.log(currentDay)
    const days = WeatherApp.lastWeatherData.timelines.daily
    let count = 0
    let i = 0
    let found = false

    if(days[0].time.includes(currentDay)) i = 0
    
    while(count < 5 && i < days.length) {
        if(!found && !days[i].time.includes(currentDay)) {
            i++
            continue
        }
        if(!found) found = true
        //next5Days.push(days[i].time.slice(0,10))
        let day = days[i]
        next5Days.push([day.time, day.values.weatherCodeMin, Math.round(day.values.temperatureMin), Math.round(day.values.temperatureMax)])
        count++
        i++
    }

    return next5Days
}

function formatNextDays() {
    $("#nextDays").empty()
    const days = getNextDays()
    //console.log(days)
    days.forEach((day) => {
        //console.log(day)
        const dayPanel = $("<div/>")
        const date = $("<p/>").text(formatDateForNextDaysDisplay(day[0]))
        const weatherIcon = $("<img>").attr("src", getCurrentWeatherFromCode(day[1]))
        const weatherMaxAndMin = $("<p/>").html(`<span>${day[3]}°</span>  <span>${day[2]}°</span>`)
        dayPanel.append(date, weatherIcon, weatherMaxAndMin).attr("data-date", day[0])
        $("#nextDays").append(dayPanel)
    })
}

function formatDateForNextDaysDisplay(dateStr) {
    const [day, month, year] = dateStr.split('/')
    const date = new Date(`${year}-${month}-${day}`)

    // Formatta la data in "Mar 25/02"
    return new Intl.DateTimeFormat("it-IT", { 
        weekday: "short"
    }).format(date) + ` ${dateStr.slice(0,5)}`;
}

function showHourlyForecastForDay() {
    const selectedDate = $(this).attr("data-date")
    $("#searchDiv").hide()
    $("main").hide()
    $("#hourlyInfos").attr("data-selectedDate", selectedDate).show()
    getHourlyForecastForDay(WeatherApp.lastWeatherData, selectedDate, $("select").val())
}

function getHourlyForecastForDay(weatherData, selectedDate, property) {
    console.log("Selected date is : " + selectedDate)
    $("#hourlyInfosDiv").empty()
    const hourlyInfos = weatherData.timelines.hourly.filter(hourlyData => hourlyData.time.startsWith(selectedDate))
    hourlyInfos.forEach(hour => {
        const hourPanel = $("<div/>").addClass("hourDiv")
        const weatherIcon = $("<img>").attr("src", getCurrentWeatherFromCode(hour.values.weatherCode))
        const time = $("<p/>").text(hour.time.slice(11,17))

        let suffix = ""
        switch(property) {
            case "temperature":
                suffix = "°C"
                break
            case "windSpeed":
                suffix = "KM/H"
                break
            case "humidity":
            case "precipitationProbability":
                suffix = "%"
                break
            default:
                suffix = "-.-"
        }

        const selectedProperty = $("<p/>").text(`${hour.values[property]} ${suffix}`)
        /*
        const temp = $("<p/>").text(hour.values.temperature + "°C")
        const windSpeed = $("<p/>").text(hour.values.windSpeed + "KM/H")
        const humidity = $("<p/>").text(hour.values.humidity + "%")
        const rainProb = $("<p/>").text(hour.values.precipitationProbability + "%")
        hourPanel.append(time, temp, windSpeed, humidity, rainProb)*/
        //hourPanel.append(time, weatherIcon, selectedProperty).addClass("hourDiv")

        Array.from([time, weatherIcon, selectedProperty]).forEach(prop => {
            const internalDiv = $("<div/>")
            internalDiv.append(prop)
            hourPanel.append(internalDiv)
        })
        $("#hourlyInfosDiv").append(hourPanel)
    })
}

function hideHourlyForecastForDay() {
    $("#searchDiv").show()
    $("main").show()
    $("#hourlyInfos").hide()
}

function changeHourlyProperty() {
    //console.log($(this).val())
    getHourlyForecastForDay(WeatherApp.lastWeatherData, $("#hourlyInfos").attr("data-selectedDate"), $("select").val())
}