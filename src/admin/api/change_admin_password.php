<?php
session_start();
header('Content-Type: application/json');


$paths = [
    __DIR__ . "/database.php",
    __DIR__ . "/../database.php"
];

$conn = null;

foreach ($paths as $path) {
    if (file_exists($path)) {
        require_once $path;

        if (class_exists("Database")) {
            $db = new Database();
            $conn = $db->getConnection();
        } elseif (function_exists("getDBConnection")) {
            $conn = getDBConnection();
        }
        break;
    }
}

if (!$conn) {
    echo json_encode([
        "success" => false,
        "message" => "Database connection file not found"
    ]);
    exit;
}

if (
    !isset($_SESSION['user_id']) ||
    !isset($_SESSION['is_admin']) ||
    $_SESSION['is_admin'] != 1
) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];

$data = json_decode(file_get_contents("php://input"), true);
if (!$data || !is_array($data)) {
    $data = $_POST;
}

if (
    empty($data['current_password']) ||
    empty($data['new_password'])
) {
    echo json_encode(['success' => false, 'message' => 'Missing fields']);
    exit;
}

$currentPassword = $data['current_password'];
$newPassword     = $data['new_password'];

if (strlen($newPassword) < 8) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters']);
    exit;
}

$stmt = $conn->prepare("SELECT password FROM users WHERE id = :id");
$stmt->execute(['id' => $user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($currentPassword, $user['password'])) {
    echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
    exit;
}


$newHash = password_hash($newPassword, PASSWORD_DEFAULT);

$update = $conn->prepare("UPDATE users SET password = :pass WHERE id = :id");
$update->execute([
    'pass' => $newHash,
    'id'   => $user_id
]);

echo json_encode([
    'success' => true,
    'message' => 'Password updated successfully'
]);
?>
