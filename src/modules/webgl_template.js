import { mat4, mat3 } from "gl-matrix";
import vertexGlsl from "../shader/vertexShader_shader_language.js";
import fragmentGlsl from "../shader/fragmentShader_shader_language.js";
import { geometryModelDatas } from "./vertexData.js";

//const gl = initContext("gl_context");
let gl;

// The shader program object is also used to
// store attribute and uniform locations.
let prog;

// Array of model objects.
const models = [];

let interactiveModel;

const camera = {
    // Initial position of the camera.
    eye: [0, 1, 4],
    //eye: [0, 0, 0],
    // Point to look at.
    center: [0, 0, 0],
    //center: [0, 0, -1],
    // Roll and pitch of the camera.
    up: [0, 1, 0],
    // Opening angle given in radian.
    // radian = degree*2*PI/360.
    fovy: (60.0 * Math.PI) / 180,
    // Camera near plane dimensions:
    // value for left right top bottom in projection.
    lrtb: 2.0,
    // View matrix.
    // creates identy matrix
    vMatrix: mat4.create(),
    // Projection matrix.
    // creates identy matrix
    pMatrix: mat4.create(),
    // Projection types: ortho, perspective, frustum.
    //projectionType: "ortho",
    projectionType: "perspective",
    // Angle to Z-Axis for camera when orbiting the center
    // given in radian.
    zAngle: 0,
    // Distance in XZ-Plane from center when orbiting.
    distance: 4,
};

function start() {
    init();
    render();
}

function init() {
    initWebGL();
    initShaderProgram();
    initUniforms();
    initModels();
    initEventHandler();
    initPipline();
}

function initWebGL() {
    // Get canvas and WebGL context.
    canvas = document.getElementById("gl_context");
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
}

/**
 * Init pipeline parameters that will not change again.
 * If projection or viewport change, their setup must
 * be in render function.
 */
function initPipline() {
    gl.clearColor(0.95, 0.95, 0.95, 1);

    // Backface culling.
    gl.frontFace(gl.CCW);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Depth(Z)-Buffer.
    gl.enable(gl.DEPTH_TEST);

    // Polygon offset of rastered Fragments.
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(0.5, 0);

    // Set viewport.
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    // Init camera.
    // Set projection aspect ratio.
    camera.aspect = gl.viewportWidth / gl.viewportHeight;
}

function initShaderProgram() {
    // Init vertex shader.
    const vs = initShader(gl.VERTEX_SHADER, vertexGlsl);
    // Init fragment shader.
    const fs = initShader(gl.FRAGMENT_SHADER, fragmentGlsl);
    // Link shader into a shader program.
    prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, "aPosition");
    gl.linkProgram(prog);
    gl.useProgram(prog);
}

/**
 * Create and init shader from source.
 *
 * @parameter shaderType: openGL shader type.
 * @parameter SourceTagId: Id of HTML Tag with shader source.
 * @returns shader object.
 */
