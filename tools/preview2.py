import bpy, os, math, mathutils
src = "C:/Users/it2rk/Downloads/SLMM-master/SLMM-master/Assets/"
files = {
 "cnab": "TUR/New Folder/Assets/Interior Assets/Models/cnab.FBX",
 "cnab2": "TUR/New Folder/Assets/Interior Assets/Models/cnab_2.FBX",
 "cnab3": "TUR/New Folder/Assets/Interior Assets/Models/cnab_3.FBX",
 "stand": "TUR/New Folder/Assets/Interior Assets/Models/stand.fbx",
 "wallw": "TUR/New Folder/Assets/Interior Assets/Models/WALL_W.FBX",
}
files_old = {
 "man": "3D-objects/Characters/MAN/eggMan/base_basic_shaded.fbx",
 "woman": "3D-objects/Characters/WOMEN/0eb554a8-fba4-44ea-a38d-5ffbc537d58f/base_basic_shaded.fbx",
 "camel": "3D-objects/ANIMALS/Camel.fbx",
 "tent": "TUR/color/tent.fbx",
 "bonfire": "3D-objects/Bonfire-folder/bonfire.fbx",
}
out = "C:/Users/it2rk/IOPsy/work/"
for k, rel in files.items():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=src + rel)
    objs = [o for o in bpy.data.objects if o.type == 'MESH']
    mn = mathutils.Vector((1e9,)*3); mx = mathutils.Vector((-1e9,)*3)
    for o in objs:
        for c in o.bound_box:
            w = o.matrix_world @ mathutils.Vector(c)
            mn = mathutils.Vector([min(a,b) for a,b in zip(mn,w)]); mx = mathutils.Vector([max(a,b) for a,b in zip(mx,w)])
    size = mx - mn; ctr = (mx + mn)/2
    print(f"BBOX {k}: size={tuple(round(v,2) for v in size)} min={tuple(round(v,2) for v in mn)}")
    d = max(size) * 1.8
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); bpy.context.scene.collection.objects.link(cam)
    cam.location = ctr + mathutils.Vector((d*0.6, -d*0.9, d*0.35)); 
    cam.rotation_euler = (ctr - cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.clip_end = 10000; cam.data.clip_start = 0.01
    bpy.context.scene.camera = cam
    s = bpy.context.scene
    s.render.engine = 'BLENDER_WORKBENCH'; s.display.shading.light = 'STUDIO'; s.display.shading.color_type = 'TEXTURE'
    s.render.resolution_x = 700; s.render.resolution_y = 700
    s.render.filepath = out + f"prev_{k}.png"
    bpy.ops.render.render(write_still=True)
