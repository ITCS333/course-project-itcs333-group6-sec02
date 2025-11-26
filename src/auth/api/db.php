<?php
function getDBConnection() {
    $host = 'localhost'; 
    $dbname = 'course';
    $username = 'admin';
    $password = 'password123';

    try {
        $pdo = new PDO(
            "mysql:host=$host;dbname=$dbname;charset=utf8;port=3306",
            $username,
            $password
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;

    } catch (PDOException $e) {
        echo "Connection failed: " . $e->getMessage();
        return null;
    }
}
?>
