(function () {
	'use strict';
	function enhance(textarea) {
		const editor = document.createElement('div');
		editor.className = 'stets-editor';
		textarea.before(editor);
		editor.append(textarea);
	}
	function init() {
		document.querySelectorAll('textarea[data-stets]').forEach(enhance);
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
	window.stets = { enhance };
})();
