attribute vec3 a_position;
uniform vec3 u_offset;

void main() {
    gl_Position = a_position + u_offset;
}