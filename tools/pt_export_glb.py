#!/usr/bin/env python3
"""Export and verify GLB models for the product-trailer pipeline (F16).

Two modes:

1. Inside Blender (headless export + mesh inventory)::

       blender -b device.blend -P tools/pt_export_glb.py -- --export out/device.glb

   Loads the blend file passed to blender, exports a binary glTF (.glb) with
   every three.js r128-incompatible feature disabled (no Draco, no animation,
   no shape keys, no custom props), then prints a mesh inventory that flags
   candidate screen meshes (name contains "screen").

2. Plain Python (offline engine-compatibility check, no Blender needed)::

       python3 tools/pt_export_glb.py --check out/device.glb

   Parses the GLB JSON chunk and fails (exit 1) if extensions unsupported by
   three.js r128 are present (Draco mesh compression, KTX2/Basis textures,
   meshopt), printing the offending extension list.

The companion modeling contract lives in docs/agent-blender-modeling.md.
"""

import argparse
import json
import struct
import sys

# Extensions the pinned three.js r128 GLTFLoader cannot decode.
UNSUPPORTED_EXTENSIONS = (
    "KHR_draco_mesh_compression",
    "KHR_texture_basisu",
    "EXT_meshopt_compression",
    "EXT_texture_webp",
)


def _read_glb(path):
    """Return (json_chunk, bin_chunk) of a binary glTF 2.0 file."""
    with open(path, "rb") as fh:
        data = fh.read()
    if len(data) < 12 or data[0:4] != b"glTF":
        raise ValueError("not a GLB file (missing glTF magic): %s" % path)
    version, _length = struct.unpack_from("<II", data, 4)
    if version != 2:
        raise ValueError("unsupported glTF version %d (expected 2)" % version)
    offset = 12
    json_chunk = None
    while offset < len(data):
        chunk_len, chunk_type = struct.unpack_from("<II", data, offset)
        offset += 8
        chunk = data[offset:offset + chunk_len]
        offset += chunk_len
        if chunk_type == 0x4E4F534A:  # "JSON"
            json_chunk = chunk
    if json_chunk is None:
        raise ValueError("GLB contains no JSON chunk: %s" % path)
    return json.loads(json_chunk.decode("utf-8"))


def check_glb(path):
    """Verify a .glb is loadable by the engine; print a report. Exit 0/1."""
    try:
        gltf = _read_glb(path)
    except (ValueError, OSError) as exc:
        print("FAIL  %s: %s" % (path, exc))
        return 1

    used = set(gltf.get("extensionsUsed", []))
    required = set(gltf.get("extensionsRequired", []))
    bad_used = sorted(e for e in used if e in UNSUPPORTED_EXTENSIONS)
    bad_required = sorted(e for e in required if e in UNSUPPORTED_EXTENSIONS)

    meshes = gltf.get("meshes", [])
    mesh_names = [m.get("name", "<unnamed>") for m in meshes]
    screens = [n for n in mesh_names if "screen" in n.lower()]

    print("OK    %s" % path)
    print("      meshes (%d): %s" % (len(mesh_names),
                                     ", ".join(mesh_names) or "(none)"))
    if screens:
        print("      screen mesh candidates: %s" % ", ".join(screens))
    else:
        print("NOTE  no mesh name contains 'screen' — name the display panel "
              "'screen' before calibration (see docs/agent-blender-modeling.md)")

    if bad_required or bad_used:
        print("FAIL  incompatible glTF extensions found:")
        for ext in sorted(set(bad_used) | set(bad_required)):
            tag = "required" if ext in bad_required else "used"
            print("        - %s (%s)" % (ext, tag))
        print("      three.js r128 cannot load these; export uncompressed "
              "glTF via tools/pt_export_glb.py or run the GLB through "
              "gltf-pipeline first.")
        return 1

    print("PASS  no Draco/KTX2/meshopt extensions — r128-compatible.")
    return 0


def export_from_blender(out_path):
    """Run inside Blender: export GLB with r128-safe flags and inventory."""
    import bpy  # noqa: WPS433 — only available inside Blender's Python.

    # Deterministic, static, uncompressed export.
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        use_selection=False,
        apply_modifiers=True,
        export_apply=True,                # apply rotation/scale on export
        export_yup=True,                  # glTF Y-up (exporter default)
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_colors=False,
        export_cameras=False,
        export_animations=False,
        export_skins=False,
        export_morph=False,
        export_skins_apply=False,
        export_extras=False,
        export_copyright="",
    )

    print("[pt_export_glb] exported %s" % out_path)
    print("[pt_export_glb] mesh inventory (the screen panel must be named "
          "'screen'):")
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        flag = "  <-- SCREEN CANDIDATE" if "screen" in obj.name.lower() else ""
        print("    - %s%s" % (obj.name, flag))
    if not any(o.type == "MESH" and o.name.lower() == "screen"
               for o in bpy.context.scene.objects):
        print("[pt_export_glb] WARNING: no mesh is named exactly 'screen'. "
              "Rename the display panel before calibration.")

    # Re-run the offline check on the freshly exported file when possible.
    try:
        rc = check_glb(out_path)
    except Exception as exc:  # pragma: no cover - best-effort report
        print("[pt_export_glb] post-export check skipped: %s" % exc)
        rc = 0
    return rc


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Export (inside Blender) or verify (plain Python) a GLB "
                    "for the product-trailer r128 engine.")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--export", metavar="OUT.glb",
                      help="run inside Blender to export the current scene "
                           "and print a mesh inventory")
    mode.add_argument("--check", metavar="IN.glb",
                      help="verify an existing GLB is uncompressed/"
                           "r128-compatible (no Blender required)")
    args = parser.parse_args(argv)

    if args.check:
        return check_glb(args.check)

    try:
        import bpy  # noqa: F401
    except ImportError:
        print("FAIL  --export must run inside Blender's Python:\n"
              "      blender -b device.blend -P tools/pt_export_glb.py -- "
              "--export out/device.glb", file=sys.stderr)
        return 2
    return export_from_blender(args.export)


if __name__ == "__main__":
    sys.exit(main())
