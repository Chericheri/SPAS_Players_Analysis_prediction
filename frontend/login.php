<?php
session_start();
require 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['email']);
    $password = $_POST['password'];

    // Check for admin login
    if ($username === 'admin' && $password === 'admin_password') {
        $_SESSION['user_id'] = 0; // Special ID for admin
        $_SESSION['username'] = 'admin';
        $_SESSION['is_admin'] = true;
        header("Location: admin_dashboard.php");
        exit();
    }

    // Regular user login
    $stmt = $pdo->prepare("SELECT user_id, email, password_hash, firstname FROM users WHERE email = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['firstname'] = $user['firstname'];
        $_SESSION['is_admin'] = false;
        header("Location: index.html");
        exit();
    } else {
        $error = "Invalid username or password.";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <!-- style css -->
    <link rel="stylesheet" href="css/signin_n_login.css">
    <title>Login</title>
</head>
<body>
   
<form class="form" method="POST">
<h1><a href="Landing_page.html" ><i class='bx bx-user'></i> Home</a></h1>
  <div class="title">Welcome,<br><span>
    <?php 
    if (isset($_SESSION['firstname'])) {
        echo htmlspecialchars($_SESSION['firstname']);
    } elseif (isset($_POST['email'])) {
        // If login failed but email was entered, show "continue"
        echo 'continue';
    } else {
        // First visit to login page
        echo 'continue';
    }
    ?>
  </span></div>
  
  <?php if (isset($error)): ?>
    <div class="error"><?php echo htmlspecialchars($error); ?></div>
  <?php endif; ?>
  
  <input class="input" name="email" placeholder="Email" type="email" required value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>">
  <input class="input" name="password" placeholder="Password" type="password" required>
  
  <button class="button-confirm" type="submit">Let's go →</button>
  <p class="login-link">Dont have an account? <a href="signup.php">Sign up</a></p>
</form>
</body>
</html>