import bpy, sys, os
src = "C:/Users/it2rk/Downloads/SLMM-master/SLMM-master/Assets/"
files = {
 "man": "3D-objects/Characters/MAN/eggMan/base_basic_shaded.fbx",
 "woman": "3D-objects/Characters/WOMEN/0eb554a8-fba4-44ea-a38d-5ffbc537d58f/base_basic_shaded.fbx",
 "camel": "3D-objects/ANIMALS/Camel.fbx",
 "tent": "TUR/color/tent.fbx",
 "bonfire": "3D-objects/Bonfire-folder/bonfire.fbx",
 "coal": "3D-objects/FlamingCoal-folder/coal/SM_coal.fbx",
}
for k, rel in files.items():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    p = src + rel
    if not os.path.exists(p): print("MISSING", k, p); continue
    bpy.ops.import_scene.fbx(filepath=p)
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    arms = [o for o in bpy.data.objects if o.type == 'ARMATURE']
    tris = sum(len(m.data.polygons) for m in meshes)
    dims = [tuple(round(x,2) for x in m.dimensions) for m in meshes[:3]]
    bones = sum(len(a.data.bones) for a in arms)
    anims = [a.name for a in bpy.data.actions]
    imgs = [(i.name, i.size[0], i.size[1]) for i in bpy.data.images]
    print(f"RESULT {k}: meshes={len(meshes)} tris={tris} armatures={len(arms)} bones={bones} actions={anims} dims={dims} images={imgs[:6]} mats={len(bpy.data.materials)}")
