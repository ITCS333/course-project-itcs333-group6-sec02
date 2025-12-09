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
$resource_id = isset($_GET['resource_id']) ? intval($_GET['resource_id']) : null;
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
if ($action === 'check_admin') {
    if (!isLoggedIn()) sendResponse(["success" => false, "message" => "Login required"], 401);
    sendResponse(["success" => true, "is_admin" => isAdmin()]);
}

// ---------- RESOURCE FUNCTIONS ----------
function getAllResources($db) {
    $stmt = $db->query("SELECT id, title, description, link, created_at FROM resources ORDER BY created_at DESC");
    sendResponse(["success" => true, "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function getResourceById($db, $id) {
    $stmt = $db->prepare("SELECT id, title, description, link, created_at FROM resources WHERE id=?");
    $stmt->execute([$id]);
    $r = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($r) sendResponse(["success" => true, "data" => $r]);
    sendResponse(["success" => false, "message" => "Resource not found"], 404);
}

function createResource($db, $data) {
    if (!isLoggedIn() || !isAdmin()) sendResponse(["success"=>false,"message"=>"Unauthorized"],401);
    if (empty($data['title']) || empty($data['link'])) sendResponse(["success"=>false,"message"=>"Title and link required"],400);
    $title = sanitize($data['title']);
    $desc = $data['description'] ?? '';
    $link = filter_var($data['link'], FILTER_VALIDATE_URL);
    if (!$link) sendResponse(["success"=>false,"message"=>"Invalid URL"],400);
    $stmt = $db->prepare("INSERT INTO resources (title, description, link) VALUES (?,?,?)");
    $stmt->execute([$title,$desc,$link]);
    sendResponse(["success"=>true,"id"=>$db->lastInsertId()],201);
}

function updateResource($db,$data) {
    if (!isLoggedIn() || !isAdmin()) sendResponse(["success"=>false,"message"=>"Unauthorized"],401);
    if (empty($data['id'])) sendResponse(["success"=>false,"message"=>"ID required"],400);
    $id=intval($data['id']);
    $stmt=$db->prepare("SELECT id FROM resources WHERE id=?"); $stmt->execute([$id]);
    if (!$stmt->fetch()) sendResponse(["success"=>false,"message"=>"Resource not found"],404);

    $fields=[];$vals=[];
    if(isset($data['title'])){$fields[]='title=?';$vals[]=sanitize($data['title']);}
    if(isset($data['description'])){$fields[]='description=?';$vals[]=$data['description'];}
    if(isset($data['link'])){$link=filter_var($data['link'],FILTER_VALIDATE_URL);if(!$link)sendResponse(["success"=>false,"message"=>"Invalid URL"],400);$fields[]='link=?';$vals[]=$link;}
    $vals[]=$id;
    $sql="UPDATE resources SET ".implode(',',$fields)." WHERE id=?";
    $stmt=$db->prepare($sql);$stmt->execute($vals);
    sendResponse(["success"=>true]);
}

function deleteResource($db,$id){
    if(!isLoggedIn() || !isAdmin()) sendResponse(["success"=>false,"message"=>"Unauthorized"],401);
    if(!$id) sendResponse(["success"=>false,"message"=>"ID required"],400);
    $stmt=$db->prepare("SELECT id FROM resources WHERE id=?"); $stmt->execute([$id]);
    if(!$stmt->fetch()) sendResponse(["success"=>false,"message"=>"Not found"],404);
    $db->beginTransaction();
    $db->prepare("DELETE FROM comments_resource WHERE resource_id=?")->execute([$id]);
    $db->prepare("DELETE FROM resources WHERE id=?")->execute([$id]);
    $db->commit();
    sendResponse(["success"=>true]);
}

// ---------- COMMENT FUNCTIONS ----------
function getComments($db,$resource_id){
    $stmt=$db->prepare("SELECT id,author,text,created_at FROM comments_resource WHERE resource_id=? ORDER BY created_at ASC");
    $stmt->execute([$resource_id]);
    sendResponse(["success"=>true,"data"=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function createComment($db,$data){
    if(!isLoggedIn())sendResponse(["success"=>false,"message"=>"Login required"],401);
    if(empty($data['resource_id'])||empty($data['text'])) sendResponse(["success"=>false,"message"=>"resource_id and text required"],400);
    $rid=intval($data['resource_id']); $author=$_SESSION['user_name']; $text=sanitize($data['text']);
    $stmt=$db->prepare("SELECT id FROM resources WHERE id=?");$stmt->execute([$rid]);if(!$stmt->fetch())sendResponse(["success"=>false,"message"=>"Resource not found"],404);
    $stmt=$db->prepare("INSERT INTO comments_resource (resource_id,author,text) VALUES (?,?,?)");$stmt->execute([$rid,$author,$text]);
    sendResponse(["success"=>true,"id"=>$db->lastInsertId()],201);
}

// ---------- ROUTING ----------
switch($method){
    case 'GET':
        if($action==='comments' && $resource_id)getComments($db,$resource_id);
        elseif($id)getResourceById($db,$id);
        else getAllResources($db);
        break;
    case 'POST':
        if($action==='comment')createComment($db,$input);
        else createResource($db,$input);
        break;
    case 'PUT': updateResource($db,$input); break;
    case 'DELETE': deleteResource($db,$id); break;
    default: sendResponse(["success"=>false,"message"=>"Method not allowed"],405);
}
?>
