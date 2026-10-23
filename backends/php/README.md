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
