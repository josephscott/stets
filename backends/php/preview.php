<?php
declare( strict_types = 1 );
require __DIR__ . '/vendor/autoload.php';

// Raw HTML is escaped and unsafe links lose their href: the editor puts this output straight into the page.
$converter = new League\CommonMark\GithubFlavoredMarkdownConverter( [ 'html_input' => 'escape', 'allow_unsafe_links' => false, 'max_nesting_level' => 50 ] );
header( 'Content-Type: text/html; charset=utf-8' );
echo $converter->convert( file_get_contents( 'php://input' ) );
