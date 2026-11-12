extends Node3D
var camera: Camera3D
var system: Node3D
var planets: Array = []
var labels: Array = []
var sector := 0
var yaw := 0.25
var pitch := 0.62
var distance := 56.0
var target := Vector3.ZERO
var drag := false
var flying := false
var paused := false
var warping := false
var speed := 0.0
var touch_turn := 0.0
var touch_thrust := 0.0
var heading := -0.8
var elapsed := 0.0
var tick := 0.0
var callback: JavaScriptObject
var mastered: Array = []
var buildings: Dictionary = {}
var colors := [Color("55cedb"),Color("aa98fa"),Color("f3bd73"),Color("87e3b4")]
var ids := [["count","fraction","signed","power","expr","factor"],["equation","system","ineq","quad","linear","inverse","parabola"],["angle","triangle","pyth","similar","circle"],["stats","prob"]]

func _ready():
	var world := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("020611")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("678fbd")
	env.ambient_light_energy = 0.45
	world.environment = env
	add_child(world)
	camera = Camera3D.new()
	camera.fov = 48
	camera.far = 1000
	camera.near = 0.1
	add_child(camera)
	make_stars()
	build_system(0)
	if OS.has_feature("web"):
		callback = JavaScriptBridge.create_callback(_on_message)
		JavaScriptBridge.get_interface("window").addEventListener("message",callback)
		emit_web({"type":"ready"})

func mat(color: Color, glow := false) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	if glow:
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	else:
		m.metallic = 0.5
		m.roughness = 0.4
	return m

func sphere(radius: float, material: Material, parent: Node3D) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = radius * 2
	mesh.radial_segments = 48
	mesh.rings = 24
	node.mesh = mesh
	node.material_override = material
	parent.add_child(node)
	return node

func halo(parent: Node3D, radius: float, color: Color):
	var h := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2.ONE * radius
	h.mesh = q
	var m := ShaderMaterial.new()
	m.shader = load("res://halo.gdshader")
	m.set_shader_parameter("tint",color)
	h.material_override = m
	parent.add_child(h)

func orbit(radius: float, color: Color, parent: Node3D):
	var im := ImmediateMesh.new()
	im.surface_begin(Mesh.PRIMITIVE_LINE_STRIP, mat(color,true))
	for i in range(181):
		var angle := TAU * i / 180.0
		im.surface_add_vertex(Vector3(cos(angle)*radius,0,sin(angle)*radius))
	im.surface_end()
	var n := MeshInstance3D.new()
	n.mesh = im
	parent.add_child(n)

func star_material(color: Color) -> ShaderMaterial:
	var m := ShaderMaterial.new()
	m.shader = load("res://star.gdshader")
	m.set_shader_parameter("tint",color)
	return m

func make_stars():
	var rng := RandomNumberGenerator.new()
	rng.seed = 32133
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	var sm := SphereMesh.new()
	sm.radius = 0.18
	sm.height = 0.36
	sm.radial_segments = 4
	sm.rings = 2
	mm.mesh = sm
	mm.instance_count = 1800
	for i in range(1800):
		var direction := Vector3(rng.randf_range(-1,1),rng.randf_range(-1,1),rng.randf_range(-1,1)).normalized()
		var scale_star := rng.randf_range(0.4,2.2)
		mm.set_instance_transform(i,Transform3D(Basis.IDENTITY.scaled(Vector3.ONE*scale_star),direction*rng.randf_range(160,300)))
		mm.set_instance_color(i,Color.from_hsv(rng.randf_range(.5,.7),rng.randf_range(.05,.45),rng.randf_range(.5,1)))
	var instance := MultiMeshInstance3D.new()
	instance.multimesh = mm
	var m := mat(Color.WHITE,true)
	m.vertex_color_use_as_albedo = true
	instance.material_override = m
	add_child(instance)
	# Distant colored nebula clouds, generated without bitmap assets.
	for i in range(7):
		var n := Node3D.new()
		add_child(n)
		n.position = Vector3(-100+i*30,35+sin(i)*20,-140)
		halo(n,150,Color(.16,.20,.48,.7))

