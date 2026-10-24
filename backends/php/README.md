# PHP backend

The PHP backend answers the editor's server requests. It needs PHP 8.2 or
later and the packages from `composer install`.

- `preview.php` turns Markdown into HTML for the Preview tab.
- `upload.php` stores the images pasted, dropped or chosen in the editor.

## Uploads

`upload.php` accepts PNG, JPEG, GIF and WebP images, recognized by their
bytes, and saves each in `uploads/` under a random name. The size limit is
PHP's `upload_max_filesize`, with `post_max_size` a little larger.

It first removes metadata, such as where a photo was taken and with what
camera, and keeps the pixels, color profile and animation as they were:

- **PNG and WebP:** every chunk the picture doesn't need.
- **JPEG:** EXIF, XMP, comments and other application data, and anything
  after the picture, such as a phone's extra pictures or video. The
  orientation is kept, so photos still stand up.
- **GIF:** nothing. GIFs seldom carry camera data, but can hold comments.

### On a real site

The endpoint checks that an upload comes from a page on the same site, but
not who sent it. Before using it for real, add:

- **Sign-in:** take uploads only from people who are allowed to post.
- **Storage limits:** cap how much each person can upload, and how often.
- **Clean-up:** nothing deletes uploads, not even images whose comment was
  never posted.

## Raw HTML

Writers a site trusts with its pages can put HTML in a comment, between a
`::: html` line and a `:::` line. Leave a blank line between it and any
text above:

```markdown
::: html
<details><summary>Build log</summary>All 304 tests passed.</details>
:::
```

That HTML goes into the page as written, script and all, so raw HTML is
off. To turn it on for a writer, pass `true` as the second argument of
`stets_markdown_to_html()`, for their saved comments and for their preview,
at the top of `preview.php`. Everyone else's regions stay text.

Each region is parsed as a browser would parse it, so a mistake, such as
an unclosed comment, can't swallow the comments after it. `<plaintext>`
and `<noscript>` are dropped, since a page reads them differently.
