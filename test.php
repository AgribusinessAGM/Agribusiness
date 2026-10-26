<?php
// Prueba mínima del servidor: versión de PHP y extensiones que necesita la app
header('Content-Type: text/plain; charset=utf-8');
echo "PHP: OK\n";
echo 'Versión: ' . PHP_VERSION . (version_compare(PHP_VERSION, '8.0.0', '>=') ? " (vale)\n" : " (necesita 8.0 o más)\n");
echo 'pdo_mysql: ' . (extension_loaded('pdo_mysql') ? 'sí' : 'NO') . "\n";
echo 'Servidor: ' . ($_SERVER['SERVER_SOFTWARE'] ?? '?') . "\n";
echo 'Interfaz: ' . PHP_SAPI . "\n";
