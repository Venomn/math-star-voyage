shader_type spatial;
render_mode diffuse_burley;
uniform vec4 ocean: source_color = vec4(.025,.12,.25,1.);
uniform vec4 land: source_color = vec4(.1,.45,.4,1.);
uniform float seed=0.0;
uniform bool gas=false;
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 p){vec3 i=floor(p);vec3 f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
void fragment(){vec3 p=normalize(VERTEX);vec3 uv=vec3(UV*vec2(12.,6.),seed);float n=noise(uv)*.6+noise(uv*2.)*.27+noise(uv*4.)*.13;float band=gas?sin(UV.y*75.+n*8.)*.5+.5:smoothstep(.43,.59,n);vec3 col=mix(ocean.rgb,land.rgb,band);float clouds=smoothstep(.65,.83,noise(uv+vec3(TIME*.008,0,12.))+noise(uv*3.)*.18);col=mix(col,vec3(.8,.9,1.),clouds*.5);float ice=smoothstep(.87,.99,abs(UV.y-.5)*2.);ALBEDO=mix(col,vec3(.7,.85,.9),ice*.7);ROUGHNESS=.85;EMISSION=col*.11;}
