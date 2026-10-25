<?php
declare( strict_types = 1 );
// Markdown on stdin, HTML on stdout, for the shared Markdown tests. --raw-html turns on ::: html regions.
if ( PHP_SAPI !== 'cli' ) {
	http_response_code( 404 );
	exit;
}
require __DIR__ . '/markdown.php';
echo stets_markdown_to_html( stream_get_contents( STDIN ), in_array( '--raw-html', $argv, true ) );
