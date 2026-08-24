<?php
/**
 * Projekt Traum Blog API
 * Handles adding/editing/deleting posts, comments, and likes in posts.json
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db_file = __DIR__ . '/posts.json';

function send_json($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function send_error($msg, $status = 400) {
    send_json(['success' => false, 'error' => $msg], $status);
}

function send_success($data = []) {
    send_json(array_merge(['success' => true], $data), 200);
}

function load_posts($db_file) {
    if (!file_exists($db_file)) {
        return [];
    }
    $content = file_get_contents($db_file);
    $posts = json_decode($content, true);
    return is_array($posts) ? $posts : [];
}

function save_posts($db_file, $posts) {
    return file_put_contents($db_file, json_encode($posts, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) !== false;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. GET ALL POSTS
if ($action === 'get_posts' || ($_SERVER['REQUEST_METHOD'] === 'GET' && empty($action))) {
    $posts = load_posts($db_file);
    send_success(['posts' => $posts]);
}

// 2. ADD NEW POST
if ($action === 'add_post' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $data = json_decode($raw_input, true);
    if (!$data) {
        $data = $_POST;
    }

    $author = isset($data['author']) ? trim($data['author']) : 'Anonymer Gast';
    $title = isset($data['title']) ? trim($data['title']) : 'Blogbeitrag';
    $content = isset($data['content']) ? trim($data['content']) : '';

    if (empty($content)) {
        send_error('Inhalt darf nicht leer sein.');
    }

    $posts = load_posts($db_file);

    $new_post = [
        'id' => round(microtime(true) * 1000), // Unique millisecond timestamp ID
        'title' => htmlspecialchars($title, ENT_QUOTES, 'UTF-8'),
        'author' => htmlspecialchars($author, ENT_QUOTES, 'UTF-8'),
        'content' => nl2br(htmlspecialchars($content, ENT_QUOTES, 'UTF-8')),
        'image' => null,
        'date' => date('d.m.Y, H:i'),
        'likes' => 0,
        'comments' => []
    ];

    // Prepend new post (newest first)
    array_unshift($posts, $new_post);

    if (save_posts($db_file, $posts)) {
        send_success(['post' => $new_post]);
    } else {
        send_error('Fehler beim Speichern in posts.json');
    }
}

// 3. TOGGLE LIKE
if ($action === 'like_post' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $data = json_decode($raw_input, true);
    if (!$data) $data = $_POST;

    $post_id = isset($data['id']) ? (float)$data['id'] : 0;
    $change = isset($data['change']) ? (int)$data['change'] : 1; // +1 or -1

    if (empty($post_id)) {
        send_error('Post ID fehlt.');
    }

    $posts = load_posts($db_file);
    $found = false;
    $new_likes = 0;

    foreach ($posts as &$post) {
        if ((float)$post['id'] === $post_id) {
            if (!isset($post['likes'])) $post['likes'] = 0;
            $post['likes'] = max(0, $post['likes'] + $change);
            $new_likes = $post['likes'];
            $found = true;
            break;
        }
    }

    if (!$found) {
        send_error('Beitrag nicht gefunden.');
    }

    if (save_posts($db_file, $posts)) {
        send_success(['likes' => $new_likes]);
    } else {
        send_error('Fehler beim Speichern.');
    }
}

// 4. ADD COMMENT TO POST
if ($action === 'add_comment' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $data = json_decode($raw_input, true);
    if (!$data) $data = $_POST;

    $post_id = isset($data['postId']) ? (float)$data['postId'] : 0;
    $author = isset($data['author']) ? trim($data['author']) : 'Gast';
    $text = isset($data['text']) ? trim($data['text']) : '';

    if (empty($post_id) || empty($text)) {
        send_error('Ungültige Kommentar-Daten. Text ist erforderlich.');
    }

    $posts = load_posts($db_file);
    $found = false;
    $new_comment = [
        'id' => round(microtime(true) * 1000),
        'author' => htmlspecialchars($author, ENT_QUOTES, 'UTF-8'),
        'text' => nl2br(htmlspecialchars($text, ENT_QUOTES, 'UTF-8')),
        'date' => date('d.m.Y, H:i')
    ];

    foreach ($posts as &$post) {
        if ((float)$post['id'] === $post_id) {
            if (!isset($post['comments']) || !is_array($post['comments'])) {
                $post['comments'] = [];
            }
            $post['comments'][] = $new_comment;
            $found = true;
            break;
        }
    }

    if (!$found) {
        send_error('Beitrag nicht gefunden.');
    }

    if (save_posts($db_file, $posts)) {
        send_success(['comment' => $new_comment]);
    } else {
        send_error('Fehler beim Speichern des Kommentars.');
    }
}

// 5. DELETE POST
if ($action === 'delete_post' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $data = json_decode($raw_input, true);
    if (!$data) $data = $_POST;

    $post_id = isset($data['id']) ? (float)$data['id'] : 0;
    if (empty($post_id)) {
        send_error('Post ID fehlt.');
    }

    $posts = load_posts($db_file);
    $found_index = -1;

    for ($i = 0; $i < count($posts); $i++) {
        if ((float)$posts[$i]['id'] === $post_id) {
            $found_index = $i;
            break;
        }
    }

    if ($found_index === -1) {
        send_error('Beitrag nicht gefunden.');
    }

    array_splice($posts, $found_index, 1);

    if (save_posts($db_file, $posts)) {
        send_success(['message' => 'Beitrag gelöscht.']);
    } else {
        send_error('Fehler beim Speichern.');
    }
}

send_error('Ungültige Aktion.');
?>
