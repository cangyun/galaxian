<?php
/**
 * Created by PhpStorm.
 * User: pc
 * Date: 2018/3/11
 * Time: 13:38
 */
require_once 'PDOe.php';
header('Content-type: text/json');

$pdoe = new PDOe("mysql", "localhost", "galaxian", "root", "root");
$position = $_POST['position'];
$name = $_POST['name'];
$time = $_POST['time'];
$pdo = $pdoe->getPDO();

$pdoe->getResults("INSERT INTO record (position, name, time) VALUES ('{$position}', '{$name}', '{$time}')");

$data = $pdoe->getResults("SELECT POSITION, NAME, TIME from record");

//echo print_r($data);
echo json_encode($data);