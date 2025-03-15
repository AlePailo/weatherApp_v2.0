import Max5ElementsUniqueQueue from './historyUniqueQueue.js'
import lastSearchData from './lastSearchData.js'

$(document).ready(function() {
    $("#searchBtn").on("click", bindFirstSuggestion)
    $("#searchInput").on("keyup", detectEnter)
    $("#searchInput").on("input focus", showSuggestions)
    $("#searchInput").on("input focus focusout", changeXStatus)
    $("body").on("click", "#searchInputX", deleteSearchInputText)
    $("body").on("click", "#nextDays div", function() {
        $(this).css("transform", "scale(0.9)")
        setTimeout(() => {
            showHourlyForecastForDay($(this).attr("data-date"))
            $(this).css("transform", "scale(1)")
        }, 150)  
    })
    $("body").on("click", "#backBtn", function() {
        $(this).css("transform", "scale(0.75)")
        setTimeout(() => {
            hideHourlyForecastForDay()
            $(this).css("transform", "scale(1)")
        }, 150)
    })
    $("select").on("change", changeHourlyProperty)

    $(document).click(function (e) {
        if (!$(e.target).closest("#searchInput, #suggestions").length) {
            $("#suggestions").hide();
        }
    })
})

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
        method: "POST",
        data: {
            cityId: cityId
        },
        beforeSend: toggleLoadingVisibility,
        success: function(response) {
            console.log(response)
            addToLastSearches(cityFullName, cityId)
            $("main").show()
            $("#placeInfos").text(cityFullName)
            const updateObj = {
                localTimeZone : response.localTimeZone,
                weather : response.weather, 
                currentTime : convertISOToLocalTime(new Date().toISOString(), response.localTimeZone)
            }
            lastSearchData.update(updateObj)
            formatISODateTimesToLocal(lastSearchData.lastWeatherData.timelines)
            console.log(lastSearchData)
            $("#currentLocalTime").text(lastSearchData.currentLocalTimeStamp.slice(12,17))
            $("#currentLocalDate").text(lastSearchData.currentLocalTimeStamp.slice(0,10))
            let currentWeather = lastSearchData.lastWeatherData.timelines.hourly[0].values
            $("#currentTemperature").text(Math.round(currentWeather.temperature) + "°C")
            $("#currentWindSpeed").text(currentWeather.windSpeed + "KM/H")
            $("#currentHumidity").text(currentWeather.humidity + "%")
            $("#currentRainProb").text(currentWeather.precipitationProbability + "%")
            $("#currentWeatherImg").attr("src", getCurrentWeatherFromCode(currentWeather.weatherCode, lastSearchData.currentLocalTimeStamp.slice(12,17)))

            formatNextDays()
            //console.log(getHourlyForecastForDay(lastSearchData.lastWeatherData, lastSearchData.currentLocalTimeStamp.slice(0,10)))
            $("#searchInput").blur() // FORSE MEGLIO PRIMA DI AJAX CALL
        },
        error: () => alert("AJAX error"),
        complete: toggleLoadingVisibility
    })
    console.log(cityFullName)
    console.log(cityId)
}

