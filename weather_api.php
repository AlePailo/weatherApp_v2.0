<?php

require_once 'config.php';

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!empty($_POST['cityId'])) {
        getCityCoords($_POST['cityId']);
    } elseif (!empty($_POST['userInput'])) {
        suggestCities($_POST['userInput']);
    } else {
        echo json_encode(['error' => 'Nessun parametro valido ricevuto']);
        exit;
    }
}

function getCityCoords($cityId) {
    if(!defined('CITIES_DB_API_KEY')) {
        echo json_encode(['error' => 'Chiave API non trovata']);
        exit;
    }

    $cityId = urlencode(trim($cityId));
    $response = apiCall("https://lookup.search.hereapi.com/v1/lookup?id=$cityId&apiKey=" . CITIES_DB_API_KEY);

    $weatherData = json_decode($response, true);
    if (!isset($weatherData['position']['lat'], $weatherData['position']['lng'])) {
        echo json_encode(['error' => 'Dati della città non validi']);
        exit;
    }
    $lat = $weatherData['position']['lat'];
    $lon = $weatherData['position']['lng'];
    retrieveForecastData($lat, $lon);
}


function retrieveForecastData($lat, $lon) {
    if(!defined('API_KEY') || !defined('TIMEZONE_API_KEY')) {
        echo json_encode(['error' => 'Chaive API non trovata']);
        exit;
    }

    $coords = urlencode(trim($lat) . "," . trim($lon));
    $response = apiCall("https://api.tomorrow.io/v4/weather/forecast?location=$coords&apikey=" . API_KEY);

    $weatherData = json_decode($response, true);
    $timeZoneResponse = apiCall("https://api.timezonedb.com/v2.1/get-time-zone?key=" . TIMEZONE_API_KEY . "&format=json&by=position&lat={$lat}&lng={$lon}");

    $timeZoneData = json_decode($timeZoneResponse, true);
    if (!isset($timeZoneData['zoneName'])) {
        echo json_encode(['error' => 'Errore nel recupero del fuso orario']);
        exit;
    }
    $localTimeZone = $timeZoneData['zoneName'];

    echo json_encode([
        'weather' => $weatherData,
        'localTimeZone' => $localTimeZone
    ]);
}


function suggestCities($input) {
    if(!defined('CITIES_DB_API_KEY')) {
        echo json_encode(['error' => 'Chiave API non trovata']);
        exit;
    }

    $userInput = urlencode(trim($input));
    $response = apiCall("https://autocomplete.search.hereapi.com/v1/autocomplete?q=$userInput&apiKey=". CITIES_DB_API_KEY . "&types=city&limit=5");
    echo $response;
}


function apiCall($apiUrl) {

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        echo json_encode(['error' => "Errore API (Codice $httpCode)"]);
        exit;
    }

    return $response;
}

?>