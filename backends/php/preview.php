<?php
declare( strict_types = 1 );
require __DIR__ . '/vendor/autoload.php';

function fail( int $status, string $message ) : never {
	http_response_code( $status );
	header( 'Content-Type: text/plain; charset=utf-8' );
	exit( $message );
}
// The response is a fragment for the editor, never a page: opened directly, it can't run anything.
header( 'Content-Security-Policy: sandbox' );
header( 'X-Content-Type-Options: nosniff' );
if ( ( $_SERVER['REQUEST_METHOD'] ?? '' ) !== 'POST' ) {
	header( 'Allow: POST' );
	fail( 405, 'Send the Markdown with POST.' );
}
// Another site's page can't send text/markdown: a form can't, and fetch() would need CORS this endpoint never grants.
if ( ! str_starts_with( strtolower( $_SERVER['CONTENT_TYPE'] ?? '' ), 'text/markdown' ) ) {
	fail( 415, 'Send the Markdown as text/markdown.' );
}

// Raw HTML is escaped and unsafe links lose their href: the editor puts this output straight into the page.
$converter = new League\CommonMark\GithubFlavoredMarkdownConverter( [ 'html_input' => 'escape', 'allow_unsafe_links' => false, 'max_nesting_level' => 50 ] );
header( 'Content-Type: text/html; charset=utf-8' );
echo $converter->convert( file_get_contents( 'php://input' ) );