function showSuggestions() {
    const input = $("#searchInput").val().trim()
    $("#suggestions").show()

    if(input.length < 1) {
        $("#suggestions").empty()
        showHistory()
        return
    }

    $.ajax({
        url: "weather_api.php",
        method: "POST",
        data: {
            userInput : input
        },
        success: function(response) {
            $("#suggestions").empty()

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
        error: () => alert("Suggestions error")
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
        //case 1101 :
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
        hour.time = convertISOToLocalTime(hour.time, lastSearchData.localTimeZone)
    })

    arr.daily.forEach(day => {
        day.time = convertISOToLocalTime(day.time, lastSearchData.localTimeZone).slice(0,10)
    })
}



function getNextDays(currentDay, coveredDays) {
    const next5Days = []
    //const currentDay = lastSearchData.currentLocalTimeStamp.slice(0,10)
    console.log(currentDay)
    //const days = lastSearchData.lastWeatherData.timelines.daily
    let count = 0
    let i = 0
    let found = false

    if(coveredDays[0].time.includes(currentDay)) i = 0
    
    while(count < 5 && i < coveredDays.length) {
        if(!found && !coveredDays[i].time.includes(currentDay)) {
            i++
            continue
        }
        if(!found) found = true
        //next5Days.push(days[i].time.slice(0,10))
        let day = coveredDays[i]
        next5Days.push([day.time, day.values.weatherCodeMin, Math.round(day.values.temperatureMin), Math.round(day.values.temperatureMax)])
        count++
        i++
    }

    return next5Days
}

function formatNextDays() {
    $("#nextDays").empty()
    const days = getNextDays(lastSearchData.currentLocalTimeStamp.slice(0,10), lastSearchData.lastWeatherData.timelines.daily)
    console.log(days)
    days.forEach((day, i) => {
        //console.log(day)
        const dayPanel = $("<div/>").addClass("flex-center")
        let date = formatDateForNextDaysDisplay(day[0])
        if(i === 0) date = "Oggi"
        if(i === 1) date = "Domani"
        const dateText = $("<p/>").text(date)
        const weatherIcon = $("<img>").attr("src", getCurrentWeatherFromCode(day[1]))
        const weatherMaxAndMin = $("<p/>").html(`<span>${day[3]}°</span>  <span>${day[2]}°</span>`)
        dayPanel.append(dateText, weatherIcon, weatherMaxAndMin).attr("data-date", day[0])
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

function showHourlyForecastForDay(selectedDate) {
    //const selectedDate = $(this).attr("data-date")
    $("select").val("temperature")
    $("#searchDiv").hide()
    $("main").hide()
    $("#hourlyInfos").attr("data-selectedDate", selectedDate).show()
    getHourlyForecastForDay(lastSearchData.lastWeatherData, selectedDate, $("select").val())
}

function getHourlyForecastForDay(weatherData, selectedDate, property) {
    console.log("Selected date is : " + selectedDate)
    $("#hourlyInfosDiv").empty()
    const hourlyInfos = weatherData.timelines.hourly.filter(hourlyData => hourlyData.time.startsWith(selectedDate))
    hourlyInfos.forEach(hour => {
        const hourPanel = $("<div/>").addClass("hourDiv")
        const weatherIcon = $("<img>").attr("src", getCurrentWeatherFromCode(hour.values.weatherCode, hour.time.slice(12,17)))
        const time = $("<p/>").text(hour.time.slice(12,17))

        let propertyVal = hour.values[property]
        let suffix = ""
        switch(property) {
            case "temperature":
                propertyVal = Math.round(propertyVal)
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

        const selectedProperty = $("<p/>").text(`${propertyVal} ${suffix}`)

        Array.from([time, weatherIcon, selectedProperty]).forEach(prop => {
            const internalDiv = $("<div/>").addClass("flex-center")
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
    getHourlyForecastForDay(lastSearchData.lastWeatherData, $("#hourlyInfos").attr("data-selectedDate"), $("select").val())
}


function showHistory() {
    const lastSearches = Max5ElementsUniqueQueue.loadFromLocalStorage()
    lastSearches.getHistory().forEach(city => {
        const listItem = $("<li>")
            //.text(city.name)
            .attr("data-cityId", city.id)
            .click(function() {
                $("#suggestions").empty()

                let cityId = $(this).attr("data-cityId")
                let cityFullName = $(this).text()
                handleSearch(cityFullName, cityId)
            })

        // Creazione delle icone
        const leftIcon = $("<span>").addClass("icon-left").html('<img src="media/svg/history.svg">')
        const rightIcon = $("<span>").addClass("icon-right").html('<img src="media/svg/x.svg">').click(function(e) {
            e.stopPropagation()
            const parentLi = $(this).parent()
            const lastSearches = Max5ElementsUniqueQueue.loadFromLocalStorage()
            lastSearches.leaveQueue(parentLi.attr("data-cityId"))
            lastSearches.saveToLocalStorage()
            parentLi.remove()
        })
        
        // Nome città con classe per facile selezione
        const cityName = $("<span>").addClass("city-name").text(city.name)

        // Costruzione dell'elemento <li>
        listItem.append(leftIcon, cityName, rightIcon)

        $("#suggestions").append(listItem)
    })
    console.log(lastSearches)
    //lastSearches.items.reverse().forEach(city => console.log(city))
}

function addToLastSearches(city, cityId) {
    const lastSearches = Max5ElementsUniqueQueue.loadFromLocalStorage()
    lastSearches.enqueue({id: cityId, name: city})
}

function toggleLoadingVisibility() {
    $("#loadingWrapper").toggleClass("flex-center")
}