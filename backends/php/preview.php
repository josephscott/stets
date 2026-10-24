<?php
declare( strict_types = 1 );
// Never show errors: the editor puts this response straight into the page. A crash is an empty 500.
ini_set( 'display_errors', '0' );
require __DIR__ . '/markdown.php';
// With this true, ::: html regions go into the preview as written, script and all. Turn it on only for writers
// trusted with the page, by asking your site's sign-in, and render their saved comments the same way.
$raw_html = false;

function fail( int $status, string $message ) : never {
	http_response_code( $status );
	header( 'Content-Type: text/plain; charset=utf-8' );
	exit( $message );
}
// The response is a fragment for the editor, never a page: opened directly, it can't run anything, and no page can frame it.
// X-Frame-Options says the same to browsers too old for frame-ancestors.
header( "Content-Security-Policy: sandbox; frame-ancestors 'none'" );
header( 'X-Frame-Options: DENY' );
header( 'X-Content-Type-Options: nosniff' );
if ( ( $_SERVER['REQUEST_METHOD'] ?? '' ) !== 'POST' ) {
	header( 'Allow: POST' );
	fail( 405, 'Send the Markdown with POST.' );
}
// Another site's page can't send text/markdown: a form can't, and fetch() would need CORS this endpoint never grants.
if ( ! str_starts_with( strtolower( $_SERVER['CONTENT_TYPE'] ?? '' ), 'text/markdown' ) ) {
	fail( 415, 'Send the Markdown as text/markdown.' );
}
// Browsers say where a request came from; old browsers and non-browser clients don't, and are let through.
if ( ( $_SERVER['HTTP_SEC_FETCH_SITE'] ?? 'same-origin' ) !== 'same-origin' ) {
	fail( 403, 'Preview is only available from this site.' );
}
// Rendering is CPU and memory heavy, so cap the input. Read one byte past the cap to notice when it's over.
const MAX_BYTES = 1024 * 1024;
$markdown = file_get_contents( 'php://input', false, null, 0, MAX_BYTES + 1 );
if ( strlen( $markdown ) > MAX_BYTES || (int) ( $_SERVER['CONTENT_LENGTH'] ?? 0 ) > MAX_BYTES ) {
	fail( 413, 'The Markdown is too large to preview.' );
}

header( 'Content-Type: text/html; charset=utf-8' );
echo stets_markdown_to_html( $markdown, $raw_html );
