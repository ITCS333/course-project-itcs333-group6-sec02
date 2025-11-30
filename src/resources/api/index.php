<?php
require_once 'Database.php';
session_start(); // Start session for authentication

// -----------------------
// Headers
// -----------------------
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// -----------------------
// DB Connection
// -----------------------
$db = (new Database())->getConnection();

// -----------------------
// Request Info
// -----------------------
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$action = isset($_GET['action']) ? $_GET['action'] : null;
$resource_id = isset($_GET['resource_id']) ? intval($_GET['resource_id']) : null;
$comment_id = isset($_GET['comment_id']) ? intval($_GET['comment_id']) : null;

// -----------------------
// Authentication Helpers
// -----------------------
function isLoggedIn() {
    return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
}

function isAdmin() {
    return isset($_SESSION['is_admin']) && $_SESSION['is_admin'] == 1;
}

// -----------------------
// Helper Functions
// -----------------------
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

function sanitize($value) {
    return htmlspecialchars(strip_tags(trim($value)));
}

// -----------------------
// RESOURCE FUNCTIONS
// -----------------------
function getAllResources($db) {
    $stmt = $db->prepare("SELECT id, title, description, link, created_at FROM resources ORDER BY created_at DESC");
    $stmt->execute();
    $resources = $stmt->fetchAll(PDO::FETCH_ASSOC);
    sendResponse(["success" => true, "data" => $resources]);
}

function getResourceById($db, $id) {
    $stmt = $db->prepare("SELECT id, title, description, link, created_at FROM resources WHERE id = ?");
    $stmt->execute([$id]);
    $resource = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($resource) {
        sendResponse(["success" => true, "data" => $resource]);
    } else {
        sendResponse(["success" => false, "message" => "Resource not found"], 404);
    }
}

function createResource($db, $data) {
    if (!isLoggedIn() || !isAdmin()) sendResponse(["success" => false, "message" => "Unauthorized"], 401);

    if (empty($data['title']) || empty($data['link'])) sendResponse(["success" => false, "message" => "Title and link are required"], 400);

    $title = sanitize($data['title']);
    $description = isset($data['description']) ? sanitize($data['description']) : '';
    $link = filter_var($data['link'], FILTER_VALIDATE_URL);
    if (!$link) sendResponse(["success" => false, "message" => "Invalid URL"], 400);

    $stmt = $db->prepare("INSERT INTO resources (title, description, link) VALUES (?, ?, ?)");
    if ($stmt->execute([$title, $description, $link])) {
        $id = $db->lastInsertId();
        sendResponse(["success" => true, "id" => $id], 201);
    } else {
        sendResponse(["success" => false, "message" => "Failed to create resource"], 500);
    }
}

