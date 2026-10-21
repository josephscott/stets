(function () {
	'use strict';
	const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
	const list = /^([-*+] \[[ xX]\] |[-*+] |\d+[.)] )/;
	const table = '| Column | Column |\n| ------ | ------ |\n| Cell   | Cell   |';
	const tools = [
		{ name: 'heading', key: 'h', shift: true, label: 'Heading', action: textarea => toggleLines(textarea, '### ', /^### /, /^#{1,6} /) },
		{ name: 'bold', key: 'b', label: 'Bold', action: textarea => toggleInline(textarea, '**') },
		{ name: 'italic', key: 'i', label: 'Italic', action: textarea => toggleInline(textarea, '_') },
		{ name: 'strikethrough', key: 'x', shift: true, label: 'Strikethrough', action: textarea => toggleInline(textarea, '~~') },
		{ name: 'quote', startsGroup: true, key: '.', code: 'Period', shift: true, label: 'Quote', action: textarea => toggleLines(textarea, '> ', /^> /) },
		{ name: 'code', key: 'e', label: 'Code', action: textarea => toggleInline(textarea, '`') },
		{ name: 'link', key: 'k', label: 'Link', action: insertLink },
		{ name: 'bulleted-list', startsGroup: true, key: '8', code: 'Digit8', shift: true, label: 'Bulleted list', action: textarea => toggleLines(textarea, '- ', /^[-*+] (?!\[[ xX]\] )/, list) },
		{ name: 'numbered-list', key: '7', code: 'Digit7', shift: true, label: 'Numbered list', action: textarea => toggleLines(textarea, n => `${n}. `, /^\d+[.)] /, list) },
		{ name: 'task-list', key: 'l', shift: true, label: 'Task list', action: textarea => toggleLines(textarea, '- [ ] ', /^[-*+] \[[ xX]\] /, list) },
		{ name: 'table', startsGroup: true, label: 'Table', action: textarea => insertBlock(textarea, table, 2, 8) }
	];
	const menuItems = [
		{ label: 'Horizontal rule', syntax: '---', action: textarea => insertBlock(textarea, '---') },
		{ label: 'Code block', syntax: '```', action: insertCodeBlock },
		{ label: 'Mention', syntax: '@', mentions: true, action: insertMention }
	];
	function shortcutHint(tool) {
		const key = tool.key.toUpperCase();
		return isMac ? (tool.shift ? '\u21e7' : '') + '\u2318' + key : 'Ctrl+' + (tool.shift ? 'Shift+' : '') + key;
	}
	function insertText(textarea, text) {
		// Replace only the part that changes: browsers edit large documents much faster that way.
		let { selectionStart: start, selectionEnd: end, value } = textarea;
		let from = 0, to = text.length;
		while (start < end && from < to && value[start] === text[from]) {
			start++;
			from++;
		}
		while (end > start && to > from && value[end - 1] === text[to - 1]) {
			end--;
			to--;
		}
		text = text.slice(from, to);
		textarea.focus();
		textarea.setSelectionRange(start, end);
		if (!document.execCommand?.('insertText', false, text)) {
			textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, 'end');
			textarea.dispatchEvent(new Event('input', { bubbles: true }));
		}
	}
	function trimmedSelection(textarea) {
		let { selectionStart: start, selectionEnd: end, value } = textarea;
		while (start < end && /\s/.test(value[start])) {
			start++;
		}
		while (end > start && /\s/.test(value[end - 1])) {
			end--;
		}
		return { start, end, value };
	}
	function toggleInline(textarea, marker) {
		const len = marker.length;
		let { start, end, value } = trimmedSelection(textarea);
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
	function insertLink(textarea) {
		const { start, end, value } = trimmedSelection(textarea);
		const selected = value.slice(start, end);
		const url = /^https?:\/\/\S+$/i.test(selected) ? selected : '';
		const text = url ? '' : selected;
		textarea.setSelectionRange(start, end);
		insertText(textarea, `[${text || 'text'}](${url || 'url'})`);
		const from = text ? start + text.length + 3 : start + 1;
		textarea.setSelectionRange(from, from + (text ? 3 : 4));
	}
	function insertBlock(textarea, block, from = block.length + 2, to = from) {
		const start = textarea.selectionEnd;
		const before = textarea.value.slice(0, start);
		const after = textarea.value.slice(start);
		const prefix = !before || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
		const suffix = after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n';
		textarea.setSelectionRange(start, start);
		insertText(textarea, prefix + block + suffix);
		textarea.setSelectionRange(start + prefix.length + from, start + prefix.length + to);
	}
	function belowCaret(textarea, index) {
		const style = getComputedStyle(textarea);
		const mirror = document.body.appendChild(document.createElement('div'));
		Object.assign(mirror.style, { position: 'absolute', visibility: 'hidden', boxSizing: 'border-box', width: `${textarea.clientWidth}px`, font: style.font, padding: style.padding, letterSpacing: style.letterSpacing, whiteSpace: 'pre-wrap', overflowWrap: 'break-word' });
		mirror.textContent = textarea.value.slice(0, index);
		const marker = mirror.appendChild(document.createElement('span'));
		marker.textContent = '@';
		const rect = textarea.getBoundingClientRect();
		const left = rect.left + scrollX + textarea.clientLeft + marker.offsetLeft - textarea.scrollLeft;
		const top = rect.top + scrollY + textarea.clientTop + marker.offsetTop + marker.offsetHeight - textarea.scrollTop + 4;
		mirror.remove();
		return { left: `${left}px`, top: `${top}px` };
	}
	function selectedLines(textarea) {
		const { selectionStart, selectionEnd, value } = textarea;
		const start = value.slice(0, selectionStart).lastIndexOf('\n') + 1;
		const last = selectionEnd > selectionStart && value[selectionEnd - 1] === '\n' ? selectionEnd - 1 : selectionEnd;
		const newline = value.indexOf('\n', last);
		return { start, end: newline === -1 ? value.length : newline };
	}
	function insertMention(textarea) {
		const end = textarea.selectionEnd;
		textarea.setSelectionRange(end, end);
		insertText(textarea, (end && !/\s/.test(textarea.value[end - 1]) ? ' ' : '') + '@');
	}
	function insertCodeBlock(textarea) {
		const { start, end } = selectedLines(textarea);
		const lines = textarea.value.slice(start, end);
		textarea.setSelectionRange(start, end);
		insertText(textarea, '```\n' + lines + '\n```');
		textarea.setSelectionRange(start + 4, start + 4 + lines.length);
	}
	function toggleLines(textarea, prefix, mine, family = mine) {
		const make = typeof prefix === 'function' ? prefix : () => prefix;
		const { selectionStart, selectionEnd, value } = textarea;
		const { start, end } = selectedLines(textarea);
		const lines = value.slice(start, end).split('\n');
		const filled = lines.filter(line => line.trim());
		const remove = filled.length > 0 && filled.every(line => mine.test(line));
		let n = 0;
		const result = lines.map(line => filled.length && !line.trim() ? line : remove ? line.replace(mine, '') : make(++n) + line.replace(family, '')).join('\n');
		textarea.setSelectionRange(start, end);
		insertText(textarea, result);
		if (selectionStart === selectionEnd) {
			const caret = Math.max(start, selectionStart + result.length - (end - start));
			textarea.setSelectionRange(caret, caret);
		} else {
			textarea.setSelectionRange(start, start + result.length);
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
		const available = menuItems.filter(item => !item.mentions || textarea.dataset.stetsMentions);
		const entries = [...tools.map(tool => ({ ...tool, syntax: tool.key ? shortcutHint(tool) : '' })), ...available];
		const tabs = textarea.dataset.stetsPreview ? '<div class="stets-tabs" role="tablist"><button type="button" class="stets-tab" role="tab" aria-selected="true" tabindex="0">Write</button><button type="button" class="stets-tab" role="tab" aria-selected="false" tabindex="-1">Preview</button></div>' : '';
		editor.insertAdjacentHTML('afterbegin', `<div class="stets-header">${tabs}<div class="stets-toolbar" role="toolbar" aria-label="Formatting"><span class="stets-group">${tools.map(tool => `
			${tool.startsGroup ? '</span><span class="stets-group">' : ''}<button type="button" class="stets-tool" data-tool="${tool.name}" aria-label="${tool.label}" title="${tool.label}${tool.key ? ` (${shortcutHint(tool)})` : ''}"></button>`).join('')}</span>
			<span class="stets-group"><button type="button" class="stets-tool" data-tool="more" aria-haspopup="menu" aria-label="More formatting" title="More formatting"></button></span></div>
			<div class="stets-menu" role="menu" popover>${entries.map(item => `<button type="button" class="stets-menu-item" role="menuitem" tabindex="-1"${item.name ? ` data-tool="${item.name}" hidden` : ''}>${item.label}<span aria-hidden="true">${item.syntax}</span></button>`).join('')}</div>
			<div class="stets-mentions" role="listbox" popover="manual"></div></div>`);
		if (tabs) {
			textarea.insertAdjacentHTML('afterend', '<div class="stets-preview" role="tabpanel" hidden></div>');
			const switchers = editor.querySelectorAll('.stets-tab');
			const preview = editor.querySelector('.stets-preview');
			switchers[1].ariaControlsElements = [preview];
			preview.ariaLabelledByElements = [switchers[1]];
			let renders = 0;
			async function render() {
				const current = ++renders;
				if (!textarea.value.trim()) {
					preview.textContent = 'Nothing to preview';
					return;
				}
				const response = await fetch(textarea.dataset.stetsPreview, { method: 'POST', headers: { 'Content-Type': 'text/markdown; charset=utf-8' }, body: textarea.value }).catch(() => null);
				const plain = response?.headers.get('Content-Type')?.startsWith('text/plain');
				const content = response?.ok || plain ? await response.text() : 'Preview is unavailable right now.';
				if (current === renders) {
					preview[response?.ok ? 'innerHTML' : 'textContent'] = content;
				}
			}
			switchers.forEach((tab, i) => tab.addEventListener('click', () => {
				switchers.forEach((other, j) => {
					other.ariaSelected = i === j;
					other.tabIndex = i === j ? 0 : -1;
				});
				tab.focus();
				textarea.hidden = editor.querySelector('.stets-toolbar').hidden = i === 1;
				preview.hidden = i === 0;
				if (i === 1) {
					render();
				}
			}));
			editor.querySelector('.stets-tabs').addEventListener('keydown', event => {
				if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
					event.preventDefault();
					switchers[event.target === switchers[0] ? 1 : 0].click();
				}
			});
		}
		const buttons = [...editor.querySelectorAll('.stets-tool')];
		buttons.forEach((button, i) => {
			button.tabIndex = i ? -1 : 0;
			button.addEventListener('click', () => tools[i]?.action(textarea));
		});
		const picker = editor.querySelector('.stets-mentions');
		let people;
		let active = 0;
		function highlight(index) {
			const rows = [...picker.children];
			active = (index + rows.length) % rows.length;
			rows.forEach((row, i) => row.ariaSelected = i === active);
			textarea.ariaActiveDescendantElement = rows[active] || null;
		}
		const pickerKeys = { ArrowDown: () => highlight(active + 1), ArrowUp: () => highlight(active - 1), Enter: () => picker.children[active].click(), Tab: () => picker.children[active].click(), Escape: () => {
			picker.hidePopover();
			textarea.ariaActiveDescendantElement = null;
		} };
		textarea.addEventListener('keydown', event => {
			if (pickerKeys[event.key] && picker.matches(':popover-open') && !event.isComposing && !event.altKey && !event.ctrlKey && !event.metaKey) {
				event.preventDefault();
				pickerKeys[event.key]();
			}
		});
		textarea.addEventListener('input', async () => {
			const url = textarea.dataset.stetsMentions;
			people ??= url && fetch(url).then(response => response.json()).catch(() => people = undefined);
			const list = (await people) || [];
			const caret = textarea.selectionEnd;
			const match = url && textarea.selectionStart === caret && textarea.value.slice(Math.max(0, caret - 32), caret).match(/(?:^|\s)@([\w-]{0,30})$/);
			const matches = match ? list.filter(person => [person.username, ...(person.name || '').split(/\s+/)].some(word => word.toLowerCase().startsWith(match[1].toLowerCase()))).slice(0, 8) : [];
			picker.replaceChildren(...matches.map(person => {
				const row = Object.assign(document.createElement('div'), { className: 'stets-mention', role: 'option', textContent: `${person.name || ''} `, onclick: () => {
					textarea.setSelectionRange(caret - match[1].length - 1, caret);
					insertText(textarea, `@${person.username} `);
				} });
				row.append(Object.assign(document.createElement('span'), { textContent: `@${person.username}` }));
				return row;
			}));
			highlight(0);
			if (matches.length && !picker.matches(':popover-open')) {
				Object.assign(picker.style, belowCaret(textarea, caret - match[1].length - 1));
			}
			picker.togglePopover(matches.length > 0);
		});
		const menu = editor.querySelector('.stets-menu');
		const more = editor.querySelector('[data-tool="more"]');
		more.popoverTargetElement = menu;
		menu.addEventListener('beforetoggle', event => {
			if (event.newState === 'open') {
				const rect = more.getBoundingClientRect();
				menu.style.top = `${rect.bottom + scrollY + 4}px`;
				menu.style.right = `${document.documentElement.clientWidth - rect.right - scrollX}px`;
			}
		});
		const items = [...menu.querySelectorAll('.stets-menu-item')];
		menu.addEventListener('toggle', event => event.newState === 'open' && !menu.contains(document.activeElement) && items.find(item => !item.hidden).focus());
		menu.addEventListener('keydown', event => {
			const visible = items.filter(item => !item.hidden);
			const current = visible.indexOf(event.target);
			const next = { ArrowUp: current - 1, ArrowDown: current + 1, Home: 0, End: visible.length - 1 }[event.key];
			if (next !== undefined) {
				event.preventDefault();
				visible[(next + visible.length) % visible.length].focus();
			}
		});
		menu.addEventListener('focusout', event => menu.contains(event.relatedTarget) || menu.togglePopover(false));
		items.forEach((item, i) => {
			item.addEventListener('click', () => {
				menu.hidePopover();
				entries[i].action(textarea);
			});
		});
		editor.querySelector('.stets-toolbar').addEventListener('keydown', event => {
			const current = buttons.indexOf(event.target);
			const next = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: buttons.length - 1 }[event.key];
			if (current === -1 || next === undefined || event.altKey || event.ctrlKey || event.metaKey) {
				return;
			}
			event.preventDefault();
			buttons[current].tabIndex = -1;
			const button = buttons[(next + buttons.length) % buttons.length];
			button.tabIndex = 0;
			button.focus();
		});
		if (!textarea.labels.length && !textarea.hasAttribute('aria-label') && !textarea.hasAttribute('aria-labelledby')) {
			textarea.setAttribute('aria-label', 'Markdown editor');
		}
		textarea.addEventListener('keydown', event => {
			const tool = tools.find(t => (t.code ? t.code === event.code : t.key === event.key.toLowerCase()) && Boolean(t.shift) === event.shiftKey);
			if ((isMac ? event.metaKey : event.ctrlKey) && !event.altKey && tool) {
				event.preventDefault();
				tool.action(textarea);
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
