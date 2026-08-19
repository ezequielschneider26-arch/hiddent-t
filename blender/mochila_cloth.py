"""
Mochila escolar urbana de tela negra (600D) hecha con simulación de tela en Blender.

Técnica (NO usamos extruidos rígidos):
  1. Malla base paramétrica (hull suave) generada por cuadrícula.
  2. Modificador CLOTH con grupo de pines (asas arriba + arranque del bolsillo)
     y colisión contra el cuerpo; la gravedad crea volumen blando y micro-arrugas.
  3. SUBDIVISION SURFACE (nivel 2) para suavidad orgánica.
  4. DISPLACE MODIFIER con un mapa de desplazamiento (imagen procedural) en
     dirección NORMAL para arrugas orgánicas profundas.
  5. Material Principled BSDF con NORMAL MAP procedural de tejido 600D
     (trama + grano + relieve), mate negro.

Uso:
  - GUI:  Abre Blender, ejecuta Archivo > Scripts (o editor Text), Run Script.
  - CLI:  blender --background --python blender/mochila_cloth.py
"""

import math
import random

import bpy
from mathutils import Vector

SCRIPT_DEBUG = True


def log(msg):
    if SCRIPT_DEBUG:
        print("[cloth_backpack]", msg)


def safe_set(obj, name, value):
    """Asigna atributo si existe (compatibilidad entre versiones de Blender)."""
    if hasattr(obj, name):
        try:
            setattr(obj, name, value)
        except Exception as exc:  # noqa: BLE001
            log("skip %s = %s (%s)" % (name, value, exc))


# ---------------------------------------------------------------------------
# 1. Texturas procedurales (normal map 600D + mapa de desplazamiento)
# ---------------------------------------------------------------------------

def fabric_height(x, y, size, seed=3):
    """Campo de alturas: trama de tejido + micro-grano + arrugas de baja frecuencia."""
    step = size / 64.0  # trama "600D" fina y densa
    r = random.Random(seed + x + y * 131)

    # surcos de la trama
    h = -0.6 if (x % step < 1.5) or (y % step < 1.5) else 0.0

    # grano fino (determinístico por ráfagas suaves)
    h += (r.random() - 0.5) * 0.5

    # arrugas orgánicas de baja frecuencia (ondas cruzadas)
    h += math.sin(x * 0.05) * 0.9 + math.sin(y * 0.043 + math.pi * 0.3) * 0.8
    h += math.sin((x + y) * 0.028) * 0.55

    return h


def _make_images(size=512, seed=3):
    """Genera 'FabricNormalMap' (RGB) y 'FabricDisplacementMap' (gris)."""
    h = [0.0] * (size * size)
    for y in range(size):
        for x in range(size):
            h[y * size + x] = fabric_height(x, y, size, seed)

    def height(x, y):
        return h[y * size + x]

    # ---- Normal map ------------------------------------------------------
    nrm = bpy.data.images.new("FabricNormalMap", size, size, alpha=False)
    nrm.colorspace_settings.name = "Non-Color"
    strength = 1.35
    pixels_nrm = [0.0] * (size * size * 4)
    for y in range(size):
        for x in range(size):
            xl = height((x - 1) % size, y)
            xr = height((x + 1) % size, y)
            yu = height(x, (y - 1) % size)
            yd = height(x, (y + 1) % size)
            nx = xl - xr
            ny = yu - yd
            nz = 2.0 * strength
            inv = 1.0 / math.sqrt(nx * nx + ny * ny + nz * nz)
            r_ = (nx * inv) * 0.5 + 0.5
            g_ = (ny * inv) * 0.5 + 0.5
            b_ = (nz * inv) * 0.5 + 0.5
            i = (y * size + x) * 4
            pixels_nrm[i] = r_
            pixels_nrm[i + 1] = g_
            pixels_nrm[i + 2] = b_
            pixels_nrm[i + 3] = 1.0
    nrm.pixels = pixels_nrm
    nrm.update()

    # ---- Desplazamiento (arrugas) ---------------------------------------
    disp = bpy.data.images.new("FabricDisplacementMap", size, size, alpha=False)
    disp.colorspace_settings.name = "Non-Color"
    lo = min(h)
    span = max(1e-6, max(h) - lo)
    pixels_d = [0.0] * (size * size * 4)
    for i, v in enumerate(h):
        pixels_d[i * 4] = (v - lo) / span
        pixels_d[i * 4 + 1] = (v - lo) / span
        pixels_d[i * 4 + 2] = (v - lo) / span
        pixels_d[i * 4 + 3] = 1.0
    disp.pixels = pixels_d
    disp.update()

    return nrm, disp


