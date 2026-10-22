<?php
declare( strict_types = 1 );
require_once __DIR__ . '/vendor/autoload.php';

use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\CommonMark\Node\Block\FencedCode;
use League\CommonMark\Extension\GithubFlavoredMarkdownExtension;
use League\CommonMark\MarkdownConverter;
use Phiki\Adapters\CommonMark\CodeBlockRenderer;
use Phiki\Grammar\Grammar;
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
		$environment->addRenderer( FencedCode::class, new class( [ 'inline' => Theme::GithubDark, 'light' => Theme::GithubLight, 'dark' => Theme::GithubDark ] ) extends CodeBlockRenderer {
			// Phiki's own detection crashes on a language with no letters, such as ```123, failing the whole preview.
			protected function detectGrammar( FencedCode $node ) : Grammar|string {
				return preg_match( '/[a-z]/i', $node->getInfoWords()[0] ?? '' ) === 1 ? parent::detectGrammar( $node ) : Grammar::Txt;
			}
		}, 10 );
		$converter = new MarkdownConverter( $environment );
	}
	return (string) $converter->convert( $markdown );
}
