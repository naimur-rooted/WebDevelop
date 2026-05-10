<?php
$ServerName = "localhost"; 
$UserName   = "root";       
$pass       = "";           

// Only server connection
$conn = mysqli_connect($ServerName, $UserName, $pass);

if (!$conn) {
    die("Connection Failed: " . mysqli_connect_error());
}else{
    echo"Server Connected";
}

