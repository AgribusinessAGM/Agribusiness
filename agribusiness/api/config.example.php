<?php
// Configuración de la Plataforma AGRIBUSINESS.
//
// Estos son los valores por defecto, pensados para XAMPP en local (usuario
// "root" sin contraseña). Para cambiar algo, copia este archivo como
// "config.php" en esta misma carpeta y edita solo lo que necesites: los
// valores de config.php sustituyen a los de aquí. config.php no se sube a git.

return [
    // ---------- Base de datos MySQL / MariaDB ----------
    'db_host' => '127.0.0.1',
    'db_port' => 3306,
    'db_name' => 'agribusiness',
    'db_user' => 'root',
    'db_pass' => '',
    // En local (XAMPP) la base de datos se crea sola si no existe. En Plesk
    // créala desde el panel y pon aquí su nombre, usuario y contraseña.
    'db_autocreate' => true,

    // ---------- Primer administrador ----------
    // Mientras no haya ninguna cuenta, se crea un administrador con este correo.
    // Entra pidiendo "He olvidado mi contraseña" en el login (necesita SMTP).
    'admin_email' => '',

    // Solo en local: crea los usuarios de ejemplo (contraseña "agromillora2026",
    // ver README) al crear la base de datos. En producción, siempre false.
    'demo_users' => false,

    // ---------- URL pública de la app ----------
    // Se usa para construir el enlace "crea tu contraseña" de las invitaciones.
    // Debe apuntar a la carpeta donde está index.html, sin barra final.
    'app_url' => 'http://localhost/Agribusiness/agribusiness',

    // ---------- Correo de acceso (SMTP, ej. Microsoft 365) ----------
    // Las contraseñas solo las crea y cambia cada persona, con enlaces de un solo uso
    // que llegan por correo (alta y "He olvidado mi contraseña"). Sin smtp_user/smtp_pass
    // no se puede dar de alta a nadie ni recuperar contraseñas.
    'smtp_host' => 'smtp.office365.com',
    'smtp_port' => 587,
    'smtp_user' => '',
    'smtp_pass' => '', // contraseña de APLICACIÓN, no la normal de la cuenta
    'from_email' => '', // por defecto, el mismo que smtp_user

    // Solo para pruebas en local, sin correo: muestra el enlace en pantalla al
    // administrador. En producción debe quedarse en false.
    'dev_show_links' => false,
];
