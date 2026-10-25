# Stets

Stets is a GitHub inspired web Markdown editor.

The editor is one JavaScript file and one CSS. It has no dependencies and
needs no build step. Without JavaScript, the textarea still works as an
ordinary form field.

Features that need a server, such as the Preview tab and file uploads,
use a small, documented HTTP API. The first backend is in PHP: see
[backends/php](backends/php/README.md). To write one in another language,
[backends/markdown.md](backends/markdown.md) describes how a backend turns
Markdown into HTML.

## Usage

Load `src/stets.css` and `src/stets.js`, and add `data-stets` to a
textarea. For a textarea added later, call `stets.enhance(textarea)`.

```html
<label for="body">Comment</label>
<textarea id="body" name="body" rows="8" data-stets></textarea>
```

The textarea grows with its text, from the height `rows` gives it. Give it
a `<label>`: without one, screen readers call it "Markdown editor".

These optional attributes add to the editor:

| Attribute | What it adds |
| --- | --- |
| `data-stets-preview` | The Preview tab. Its URL renders the Markdown, like the PHP backend's `preview.php` |
| `data-stets-upload` | Pasting, dropping and choosing images. Its URL stores them, like `upload.php` |
| `data-stets-mentions` | `@` mentions. Its URL lists the people as JSON, fetched once someone types: `[{ "username": "aisha", "name": "Aisha Khan" }]` |
| `data-stets-avatar` | A picture of the person writing, at the top of the editor |
| `data-stets-user` | The writer's name, which describes the avatar to screen readers |
| `data-stets-guide` | A link to a Markdown guide, which opens in a new tab. The demo's is `demo/guide.html` |
| `data-stets-raw-html` | The HTML block item in the ⋯ menu. Present means on: set it only for writers whose raw HTML the backend lets through |

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
| `--stets-danger` | Error messages, such as why an upload failed |
| `--stets-border` | Borders and dividers |
| `--stets-bar` | Toolbar background, mixed from the accent by default |
| `--stets-font` | Font of the preview, tabs and menus |
| `--stets-writing-font` | Font of the text you type, the code font by default |
| `--stets-code-font` | Font of code in the preview |
| `--stets-radius` | Corner rounding of the editor |
| `--stets-code-scheme` | Colors of highlighted code: `dark`, the default, or `light` |
