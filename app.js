const canvas = document.getElementById('shader-canvas');
const gl = canvas.getContext('webgl');
const noiseFactorInput = document.getElementById('noise-factor');
const timeSpeedInput = document.getElementById('time-speed');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let program, timeLocation, resolutionLocation, noiseFactorLocation, timeSpeedLocation;

// Vertex shader program
const vertexShaderSource = `
attribute vec4 aVertexPosition;
void main(void) {
    gl_Position = aVertexPosition;
}
`;

// Fragment shader program
const fragmentShaderSource = `precision mediump float;
uniform float time;
uniform float noiseFactor;
uniform float timeSpeed;
uniform vec2 resolution;

vec2 hash(vec2 p) {
    p = vec2(dot(p,vec2(127.1,311.7)),
             dot(p,vec2(269.5,183.3)));
    return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise(in vec2 p) {
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;
    vec2 i = floor(p + (p.x + p.y)*K1);
    vec2 a = p - i + (i.x + i.y)*K2;
    vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0*K2;
    vec3 h = max(0.5 - vec3(dot(a,a), dot(b,b), dot(c,c)), 0.0);
    vec3 n = h*h*h*h*vec3(dot(a,hash(i + 0.0)), dot(b,hash(i + o)), dot(c,hash(i + 1.0)));
    return dot(n, vec3(70.0));
}

void main(void) {
    vec2 uv = gl_FragCoord.xy / resolution;
    float n = noise(uv * noiseFactor + time * timeSpeed * 0.1);
    vec3 color = vec3(n);
    gl_FragColor = vec4(color, 1.0);
}`;

// Initialize shaders
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

// Load shader
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

// Initialize WebGL
function initWebGL() {
    program = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);

    timeLocation = gl.getUniformLocation(program, 'time');
    resolutionLocation = gl.getUniformLocation(program, 'resolution');
    noiseFactorLocation = gl.getUniformLocation(program, 'noiseFactor');
    timeSpeedLocation = gl.getUniformLocation(program, 'timeSpeed');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
        -1.0,  1.0,
        1.0,  1.0,
        -1.0, -1.0,
        1.0, -1.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const vertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
    gl.enableVertexAttribArray(vertexPosition);
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
}

// Draw scene
function drawScene() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1f(timeLocation, performance.now() / 1000);
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(noiseFactorLocation, parseFloat(noiseFactorInput.value));
    gl.uniform1f(timeSpeedLocation, parseFloat(timeSpeedInput.value));

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(drawScene);
}

// Initialize everything
initWebGL();
drawScene();

// Update shader when inputs change
noiseFactorInput.addEventListener('input', updateShader);
timeSpeedInput.addEventListener('input', updateShader);

function updateShader() {
    gl.deleteProgram(program);
    const fragmentShaderSource = shaderCodeInput.value;
    program = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);

    timeLocation = gl.getUniformLocation(program, 'time');
    resolutionLocation = gl.getUniformLocation(program, 'resolution');
    noiseFactorLocation = gl.getUniformLocation(program, 'noiseFactor');
    timeSpeedLocation = gl.getUniformLocation(program, 'timeSpeed');

    const vertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
    gl.enableVertexAttribArray(vertexPosition);
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
}
