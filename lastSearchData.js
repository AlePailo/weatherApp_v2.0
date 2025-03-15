const lastSearchData = {
    localTimeZone: null,
    lastWeatherData: null,
    currentLocalTimeStamp: null,
    
    update({ localTimeZone, weather, currentTime }) {
        if (localTimeZone) this.localTimeZone = localTimeZone;
        if (weather) this.lastWeatherData = weather;
        if (currentTime) this.currentLocalTimeStamp = currentTime;
    }
}

export default lastSearchData