# Markdown to HTML

A backend turns a comment's Markdown into an HTML fragment, for the
Preview tab and for showing saved comments. This describes what the
[PHP backend](php/README.md) does, for building the same thing in another
language.

The examples are the PHP backend's exact output. Another backend should
produce the same elements, attributes and text. [Testing](#testing) lists
the differences that don't count. Markdown libraries also differ in rare
edge cases, such as unusual footnote labels.

## The function

```text
markdown_to_html(markdown: string, raw_html: bool = false) -> string
```

- It takes UTF-8 Markdown and returns an HTML fragment, not a page.
- Use it for the [preview](http-api.md#preview) and for saved comments, so
  the two always match.
- Without `raw_html`, the output is safe to put straight into a page.
- `raw_html` turns on [raw HTML regions](#raw-html-regions). Pass it only
  for writers the site trusts with its pages.
- Build the parser once per process for each `raw_html` value, and reuse
  it.

## Markdown

[CommonMark 0.31.2](https://spec.commonmark.org/0.31.2/), plus these
[GitHub Flavored Markdown](https://github.github.com/gfm/) extensions:

- Tables
- Task lists
- Strikethrough, with one or two tildes
- Autolinks for `www.`, `http://`, `https://`, `ftp://` and email
  addresses

Also [footnotes](#footnotes), [highlighted code](#code-blocks) and
[YouTube embeds](#youtube-embeds). The PHP backend uses
league/commonmark 2.10, with its CommonMark core, GitHub Flavored Markdown
and footnote extensions.

| Input | Output |
| --- | --- |
| Raw HTML, inline or a block | Escaped, so it shows as text. An escaped HTML block isn't wrapped in `<p>` |
| A link to an unsafe URL | `<a>` with no `href` |
| An image with an unsafe URL | `<img src="">` |
| A single newline in a paragraph | A newline, not `<br>`. GitHub's comments differ here |
| Blocks nested more than 50 deep | The deeper markers stay text |
| Table rows missing cells | Empty cells fill them, up to 10,000 per table. Past that, the rest of the table is dropped |
| A heading | No `id` |
| A link, autolinks included | `rel="nofollow ugc"`, so search engines don't count it, and no `target`. Footnote links get no `rel` |

A URL is unsafe if its scheme is `javascript:`, `vbscript:`, `file:` or
`data:`, in any case. `data:image/png`, `data:image/gif`,
`data:image/jpeg` and `data:image/webp` are safe. Check after removing
tabs and line breaks anywhere, and spaces and control characters at the
start, as browsers do.

````markdown
| Left | Right |
| :--- | ----: |
| a | b |

- [x] done
- [ ] todo

~~gone~~ <b>raw</b> [js](javascript:alert(1)) www.example.com
````

```html
<table>
<thead>
<tr>
<th align="left">Left</th>
<th align="right">Right</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">a</td>
<td align="right">b</td>
</tr>
</tbody>
</table>
<ul>
<li><input checked="" disabled="" type="checkbox"> done</li>
<li><input disabled="" type="checkbox"> todo</li>
</ul>
<p><del>gone</del> &lt;b&gt;raw&lt;/b&gt; <a rel="nofollow ugc">js</a> <a rel="nofollow ugc" href="http://www.example.com">www.example.com</a></p>
```

## Footnotes

`[^label]` refers to a note written as `[^label]: text`. Labels are case
sensitive.

- Notes are listed at the end, numbered in the order they're first
  referred to. There's no `<hr>` before them.
- A note never referred to is dropped. A reference to a missing note
  stays text.
- Inline notes, `^[text]`, aren't supported and stay text.
- A second reference to a note gets `__2` on its id, the third `__3`,
  and the note gets a back link to each.

```markdown
Fact[^1] and again[^1].

[^1]: Source.
```

```html
<p>Fact<sup id="fnref-a6fb5ce1-1"><a class="footnote-ref" href="#fn-a6fb5ce1-1" role="doc-noteref">1</a></sup> and again<sup id="fnref-a6fb5ce1-1__2"><a class="footnote-ref" href="#fn-a6fb5ce1-1" role="doc-noteref">1</a></sup>.</p>
<div class="footnotes" role="doc-endnotes"><ol><li class="footnote" id="fn-a6fb5ce1-1" role="doc-endnote"><p>Source.&nbsp;<a class="footnote-backref" rev="footnote" href="#fnref-a6fb5ce1-1" role="doc-backlink">↩</a>&nbsp;<a class="footnote-backref" rev="footnote" href="#fnref-a6fb5ce1-1__2" role="doc-backlink">↩</a></p></li></ol></div>
```

`a6fb5ce1` is 8 random hex digits, new for every render, so two comments
on one page, or a comment and its preview, never share ids. The PHP
backend renders `id="fn:1"` and `href="#fnref:1"`, then replaces these
four strings across the whole output:

| Rendered | Replaced with |
| --- | --- |
| `id="fn:` | `id="fn-a6fb5ce1-` |
| `href="#fn:` | `href="#fn-a6fb5ce1-` |
| `id="fnref:` | `id="fnref-a6fb5ce1-` |
| `href="#fnref:` | `href="#fnref-a6fb5ce1-` |

A writer's own link to `#fn:1`, and ids in raw HTML regions, follow
along. Text can't produce these strings: its quotes come out as `&quot;`.

## Code blocks

Fenced code is highlighted with TextMate grammars and the GitHub Dark and
GitHub Light themes. The PHP backend uses Phiki 2.2, a PHP port of
[Shiki](https://shiki.style), with Shiki's grammars and its `github-dark`
and `github-light` themes. Other highlighters split code into tokens and
color them differently, which the [tests](#testing) allow.

- The first word of the info string picks the language, aliases
  included: `js` is `javascript`.
- With no language, an unknown one, or one with no letters, such as
  ```` ```123 ````, the code is plain text, with no `language-` class or
  `data-language`. Highlighting must never fail a render.
- Indented code isn't highlighted: it's `<pre><code>`, escaped.

````markdown
```js
let a = 1;
```
````

```html
<pre class="phiki language-javascript github-dark phiki-themes github-light" data-language="javascript" style="background-color: #24292e;color: #e1e4e8;--phiki-light-background-color: #fff;--phiki-light-color: #24292e;--phiki-dark-background-color: #24292e;--phiki-dark-color: #e1e4e8;"><code><span class="line"><span class="token" style="color: #f97583;--phiki-light-color: #d73a49;--phiki-dark-color: #f97583;">let</span><span class="token"> </span><span class="token" style="color: #e1e4e8;--phiki-light-color: #24292e;--phiki-dark-color: #e1e4e8;">a</span><span class="token"> </span><span class="token" style="color: #f97583;--phiki-light-color: #d73a49;--phiki-dark-color: #f97583;">=</span><span class="token"> </span><span class="token" style="color: #79b8ff;--phiki-light-color: #005cc5;--phiki-dark-color: #79b8ff;">1</span><span class="token">;</span><span class="token">
</span></span></code></pre>
```

- Each line is a `<span class="line">` of `<span class="token">`s. The
  line's newline is in its last token.
- A token with a color of its own has the dark color inline, plus
  `--phiki-light-color` and `--phiki-dark-color`. Other tokens have no
  `style`.
- The `<pre>` has the dark theme's colors inline, so code is readable
  without stets.css, plus the light and dark ones as custom properties.
- stets.css switches between light and dark with the `phiki-themes` class
  and the `--phiki-light-color` and `--phiki-dark-color` properties.

## YouTube embeds

A link to a YouTube video becomes the video's poster, linking to it,
when:

- it's alone in a paragraph at the top level of the comment, not in a
  list, quote or footnote,
- its text is its URL, as in `https://youtu.be/dQw4w9WgXcQ`,
  `<https://youtu.be/dQw4w9WgXcQ>` or
  `[https://youtu.be/dQw4w9WgXcQ](https://youtu.be/dQw4w9WgXcQ)`, and
- the URL is one of these, where `ID` is 11 letters, digits, `-` or `_`,
  not followed by another of them:

```text
https://youtu.be/ID
https://www.youtube.com/watch?v=ID
https://www.youtube.com/shorts/ID
https://www.youtube.com/embed/ID
https://www.youtube.com/live/ID
```

`http://` works too, and so do `m.youtube.com` and `youtube.com`. `v` can
be any parameter of the query. The host must be lowercase. Anything else in the
URL, such as a start time, is dropped.

The paragraph is replaced by:

```html
<a class="stets-youtube" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" rel="nofollow ugc" aria-label="Play YouTube video"><img src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" alt="" width="480" height="360" loading="lazy"></a>
```

- Only the first 10 in a comment embed, so one comment can't load a
  hundred posters. The rest stay links.
- The page loads only the poster. stets-content.css styles it, and on a
  click, stets-content.js swaps in the player from `youtube-nocookie.com`.
  Without them, the link opens YouTube.
- The PHP backend replaces the paragraphs after parsing, before
  rendering.

## Raw HTML regions

Only with `raw_html`. Without it, these lines are ordinary text, with
their HTML escaped.

```markdown
::: html
<details><summary>Build log</summary>All 304 tests passed.</details>
:::
```

- A region opens with a line of three or more colons, then `html` in
  any case. The line can be indented up to 3 spaces, with spaces or tabs
  between and after.
- It closes with a line of only colons, at least as many as opened it,
  indented the same way. Without one, the region runs to the end of its
  list item, quote or comment, like fenced code.
- It can't interrupt a paragraph: text right above it needs a blank line
  between. Any other block, such as a heading, can end right above it.
- It works inside lists and quotes, like fenced code.

The lines between the fences are parsed as an HTML fragment inside a
`<div>`, the way a browser's `innerHTML` would, and written back out.
Then every `<plaintext>` and `<noscript>` element is removed. What's left
is the output, with nothing else filtered: scripts, event handlers and
`javascript:` URLs go through.

| In the region | Output |
| --- | --- |
| `<!-- unclosed` | `<!-- unclosed-->` |
| `<iframe src="x" />` | `<iframe src="x"></iframe>` |
| `</div></article>stray` | `stray` |
| `<a href='https://example.com>docs</a>` | Nothing |
| `<plaintext>x` | Nothing |

That way a mistake, such as an unclosed comment, ends with the region
instead of swallowing the comments after it. `<plaintext>` never ends in
a page, and where scripts run, a page reads what's in `<noscript>` as
text, not as the elements the parser saw.

Use an HTML5 parser, one that follows the HTML standard. The PHP backend
uses PHP 8.4's `Dom\HTMLDocument`.

## Testing

`tests/markdown/` holds Markdown files, each with the HTML the PHP backend
makes from it: `NAME.md` and `NAME.html`. Those in `raw-html/` are made
with `raw_html`. They cover the rules here. For the rest of CommonMark and
GitHub Flavored Markdown, use a library that passes their spec tests.

To test a backend, give it a command that reads Markdown on stdin and
writes the HTML to stdout, with `--raw-html` for `raw_html`. The PHP
backend's is `markdown-cli.php`. The command runs in the repository's
root:

```bash
STETS_MARKDOWN_COMMAND="your command" make test-markdown
```

Both outputs are read as a browser reads them, then compared. These
differences don't count:

- Whitespace next to block elements, and runs of whitespace in text,
  except in `<pre>`
- The order of attributes, and of class names
- `<br />` or `<br>`, `checked=""` or `checked`, `&quot;` or `"`
- Inside `<pre>`, the token `<span>`s: only the lines and their text count
- The 8 random digits in footnote ids, as long as one output uses the same
  digits throughout

Everything else must match. Whitespace between inline elements counts,
since it shows: separate blocks with a newline, as the PHP backend does.

When the PHP backend's output changes on purpose, such as after a library
upgrade, `make markdown-expected` writes every `NAME.html` again. Review
the diff before committing it.
