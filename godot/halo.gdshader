shader_type spatial;
render_mode unshaded,blend_add,depth_draw_never,cull_disabled;
uniform vec4 tint:source_color=vec4(.2,.65,1.,1.);
void vertex(){MODELVIEW_MATRIX=VIEW_MATRIX*mat4(INV_VIEW_MATRIX[0],INV_VIEW_MATRIX[1],INV_VIEW_MATRIX[2],MODEL_MATRIX[3]);}
void fragment(){float r=length(UV-.5)*2.;float glow=pow(max(0.,1.-r),3.)*.7;ALBEDO=tint.rgb;ALPHA=glow*tint.a;}