func build_system(index: int):
	sector = index
	if is_instance_valid(system):
		system.queue_free()
	system = Node3D.new()
	add_child(system)
	planets.clear()
	labels.clear()
	var star_color: Color = colors[index]
	var sun := sphere(2.4,star_material(star_color),system)
	halo(sun,25,Color(star_color,.55))
	halo(sun,11,Color(star_color,.8))
	var light := OmniLight3D.new()
	light.light_color = star_color.lightened(.7)
	light.light_energy = 3.5
	light.omni_range = 90
	system.add_child(light)
	var fill := DirectionalLight3D.new()
	fill.rotation_degrees = Vector3(-35,-40,0)
	fill.light_energy = 1.0
	fill.light_color = Color("a4c8ee")
	system.add_child(fill)
	var count: int = ids[index].size()
	for i in range(count):
		var radius := 7.0 + i*3.5
		orbit(radius,Color("203b50"),system)
		var angle := .5+i*2.36+index*.6
		var pivot := Node3D.new()
		system.add_child(pivot)
		pivot.position = Vector3(cos(angle)*radius, sin(i*2.)*.7, sin(angle)*radius)
		var material := ShaderMaterial.new()
		material.shader = load("res://planet.gdshader")
		var c := Color.from_hsv(fmod(.48+i*.115+index*.14,1.0),.60,.65)
		material.set_shader_parameter("ocean",c.darkened(.7))
		material.set_shader_parameter("land",c.lightened(.15))
		material.set_shader_parameter("seed",float(i+index*10))
		material.set_shader_parameter("gas",i%3==2)
		var size_planet := 1.05+fmod(i*.47,1.1)
		var planet := sphere(size_planet,material,pivot)
		planet.rotation.z = .18
		halo(pivot,size_planet*3.8,Color(c,.25))
		if i%3==2:
			var ring := MeshInstance3D.new()
			var torus := TorusMesh.new()
			torus.inner_radius = size_planet*1.4
			torus.outer_radius = size_planet*2.15
			ring.mesh = torus
			ring.scale.y = .025
			ring.rotation.z = .28
			ring.material_override = mat(c.lightened(.2),true)
			pivot.add_child(ring)
		var beacon := Node3D.new()
		pivot.add_child(beacon)
		orbit(size_planet*1.3,Color("b9f2a0"),beacon)
		beacon.visible = mastered.has(ids[index][i])
		var city := Node3D.new()
		pivot.add_child(city)
		planets.append({"city":city,"city_count":-1,"node":planet,"pivot":pivot,"id":ids[index][i],"radius":size_planet,"beacon":beacon})
	update_buildings()
	target = Vector3.ZERO
	distance = 56.0
	flying = false
	emit_web({"type":"arrived","sector":index})

func _on_message(args: Array):
	var event = args[0]
	if str(event.origin) != str(JavaScriptBridge.get_interface("window").location.origin):
		return
	var data = JSON.parse_string(str(event.data))
	if not data is Dictionary:
		return
	match data.get("type",""):
		"sector":
			var index := int(data.get("sector",0))
			if index>=0 and index<4:
				if data.get("animate",false):
					warp(index)
				else:
					build_system(index)
		"overview":
			flying = false
			target = Vector3.ZERO
			distance = 56
		"pause":
			paused = bool(data.get("value",false))
		"focus":
			for p in planets:
				if p.id == data.get("id"):
					target = p.pivot.position + Vector3(0,0.8,0)
					distance = 10
		"controls":
			touch_turn = float(data.get("turn",0))
			touch_thrust = float(data.get("thrust",0))
		"buildings":
			buildings = data.get("counts",{})
			update_buildings()
		"mastered":
			mastered = data.get("ids",[])
			for p in planets:
				p.beacon.visible = mastered.has(p.id)

func emit_web(data: Dictionary):
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.parent.postMessage("+JSON.stringify(JSON.stringify(data))+",window.location.origin)")

func warp(index: int):
	if warping:
		return
	warping = true
	flying = false
	emit_web({"type":"warp_started"})
	var tween := create_tween()
	tween.tween_property(camera,"fov",62.0,0.3)
	await tween.finished
	build_system(index)
	camera.fov = 62
	var settle := create_tween()
	settle.tween_property(camera,"fov",48.0,0.4)
	await settle.finished
	warping = false
	emit_web({"type":"warp_done"})

