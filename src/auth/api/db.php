<?php
function getDBConnection() {
    $host = 'localhost';
    $dbname = 'course';   
    $username = 'root';   
    $password = '';       

    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;

    } catch (PDOException $e) {
        error_log("DB Connection failed: " . $e->getMessage());
        return null;
    }
}

?>
