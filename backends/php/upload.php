<?php
declare( strict_types = 1 );

// The type comes from the image's own bytes, never from its name. SVG is left out: it can carry scripts.
$types = [ 'image/png' => 'png', 'image/jpeg' => 'jpg', 'image/gif' => 'gif', 'image/webp' => 'webp' ];
$file = $_FILES['image'] ?? null;
$extension = ( $file['error'] ?? null ) === UPLOAD_ERR_OK ? $types[ getimagesize( $file['tmp_name'] )['mime'] ?? '' ] ?? null : null;
if ( $extension === null ) {
	http_response_code( 415 );
	header( 'Content-Type: text/plain; charset=utf-8' );
	exit( 'Send a PNG, JPEG, GIF or WebP image as the "image" field.' );
}
// A random name: nobody can choose another upload's name, or guess one.
$name = bin2hex( random_bytes( 16 ) ) . ".$extension";
is_dir( __DIR__ . '/uploads' ) || mkdir( __DIR__ . '/uploads' );
move_uploaded_file( $file['tmp_name'], __DIR__ . "/uploads/$name" );
http_response_code( 201 );
header( 'Content-Type: application/json' );
echo json_encode( [ 'url' => dirname( $_SERVER['SCRIPT_NAME'] ) . "/uploads/$name" ] );
