(function () {
	'use strict';
	const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
	function insertText(textarea, text) {
		if (!document.execCommand?.('insertText', false, text)) {
			textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, 'end');
			textarea.dispatchEvent(new Event('input', { bubbles: true }));
		}
	}
	function enhance(textarea) {
		if (textarea.closest('.stets-editor')) {
			return;
		}
		const editor = document.createElement('div');
		editor.className = 'stets-editor';
		textarea.before(editor);
		editor.append(textarea);
		if (!textarea.labels.length && !textarea.hasAttribute('aria-label') && !textarea.hasAttribute('aria-labelledby')) {
			textarea.setAttribute('aria-label', 'Markdown editor');
		}
		textarea.addEventListener('keydown', event => {
			if ((isMac ? event.metaKey : event.ctrlKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'b') {
				event.preventDefault();
				const { selectionStart: start, selectionEnd: end } = textarea;
				insertText(textarea, '**' + textarea.value.slice(start, end) + '**');
				textarea.setSelectionRange(start + 2, end + 2);
			}
		});
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
