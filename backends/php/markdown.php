<?php
declare( strict_types = 1 );
require_once __DIR__ . '/vendor/autoload.php';

use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\GithubFlavoredMarkdownExtension;
use League\CommonMark\MarkdownConverter;
use Phiki\Adapters\CommonMark\PhikiExtension;
use Phiki\Theme\Theme;

// Markdown in, HTML fragment out. Use it for the preview and for showing saved comments, so both always match.
// Raw HTML is escaped and unsafe links lose their href, so the output can go straight into a page.
function stets_markdown_to_html( string $markdown ) : string {
	static $converter = null;
	if ( $converter === null ) {
		$environment = new Environment( [ 'html_input' => 'escape', 'allow_unsafe_links' => false, 'max_nesting_level' => 50 ] );
		$environment->addExtension( new CommonMarkCoreExtension() );
		$environment->addExtension( new GithubFlavoredMarkdownExtension() );
		// Code is dark by default: Phiki writes the first theme inline, so it shows even without stets.css.
		// Light and dark colors also come as CSS variables, so stets.css can switch between them.
		$environment->addExtension( new PhikiExtension( [ 'inline' => Theme::GithubDark, 'light' => Theme::GithubLight, 'dark' => Theme::GithubDark ] ) );
		$converter = new MarkdownConverter( $environment );
	}
	return (string) $converter->convert( $markdown );
}
