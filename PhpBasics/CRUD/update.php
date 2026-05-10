<?php
include "dbconnect.php";

if (isset($_POST['update'])) {
    $id        = $_POST['id'];
    $name      = $_POST['name'];
    $email     = $_POST['email'];
    $department= $_POST['department'];

    $sql = "UPDATE Students 
            SET name='$name', email='$email', department='$department' 
            WHERE id=$id";

    if (mysqli_query($conn, $sql)) {
        header("Location: index.php");
        exit;
    } else {
        echo "Error updating record: " . mysqli_error($conn);
    }
}
?>
