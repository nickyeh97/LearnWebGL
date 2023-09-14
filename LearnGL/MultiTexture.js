var V = `#version 300 es
	in vec4 a_Position;
	in vec2 a_TexCoord;

	uniform vec2 projectionVector;
	uniform vec2 offsetVector;

	out vec2 v_TexCoord;

	void main(void) {
		gl_Position = a_Position;
		v_TexCoord = a_TexCoord;
	}
`;

// Fragment shader program
var F1 = `#version 300 es
	precision mediump float;

	in vec2 v_TexCoord;
	// layout (location = 2) out vec4 FragColor;
	out vec4 FragColor;

	uniform sampler2D u_Sampler0;
	uniform sampler2D u_Sampler1;

	void main(void) {
		
		vec4 color0 = texture(u_Sampler0, v_TexCoord);
		vec4 color1 = texture(u_Sampler1, v_TexCoord);
		FragColor = color0 * color1;
	}
`;

var F2 = `#version 300 es
precision mediump float;

in vec2 v_TexCoord;
out vec4 FragColor;

uniform sampler2D u_Sampler;

void main(void) {
	vec4 color0 = texture(u_Sampler, v_TexCoord);
	FragColor = color0;
}
`;

function main() {
	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	var gl = getWebGLContext(canvas);
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	if (!initShaders(gl, V, F1)) {
		console.log('Failed to intialize shaders.');
		return;
	}

	// Set the vertex information
	var n = initVertexBuffers(gl);
	if (n < 0) {
		console.log('Failed to set the vertex information');
		return;
	}

	// Specify the color for clearing <canvas>
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	const fbo = initFramebufferObject(gl);

	// Set texture
	if (!initTextures(gl, n, fbo)) {
		console.log('Failed to intialize the texture.');
		return;
	}
}

function draw(gl, fbo, n) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Change the drawing destination to color buffer
	
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT); // Clear the color buffer

	gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
}
function initVertexBuffers(gl) {
	var verticesTexCoords = new Float32Array([
		// Vertex coordinate, Texture coordinate
		-0.5, 0.5, 0.0, 1.0,
		-0.5, -0.5, 0.0, 0.0,
		0.5, 0.5, 1.0, 1.0,
		0.5, -0.5, 1.0, 0.0,
	]);
	var n = 4; // The number of vertices

	// Create a buffer object
	var vertexTexCoordBuffer = gl.createBuffer();
	if (!vertexTexCoordBuffer) {
		console.log('Failed to create the buffer object');
		return -1;
	}

	// Write the positions of vertices to a vertex shader
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

	var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
	//Get the storage location of a_Position, assign and enable buffer
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position');
		return -1;
	}
	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
	gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

	// Get the storage location of a_TexCoord
	var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
	if (a_TexCoord < 0) {
		console.log('Failed to get the storage location of a_TexCoord');
		return -1;
	}
	gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
	gl.enableVertexAttribArray(a_TexCoord);  // Enable the buffer assignment

	return n;
}

var fb;
var fb2;
var rb;

function loaded(image) {
	return new Promise((resolve) => {
		image.onload = () => {
			resolve();
		};
	});
}

