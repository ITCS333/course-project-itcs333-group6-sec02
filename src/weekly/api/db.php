<?php

class Database {

    private $host = 'localhost';
    private $db   = 'course';
    private $user = 'admin';
    private $pass = 'password123';
    private $conn;

    public function getConnection() {
        $this->conn = null;

        $dsn = "mysql:host={$this->host};dbname={$this->db};";

        try {
            $this->conn = new PDO($dsn, $this->user, $this->pass);
        } catch (PDOException $e) {
            throw new PDOException($e->getMessage(), (int)$e->getCode());
        }

        return $this->conn;
    }
}
