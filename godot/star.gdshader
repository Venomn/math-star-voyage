shader_type spatial;
render_mode unshaded;
uniform vec4 tint:source_color=vec4(.5,.8,1.,1.);
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void fragment(){vec2 p=UV*90.;float grain=hash(floor(p+TIME*.1));float wave=sin(UV.y*70.+sin(UV.x*40.+TIME*.1)*2.)*.08;float rim=pow(max(dot(normalize(NORMAL),normalize(VIEW)),0.),.35);ALBEDO=mix(tint.rgb*.65,vec3(.9,.98,1.),rim*.65+grain*.2+wave);}
