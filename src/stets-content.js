// For pages that show rendered comments, the editor's preview among them.
(function () {
	'use strict';
	// A YouTube embed is a link to the video, showing its poster. Clicked, it becomes the player, playing at once.
	// None of the player loads before then, and youtube-nocookie.com sets no cookies until the video plays.
	document.addEventListener('click', event => {
		const link = event.target.closest?.('a.stets-youtube');
		const id = link && new URL(link.href).searchParams.get('v');
		// With a modifier key, the click opens the video in a new tab or window, as for any link.
		if (!/^[\w-]{11}$/.test(id) || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}
		event.preventDefault();
		const focused = document.activeElement === link;
		const player = Object.assign(document.createElement('iframe'), { className: 'stets-youtube', title: 'YouTube video', src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`, allow: 'autoplay; encrypted-media; fullscreen; picture-in-picture', referrerPolicy: 'strict-origin-when-cross-origin' });
		link.replaceWith(player);
		// The player takes the place of a link focused from the keyboard. A mouse click leaves focus where it was.
		if (focused) {
			player.focus();
		}
	});
	// Pressing the poster would focus it for a moment. In the editor's preview, that lights up the editor's border just before the player replaces it.
	document.addEventListener('mousedown', event => {
		if (event.button === 0 && event.target.closest?.('a.stets-youtube')) {
			event.preventDefault();
		}
	});
})();
