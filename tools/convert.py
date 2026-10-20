import bpy, mathutils
src = "C:/Users/it2rk/Downloads/SLMM-master/SLMM-master/Assets/"
out = "C:/Users/it2rk/IOPsy/public/models/"
# name: (file, target_tris, target_size_axis('z' height | 'max'), target_size, tex)
jobs = {
 "man":     ("3D-objects/Characters/MAN/eggMan/base_basic_shaded.fbx", 14000, "z", 1.75, 1024),
 "woman":   ("3D-objects/Characters/WOMEN/0eb554a8-fba4-44ea-a38d-5ffbc537d58f/base_basic_shaded.fbx", 14000, "z", 1.75, 1024),
 "camel":   ("3D-objects/ANIMALS/Camel.fbx", 0, "z", 2.2, 1024),
 "tent":    ("TUR/color/tent.fbx", 0, "max", 14.0, 1024),
 "bonfire": ("3D-objects/Bonfire-folder/bonfire.fbx", 0, "max", 3.2, 1024),
}
def bbox(objs):
    mn = mathutils.Vector((1e9,)*3); mx = mathutils.Vector((-1e9,)*3)
    for o in objs:
        for c in o.bound_box:
            w = o.matrix_world @ mathutils.Vector(c)
            mn = mathutils.Vector([min(a,b) for a,b in zip(mn,w)]); mx = mathutils.Vector([max(a,b) for a,b in zip(mx,w)])
    return mn, mx
for name,(rel,tris,axis,size,tex) in jobs.items():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=src+rel)
    meshes = [o for o in bpy.data.objects if o.type=='MESH']
    if tris:
        for m in meshes:
            bpy.context.view_layer.objects.active = m
            n = len(m.data.polygons)
            mod = m.modifiers.new("d","DECIMATE"); mod.ratio = min(1.0, tris/ max(n,1)); 
            bpy.ops.object.modifier_apply(modifier=mod.name)
    for img in bpy.data.images:
        if img.size[0] > tex or img.size[1] > tex:
            img.scale(min(img.size[0],tex), min(img.size[1],tex))
    mn,mx = bbox(meshes); s = mx-mn
    ref = s.z if axis=="z" else max(s)
    f = size/ref
    # scale root objects (keeps armature/animation valid by scaling the hierarchy roots)
    roots = [o for o in bpy.data.objects if o.parent is None]
    for r in roots:
        r.scale = r.scale*f
    bpy.context.view_layer.update()
    mn,mx = bbox(meshes)
    # center on XY, feet on ground
    off = mathutils.Vector(((mn.x+mx.x)/2, (mn.y+mx.y)/2, mn.z))
    for r in roots: r.location -= off
    bpy.context.view_layer.update()
    for o in bpy.data.objects: o.select_set(True)
    final = sum(len(m.data.polygons) for m in meshes)
    bpy.ops.export_scene.gltf(filepath=out+name+".glb", export_format='GLB', export_image_format='JPEG', export_jpeg_quality=82,
        export_animations=True, export_apply=False, export_yup=True)
    print(f"DONE {name} polys={final} scale={f:.4f}")
