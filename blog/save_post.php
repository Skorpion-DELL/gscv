<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$db_file = 'posts.json';

// Initialize posts.json if it doesn't exist
if (!file_exists($db_file)) {
    file_put_contents($db_file, json_encode([]));
}

// Helper function to send JSON error
function send_error($message) {
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}

// Helper function to send JSON success
function send_success($data = []) {
    echo json_encode(array_merge(['success' => true], $data));
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. ADD NEW POST
if ($action === 'add_post' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = isset($_POST['title']) ? trim($_POST['title']) : '';
    $content = isset($_POST['content']) ? trim($_POST['content']) : '';
    
    if (empty($title) || empty($content)) {
        send_error('Titel und Inhalt dürfen nicht leer sein.');
    }
    
    $image_path = null;
    
    // Handle image upload
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = 'uploads/';
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }
        
        $file_tmp = $_FILES['image']['tmp_name'];
        $file_name = basename($_FILES['image']['name']);
        $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
        
        // Validate extension
        $allowed_exts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!in_array($file_ext, $allowed_exts)) {
            send_error('Ungültiges Bildformat. Erlaubt sind: JPG, JPEG, PNG, GIF, WEBP.');
        }
        
        // Validate mime type
        $mime_type = mime_content_type($file_tmp);
        if (strpos($mime_type, 'image/') !== 0) {
            send_error('Die hochgeladene Datei ist kein Bild.');
        }
        
        // Generate unique name
        $new_file_name = uniqid('img_', true) . '.' . $file_ext;
        $dest_path = $upload_dir . $new_file_name;
        
        if (move_uploaded_file($file_tmp, $dest_path)) {
            $image_path = $dest_path; // Relative path from blog directory
        } else {
            send_error('Fehler beim Speichern des Bildes auf dem Server.');
        }
    }
    
    // Read existing database
    $json_data = file_get_contents($db_file);
    $posts = json_decode($json_data, true);
    if (!is_array($posts)) {
        $posts = [];
    }
    
    // Create new post
    $new_post = [
        'id' => time(), // Unique ID using timestamp
        'title' => htmlspecialchars($title),
        'content' => nl2br(htmlspecialchars($content)),
        'image' => $image_path,
        'date' => date('d.m.Y, H:i'),
        'comments' => []
    ];
    
    // Prepend new post (newest first)
    array_unshift($posts, $new_post);
    
    // Save database
    if (file_put_contents($db_file, json_encode($posts, JSON_PRETTY_PRINT))) {
        send_success(['post' => $new_post]);
    } else {
        send_error('Fehler beim Schreiben in die posts.json Datei.');
    }
}