# ---------------------------------------------------------------------------
# 2. Malla paramétrica (hull del cuerpo) — nada de extruidos rígidos
# ---------------------------------------------------------------------------

Z_MIN, Z_MAX = -1.05, 1.42   # alto ~2.47
HALF_WIDTH = 0.86            # ancho max ~1.72 (proporción cuerpo ~0.7)
HALF_DEPTH = 0.40            # profundidad ~0.8 (13-15 cm reales)
ARCH_START = 0.62            # donde empieza el arco superior
ARCH_R = 0.84                # radio del arco superior

NZ, NT = 36, 44


def half_width(z):
    """Silueta: laterales casi rectos + arco superior amplio y suave."""
    if z <= ARCH_START:
        return HALF_WIDTH
    d = z - ARCH_START
    if d >= ARCH_R:
        return 0.015
    v = ARCH_R * ARCH_R - d * d
    return math.sqrt(max(0.0, v))


def rect_point(theta, hw, hd, cr):
    """Punto sobre rectángulo redondeado (frontera de sección horizontal)."""
    hx = max(hw - cr, 0.001)
    hy = max(hd - cr, 0.001)
    dx = math.cos(theta)
    dy = math.sin(theta)
    sx = float("inf") if abs(dx) < 1e-9 else hx / abs(dx)
    sy = float("inf") if abs(dy) < 1e-9 else hy / abs(dy)
    sc = min(sx, sy)
    px = dx * sc
    py = dy * sc
    nrm = math.hypot(px, py) or 1.0
    nx = px / nrm
    ny = py / nrm
    return px + nx * cr, py + ny * cr


def build_body():
    """Cuerpo principal: superficie paramétrica suave + tapas superior/inferior."""
    verts = []
    for i in range(NZ):
        z = Z_MIN + (Z_MAX - Z_MIN) * i / (NZ - 1)
        hw = half_width(z)
        cr = 0.30 if z < ARCH_START - 0.15 else 0.16
        for j in range(NT):
            th = 2.0 * math.pi * j / NT
            x, y = rect_point(th, hw, HALF_DEPTH, cr)
            verts.append((x, y, z))

    # tapas
    ix_bottom = len(verts)
    verts.append((0, 0, Z_MIN))
    ix_top = len(verts)
    verts.append((0, 0, Z_MAX))

    faces = []
    for i in range(NZ - 1):
        for j in range(NT):
            a = i * NT + j
            b = i * NT + (j + 1) % NT
            c = (i + 1) * NT + (j + 1) % NT
            d = (i + 1) * NT + j
            faces.append((a, b, c, d))
    for j in range(NT):
        a = j
        b = (j + 1) % NT
        faces.append((a, b, ix_bottom))
    last = (NZ - 1) * NT
    for j in range(NT):
        a = last + j
        b = last + (j + 1) % NT
        faces.append((a, b, ix_top))

    me = bpy.data.meshes.new("BackpackBodyMesh")
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new("BackpackBody", me)
    bpy.context.collection.objects.link(ob)
    return ob


def build_pocket():
    """Bolsillo frontal inferior: panel plano cosido, levemente arqueado."""
    nx, ny = 40, 22
    pw = 0.72          # 83% del ancho del cuerpo
    z_lo, z_hi = -0.95, -0.05   # mitad inferior
    y_front = 0.47     # apenas por delante de la cara frontal
    corner = 0.28      # esquinas suavizadas (normalizado)

    def sheet(ux, uz):
        """Mapea cuadrado [-1,1]^2 a rectángulo redondeado."""
        inner = 1.0 - corner
        ax = max(-inner, min(inner, ux))
        az = max(-inner, min(inner, uz))
        dx = ux - ax
        dz = uz - az
        nd = math.hypot(dx, dz)
        if nd > 1e-6:
            ax += (dx / nd) * corner
            az += (dz / nd) * corner
        return ax, az

    verts = []
    for i in range(ny):
        uz = 2.0 * i / (ny - 1) - 1.0
        for j in range(nx):
            ux = 2.0 * j / (nx - 1) - 1.0
            sx, sz = sheet(ux, uz)
            x = sx * pw
            z = (z_lo + z_hi) / 2.0 + sz * (z_hi - z_lo) / 2.0
            verts.append((x, y_front, z))

    faces = []
    for i in range(ny - 1):
        for j in range(nx - 1):
            a = i * nx + j
            b = a + 1
            c = a + nx + 1
            d = a + nx
            faces.append((a, d, c, b))   # normal hacia afuera (+Y, frente)

    me = bpy.data.meshes.new("PocketMesh")
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new("PocketFront", me)
    bpy.context.collection.objects.link(ob)
    return ob, (ny, nx)   # para saber qué fila es el borde superior


