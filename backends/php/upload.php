<?php
declare( strict_types = 1 );
// Never show errors: the editor shows this response to the person uploading. A crash is an empty 500.
ini_set( 'display_errors', '0' );

function fail( int $status, string $message ) : never {
	http_response_code( $status );
	header( 'Content-Type: text/plain; charset=utf-8' );
	exit( $message );
}
// Photos can say where they were taken, and screenshots what was on screen. Only the blocks that draw the picture are kept,
// so it looks just as it was sent: the same pixels, colors and animation.
function without_metadata( string $bytes, string $extension ) : string {
	if ( $extension === 'png' ) {
		// After its signature, a PNG is chunks: length, type, data and checksum.
		$kept = substr( $bytes, 0, 8 );
		for ( $at = 8; $at + 8 <= strlen( $bytes ); $at += 12 + $length ) {
			[ 'length' => $length, 'type' => $type ] = unpack( 'Nlength/a4type', $bytes, $at );
			if ( in_array( $type, [ 'IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'gAMA', 'cHRM', 'sRGB', 'iCCP', 'cICP', 'mDCv', 'cLLi', 'sBIT', 'pHYs', 'acTL', 'fcTL', 'fdAT' ], true ) ) {
				$kept .= substr( $bytes, $at, 12 + $length );
			}
		}
		return $kept;
	}
	if ( $extension === 'jpg' ) {
		// A JPEG is segments, each a marker and a length. Application segments and comments are metadata, except the color profile and
		// Adobe's color note. Everything after the end marker goes too: phones put more pictures, and even video, there.
		$kept = "\xFF\xD8";
		for ( $at = 2; $at + 4 <= strlen( $bytes ) && $bytes[ $at ] === "\xFF" && $bytes[ $at + 1 ] !== "\xD9"; $at = $end ) {
			[ 'marker' => $marker, 'length' => $length ] = unpack( 'Cmarker/nlength', $bytes, $at + 1 );
			$end = $at + 2 + $length;
			if ( $marker === 0xDA ) {
				// A scan's compressed data runs to the next marker: a 0xFF that isn't escaped (0xFF00) or a restart (0xFFD0 to 0xFFD7).
				$end = preg_match( '/\xFF(?=[^\x00\xD0-\xD7\xFF])/', $bytes, $next, PREG_OFFSET_CAPTURE, $end ) ? $next[0][1] : strlen( $bytes );
			}
			$label = substr( $bytes, $at + 4, 12 );
			if ( ( $marker & 0xF0 ) !== 0xE0 && $marker !== 0xFE || $marker === 0xE2 && $label === "ICC_PROFILE\0" || $marker === 0xEE && str_starts_with( $label, 'Adobe' ) ) {
				$kept .= substr( $bytes, $at, $end - $at );
			} elseif ( $marker === 0xE1 && str_starts_with( $label, "Exif\0\0" ) ) {
				// Phones often save a photo sideways and note which way is up. Only that note is kept, in a fresh EXIF block of its own.
				$tiff = substr( $bytes, $at + 10, $length - 8 );
				[ $short, $long ] = str_starts_with( $tiff, 'MM' ) ? [ 'n', 'N' ] : [ 'v', 'V' ];
				$ifd = strlen( $tiff ) >= 8 ? unpack( $long, $tiff, 4 )[1] : strlen( $tiff );
				$count = $ifd + 2 <= strlen( $tiff ) ? unpack( $short, $tiff, $ifd )[1] : 0;
				for ( $entry = $ifd + 2; $count-- > 0 && $entry + 12 <= strlen( $tiff ); $entry += 12 ) {
					[ 'tag' => $tag, 'value' => $value ] = unpack( "{$short}tag/x6/{$short}value", $tiff, $entry );
					if ( $tag === 0x0112 && $value >= 2 && $value <= 8 ) {
						$exif = pack( 'a6a4NnnnNnxxN', 'Exif', "MM\0*", 8, 1, 0x0112, 3, 1, $value, 0 );
						$kept .= "\xFF\xE1" . pack( 'n', strlen( $exif ) + 2 ) . $exif;
					}
				}
			}
		}
		return $kept . "\xFF\xD9";
	}
	if ( $extension === 'webp' ) {
		// After its 12-byte header, a WebP is chunks: type, little-endian length, and data padded to an even length.
		$kept = '';
		for ( $at = 12; $at + 8 <= strlen( $bytes ); $at += 8 + $length + $length % 2 ) {
			[ 'type' => $type, 'length' => $length ] = unpack( 'a4type/Vlength', $bytes, $at );
			if ( in_array( $type, [ 'VP8X', 'VP8 ', 'VP8L', 'ALPH', 'ANIM', 'ANMF', 'ICCP' ], true ) ) {
				$kept .= substr( $bytes, $at, 8 + $length + $length % 2 );
			}
		}
		// The extended header's flags say whether EXIF and XMP chunks follow. They no longer do.
		if ( str_starts_with( $kept, 'VP8X' ) ) {
			$kept[8] = chr( ord( $kept[8] ) & ~0x0C );
		}
		return 'RIFF' . pack( 'V', strlen( $kept ) + 4 ) . 'WEBP' . $kept;
	}
	return $bytes;
}
header( 'X-Content-Type-Options: nosniff' );
if ( ( $_SERVER['REQUEST_METHOD'] ?? '' ) !== 'POST' ) {
	header( 'Allow: POST' );
	fail( 405, 'Send the image with POST.' );
}
// Another site's form can send a multipart upload, but can't add a header, and its scripts would need CORS this endpoint never grants.
if ( ( $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '' ) !== 'stets' || ( $_SERVER['HTTP_SEC_FETCH_SITE'] ?? 'same-origin' ) !== 'same-origin' ) {
	fail( 403, 'Uploads are only accepted from this site.' );
}
$file = $_FILES['image'] ?? null;
// The size limit is PHP's: upload_max_filesize for the image, and post_max_size, a little larger, for the whole request.
if ( ( $file['error'] ?? null ) === UPLOAD_ERR_INI_SIZE || (int) ( $_SERVER['CONTENT_LENGTH'] ?? 0 ) > ini_parse_quantity( ini_get( 'post_max_size' ) ) ) {
	fail( 413, 'Images can be up to ' . round( ini_parse_quantity( ini_get( 'upload_max_filesize' ) ) / 1048576, 1 ) . ' MB.' );
}
// The type comes from the image's own bytes, never from its name. SVG is left out: it can carry scripts.
$types = [ 'image/png' => 'png', 'image/jpeg' => 'jpg', 'image/gif' => 'gif', 'image/webp' => 'webp' ];
$extension = ( $file['error'] ?? null ) === UPLOAD_ERR_OK ? $types[ getimagesize( $file['tmp_name'] )['mime'] ?? '' ] ?? null : null;
if ( $extension === null ) {
	fail( 415, 'Only PNG, JPEG, GIF and WebP images are accepted.' );
}
// A random name: nobody can choose another upload's name, or guess one.
$name = bin2hex( random_bytes( 16 ) ) . ".$extension";
$saved = ( is_dir( __DIR__ . '/uploads' ) || mkdir( __DIR__ . '/uploads' ) ) && file_put_contents( __DIR__ . "/uploads/$name", without_metadata( file_get_contents( $file['tmp_name'] ), $extension ) ) !== false;
if ( ! $saved ) {
	fail( 500, 'The image could not be saved.' );
}
http_response_code( 201 );
header( 'Content-Type: application/json' );
echo json_encode( [ 'url' => dirname( $_SERVER['SCRIPT_NAME'] ) . "/uploads/$name" ] );
