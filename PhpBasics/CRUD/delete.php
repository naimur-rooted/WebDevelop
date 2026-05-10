<?php
include "dbconnect.php";

if (isset($_GET['id'])) {
    $id = $_GET['id'];

    $sql = "DELETE FROM Students WHERE id=$id";

    if (mysqli_query($conn, $sql)) {
        header("Location: index.php");
        echo"Deleted Successfully";
        exit;
    } else {
        echo "Error deleting record: " . mysqli_error($conn);
        echo "<script>alert('Deleted Successfully'); window.location='index.php';</script>";
    }
}
?>
