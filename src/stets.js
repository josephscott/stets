(function () {
	'use strict';
	const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
	const tools = [
		{ name: 'bold', key: 'b', marker: '**', label: 'Bold' },
		{ name: 'italic', key: 'i', marker: '_', label: 'Italic' }
	];
	function insertText(textarea, text) {
		textarea.focus();
		if (!document.execCommand?.('insertText', false, text)) {
			textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, 'end');
			textarea.dispatchEvent(new Event('input', { bubbles: true }));
		}
	}
	function toggleInline(textarea, marker) {
		const len = marker.length;
		let { selectionStart: start, selectionEnd: end, value } = textarea;
		while (start < end && /\s/.test(value[start])) {
			start++;
		}
		while (end > start && /\s/.test(value[end - 1])) {
			end--;
		}
		if (start >= len && value.slice(start - len, start) === marker && value.slice(end, end + len) === marker) {
			start -= len;
			end += len;
		}
		const selected = value.slice(start, end);
		const wrapped = selected.length >= len * 2 && selected.startsWith(marker) && selected.endsWith(marker);
		textarea.setSelectionRange(start, end);
		insertText(textarea, wrapped ? selected.slice(len, -len) : marker + selected + marker);
		textarea.setSelectionRange(start + (wrapped ? 0 : len), end + (wrapped ? -2 * len : len));
	}
	function enhance(textarea) {
		if (textarea.closest('.stets-editor')) {
			return;
		}
		const editor = document.createElement('div');
		editor.className = 'stets-editor';
		textarea.before(editor);
		editor.append(textarea);
		const shortcut = isMac ? '\u2318' : 'Ctrl+';
		editor.insertAdjacentHTML('afterbegin', `<div class="stets-header">${tools.map(tool => `
			<button type="button" class="stets-tool" data-tool="${tool.name}" aria-label="${tool.label}" title="${tool.label} (${shortcut}${tool.key.toUpperCase()})"></button>`).join('')}</div>`);
		if (!textarea.labels.length && !textarea.hasAttribute('aria-label') && !textarea.hasAttribute('aria-labelledby')) {
			textarea.setAttribute('aria-label', 'Markdown editor');
		}
		textarea.addEventListener('keydown', event => {
			const tool = tools.find(t => t.key === event.key.toLowerCase());
			if ((isMac ? event.metaKey : event.ctrlKey) && !event.shiftKey && !event.altKey && tool) {
				event.preventDefault();
				toggleInline(textarea, tool.marker);
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