def build_handle():
    """Asa superior: cinta plana de nylon (estático, discreto)."""
    bpy.ops.mesh.primitive_cube_add(location=(0.0, 0.0, Z_MAX + 0.03))
    cube = bpy.context.object
    cube.name = "TopHandle"
    cube.scale = (0.85, 0.09, 0.06)
    return cube


# ---------------------------------------------------------------------------
# 3. Modifiers: Cloth -> Subdivision Surface -> Displacement
# ---------------------------------------------------------------------------

def add_pin_group(obj, top_row=None, bottom_row=None):
    """Grupo de vértices "Pins": pines para la simulación de tela."""
    if "Pins" not in obj.vertex_groups:
        vg = obj.vertex_groups.new(name="Pins")
        indices = []
        if top_row is not None:
            indices.extend(top_row)
        if bottom_row is not None:
            indices.extend(bottom_row)
        vg.add(indices, 1.0, "ADD")
    return obj.vertex_groups["Pins"]


def apply_cloth(obj, pin_group="Pins", with_gravity=True):
    cloth = obj.modifiers.new("Cloth", "CLOTH")
    s = cloth.settings
    safe_set(s, "quality", 12)
    safe_set(s, "mass", 0.55)
    safe_set(s, "air_damping", 0.03)
    safe_set(s, "bending_stiffness", 3.5)
    safe_set(s, "structural_stiffness", 60)
    safe_set(s, "shear_stiffness", 35)
    safe_set(s, "compression_stiffness", 15)
    safe_set(s, "damping", 4.0)
    safe_set(s, "time_scale", 1.0)
    safe_set(s, "pin_stiffness", 30.0)
    safe_set(s, "use_pin_cloth", True)
    safe_set(s, "vertex_group_mass", pin_group)
    if with_gravity and hasattr(s, "gravity"):
        try:
            s.gravity[2] = -9.8
        except Exception:  # noqa: BLE001
            pass
    return cloth


def add_collision(obj):
    col = obj.modifiers.new("Collision", "COLLISION")
    safe_set(col.settings, "thickness_outer", 0.015)
    safe_set(col.settings, "quality", 6)
    return col


def reorder_modifiers(obj, top_order):
    """Deja los modificadores en orden: lista superiores (aplicado último) primero."""
    names = list(obj.modifiers.keys())
    for i, name in enumerate(top_order):
        idx = names.index(name)
        obj.modifiers.move(idx, i)
        names = list(obj.modifiers.keys())


# ---------------------------------------------------------------------------
# 4. Material (Principled + Normal Map 600D + displacment en nodos)
# ---------------------------------------------------------------------------

