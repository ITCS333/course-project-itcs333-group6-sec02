<?php
require_once 'Database.php';
session_start(); // For authentication

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = (new Database())->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$action = $_GET['action'] ?? null;
$assignment_id = isset($_GET['assignment_id']) ? intval($_GET['assignment_id']) : null;
$comment_id = isset($_GET['comment_id']) ? intval($_GET['comment_id']) : null;

// ---------- Authentication helpers ----------
function isLoggedIn() { return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true; }
function isAdmin() { return isset($_SESSION['is_admin']) && $_SESSION['is_admin'] == 1; }

// ---------- Helpers ----------
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}
function sanitize($value) { return htmlspecialchars(strip_tags(trim($value))); }

// ---------- ADMIN CHECK ----------
function checkAdmin() {
    if (!isLoggedIn()) sendResponse(["success" => false, "message" => "Login required"], 401);
    sendResponse(["success" => true, "is_admin" => isAdmin()]);
}

// ---------- ASSIGNMENT FUNCTIONS ----------
function getAllAssignments($db) {
    $stmt = $db->query("SELECT * FROM assignments ORDER BY created_at DESC");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($data as &$a) $a['files'] = json_decode($a['files'], true) ?? [];
    sendResponse(["success" => true, "data" => $data]);
}

function getAssignmentById($db, $id) {
    $stmt = $db->prepare("SELECT * FROM assignments WHERE id=?");
    $stmt->execute([$id]);
    $a = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($a) {
        $a['files'] = json_decode($a['files'], true) ?? [];
        sendResponse(["success" => true, "data" => $a]);
    }
    sendResponse(["success" => false, "message" => "Assignment not found"], 404);
}

function createAssignment($db, $data) {
    if (!isLoggedIn() || !isAdmin()) sendResponse(["success"=>false,"message"=>"Unauthorized"],401);
    if (empty($data['title']) || empty($data['description']) || empty($data['due_date'])) {
        sendResponse(["success"=>false,"message"=>"Missing required fields"],400);
    }

    $stmt = $db->prepare("INSERT INTO assignments (title, description, due_date, files) VALUES (?,?,?,?)");
    $stmt->execute([
        sanitize($data['title']),
        sanitize($data['description']),
        $data['due_date'],
        json_encode($data['files'] ?? [])
    ]);
    getAssignmentById($db, $db->lastInsertId());
}

function updateAssignment($db, $data) {
    if (!isLoggedIn() || !isAdmin()) sendResponse(["success"=>false,"message"=>"Unauthorized"],401);
    if (empty($data['id'])) sendResponse(["success"=>false,"message"=>"ID required"],400);

    $id = intval($data['id']);
    $stmt=$db->prepare("SELECT id FROM assignments WHERE id=?"); 
    $stmt->execute([$id]);
    if(!$stmt->fetch()) sendResponse(["success"=>false,"message"=>"Assignment not found"],404);

    $fields=[];$vals=[];
    if(isset($data['title'])) $fields[]='title=?'; $vals[]=sanitize($data['title']);
    if(isset($data['description'])) $fields[]='description=?'; $vals[]=sanitize($data['description']);
    if(isset($data['due_date'])) $fields[]='due_date=?'; $vals[]=$data['due_date'];
    if(isset($data['files'])) $fields[]='files=?'; $vals[]=json_encode($data['files']);
    if(empty($fields)) sendResponse(["success"=>false,"message"=>"No fields to update"],400);

    $vals[]=$id;
    $sql="UPDATE assignments SET ".implode(',',$fields)." WHERE id=?";
    $stmt=$db->prepare($sql); 
    $stmt->execute($vals);
    sendResponse(["success"=>true]);
}

function deleteAssignment($db,$id){
    if(!isLoggedIn() || !isAdmin()) sendResponse(["success"=>false,"message"=>"Unauthorized"],401);
    if(!$id) sendResponse(["success"=>false,"message"=>"ID required"],400);

    $stmt=$db->prepare("SELECT id FROM assignments WHERE id=?"); 
    $stmt->execute([$id]);
    if(!$stmt->fetch()) sendResponse(["success"=>false,"message"=>"Not found"],404);

    $db->beginTransaction();
    $db->prepare("DELETE FROM comments_assignment WHERE assignment_id=?")->execute([$id]);
    $db->prepare("DELETE FROM assignments WHERE id=?")->execute([$id]);
    $db->commit();

    sendResponse(["success"=>true]);
}

// ---------- COMMENT FUNCTIONS ----------
function getComments($db,$assignment_id){
    $stmt=$db->prepare("SELECT id,author,text,created_at FROM comments_assignment WHERE assignment_id=? ORDER BY created_at ASC");
    $stmt->execute([$assignment_id]);
    sendResponse(["success"=>true,"data"=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function createComment($db,$data){
    if(!isLoggedIn()) sendResponse(["success"=>false,"message"=>"Login required"],401);
    if(empty($data['assignment_id'])||empty($data['text'])) sendResponse(["success"=>false,"message"=>"assignment_id and text required"],400);

    $aid=intval($data['assignment_id']); 
    $author=$_SESSION['user_name'] ?? 'Student'; 
    $text=sanitize($data['text']);
    
    $stmt=$db->prepare("SELECT id FROM assignments WHERE id=?"); 
    $stmt->execute([$aid]);
    if(!$stmt->fetch()) sendResponse(["success"=>false,"message"=>"Assignment not found"],404);

    $stmt=$db->prepare("INSERT INTO comments_assignment (assignment_id,author,text) VALUES (?,?,?)");
    $stmt->execute([$aid,$author,$text]);

    getComments($db,$aid);
}

// ---------- ROUTING WITH TRY-CATCH ----------
try {
    switch($method){
        case 'GET':
            if($action==='comments' && $assignment_id) getComments($db,$assignment_id);
            elseif($id) getAssignmentById($db,$id);
            elseif($action==='check_admin') checkAdmin();
            else getAllAssignments($db);
            break;
        case 'POST':
            if($action==='comment') createComment($db,$input);
            else createAssignment($db,$input);
            break;
        case 'PUT': updateAssignment($db,$input); break;
        case 'DELETE': deleteAssignment($db,$id); break;
        default: sendResponse(["success"=>false,"message"=>"Method not allowed"],405);
    }
} catch (PDOException $e) {
    // Catches database-related errors
    error_log("PDO Error: ".$e->getMessage());
    sendResponse(["success"=>false,"message"=>"Database error occurred"],500);
} catch (Exception $e) {
    // Catches any other errors
    error_log("General Error: ".$e->getMessage());
    sendResponse(["success"=>false,"message"=>"An error occurred"],500);
}
?>
