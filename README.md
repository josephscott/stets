# Stets

Stets is a GitHub inspired web Markdown editor.

The editor is one JavaScript file and one CSS. It has no dependencies and
needs no build step. Without JavaScript, the textarea still works as an
ordinary form field.

Features that need a server, such as the Preview tab and file uploads,
use a small, documented HTTP API.

## Customizing the look

The editor's colors, fonts and corners come from CSS custom properties.
Override them on `.stets-editor` in a stylesheet loaded after `stets.css`.
The defaults work in light and dark mode; use `light-dark()` to set both.

```css
.stets-editor {
	--stets-accent: light-dark(#7c3aed, #b794f6);
}
```

| Property | What it sets |
| --- | --- |
| `--stets-accent` | Focus ring, links, cursor, the selected tab's dots, the toolbar tint |
| `--stets-background` | Background of the editor and its menus |
| `--stets-text` | Text color |
| `--stets-muted` | Secondary text, such as the unselected tab |
| `--stets-border` | Borders and dividers |
| `--stets-bar` | Toolbar background, mixed from the accent by default |
| `--stets-font` | Font of the preview, tabs and menus |
| `--stets-writing-font` | Font of the text you type, the code font by default |
| `--stets-code-font` | Font of code in the preview |
| `--stets-radius` | Corner rounding of the editor |
| `--stets-code-scheme` | Colors of highlighted code: `dark`, the default, or `light` |
