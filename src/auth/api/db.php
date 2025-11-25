<?php

function getDBConnection() {
    
    $host = getenv('DB_HOST');
    $dbname = getenv('DB_NAME');
    $user = getenv('DB_USER');
    $pass = getenv('DB_PASS');

    
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";

    try {
        
        $pdo = new PDO($dsn, $user, $pass);

        
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); 
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        return $pdo;

    } catch (PDOException $e) {
       
        error_log("Database connection failed: " . $e->getMessage());

        
        die(json_encode([
            'success' => false,
            'message' => 'Database connection error'
        ]));
    }
}
?>
