<?php
declare( strict_types = 1 );
require_once __DIR__ . '/vendor/autoload.php';

use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\CommonMark\Node\Block\FencedCode;
use League\CommonMark\Extension\Footnote\FootnoteExtension;
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
		$environment = new Environment( [ 'html_input' => 'escape', 'allow_unsafe_links' => false, 'max_nesting_level' => 50, 'footnote' => [ 'container_add_hr' => false, 'enable_inline_footnotes' => false ] ] );
		$environment->addExtension( new CommonMarkCoreExtension() );
		$environment->addExtension( new GithubFlavoredMarkdownExtension() );
		$environment->addExtension( new FootnoteExtension() );
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
	// Footnote ids get a random part, so two comments on one page, or a comment and its preview, never share them.
	// Links written as #fn:1 follow along. Text can't look like these attributes: its quotes come out as &quot;.
	$id = bin2hex( random_bytes( 4 ) );
	return strtr( (string) $converter->convert( $markdown ), [ 'id="fn:' => "id=\"fn-$id-", 'href="#fn:' => "href=\"#fn-$id-", 'id="fnref:' => "id=\"fnref-$id-", 'href="#fnref:' => "href=\"#fnref-$id-" ] );
}