function updateResource($db, $data) {
    if (!isLoggedIn() || !isAdmin()) sendResponse(["success" => false, "message" => "Unauthorized"], 401);

    if (empty($data['id'])) sendResponse(["success" => false, "message" => "Resource ID is required"], 400);
    $id = intval($data['id']);

    $stmt = $db->prepare("SELECT * FROM resources WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) sendResponse(["success" => false, "message" => "Resource not found"], 404);

    $fields = [];
    $values = [];

    if (isset($data['title'])) { $fields[] = "title = ?"; $values[] = sanitize($data['title']); }
    if (isset($data['description'])) { $fields[] = "description = ?"; $values[] = sanitize($data['description']); }
    if (isset($data['link'])) { 
        $link = filter_var($data['link'], FILTER_VALIDATE_URL);
        if (!$link) sendResponse(["success" => false, "message" => "Invalid URL"], 400);
        $fields[] = "link = ?"; $values[] = $link;
    }

    if (empty($fields)) sendResponse(["success" => false, "message" => "No fields to update"], 400);

    $values[] = $id;
    $sql = "UPDATE resources SET " . implode(", ", $fields) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    if ($stmt->execute($values)) sendResponse(["success" => true]);
    else sendResponse(["success" => false, "message" => "Failed to update resource"], 500);
}

function deleteResource($db, $id) {
    if (!isLoggedIn() || !isAdmin()) sendResponse(["success" => false, "message" => "Unauthorized"], 401);

    if (!$id) sendResponse(["success" => false, "message" => "Resource ID required"], 400);
    $stmt = $db->prepare("SELECT * FROM resources WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) sendResponse(["success" => false, "message" => "Resource not found"], 404);

    try {
        $db->beginTransaction();
        $stmt = $db->prepare("DELETE FROM comments_resource WHERE resource_id = ?");
        $stmt->execute([$id]);

        $stmt = $db->prepare("DELETE FROM resources WHERE id = ?");
        $stmt->execute([$id]);
        $db->commit();

        sendResponse(["success" => true]);
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(["success" => false, "message" => "Failed to delete resource"], 500);
    }
}

// -----------------------
// COMMENT FUNCTIONS
// -----------------------
function getCommentsByResourceId($db, $resource_id) {
    if (!$resource_id) sendResponse(["success" => false, "message" => "Resource ID required"], 400);
    $stmt = $db->prepare("SELECT id, author, text, created_at FROM comments_resource WHERE resource_id = ? ORDER BY created_at ASC");
    $stmt->execute([$resource_id]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    sendResponse(["success" => true, "data" => $comments]);
}

function createComment($db, $data) {
    if (!isLoggedIn()) sendResponse(["success" => false, "message" => "Login required"], 401);

    if (empty($data['resource_id']) || empty($data['text'])) sendResponse(["success" => false, "message" => "resource_id and text are required"], 400);

    $rid = intval($data['resource_id']);
    $author = $_SESSION['user_name']; // Automatically assign logged-in user as author
    $text = sanitize($data['text']);

    $stmt = $db->prepare("SELECT * FROM resources WHERE id = ?");
    $stmt->execute([$rid]);
    if (!$stmt->fetch()) sendResponse(["success" => false, "message" => "Resource not found"], 404);

    $stmt = $db->prepare("INSERT INTO comments_resource (resource_id, author, text) VALUES (?, ?, ?)");
    if ($stmt->execute([$rid, $author, $text])) {
        $id = $db->lastInsertId();
        sendResponse(["success" => true, "id" => $id], 201);
    } else {
        sendResponse(["success" => false, "message" => "Failed to add comment"], 500);
    }
}

function deleteComment($db, $comment_id) {
    if (!$comment_id) sendResponse(["success" => false, "message" => "Comment ID required"], 400);

    $stmt = $db->prepare("SELECT * FROM comments_resource WHERE id = ?");
    $stmt->execute([$comment_id]);
    $comment = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$comment) sendResponse(["success" => false, "message" => "Comment not found"], 404);

    if (!isLoggedIn() || (!isAdmin() && $_SESSION['user_name'] !== $comment['author'])) {
        sendResponse(["success" => false, "message" => "Unauthorized"], 401);
    }

    $stmt = $db->prepare("DELETE FROM comments_resource WHERE id = ?");
    if ($stmt->execute([$comment_id])) sendResponse(["success" => true]);
    else sendResponse(["success" => false, "message" => "Failed to delete comment"], 500);
}

// -----------------------
// ROUTING
// -----------------------
switch ($method) {
    case 'GET':
        if ($action === 'comments' && $resource_id) getCommentsByResourceId($db, $resource_id);
        elseif ($id) getResourceById($db, $id);
        else getAllResources($db);
        break;

    case 'POST':
        if ($action === 'comment') createComment($db, $input);
        else createResource($db, $input);
        break;

    case 'PUT':
        updateResource($db, $input);
        break;

    case 'DELETE':
        if ($action === 'delete_comment' && $comment_id) deleteComment($db, $comment_id);
        else deleteResource($db, $id);
        break;

    default:
        sendResponse(["success" => false, "message" => "Method not allowed"], 405);
}
?>
