#!/usr/bin/env python3
"""make_fixture_glb.py — generate a tiny, license-clean synthetic GLB for tests.

The real CC0/procurement models live outside git (PLAN F4). To exercise the
*external GLB* path of both the engine and the M1.5 calibration harness in CI
without shipping any third-party mesh, this emits a minimal hand-rolled glTF 2.0
binary: a "DeviceBody" box plus a "Screen" plane carrying a green emissive
material (so the engine's emissive-based auto-detection finds the screen even
before a manifest `screen.mesh` is set).

The mesh is intentionally procedural and trivial — zero third-party IP.

Usage: python3 tools/make_fixture_glb.py --out dist/fixtures/fixture-device.glb
"""
import argparse
import json
import os
import struct


def pad4(b):
    while len(b) % 4:
        b += b'\x00'
    return b


def build_glb():
    # ---- geometry ---------------------------------------------------------
    # Device body: unit-ish box centred at origin, base around y=0.
    box_verts = [
        (-0.5, 0.0, -0.15), (0.5, 0.0, -0.15), (0.5, 0.9, -0.15), (-0.5, 0.9, -0.15),
        (-0.5, 0.0, 0.15), (0.5, 0.0, 0.15), (0.5, 0.9, 0.15), (-0.5, 0.9, 0.15),
    ]
    box_idx = [0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1,
               1, 5, 6, 1, 6, 2, 3, 2, 6, 3, 6, 7, 0, 3, 7, 0, 7, 4]
    # Screen: 1x0.6 plane on the front face (+Z), CCW winding when viewed from +Z.
    # glTF UV convention: V=0 at the TOP of the image (GLTFLoader sets flipY=false).
    # Vertices run bottom-left -> bottom-right -> top-right -> top-left, so the
    # bottom vertices carry V=1 and the top vertices V=0.
    scr_verts = [
        (-0.42, 0.18, 0.151), (0.42, 0.18, 0.151),
        (0.42, 0.78, 0.151), (-0.42, 0.78, 0.151),
    ]
    scr_uv = [(0.0, 1.0), (1.0, 1.0), (1.0, 0.0), (0.0, 0.0)]
    scr_idx = [0, 1, 2, 0, 2, 3]
    scr_normal = (0.0, 0.0, 1.0)

    pos_fmt = '<3f'
    uv_fmt = '<2f'
    normal_fmt = '<3f'
    idx_fmt = '<H'

    chunks = b''
    views = []   # (byte_offset, byte_length, target)
    accs = []    # {bufferView, componentType, count, type, min, max}

    def add_view(data, target):
        nonlocal chunks
        data = pad4(data)
        off = len(chunks)
        views.append([off, len(data), target])
        chunks += data
        return len(views) - 1

    def add_accessor(view, comp, count, typ, mn=None, mx=None):
        a = {'bufferView': view, 'componentType': comp, 'count': count, 'type': typ}
        if mn is not None:
            a['min'] = mn
            a['max'] = mx
        accs.append(a)
        return len(accs) - 1

    ARRAY, ELEMENT = 34962, 34963
    FLOAT, USHORT = 5126, 5123

    # box positions
    bp = b''.join(struct.pack(pos_fmt, *v) for v in box_verts)
    vp = add_view(bp, ARRAY)
    ap = add_accessor(vp, FLOAT, len(box_verts), 'VEC3',
                      mn=[min(v[i] for v in box_verts) for i in range(3)],
                      mx=[max(v[i] for v in box_verts) for i in range(3)])
    # box indices
    bi = b''.join(struct.pack(idx_fmt, i) for i in box_idx)
    vi = add_view(bi, ELEMENT)
    ai = add_accessor(vi, USHORT, len(box_idx), 'SCALAR')
    # screen positions
    sp = b''.join(struct.pack(pos_fmt, *v) for v in scr_verts)
    vsp = add_view(sp, ARRAY)
    asp = add_accessor(vsp, FLOAT, len(scr_verts), 'VEC3',
                       mn=[min(v[i] for v in scr_verts) for i in range(3)],
                       mx=[max(v[i] for v in scr_verts) for i in range(3)])
    # screen normals
    sn = b''.join(struct.pack(normal_fmt, *scr_normal) for _ in scr_verts)
    vsn = add_view(sn, ARRAY)
    asn = add_accessor(vsn, FLOAT, len(scr_verts), 'VEC3')
    # screen uv
    su = b''.join(struct.pack(uv_fmt, *uv) for uv in scr_uv)
    vsu = add_view(su, ARRAY)
    asu = add_accessor(vsu, FLOAT, len(scr_uv), 'VEC2')
    # screen indices
    si = b''.join(struct.pack(idx_fmt, i) for i in scr_idx)
    vsi = add_view(si, ELEMENT)
    asi = add_accessor(vsi, USHORT, len(scr_idx), 'SCALAR')

    gltf = {
        'asset': {'version': '2.0', 'generator': 'make_fixture_glb.py'},
        'scenes': [{'nodes': [0]}],
        'scene': 0,
        'nodes': [
            {'name': 'FixtureDevice', 'children': [1, 2]},
            {'name': 'DeviceBody', 'mesh': 0},
            {'name': 'Screen', 'mesh': 1},
        ],
        'meshes': [
            {'name': 'DeviceBody', 'primitives': [{'attributes': {'POSITION': ap}, 'indices': ai, 'material': 0}]},
            {'name': 'Screen', 'primitives': [{'attributes': {'POSITION': asp, 'NORMAL': asn, 'TEXCOORD_0': asu},
                                              'indices': asi, 'material': 1}]},
        ],
        'materials': [
            {'name': 'BodyMat', 'pbrMetallicRoughness': {
                'baseColorFactor': [0.11, 0.13, 0.19, 1.0], 'metallicFactor': 0.5, 'roughnessFactor': 0.5}},
            {'name': 'ScreenMat', 'pbrMetallicRoughness': {
                'baseColorFactor': [0.0, 0.05, 0.02, 1.0], 'metallicFactor': 0.0, 'roughnessFactor': 0.3},
             'emissiveFactor': [0.1, 1.0, 0.2], 'emissiveTexture': None},
        ],
        'buffers': [{'byteLength': len(chunks)}],
        'bufferViews': [{'buffer': 0, 'byteOffset': v[0], 'byteLength': v[1], 'target': v[2]} for v in views],
        'accessors': accs,
    }
    # emissiveFactor alone (no emissiveTexture) is enough: engine treats
    # emissive.getHex() != 0 with intensity>0.5 as a screen candidate.
    gltf['materials'][1].pop('emissiveTexture')

    # glTF 2.0: JSON chunk MUST be padded with spaces (0x20), BIN with zeros.
    js_raw = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
    js = js_raw + b' ' * ((4 - len(js_raw) % 4) % 4)
    bin_blob = chunks

    total = 12 + 8 + len(js) + 8 + len(bin_blob)
    out = struct.pack('<III', 0x46546C67, 2, total)
    out += struct.pack('<II', len(js), 0x4E4F534A) + js
    out += struct.pack('<II', len(bin_blob), 0x004E4942) + bin_blob
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    args = ap.parse_args()
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    data = build_glb()
    with open(args.out, 'wb') as f:
        f.write(data)
    print('wrote %s (%d bytes)' % (args.out, len(data)))


if __name__ == '__main__':
    main()
