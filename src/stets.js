(function () {
	'use strict';
	function enhance(textarea) {
		const editor = document.createElement('div');
		editor.className = 'stets-editor';
		textarea.before(editor);
		editor.append(textarea);
	}
	window.stets = { enhance };
})();