func _input(event):
	if paused or warping:
		return
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT or event.button_index == MOUSE_BUTTON_RIGHT:
			drag = event.pressed
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			distance = maxf(12,distance-3)
		if event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			distance = minf(90,distance+3)
	if event is InputEventMouseMotion and drag:
		yaw -= event.relative.x*.005
		pitch = clampf(pitch+event.relative.y*.004,.12,1.35)
	if event is InputEventScreenDrag:
		yaw -= event.relative.x*.005
		pitch = clampf(pitch+event.relative.y*.004,.12,1.35)

func _process(delta):
	elapsed += delta
	if not paused:
		for p in planets:
			p.node.rotation.y += delta*.045
	var offset := Vector3(sin(yaw)*cos(pitch),sin(pitch),cos(yaw)*cos(pitch))*distance
	camera.position = camera.position.lerp(target+offset,minf(1,delta*5))
	camera.look_at(target,Vector3.UP)
	tick += delta
	if tick > .07:
		tick = 0
		var pins := []
		var viewport_size := get_viewport().get_visible_rect().size
		for p in planets:
			var point: Vector3 = p.pivot.global_position+Vector3(0,p.radius+0.6+(minf(float(p.city_count),4.0)+clampf(float(p.city_count)-12.0,0.0,8.0))*0.34,0)
			var screen := camera.unproject_position(point)
			pins.append({"id":p.id,"x":screen.x/viewport_size.x,"y":screen.y/viewport_size.y,"visible":not camera.is_position_behind(point)})
		emit_web({"type":"positions","pins":pins,"speed":roundf(absf(speed)*10),"flying":flying})

func block(size: Vector3, color: Color, parent: Node3D, position_value: Vector3, glow := false) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var shape := BoxMesh.new()
	shape.size = size
	node.mesh = shape
	node.material_override = mat(color,glow)
	node.position = position_value
	parent.add_child(node)
	return node

func update_buildings():
	for p in planets:
		var count := clampi(int(buildings.get(p.id,0)),0,36)
		if p.city_count == count:
			continue
		var previous: int = p.city_count
		p.city_count = count
		for child in p.city.get_children():
			p.city.remove_child(child)
			child.queue_free()
		for tower in range(3):
			var floors := clampi(count-tower*4,0,4)+clampi(count-12-tower*8,0,8)
			if floors <= 0:
				continue
			var x: float = [0.0,-0.62,0.62][tower]
			var z := -0.15 if tower==1 else 0.25
			var ground := sqrt(maxf(0.1,p.radius*p.radius-x*x-z*z))
			block(Vector3(0.6,0.08,0.6),Color("729d88"),p.city,Vector3(x,ground,z))
			for floor_index in range(floors):
				var unit := Node3D.new()
				p.city.add_child(unit)
				unit.position = Vector3(x,ground+0.06+floor_index*0.36,z)
				var colors_city := [Color("f4deaf"),Color("9cdbce"),Color("eeb0a0")]
				block(Vector3(0.48,0.34,0.48),colors_city[tower],unit,Vector3(0,0.17,0))
				for window_x in [-0.12,0.12]:
					block(Vector3(0.09,0.12,0.018),Color("fff3a3"),unit,Vector3(window_x,0.19,0.249),true)
				if previous >= 0 and count > previous and (tower*4+floor_index if floor_index<4 else 12+tower*8+floor_index-4) >= previous:
					unit.scale = Vector3.ONE*0.01
					create_tween().tween_property(unit,"scale",Vector3.ONE,0.55).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
			var roof := MeshInstance3D.new()
			var cone := CylinderMesh.new()
			cone.top_radius = 0
			cone.bottom_radius = 0.43
			cone.height = 0.3
			cone.radial_segments = 4
			roof.mesh = cone
			roof.material_override = mat(Color("466f8a"))
			roof.rotation.y = PI/4
			roof.position = Vector3(x,ground+0.06+floors*0.36+0.13,z)
			p.city.add_child(roof)
