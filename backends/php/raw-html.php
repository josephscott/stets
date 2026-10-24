<?php
declare( strict_types = 1 );

use Dom\HTMLDocument;
use League\CommonMark\Node\Block\AbstractBlock;
use League\CommonMark\Node\Node;
use League\CommonMark\Parser\Block\AbstractBlockContinueParser;
use League\CommonMark\Parser\Block\BlockContinue;
use League\CommonMark\Parser\Block\BlockContinueParserInterface;
use League\CommonMark\Parser\Block\BlockStart;
use League\CommonMark\Parser\Block\BlockStartParserInterface;
use League\CommonMark\Parser\Cursor;
use League\CommonMark\Parser\MarkdownParserStateInterface;
use League\CommonMark\Renderer\ChildNodeRendererInterface;
use League\CommonMark\Renderer\NodeRendererInterface;

// A ::: html region: its HTML goes into the page as written, script and all, so it's only for writers trusted with the page.
final class StetsRawHtml extends AbstractBlock {
	public string $html = '';
}

// Fenced like ``` code: three or more colons, then html, and nothing else on the line.
final class StetsRawHtmlStartParser implements BlockStartParserInterface {
	public function tryStart( Cursor $cursor, MarkdownParserStateInterface $parserState ) : ?BlockStart {
		// Like an HTML block, it can't interrupt a paragraph, so no text that looks harmless without raw HTML hides a region.
		if ( $cursor->isIndented() || $cursor->getNextNonSpaceCharacter() !== ':' || $parserState->getActiveBlockParser()->canHaveLazyContinuationLines() ) {
			return BlockStart::none();
		}
		$fence = $cursor->matchInPlace( '/\G[ \t]*:{3,}[ \t]*html[ \t]*$/i' );
		return $fence === null ? BlockStart::none() : BlockStart::of( new StetsRawHtmlParser( strspn( ltrim( $fence ), ':' ) ) )->at( $cursor );
	}
}

// Runs to a closing fence at least as long as the opening one. Without one, it runs to the end of its list item, quote or comment, like a code block.
final class StetsRawHtmlParser extends AbstractBlockContinueParser {
	private StetsRawHtml $block;
	private array $lines = [];

	public function __construct( private int $fence ) {
		$this->block = new StetsRawHtml();
	}

	public function getBlock() : StetsRawHtml {
		return $this->block;
	}

	public function tryContinue( Cursor $cursor, BlockContinueParserInterface $activeBlockParser ) : ?BlockContinue {
		$closing = ! $cursor->isIndented() && preg_match( '/^[ \t]*(:{3,})[ \t]*$/', $cursor->getRemainder(), $match ) === 1 && strlen( $match[1] ) >= $this->fence;
		return $closing ? BlockContinue::finished() : BlockContinue::at( $cursor );
	}

	public function addLine( string $line ) : void {
		$this->lines[] = $line;
	}

	// The first line is what followed the opening fence: nothing. The rest are parsed and written back out the way a browser
	// reads them, so a mistake, such as an unclosed comment or a quote left open, ends with the region instead of swallowing the comments after it.
	public function closeBlock() : void {
		$region = HTMLDocument::createEmpty()->createElement( 'div' );
		$region->innerHTML = implode( "\n", array_slice( $this->lines, 1 ) );
		// Two elements a page reads differently: <plaintext> never ends there, and where scripts run, <noscript> holds text.
		foreach ( $region->querySelectorAll( 'plaintext, noscript' ) as $element ) {
			$element->remove();
		}
		$this->block->html = $region->innerHTML;
	}
}

// The region's HTML, which its parser already balanced.
final class StetsRawHtmlRenderer implements NodeRendererInterface {
	public function render( Node $node, ChildNodeRendererInterface $childRenderer ) : string {
		return $node->html;
	}
}
