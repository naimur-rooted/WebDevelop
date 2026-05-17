<?php
include "dbconnect.php";

$sql = "SELECT * FROM Students";
$result = mysqli_query($conn, $sql);
?>

<h2>Student List</h2>
<a href="insert.php">Add New Student</a><br><br>

<table border="1" cellpadding="10">
    <tr>
        <th>ID</th><th>Name</th><th>Email</th><th>Department</th><th>Actions</th>
    </tr>
    <?php if (mysqli_num_rows($result) > 0) { ?>
        <?php while ($row = mysqli_fetch_assoc($result)) { ?>
        <tr>
            <td><?php echo $row['id']; ?></td>
            <td><?php echo $row['name']; ?></td>
            <td><?php echo $row['email']; ?></td>
            <td><?php echo $row['department']; ?></td>
            <td>
                <a href="edit.php?id=<?php echo $row['id']; ?>">Edit</a> |
                <a href="delete.php?id=<?php echo $row['id']; ?>">Delete</a>
            </td>
        </tr>
        <?php } ?>
    <?php } else { ?>
        <tr><td colspan="5">No records found</td></tr>
    <?php } ?>
</table>
