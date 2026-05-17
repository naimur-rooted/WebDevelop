<?php
include "dbconnect.php";

// Get the student ID from the URL
$id = $_GET['id'];

// Fetch the student record
$sql = "SELECT * FROM Students WHERE id=$id";
$result = mysqli_query($conn, $sql);
$row = mysqli_fetch_assoc($result);
?>

<!DOCTYPE html>
<html>
<head>
    <title>Edit Student</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h2>Edit Student</h2>
    <form method="POST" action="update.php">
        <input type="hidden" name="id" value="<?php echo $row['id']; ?>">

        Name: <input type="text" name="name" value="<?php echo $row['name']; ?>" required><br><br>
        Email: <input type="email" name="email" value="<?php echo $row['email']; ?>" required><br><br>
        Department: <input type="text" name="department" value="<?php echo $row['department']; ?>" required><br><br>

        <input type="submit" name="update" value="Update Student">
    </form>
</body>
</html>
