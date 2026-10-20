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
				let { selectionStart: start, selectionEnd: end, value } = textarea;
				while (start < end && /\s/.test(value[start])) {
					start++;
				}
				while (end > start && /\s/.test(value[end - 1])) {
					end--;
				}
				if (start >= 2 && value.slice(start - 2, start) === '**' && value.slice(end, end + 2) === '**') {
					start -= 2;
					end += 2;
				}
				const selected = value.slice(start, end);
				const wrapped = selected.length >= 4 && selected.startsWith('**') && selected.endsWith('**');
				textarea.setSelectionRange(start, end);
				insertText(textarea, wrapped ? selected.slice(2, -2) : '**' + selected + '**');
				textarea.setSelectionRange(start + (wrapped ? 0 : 2), end + (wrapped ? -4 : 2));
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
