<?php

require_once 'weatherService.php';

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!empty($_POST['cityId'])) {
            $weatherService = new WeatherService();
            echo $weatherService->getCityCoords($_POST['cityId']);
        } elseif (!empty($_POST['userInput'])) {
            $weatherService = new WeatherService();
            echo $weatherService->suggestCities($_POST['userInput']);
        } else {
            throw new Exception('Parametro mancante');
        }
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

?>