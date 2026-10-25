<?php
declare( strict_types = 1 );

// For a link to a YouTube video, the video's poster linking to it; null for any other link.
// None of YouTube's player loads with it: stets-content.js swaps in the player on a click. Without it, the link opens YouTube.
function stets_youtube_embed( string $url ) : ?string {
	// The id is exactly 11 letters, digits, - or _, so it's safe in a URL or attribute as it is.
	if ( preg_match( '~^https?://(?:(?:www\.|m\.)?youtube\.com/(?:watch\?(?:[^#]*&)?v=|shorts/|embed/|live/)|youtu\.be/)([\w-]{11})(?![\w-])~', $url, $match ) !== 1 ) {
		return null;
	}
	return "<a class=\"stets-youtube\" href=\"https://www.youtube.com/watch?v=$match[1]\" aria-label=\"Play YouTube video\"><img src=\"https://i.ytimg.com/vi/$match[1]/hqdefault.jpg\" alt=\"\" width=\"480\" height=\"360\" loading=\"lazy\"></a>";
}