// 2. ADD NEW COMMENT
if ($action === 'add_comment' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Read raw JSON input
    $raw_input = file_get_contents('php://input');
    $data = json_decode($raw_input, true);
    
    if (!$data) {
        // Fallback to POST variables
        $data = $_POST;
    }
    
    $post_id = isset($data['postId']) ? (int)$data['postId'] : 0;
    $author = isset($data['author']) ? trim($data['author']) : '';
    $text = isset($data['text']) ? trim($data['text']) : '';
    
    if (empty($post_id) || empty($author) || empty($text)) {
        send_error('Ungültige Kommentar-Daten. Bitte füllen Sie alle Felder aus.');
    }
    
    // Read database
    $json_data = file_get_contents($db_file);
    $posts = json_decode($json_data, true);
    if (!is_array($posts)) {
        send_error('Datenbank konnte nicht gelesen werden.');
    }
    
    $found = false;
    $new_comment = [
        'author' => htmlspecialchars($author),
        'text' => nl2br(htmlspecialchars($text)),
        'date' => date('d.m.Y, H:i')
    ];
    
    foreach ($posts as &$post) {
        if ((int)$post['id'] === $post_id) {
            if (!isset($post['comments']) || !is_array($post['comments'])) {
                $post['comments'] = [];
            }
            $post['comments'][] = $new_comment;
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        send_error('Beitrag mit ID ' . $post_id . ' nicht gefunden.');
    }
    
    // Save database
    if (file_put_contents($db_file, json_encode($posts, JSON_PRETTY_PRINT))) {
        send_success(['comment' => $new_comment]);
    } else {
        send_error('Fehler beim Schreiben in die posts.json Datei.');
    }
}

// 3. EDIT POST
if ($action === 'edit_post' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $post_id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    $title = isset($_POST['title']) ? trim($_POST['title']) : '';
    $content = isset($_POST['content']) ? trim($_POST['content']) : '';
    $remove_image = isset($_POST['remove_image']) && $_POST['remove_image'] === 'true';

    if (empty($post_id)) {
        send_error('Post-ID fehlt.');
    }
    if (empty($title) || empty($content)) {
        send_error('Titel und Inhalt dürfen nicht leer sein.');
    }

    // Read database
    $json_data = file_get_contents($db_file);
    $posts = json_decode($json_data, true);
    if (!is_array($posts)) {
        send_error('Datenbank konnte nicht gelesen werden.');
    }

    $found_index = -1;
    for ($i = 0; $i < count($posts); $i++) {
        if ((int)$posts[$i]['id'] === $post_id) {
            $found_index = $i;
            break;
        }
    }

    if ($found_index === -1) {
        send_error('Beitrag nicht gefunden.');
    }

    $image_path = $posts[$found_index]['image'];

    // Handle new image upload
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        // Delete old image if exists
        if (!empty($image_path) && file_exists($image_path)) {
            unlink($image_path);
        }

        $upload_dir = 'uploads/';
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }

        $file_tmp = $_FILES['image']['tmp_name'];
        $file_name = basename($_FILES['image']['name']);
        $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

        // Validate extension
        $allowed_exts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!in_array($file_ext, $allowed_exts)) {
            send_error('Ungültiges Bildformat. Erlaubt sind: JPG, JPEG, PNG, GIF, WEBP.');
        }

        // Validate mime type
        $mime_type = mime_content_type($file_tmp);
        if (strpos($mime_type, 'image/') !== 0) {
            send_error('Die hochgeladene Datei ist kein Bild.');
        }

        // Generate unique name
        $new_file_name = uniqid('img_', true) . '.' . $file_ext;
        $dest_path = $upload_dir . $new_file_name;

        if (move_uploaded_file($file_tmp, $dest_path)) {
            $image_path = $dest_path;
        } else {
            send_error('Fehler beim Speichern des Bildes auf dem Server.');
        }
    } else if ($remove_image) {
        // Delete old image if requested to remove
        if (!empty($image_path) && file_exists($image_path)) {
            unlink($image_path);
        }
        $image_path = null;
    }

    // Update post fields
    $posts[$found_index]['title'] = htmlspecialchars($title);
    $posts[$found_index]['content'] = nl2br(htmlspecialchars($content));
    $posts[$found_index]['image'] = $image_path;

    // Save database
    if (file_put_contents($db_file, json_encode($posts, JSON_PRETTY_PRINT))) {
        send_success(['post' => $posts[$found_index]]);
    } else {
        send_error('Fehler beim Schreiben in die posts.json Datei.');
    }
}

// 4. DELETE POST
if ($action === 'delete_post' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Read raw JSON input
    $raw_input = file_get_contents('php://input');
    $data = json_decode($raw_input, true);
    if (!$data) {
        $data = $_POST;
    }

    $post_id = isset($data['id']) ? (int)$data['id'] : 0;

    if (empty($post_id)) {
        send_error('Post-ID fehlt.');
    }

    // Read database
    $json_data = file_get_contents($db_file);
    $posts = json_decode($json_data, true);
    if (!is_array($posts)) {
        send_error('Datenbank konnte nicht gelesen werden.');
    }

    $found_index = -1;
    for ($i = 0; $i < count($posts); $i++) {
        if ((int)$posts[$i]['id'] === $post_id) {
            $found_index = $i;
            break;
        }
    }

    if ($found_index === -1) {
        send_error('Beitrag nicht gefunden.');
    }

    // Delete associated image file if it exists
    $image_path = $posts[$found_index]['image'];
    if (!empty($image_path) && file_exists($image_path)) {
        unlink($image_path);
    }

    // Remove the post from the array
    array_splice($posts, $found_index, 1);

    // Save database
    if (file_put_contents($db_file, json_encode($posts, JSON_PRETTY_PRINT))) {
        send_success(['message' => 'Beitrag erfolgreich gelöscht.']);
    } else {
        send_error('Fehler beim Schreiben in die posts.json Datei.');
    }
}

// If no action matched or invalid request method
send_error('Ungültige Anfrage.');
?>