function initShader(shaderType, shaderSource) {
    const shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log("Error: " + gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function initUniforms() {
    // Projection Matrix.
    prog.pMatrixUniform = gl.getUniformLocation(prog, "uPMatrix");

    // Model-View-Matrix.
    prog.mvMatrixUniform = gl.getUniformLocation(prog, "uMVMatrix");

    prog.colorUniform = gl.getUniformLocation(prog, "uColor");

    prog.nMatrixUniform = gl.getUniformLocation(prog, "uNMatrix");
}

function initModels() {
    // fill-style
    //const fs = "fillwireframe";
    const fs = "fill";
    //createModel("torus", fs, [0.15, -0.3, -1.5], [0, 0, 0], [1, 1, 1]);
    createModel(
        "plane",
        "wireframe",
        [1.0, 1.0, 1.0, 1.0],
        [0, -0.8, 0],
        [0, 0, 0],
        [1, 1, 1]
    );

    createModel(
        "sphere",
        fs,
        [0, 0, 0, 1],
        [0, 0, 0],
        [0, 0, 0],
        [1.0, 1.0, 1.0]
    );
    createModel(
        "sphere",
        fs,
        [0, 0, 0, 1],
        [0, 0.5, 0.5],
        [0, 0, 0],
        [1.0, 1.0, 1.0]
    );
    createModel(
        "sphere",
        fs,
        [0, 0, 0, 1],
        [0, 1.0, 1.0],
        [0, 0, 0],
        [1.0, 1.0, 1.0]
    );
    createModel(
        "sphere",
        fs,
        [1, 1, 1, 1],
        [0, 1.0, 1.5],
        [0, 0, 0],
        [1.0, 1.0, 1.0]
    );
    interactiveModel = models[0];
}

/**
 * Create model object, fill it and push it in models array.
 *
 * @parameter geometryname: string with name of geometry.
 * @parameter fillstyle: wireframe, fill, fillwireframe.
 */
function createModel(geometryname, fillstyle, color, translate, rotate, scale) {
    const model = {};
    model.fillstyle = fillstyle;
    model.color = color;
    initDataAndBuffers(model, geometryname);
    initTransformations(model, translate, rotate, scale);
    models.push(model);
}

function initTransformations(model, translate, rotate, scale) {
    model.translate = translate;
    model.rotate = rotate;
    model.scale = scale;
    // mMatrix - ist Model Matrix
    model.mMatrix = mat4.create();
    //mvMatrix - ist ModelView Matrix
    model.mvMatrix = mat4.create();

    model.nMatrix = mat3.create();
}

function updateTransformations(model) {
    let mMatrix = model.mMatrix;
    let mvMatrix = model.mvMatrix;
    //mat4.copy(mvMatrix, camera.vMatrix);
    mat4.identity(mMatrix);
    mat4.identity(mvMatrix);

    mat4.translate(mMatrix, mMatrix, model.translate);
    //mat4.rotateZ(mMatrix, mMatrix, model.rotate[2]);
    //mat4.rotateY(mMatrix, mMatrix, model.rotate[1]);
    mat4.rotateX(mMatrix, mMatrix, model.rotate[0]);
    mat4.rotateY(mMatrix, mMatrix, model.rotate[1]);
    mat4.rotateZ(mMatrix, mMatrix, model.rotate[2]);
    mat4.scale(mMatrix, mMatrix, model.scale);

    mat4.multiply(mvMatrix, camera.vMatrix, mMatrix);

    // Calculate normal matrix from model-view matrix.
    mat3.normalFromMat4(model.nMatrix, mvMatrix);
}

/**
 * Init data and buffers for model object.
 *
 * @parameter model: a model object to augment with data.
 * @parameter geometryname: string with name of geometry.
 */
function initDataAndBuffers(model, geometryname) {
    // Provide model object with vertex data arrays.
    // Fill data arrays for Vertex-Positions, Normals, Index data:
    // vertices, normals, indicesLines, indicesTris;
    // Pointer this refers to the window.
    //this[geometryname]["createVertexData"].apply(model);
    for (let i = 0; i < geometryModelDatas.length; i++) {
        if (geometryModelDatas[i].description === geometryname) {
            geometryModelDatas[i].function.apply(model);
        }
    }

    // Setup position vertex buffer object.
    model.vboPos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vboPos);
    gl.bufferData(gl.ARRAY_BUFFER, model.vertices, gl.STATIC_DRAW);
    // Bind vertex buffer to attribute variable.
    prog.positionAttrib = gl.getAttribLocation(prog, "aPosition");
    gl.enableVertexAttribArray(prog.positionAttrib);

    // Setup normal vertex buffer object.
    model.vboNormal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vboNormal);
    gl.bufferData(gl.ARRAY_BUFFER, model.normals, gl.STATIC_DRAW);
    // Bind buffer to attribute variable.
    prog.normalAttrib = gl.getAttribLocation(prog, "aNormal");
    gl.enableVertexAttribArray(prog.normalAttrib);

    // Setup lines index buffer object.
    model.iboLines = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboLines);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.indicesLines, gl.STATIC_DRAW);
    model.iboLines.numberOfElements = model.indicesLines.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // Setup triangle index buffer object.
    model.iboTris = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboTris);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.indicesTris, gl.STATIC_DRAW);
    model.iboTris.numberOfElements = model.indicesTris.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

