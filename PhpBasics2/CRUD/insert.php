<?php
include "dbconnect.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name       = $_POST['name'];
    $email      = $_POST['email'];
    $department = $_POST['department'];

    $sql = "INSERT INTO Students (name, email, department)
            VALUES ('$name', '$email', '$department')";

    if (mysqli_query($conn, $sql)) {
        header("Location: index.php");
        exit;
    } else {
        echo "Error: " . mysqli_error($conn);
    }
}
?>

<h2>Add Student</h2>
<form method="POST" action="">
    Name: <input type="text" name="name" required><br><br>
    Email: <input type="email" name="email" required><br><br>
    Department: <input type="text" name="department" required><br><br>
    <input type="submit" value="Add Student">
</form>
