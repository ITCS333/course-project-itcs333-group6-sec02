<?php
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unauthorized Access</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css">

    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #9104ad, #c86dd7);
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        .box {
            background: #fff;
            padding: 40px;
            text-align: center;
            width: 360px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-radius: 14px;
        }

        h1 {
            color: #c0392b;
            font-size: 28px;
            margin-bottom: 10px;
        }

        p {
            color: #555;
            font-size: 16px;
            margin-bottom: 25px;
        }

        a.btn {
            background-color: #9104ad;
            color: white;
            padding: 12px 20px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            display: inline-block;
            transition: 0.3s;
        }

        a.btn:hover {
            background-color: #720287;
        }

        .icon {
            font-size: 50px;
            color: #c0392b;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>

    <div class="box">
        <i class="fa-solid fa-ban icon"></i>
        <h1>Unauthorized Access</h1>
        <p>You do not have permission to view this page.</p>

        <a href="/index.html" class="btn">Return Home</a>
    </div>

</body>
</html>
