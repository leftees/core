<?php
	date_default_timezone_set('Europe/Rome');
	
	$now = date("Y/m/d h:i:s") ;
	$hello = "Hello from service.php at ";

	echo $hello.$now;
?>