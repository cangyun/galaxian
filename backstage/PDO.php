<?php

/**
 * Created by PhpStorm.
 * User: pc
 * Date: 2018/3/1
 * Time: 17:15
 */
class PDOe
{
    private $PDO;
    private $err;

    function __construct($dbms, $host, $dbname, $user, $pass)
    {
        $dsn = $dbms . ":host=" . $host . ";dbname=" . $dbname;
        try {
            $this->PDO = new PDO($dsn, $user, $pass);
        } catch (PDOException $e) {
            $this->err = $e;
            echo $this->getError();
        }
    }

    public function getPDO()
    {
        return $this->PDO;
    }

    public function getResult($str)
    {
        $state = $this->PDO->prepare($str);
        $state->execute();
        return $state->fetch(PDO::FETCH_ASSOC);
    }

    public function getResults($str)
    {
        $state = $this->PDO->prepare($str);
        $state->execute();
        return $state->fetchAll(PDO::FETCH_COLUMN);
    }

    public function getError()
    {
        return $this->err;
    }
}