function initEventHandler() {
    const deltaRotate = Math.PI / 36;
    const deltaTranslate = 0.05;
    const x = 0,
        y = 1,
        z = 2;
    window.onkeydown = function (evt) {
        const sign = evt.shiftKey ? 1 : -1;
        const key = evt.which ? evt.which : evt.keyCode;
        const c = String.fromCharCode(key);

        // Change projection of scene.
        switch (c) {
            //case "O":
            //camera.projectionType = "ortho";
            //camera.lrtb = 2;
            //break;
            //case "P":
            //camera.projectionType = "perspective";
            //break;
            case "F":
                //camera.projectionType = "frustum";
                //camera.lrtb = 1.2;
                break;
            case "%":
                camera.zAngle -= deltaRotate;
                interactiveModel.rotate[1] -= deltaRotate;
                break;
            case "'":
                camera.zAngle += deltaRotate;
                interactiveModel.rotate[1] += deltaRotate;
                break;
            //case "N":
            //camera.distance += sign * deltaTranslate;
            //case "H":
            //camera.eye[y] += -sign * deltaTranslate;
            //break;
            case "N":
                // Camera near plane dimensions.
                camera.lrtb += sign * 0.1;
                camera.distance += sign * deltaTranslate;
                break;
            //            case "D":
            //                camera.eye[x] += deltaTranslate;
            //                camera.center[x] += deltaTranslate;
            //                break;
            //
            //            case "A":
            //                camera.eye[x] -= deltaTranslate;
            //                camera.center[x] -= deltaTranslate;
            //                break;

            //            case "W":
            //                camera.eye[y] += deltaTranslate;
            //                camera.center[y] += deltaTranslate;
            //                break;
            //
            //            case "S":
            //                camera.eye[y] -= deltaTranslate;
            //                camera.center[y] -= deltaTranslate;
            //                break;
            //
            //            case "X":
            //                interactiveModel.rotate[0] += sign * deltaRotate;
            //                break;
            //
            //            case "Y":
            //                interactiveModel.rotate[1] += sign * deltaRotate;
            //                break;

            //            case "Z":
            //                interactiveModel.rotate[2] += sign * deltaRotate;
            //                break;
            //            case "K":
            //interactiveModel = models[0];
            //interactiveModel.translate[2] = -1.5 * Math.cos(camera.zAngle);
            //interactiveModel.translate[0] = -1.5 * Math.sin(camera.zAngle);
            //interactiveModel = models[1];
            //camera.zAngle += deltaRotate;
            //don't rotate the pane
            //interactiveModel.rotate[1] += deltaRotate;
            //break;

            default:
        }

        // Render the scene again on any key pressed.
        render();
    };
}

/**
 * Run the rendering pipeline.
 */
