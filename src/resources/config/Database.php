<?php
class Database {
    private $host = "localhost";
    private $db_name = "course";
    private $username = "admin";
    private $password = "password123";
    public $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8";
            $this->conn = new PDO($dsn, $this->username, $this->password);

            // PDO settings
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        } catch (PDOException $exception) {
            
            error_log("Database connection error: " . $exception->getMessage());
        }

        return $this->conn;
    }
}
?>
