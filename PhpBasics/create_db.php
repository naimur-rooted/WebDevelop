<?php
include "config.php";  // bring in the connection

// SQL command to create a database
$sql = "CREATE DATABASE student_db";

if (mysqli_query($conn, $sql)) {
    echo "Database created successfully";
} else {
    echo "Error creating database: " . mysqli_error($conn);
}
?>