function render() {
    // Clear framebuffer and depth-/z-buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // setze Projektionsmatrix camera.pMatrix (orthogonal, perspektivisch etc.)
    setProjection();

    //mat4.identity(camera.vMatrix);
    //mat4.rotate(camera.vMatrix, camera.vMatrix, (Math.PI * 1) / 8, [1, 0, 0]);
    // Kreisbahn der Kamera
    // Anpassung der x und z koordinaten
    calculateCameraOrbit();
    //1. Parameter - out -> Ergebniss der 4x4 Matrix wird in out geschrieben
    //2. Parameter - eye -> virtuelle Position der Kamera
    //3. Parameter - center -> der Punkt auf den die Kamera schaut
    //4. Parameter - up -> kann Kamera um die Achse des Objektives gedreht werden
    //eye(0, 1, 4), center(0, 0, 0), up(0, 1, 0)
    mat4.lookAt(camera.vMatrix, camera.eye, camera.center, camera.up);

    // Loop over models.
    for (let i = 0; i < models.length; i++) {
        updateTransformations(models[i]);
        // Update modelview for model.
        // kopiert die Camera-Matrix in die Model-View-Matrix
        //mat4.copy(models[i].mvMatrix, camera.vMatrix);
        //mat4.scale(models[i].mvMatrix, models[i].mvMatrix, models[i].scale);
        //mat4.rotate(models[i].mvMatrix, models[i].mvMatrix, models[i].rotate);

        //mat4.translate(
        //models[i].mvMatrix,
        //models[i].mvMatrix,
        //models[i].translate
        //);
        //mat4.scale(models[i].mvMatrix, models[i].mvMatrix, models[i].scale);

        // Set uniforms for model.
        // binde die Model-View-Matrix zur Transformation der Vertex Welt-Koordinaten
        // in Kamera Koordinaten
        gl.uniformMatrix4fv(prog.mvMatrixUniform, false, models[i].mvMatrix);
        gl.uniform4fv(prog.colorUniform, models[i].color);
        gl.uniformMatrix3fv(prog.nMatrixUniform, false, models[i].nMatrix);
        draw(models[i]);
    }
}

function calculateCameraOrbit() {
    // Calculate x,z position/eye of camera orbiting the center.
    // Kreisbahn um das Objekt
    const x = 0,
        z = 2;
    camera.eye[x] = camera.center[x];
    camera.eye[z] = camera.center[z];
    // camera.distance ist der Radius des Kreises (der Kamera-Kreisbahn)
    camera.eye[x] += camera.distance * Math.sin(camera.zAngle);
    camera.eye[z] += camera.distance * Math.cos(camera.zAngle);
}

function setProjection() {
    // Set projection Matrix.
    switch (camera.projectionType) {
        case "ortho":
            const v = camera.lrtb;
            mat4.ortho(camera.pMatrix, -v, v, -v, v, -10, 10);
            break;
        case "perspective":
            mat4.perspective(camera.pMatrix, camera.fovy, camera.aspect, 1, 10);
            break;

        case "frustum":
            const f = camera.lrtb;
            mat4.frustum(camera.pMatrix, -f / 2, f / 2, -f / 2, f / 2, 1, 10);
            break;
        default:
    }
    // Set projection uniform.
    gl.uniformMatrix4fv(prog.pMatrixUniform, false, camera.pMatrix);
}

function draw(model) {
    // Setup position VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vboPos);
    gl.vertexAttribPointer(prog.positionAttrib, 3, gl.FLOAT, false, 0, 0);

    // Setup normal VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vboNormal);
    gl.vertexAttribPointer(prog.normalAttrib, 3, gl.FLOAT, false, 0, 0);

    // Setup rendering tris.
    const fill = model.fillstyle.search(/fill/) != -1;
    if (fill) {
        gl.enableVertexAttribArray(prog.normalAttrib);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboTris);
        gl.drawElements(
            gl.TRIANGLES,
            model.iboTris.numberOfElements,
            gl.UNSIGNED_SHORT,
            0
        );
    }

    // Setup rendering lines.
    const wireframe = model.fillstyle.search(/wireframe/) != -1;
    if (wireframe) {
        gl.disableVertexAttribArray(prog.normalAttrib);
        gl.vertexAttrib3f(prog.normalAttrib, 0, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboLines);
        gl.drawElements(
            gl.LINES,
            model.iboLines.numberOfElements,
            gl.UNSIGNED_SHORT,
            0
        );
    }
}

export { start };
