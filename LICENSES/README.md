# Third-party licences

## MiSans (Latin subset)

`src/client/fonts.ts` embeds three `MiSansLatin-*.woff2` files from the npm package
[`misans@4.1.0`](https://www.npmjs.com/package/misans), distributed there under the
Apache License 2.0. The full licence text is in [`MiSans.txt`](./MiSans.txt).

Only the Latin subset is shipped; the Medium file is declared as the 400 face so the
regular UI weight keeps the approved target look, while Semibold covers 600 and Bold 700. The CJK MiSans faces (about 45 MB of sharded
woff2) are deliberately **not** vendored; Chinese text keeps the user's own font
setting. See the header of `src/client/fonts.ts` for the reasoning.