def setup_fabric_material(obj, normal_img):
    mat_name = "Poliester600D"
    mat = bpy.data.materials.get(mat_name)
    if mat is None:
        mat = bpy.data.materials.new(mat_name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    links = mat.node_tree.links

    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (-200, 0)
    bsdf.inputs["Base Color"].default_value = (0.075, 0.075, 0.078, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.82
    bsdf.inputs["Metallic"].default_value = 0.0

    img_node = nodes.new("ShaderNodeTexImage")
    img_node.location = (-700, 0)
    img_node.image = normal_img
    img_node.color_space = "NON_COLOR"

    nrm = nodes.new("ShaderNodeNormalMap")
    nrm.location = (-480, 0)
    nrm.inputs["Strength"].default_value = 1.5

    links.new(img_node.outputs["Color"], nrm.inputs["Color"])
    links.new(nrm.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    if len(obj.data.materials) == 0:
        obj.data.materials.append(mat)
    else:
        obj.data.materials[0] = mat
    return mat


# ---------------------------------------------------------------------------
# 5. Simulacion (background-safe) + aplicar Cloth
# ---------------------------------------------------------------------------

def bake_cloth(objects, frame_start=1, frame_end=26):
    scene = bpy.context.scene
    scene.frame_start = frame_start
    scene.frame_end = frame_end
    for f in range(frame_start, frame_end + 1):
        scene.frame_set(f)
        for key in ("view_layer",):
            getattr(bpy.context, key).update()
        deps = bpy.context.evaluated_depsgraph_get()
        deps.update()


def apply_modifier_solo(obj, mod_name):
    """Aplica un modificador ocultando los demás (el resultado queda limpio)."""
    for m in obj.modifiers:
        m.show_viewport = (m.name == mod_name)
        m.show_render = (m.name == mod_name)
    bpy.ops.object.modifier_apply(modifier=mod_name)


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    random.seed(7)

    # limpiar escena
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    log("Generando texturas procedurales ...")
    nrm_img, disp_img = _make_images(size=512, seed=9)

    # --- cuerpo ---
    body = build_body()
    body.name = "Mochila"
    body.location = (0, 0, 0)
    add_pin_group(
        body,
        top_row=[(NZ - 1) * NT + j for j in range(NT)],
        bottom_row=[j for j in range(NT)],
    )
    cloth = apply_cloth(body, pin_group="Pins", with_gravity=True)
    add_collision(body)

    subsurf = body.modifiers.new("Subdivision", "SUBSURF")
    subsurf.levels = 2
    subsurf.render_levels = 2
    subsurf.quality = 3

    disp = body.modifiers.new("Wrinkles", "DISPLACE")

    # --- bolsillo ---
    pocket, (pny, pnx) = build_pocket()
    add_pin_group(pocket, top_row=[(pny - 1) * pnx + j for j in range(pnx)], bottom_row=None)
    apply_cloth(pocket, pin_group="Pins", with_gravity=True)
    ps = pocket.modifiers.new("Subdivision", "SUBSURF")
    ps.levels = 2
    ps.render_levels = 2

    # --- asa ---
    handle = build_handle()

    # orden de apilado: Cloth (base) -> Subsurf -> Displace (top)
    reorder_modifiers(body, ["Wrinkles", "Subdivision", "Cloth"])
    for m in body.modifiers:
        log("body mod: %s" % m.type)

    # --- materiales ---
    setup_fabric_material(body, nrm_img)
    setup_fabric_material(pocket, nrm_img)
    setup_fabric_material(handle, nrm_img)

    # suavizado
    for ob in (body, pocket, handle):
        ob.data.use_auto_smooth = True
        ob.data.auto_smooth_angle = math.radians(60)

    bpy.context.view_layer.objects.active = body
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    bpy.ops.object.shade_smooth()

    log("Simulando Cloth (%d frames) ..." % 25)
    bake_cloth([body, pocket], 1, 25)

    # bake del resultado de Cloth en la geometría (Subsurf y Displace siguen vivos)
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    bpy.context.view_layer.objects.active = body
    apply_modifier_solo(body, "Cloth")
    bpy.ops.object.select_all(action="DESELECT")
    pocket.select_set(True)
    bpy.context.view_layer.objects.active = pocket
    apply_modifier_solo(pocket, "Cloth")

    # reactiva todo
    for ob in (body, pocket):
        for m in ob.modifiers:
            if m.type in {"SUBSURF", "DISPLACE"}:
                m.show_viewport = True
                m.show_render = True

    # --- luces softbox + cámara frontal + fondo gris ---
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.film_transparent = False
    scene.world = scene.world or bpy.data.worlds.new("Studio")
    if scene.world is None:
        world = bpy.data.worlds.new("Studio")
        scene.world = world
    world = scene.world
    world.use_nodes = True
    wbg = world.node_tree.nodes.get("Background")
    if wbg:
        wbg.inputs[0].default_value = (0.93, 0.93, 0.93, 1.0)
        wbg.inputs[1].default_value = 1.0

    for (loc, size, name, power) in (
        ((-3.2, -3.4, 3.0), (5.0, 3.5), "SoftboxL", 900),
        ((3.2, -3.4, 3.0), (5.0, 3.5), "SoftboxR", 900),
        ((0.0, 3.0, 4.5), (6.0, 2.0), "Top", 500),
    ):
        bpy.ops.object.light_add(type="AREA", location=loc)
        light = bpy.context.object
        light.name = name
        light.data.size = size[0]
        light.data.size_y = size[1]
        light.data.energy = power
        light.data.color = (1.0, 1.0, 0.98)

    # cámara frontal a la altura de los ojos
    bpy.ops.object.camera_add()
    cam = bpy.context.object
    cam.name = "CamFront"
    target = Vector((0.0, 0.0, 0.85))
    cam.location = Vector((0.0, -4.6, 0.85))
    direction = target - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam

    log("Listo. Malla + simulacion + materiales creados.")


if __name__ == "__main__":
    main()