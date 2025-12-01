// Vertex shader for volumetric atmosphere
varying vec3 vWorldPosition;
varying vec3 vViewDirection;

void main() {
  // Pass world position to fragment shader
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  
  // View direction from camera to this vertex
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vViewDirection = normalize(worldPosition.xyz - cameraPosition);
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
