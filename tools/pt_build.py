#!/usr/bin/env python3
"""pt_build.py — assemble a single self-contained trailer HTML from the three contracts.

Usage:
  python3 tools/pt_build.py \
    --manifest examples/sellerscope/model.manifest.json \
    --storyboard examples/sellerscope/storyboard.json \
    --content examples/sellerscope/content.js content/terminal/content.js \
    --title "SellerScope · 3D Trailer" \
    --out dist/sellerscope.html

Placeholders (engine/stage.html):
  __TITLE__            <title> text
  /*__THREE__*/        vendor three.r128.min.js
  /*__GLTFLOADER__*/   vendor GLTFLoader.r128.js
  /*__BUILTIN_MODELS__*/ engine/builtin-models.js
  /*__MANIFEST__*/     manifest JSON object literal
  /*__STORYBOARD__*/   storyboard JSON object literal
  /*__CONTENT__*/      content JS files concatenated in given order
  /*__ENGINE__*/       engine/engine.js

Content files are concatenated in the order passed; configuration files
(e.g. window.PT_TERMINAL_CFG = {...}) must come BEFORE the template that
consumes them (content/terminal/content.js).
"""
import argparse
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def read_json_object(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def main():
    ap = argparse.ArgumentParser(description='Assemble a product-trailer single HTML.')
    ap.add_argument('--manifest', required=True, help='model.manifest.json')
    ap.add_argument('--storyboard', required=True, help='storyboard.json')
    ap.add_argument('--content', nargs='+', required=True,
                    help='content JS files in load order (cfg first, template last)')
    ap.add_argument('--title', default='product-trailer')
    ap.add_argument('--out', required=True, help='output HTML path')
    ap.add_argument('--stage', default=os.path.join(ROOT, 'engine', 'stage.html'))
    ap.add_argument('--three', default=os.path.join(ROOT, 'engine', 'vendor', 'three.r128.min.js'))
    ap.add_argument('--gltfloader', default=os.path.join(ROOT, 'engine', 'vendor', 'GLTFLoader.r128.js'))
    ap.add_argument('--builtin', default=os.path.join(ROOT, 'engine', 'builtin-models.js'))
    ap.add_argument('--engine', default=os.path.join(ROOT, 'engine', 'engine.js'))
    args = ap.parse_args()

    def resolve(p):
        return p if os.path.isabs(p) else os.path.join(ROOT, p)

    html = read(resolve(args.stage))
    replacements = {
        '__TITLE__': args.title,
        '/*__THREE__*/': read(resolve(args.three)),
        '/*__GLTFLOADER__*/': read(resolve(args.gltfloader)),
        '/*__BUILTIN_MODELS__*/': read(resolve(args.builtin)),
        '/*__MANIFEST__*/': json.dumps(read_json_object(resolve(args.manifest)),
                                       ensure_ascii=False, indent=2),
        '/*__STORYBOARD__*/': json.dumps(read_json_object(resolve(args.storyboard)),
                                         ensure_ascii=False, indent=2),
        '/*__CONTENT__*/': '\n;\n'.join(read(resolve(c)) for c in args.content),
        '/*__ENGINE__*/': read(resolve(args.engine)),
    }

    for token, value in replacements.items():
        if token not in html:
            print('error: placeholder %r not found in stage template' % token, file=sys.stderr)
            sys.exit(2)
        html = html.replace(token, value)

    leftover = [tok for tok in replacements if tok in html]
    if leftover:
        print('error: unresolved placeholders: %s' % ', '.join(leftover), file=sys.stderr)
        sys.exit(2)

    out = resolve(args.out)
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)

    size = os.path.getsize(out)
    print('built %s (%.2f MB, %d bytes)' % (out, size / 1048576, size))


if __name__ == '__main__':
    main()
