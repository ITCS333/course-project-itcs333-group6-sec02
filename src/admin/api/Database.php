<?php
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
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8",
                $this->username,
                $this->password
            );

            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Database connection error: " . $e->getMessage()
            ]);
            exit;
        }

        return $this->conn;
    }
}
?>

?>
