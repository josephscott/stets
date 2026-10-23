<?php
declare( strict_types = 1 );

function fail( int $status, string $message ) : never {
	http_response_code( $status );
	header( 'Content-Type: text/plain; charset=utf-8' );
	exit( $message );
}
$file = $_FILES['image'] ?? null;
// The size limit is PHP's: upload_max_filesize for the image, and post_max_size, a little larger, for the whole request.
if ( ( $file['error'] ?? null ) === UPLOAD_ERR_INI_SIZE || (int) ( $_SERVER['CONTENT_LENGTH'] ?? 0 ) > ini_parse_quantity( ini_get( 'post_max_size' ) ) ) {
	fail( 413, 'Images can be up to ' . round( ini_parse_quantity( ini_get( 'upload_max_filesize' ) ) / 1048576, 1 ) . ' MB.' );
}
// The type comes from the image's own bytes, never from its name. SVG is left out: it can carry scripts.
$types = [ 'image/png' => 'png', 'image/jpeg' => 'jpg', 'image/gif' => 'gif', 'image/webp' => 'webp' ];
$extension = ( $file['error'] ?? null ) === UPLOAD_ERR_OK ? $types[ getimagesize( $file['tmp_name'] )['mime'] ?? '' ] ?? null : null;
if ( $extension === null ) {
	fail( 415, 'Send a PNG, JPEG, GIF or WebP image as the "image" field.' );
}
// A random name: nobody can choose another upload's name, or guess one.
$name = bin2hex( random_bytes( 16 ) ) . ".$extension";
is_dir( __DIR__ . '/uploads' ) || mkdir( __DIR__ . '/uploads' );
move_uploaded_file( $file['tmp_name'], __DIR__ . "/uploads/$name" );
http_response_code( 201 );
header( 'Content-Type: application/json' );
echo json_encode( [ 'url' => dirname( $_SERVER['SCRIPT_NAME'] ) . "/uploads/$name" ] );
