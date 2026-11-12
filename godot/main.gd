extends Node3D
var camera: Camera3D
var system: Node3D
var ship: Node3D
var engine: MeshInstance3D
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
	make_ship()
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

func make_ship():
	ship = Node3D.new()
	add_child(ship)
	var hull := MeshInstance3D.new()
	var cone := CylinderMesh.new()
	cone.top_radius = 0
	cone.bottom_radius = 0.35
	cone.height = 1.7
	hull.mesh = cone
	hull.material_override = mat(Color("dbe6f1"))
	hull.rotation.x = -PI/2
	ship.add_child(hull)
	var wings := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(1.7,.08,.55)
	wings.mesh = box
	wings.material_override = mat(Color("7597b7"))
	wings.position.z = .35
	ship.add_child(wings)
	engine = sphere(.19,mat(Color("74e6ff"),true),ship)
	engine.position.z = .9
	halo(engine,2.5,Color(.1,.7,1.,.8))

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
		planets.append({"node":planet,"pivot":pivot,"id":ids[index][i],"radius":size_planet,"beacon":beacon})
	ship.position = Vector3(8,2,11)
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
		"fly":
			flying = not flying
			emit_web({"type":"mode","flying":flying})
		"overview":
			flying = false
			target = Vector3.ZERO
			distance = 56
		"pause":
			paused = bool(data.get("value",false))
		"focus":
			for p in planets:
				if p.id == data.get("id"):
					target = p.pivot.position
					distance = 17
		"controls":
			touch_turn = float(data.get("turn",0))
			touch_thrust = float(data.get("thrust",0))
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
	tween.tween_property(camera,"fov",100.0,1.0)
	tween.parallel().tween_property(ship,"position",ship.position+Vector3(0,10,-90),1.8)
	await tween.finished
	build_system(index)
	camera.fov = 75
	var settle := create_tween()
	settle.tween_property(camera,"fov",48.0,1.1)
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
		if flying and not warping:
			var turn := float(Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT))-float(Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT))
			var thrust := float(Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP))-float(Input.is_physical_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN))
			heading -= (turn+touch_turn)*delta*1.5
			speed = move_toward(speed,(thrust+touch_thrust)*13,delta*7)
			ship.position += Vector3(sin(heading),0,-cos(heading))*speed*delta
			ship.position = ship.position.limit_length(65)
			ship.rotation.y = -heading
			target = target.lerp(ship.position,delta*2)
			distance = lerpf(distance,12,delta*2)
		else:
			ship.position.y = 2+sin(elapsed)*.16
	engine.scale = Vector3(1,1,1+absf(speed)*.15)
	var offset := Vector3(sin(yaw)*cos(pitch),sin(pitch),cos(yaw)*cos(pitch))*distance
	camera.position = camera.position.lerp(target+offset,minf(1,delta*5))
	camera.look_at(target,Vector3.UP)
	tick += delta
	if tick > .07:
		tick = 0
		var pins := []
		var viewport_size := get_viewport().get_visible_rect().size
		for p in planets:
			var point: Vector3 = p.pivot.global_position+Vector3(0,p.radius+0.6,0)
			var screen := camera.unproject_position(point)
			pins.append({"id":p.id,"x":screen.x/viewport_size.x,"y":screen.y/viewport_size.y,"visible":not camera.is_position_behind(point)})
		emit_web({"type":"positions","pins":pins,"speed":roundf(absf(speed)*10),"flying":flying})
