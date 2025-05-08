<?php
session_start();
require 'db_connect.php';

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $firstname = trim($_POST['firstname']);
    $lastname = trim($_POST['lastname']);
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];

    // Validate inputs
    if (empty($firstname) || empty($lastname) || empty($email) || empty($password)) {
        $error = "All fields are required.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = "Invalid email format.";
    } elseif ($password !== $confirm_password) {
        $error = "Passwords do not match.";
    } elseif (strlen($password) < 8) {
        $error = "Password must be at least 8 characters long.";
    } else {
        try {
            // Check if email already exists
            $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            
            if ($stmt->rowCount() > 0) {
                $error = "Email already exists.";
            } else {
                // Hash password
                $password_hash = password_hash($password, PASSWORD_DEFAULT);
                
                // Insert new user
                $stmt = $pdo->prepare("INSERT INTO users (firstname, lastname, email, password_hash) VALUES (?, ?, ?, ?)");
                if ($stmt->execute([$firstname, $lastname, $email, $password_hash])) {
                    $_SESSION['firstname'] = $firstname;
                    $success = "Registration successful! Redirecting to login...";
                    header("Refresh: 2; url=login.php");
                } else {
                    $error = "Registration failed. Please try again.";
                }
            }
        } catch (PDOException $e) {
            $error = "Database error: " . $e->getMessage();
        }
    }
}
?>


<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="css/signin_n_login.css">
    <title>Sign Up</title>
</head>
<body>
<form class="form" method="POST">
    <p class="title">Register</p>
    <p class="message">Signup now and get full access.</p>
    
    <?php if ($error): ?>
        <div class="error"><?php echo htmlspecialchars($error); ?></div>
    <?php endif; ?>
    
    <?php if ($success): ?>
        <div class="success"><?php echo htmlspecialchars($success); ?></div>
    <?php endif; ?>
    
    <div class="flex">
        <label>
            <input required name="firstname" placeholder="" type="text" class="input" 
                   value="<?php echo isset($_POST['firstname']) ? htmlspecialchars($_POST['firstname']) : ''; ?>">
            <span>Firstname</span>
        </label>

        <label>
            <input required name="lastname" placeholder="" type="text" class="input"
                   value="<?php echo isset($_POST['lastname']) ? htmlspecialchars($_POST['lastname']) : ''; ?>">
            <span>Lastname</span>
        </label>
    </div>  
            
    <label>
        <input required name="email" placeholder="" type="email" class="input"
               value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>">
        <span>Email</span>
    </label> 
        
    <label>
        <input required name="password" placeholder="" type="password" class="input">
        <span>Password</span>
    </label>
    <label>
        <input required name="confirm_password" placeholder="" type="password" class="input">
        <span>Confirm password</span>
    </label>
    <button class="submit" type="submit">Submit</button>
    <p class="login-link">Already have an account? <a href="login.php">Sign in</a></p>
</form>
</body>
</html>