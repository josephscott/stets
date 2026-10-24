<?php
declare( strict_types = 1 );

use League\CommonMark\Node\Block\AbstractBlock;
use League\CommonMark\Parser\Block\BlockStart;
use League\CommonMark\Parser\Block\BlockStartParserInterface;
use League\CommonMark\Parser\Cursor;
use League\CommonMark\Parser\MarkdownParserStateInterface;

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
