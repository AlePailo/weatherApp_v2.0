<?php

require_once "config.php";

if(isset($_POST["cityId"])) {
    getCityCoords($_POST["cityId"]);
    
}

if(isset($_POST["userInput"])) {
    suggestCities($_POST["userInput"]);
}

function getCityCoords($cityId) {
    if(!defined("CITIES_DB_API_KEY")) {
        echo json_encode(["error" => "Chaive API non trovata"]);
        exit;
    }

    $cityId = urlencode(trim($cityId));
    
    $apiUrl = 'https://lookup.search.hereapi.com/v1/lookup?id=' . $cityId . '&apiKey=' . CITIES_DB_API_KEY;
    
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5); // Timeout di 5 secondi
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        echo json_encode(["error" => "Errore API (Codice $httpCode)"]);
        exit;
    }

    $weatherData = json_decode($response, true);

    $lat = $weatherData["position"]["lat"];
    $lon = $weatherData["position"]["lng"];

    retrieveForecastData($lat, $lon);
}

function retrieveForecastData($lat, $lon) {
    if(!defined("API_KEY")) {
        echo json_encode(["error" => "Chaive API non trovata"]);
        exit;
    }

    $coords = urlencode(trim($lat) . ", " . trim($lon));
    
    $apiUrl = 'https://api.tomorrow.io/v4/weather/forecast?location=' . $coords . '&apikey=' . API_KEY;
    
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5); // Timeout di 5 secondi
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        echo json_encode(["error" => "Errore API (Codice $httpCode)"]);
        exit;
    }

    $weatherData = json_decode($response, true);
    

    $timeZoneUrl = "https://api.timezonedb.com/v2.1/get-time-zone?key=" . TIMEZONE_API_KEY . "&format=json&by=position&lat={$lat}&lng={$lon}";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $timeZoneUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);

    $timeZoneResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        echo json_encode(["error" => "Errore API fuso orario (Codice $httpCode)"]);
        exit;
    }

    $timeZoneData = json_decode($timeZoneResponse, true);
    $localTimeZone = $timeZoneData['zoneName'];
    //$localTime = $timeZoneData['formatted'] ?? null; // Es: "2025-02-12 15:30:00"

    /*if ($localTime) {
        $localTimeISO = str_replace(" ", "T", substr($localTime, 0, 16)) . "Z";
    } else {
        $localTimeISO = null;
    }*/

    // 🔹 4. RESTITUISCI TUTTI I DATI
    echo json_encode([
        "weather" => $weatherData,
        "localTimeZone" => $localTimeZone
    ]);
}

function suggestCities($input) {
    if(!defined("CITIES_DB_API_KEY")) {
        echo json_encode(["error" => "Chaive API non trovata"]);
        exit;
    }

    $userInput = urlencode(trim($input));

    $apiUrl = 'https://autocomplete.search.hereapi.com/v1/autocomplete?q=' . $userInput . '&apiKey='. CITIES_DB_API_KEY . '&types=city&limit=5';
    
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5); // Timeout di 5 secondi
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        echo json_encode(["error" => "Errore API (Codice $httpCode)"]);
        exit;
    }

    echo $response;
}

?>