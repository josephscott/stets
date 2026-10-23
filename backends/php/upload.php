<?php
declare( strict_types = 1 );
// Never show errors: the editor shows this response to the person uploading. A crash is an empty 500.
ini_set( 'display_errors', '0' );

function fail( int $status, string $message ) : never {
	http_response_code( $status );
	header( 'Content-Type: text/plain; charset=utf-8' );
	exit( $message );
}
header( 'X-Content-Type-Options: nosniff' );
if ( ( $_SERVER['REQUEST_METHOD'] ?? '' ) !== 'POST' ) {
	header( 'Allow: POST' );
	fail( 405, 'Send the image with POST.' );
}
// Another site's form can send a multipart upload, but can't add a header, and its scripts would need CORS this endpoint never grants.
if ( ( $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '' ) !== 'stets' || ( $_SERVER['HTTP_SEC_FETCH_SITE'] ?? 'same-origin' ) !== 'same-origin' ) {
	fail( 403, 'Uploads are only accepted from this site.' );
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
	fail( 415, 'Only PNG, JPEG, GIF and WebP images are accepted.' );
}
// A random name: nobody can choose another upload's name, or guess one.
$name = bin2hex( random_bytes( 16 ) ) . ".$extension";
$saved = ( is_dir( __DIR__ . '/uploads' ) || mkdir( __DIR__ . '/uploads' ) ) && move_uploaded_file( $file['tmp_name'], __DIR__ . "/uploads/$name" );
if ( ! $saved ) {
	fail( 500, 'The image could not be saved.' );
}
http_response_code( 201 );
header( 'Content-Type: application/json' );
echo json_encode( [ 'url' => dirname( $_SERVER['SCRIPT_NAME'] ) . "/uploads/$name" ] );
