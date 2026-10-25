# HTTP API

The editor asks a server for three things, each at the URL in an
attribute on the textarea. Without the attribute, that feature is off.

| Attribute | Request | Answer |
| --- | --- | --- |
| `data-stets-preview` | [Preview](#preview): POST the Markdown | The HTML |
| `data-stets-upload` | [Upload](#upload): POST an image | JSON with the image's URL |
| `data-stets-mentions` | [Mentions](#mentions): GET | JSON list of people |

The [PHP backend](php/README.md) has `preview.php` and `upload.php`. The
mentions list is up to the site: the demo's is a static file.

The editor sends each request with `fetch()` from its own page, so the
site's cookies go along. Serve all three from the page's origin, the same
scheme, host and port: none of them grants CORS, and preview and upload
refuse requests from other origins, subdomains included.

When preview or upload fails, the editor shows the writer the response's
text if it's `text/plain`, and a general message otherwise. So:

- Error messages are one sentence for the writer, as
  `text/plain; charset=utf-8`.
- Never show error details, such as a stack trace. When something
  crashes, answer 500 with an empty body.

## Preview

The Preview tab sends the textarea's text, with
`Content-Type: text/markdown; charset=utf-8`, and puts a successful
response into the page as HTML. It sends nothing when the text is empty
or only whitespace.

The answer is [Markdown to HTML](markdown.md)'s output. Whether a writer
gets `raw_html` comes from the site's sign-in: use the same for their
saved comments.

Check these in order:

| Status | When | Body |
| --- | --- | --- |
| 405 | It isn't a POST. Send `Allow: POST` too | `Send the Markdown with POST.` |
| 415 | `Content-Type` doesn't start with `text/markdown`, in any case | `Send the Markdown as text/markdown.` |
| 403 | `Sec-Fetch-Site` is sent and isn't `same-origin` | `Preview is only available from this site.` |
| 413 | The body is over 1 MiB, 1,048,576 bytes | `The Markdown is too large to preview.` |
| 200 | Otherwise | The HTML, as `text/html; charset=utf-8` |
| 500 | Anything fails, invalid UTF-8 included | Empty |

- Another site's page can't send `text/markdown`: a form can't, and
  `fetch()` would need CORS. Clients that send no `Sec-Fetch-Site`, such
  as old browsers, are let through.
- Read at most 1 MiB and one byte, to notice a body over the limit
  without reading all of it. Refuse a `Content-Length` over it too.
- When an error message can't be shown, the editor says "Preview is
  unavailable right now."

Every response has these headers, so the fragment can't run anything if
opened directly, and no page can frame it:

```text
Content-Security-Policy: sandbox; frame-ancestors 'none'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

## Upload

Each image pasted, dropped or chosen with **Image…** is its own request.
The editor only sends files the browser says are images, as `image/*`,
and puts a placeholder in the text while each one uploads.

The request is a `multipart/form-data` POST with the file in the field
`image`, and this header:

```text
X-Requested-With: stets
```

A stored image is answered with 201 and JSON:

```json
{ "url": "/backends/php/uploads/0f8e1c2d3b4a59687766554433221100.png" }
```

The editor replaces the placeholder with `![alt](url)`, the alt text
coming from the file name. The URL goes into the Markdown as it is, so
keep spaces and parentheses out of it.

Check these in order:

| Status | When | Body |
| --- | --- | --- |
| 405 | It isn't a POST. Send `Allow: POST` too | `Send the image with POST.` |
| 403 | `X-Requested-With: stets` is missing, or `Sec-Fetch-Site` is sent and isn't `same-origin` | `Uploads are only accepted from this site.` |
| 413 | The image is over the size limit | `Images can be up to N MB.`, N being the limit |
| 415 | There's no `image` file, or its bytes aren't PNG, JPEG, GIF or WebP | `Only PNG, JPEG, GIF and WebP images are accepted.` |
| 500 | It can't be saved | `The image could not be saved.` |
| 201 | Otherwise | The JSON, as `application/json` |

- Another site's form can send a multipart upload, but can't add a
  header, and its scripts would need CORS.
- Tell the type from the bytes, never from the file name or the
  request. SVG is refused: it can carry scripts.
- Save each image under a random name, 32 hex digits and the type's
  extension, so nobody can choose or guess another upload's name.
- Remove metadata, such as where a photo was taken, and keep what draws
  the picture. The PHP backend's [Uploads](php/README.md#uploads) section
  says what each format keeps.
- The PHP backend's size limit is PHP's `upload_max_filesize`, with
  `post_max_size` a little larger.
- Every response has `X-Content-Type-Options: nosniff`.
- When an error message can't be shown, the editor says "Try again."

The PHP backend doesn't check who's uploading. Its
[On a real site](php/README.md#on-a-real-site) list says what to add.

## Mentions

The editor GETs the list the first time the writer types, once per
editor, and keeps it. If that fails, it tries again on the next
keystroke. The answer is a JSON array:

```json
[
	{ "username": "aisha", "name": "Aisha Khan" },
	{ "username": "diego", "name": "Diego Fernandez" }
]
```

- `username` is what goes in the text after `@`.
- `name` is optional, and shown beside the username.
- Typing `@` and up to 30 letters, digits, `_` or `-` lists up to 8
  people whose username, or any word of whose name, starts with what was
  typed, ignoring case.

The whole list loads at once, and matching happens in the page. It can
be a static file, like the demo's `people.json`, or made for each writer
from their sign-in, since cookies go along.
