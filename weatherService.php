<?php

require_once 'config.php';

class WeatherService {
    private string $weatherApiKey;
    private string $timeZoneDBApiKey;
    private string $citiesDBApiKey;

    public function __construct() {
        if(!defined('API_KEY') || !defined('TIMEZONE_API_KEY') || !defined('CITIES_DB_API_KEY')) {
            throw new Exception('Chiavi API mancanti');
        }

        $this->weatherApiKey = API_KEY;
        $this->timeZoneDBApiKey = TIMEZONE_API_KEY;
        $this->citiesDBApiKey = CITIES_DB_API_KEY;
    }

    public function getCityCoords(string $cityId) : string {
        $cityId = urlencode(trim($cityId));
        $response = $this->apiCall("https://lookup.search.hereapi.com/v1/lookup?id=$cityId&apiKey=" . $this->citiesDBApiKey);
    
        $weatherData = json_decode($response, true);

        if (!isset($weatherData['position']['lat'], $weatherData['position']['lng'])) {
            throw new Exception('Dati della città non validi');
        }

        return $this->retrieveForecastData($weatherData['position']['lat'], $weatherData['position']['lng']);
    }

    public function retrieveForecastData(string $lat, string $lon) : string {
        $coords = urlencode("$lat, $lon");
        
        $weatherResponse = $this->apiCall("https://api.tomorrow.io/v4/weather/forecast?location=$coords&apikey=" . $this->weatherApiKey);
        $timeZoneResponse = $this->apiCall("https://api.timezonedb.com/v2.1/get-time-zone?key=" . $this->timeZoneDBApiKey . "&format=json&by=position&lat=$lat&lng=$lon");
        
        $weather = json_decode($weatherResponse, true);
        $timeZoneData = json_decode($timeZoneResponse, true);

        if (!isset($timeZoneData['zoneName'])) {
            throw new Exception('Errore nel recupero del fuso orario');
        }

        return json_encode([
            'weather' => $weather,
            'localTimeZone' => $timeZoneData['zoneName']
        ]);
    }

    public function suggestCities(string $input) : string {
        $userInput = urlencode(trim($input));
        return $this->apiCall("https://autocomplete.search.hereapi.com/v1/autocomplete?q=$userInput&apiKey=". $this->citiesDBApiKey . "&types=city&limit=5");
    }

    private function apiCall(string $url) : string {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            throw new Exception("Errore cURL: $curlError");
        }

        if ($httpCode !== 200) {
            throw new Exception("Errore API (Codice $httpCode)");
        }

        return $response;
    }
}

?>