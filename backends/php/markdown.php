<?php
declare( strict_types = 1 );
require_once __DIR__ . '/vendor/autoload.php';

// Markdown in, HTML fragment out. Use it for the preview and for showing saved comments, so both always match.
// Raw HTML is escaped and unsafe links lose their href, so the output can go straight into a page.
function stets_markdown_to_html( string $markdown ) : string {
	static $converter = null;
	$converter ??= new League\CommonMark\GithubFlavoredMarkdownConverter( [ 'html_input' => 'escape', 'allow_unsafe_links' => false, 'max_nesting_level' => 50 ] );
	return (string) $converter->convert( $markdown );
}