function initTextures(gl, n, fbo) {
	// Create a texture object
	var texture0 = gl.createTexture();
	var texture1 = gl.createTexture();

	// Get the storage location of u_Sampler0 and u_Sampler1
	var u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
	var u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
	
	// Create the image object
	var image0 = new Image();
	var image1 = new Image();
	
	const p = [loaded(image0), loaded(image1)];

	Promise.all(p).then(() => {
		gl.uniform1i(u_Sampler0, 0);
		gl.uniform1i(u_Sampler1, 1);

		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		gl.clearColor(0.2, 0.2, 0.4, 1.0); // Set clear color (the color is slightly changed)
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear FBO

		gl.activeTexture(gl.TEXTURE0);
		loadTexture(gl, n, texture0, u_Sampler0, image0, 0);
		gl.activeTexture(gl.TEXTURE1);
		loadTexture(gl, n, texture1, u_Sampler1, image1, 1);

		draw(gl, fbo, n)
		// ??
		// gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);

		// gl.clear(gl.COLOR_BUFFER_BIT);
		// gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);   // Draw the rectangle
		// gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// fb2 = gl.createFramebuffer();

		// gl.activeTexture(gl.TEXTURE2);
		// var output = outputTexture(gl);
		// gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);
		// gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		// if (!initShaders(gl, V, F2)) {
		// 	console.log('Failed to intialize shaders2.');
		// 	return;
		// }
		// gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
		// var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
		// gl.uniform1i(u_Sampler, 2);
		// gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		// gl.clear(gl.COLOR_BUFFER_BIT);
		// gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);   // Draw the rectangle


	});
	// Tell the browser to load an Image
	image0.crossOrigin = 'anonymous';
	image1.crossOrigin = 'anonymous';
	image0.src = 'http://127.0.0.1:5500/LearnGL/imgs/7herbs.jpg';
	image1.src = 'http://127.0.0.1:5500/LearnGL/imgs/blueflower.jpg';
	return true;
}
// Specify whether the texture unit is ready to use
var g_texUnit0 = false, g_texUnit1 = false;

function outputTexture(gl) {
	// create to render to
	const targetTextureWidth = 256;
	const targetTextureHeight = 256;
	const targetTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, targetTexture);
	{
		// define size and format of level 0
		const level = 0;
		const internalFormat = gl.RGBA;
		const border = 0;
		const format = gl.RGBA;
		const type = gl.UNSIGNED_BYTE;
		const data = null;
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
			targetTextureWidth, targetTextureHeight, border,
			format, type, data);

		// set the filtering so we don't need mips
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}
	return targetTexture;
}

function finalTexture(gl) {
	// create to render to
	const targetTextureWidth = 256;
	const targetTextureHeight = 256;
	const targetTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, targetTexture);
	{
		// define size and format of level 0
		const level = 0;
		const internalFormat = gl.RGBA;
		const border = 0;
		const format = gl.RGBA;
		const type = gl.UNSIGNED_BYTE;
		const data = null;
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
			targetTextureWidth, targetTextureHeight, border,
			format, type, data);

		// set the filtering so we don't need mips
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}
	return targetTexture;
}
// Specify whether the texture unit is ready to use
var g_texUnit0 = false, g_texUnit1 = false; 
function loadTexture(gl, n, texture, u_Sampler, image, texUnit, output) {
	if (texUnit == 0) {
		g_texUnit0 = true;
	} else {
		g_texUnit1 = true;
	}
	// Flip Y axio
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
	// Bind the texture object to the target
	gl.bindTexture(gl.TEXTURE_2D, texture);
	// Set texture parameters
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	// Set the image to texture
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

	gl.uniform1i(u_Sampler, texUnit);   // Pass the texure unit to u_Sampler

	if (g_texUnit0 && g_texUnit1) {
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
	}
}

function initFramebufferObject(gl) {
	var framebuffer, texture;

	// 1. Create a frame buffer object (FBO)
	framebuffer = gl.createFramebuffer();

	// 2. Create a texture object and set its size and parameters
	texture = gl.createTexture();
	
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 600, 600, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	// Store the texture object into FBO
	framebuffer.texture = texture; 

	// 3. Attach the texture object to the color attachment of the framebuffer object
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	// WebGL COLOR_ATTACHMENT only cab be COLOR_ATTACHMENT0, OpenGL can be more (COLOR_ATTACHMENT0~8)
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0 /* level (MIPMAP tex level)*/);
	
	// 4. Check if FBO is configured correctly
	var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
	if (gl.FRAMEBUFFER_COMPLETE !== e) {
		console.log('Frame buffer object is incomplete: ' + e.toString());
		return error();
	}

	// Unbind the buffer object
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindTexture(gl.TEXTURE_2D, null);


	return framebuffer;
}
