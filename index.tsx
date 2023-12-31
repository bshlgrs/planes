
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { PhysicsSystem } from './physics';
import { Sky } from 'three/addons/objects/Sky.js';


import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaceGraphics } from './faceGraphics';
import { LabelGraphics } from './labelGraphics';
import { ParticleGraphics } from './particleGraphics';
import { FulcrumGraphics } from './fulcrumGraphics';
import { SpringGraphics } from './springGraphics';
import { MyAirplane } from './myAirplane';
import { Airplane, Spring, Face, Engine, MAX_THRUST } from './airplaneBuilder';
import { MagicInput } from './magicInput';

import Editor from "@monaco-editor/react";
// import Editor from 'react-simple-code-editor';
// import { highlight, languages } from 'prismjs/components/prism-core';
// import 'prismjs/components/prism-clike';
// import 'prismjs/components/prism-javascript';
// import 'prismjs/themes/prism.css'; //Example style, you can use another


// import CodeEditor from '@uiw/react-textarea-code-editor';

// Basic setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);



const magicInput = new MagicInput();

const light = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

{
    const groundGeometry = new THREE.PlaneGeometry(10000, 10000); // Adjust size as needed
    const loader = new THREE.TextureLoader();
    const texture = loader.load('grass.jpg'); // Replace with your image path
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(100, 100); // Adjust the repeat values as needed
    const groundMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate the ground to be horizontal
    scene.add(ground);
}

{

    // Create a thousand spheres
    const sphereGeometry = new THREE.SphereGeometry(10, 32, 32); // Radius is 50, as diameter is 100
    const sphereMaterial = new THREE.MeshPhysicalMaterial({ color: 0xff0000 });

    for (let i = 0; i < 1000; i++) {
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

        sphere.position.x = Math.random() * 10000 - 5000;
        sphere.position.y = Math.random() * 200;
        sphere.position.z = Math.random() * 10000 - 5000;

        scene.add(sphere);
    }

}

const gameStuff = {
    airplane: null,
    physicsSystem: null,
    faceGraphics: null,
    labelGraphics: null,
    particleGraphics: null,
    fulcrumGraphics: null,
    springGraphics: null,

};


function loadPlane(newPlane: Airplane) {
    if (gameStuff.airplane) {
        gameStuff.faceGraphics.dispose();
        gameStuff.labelGraphics.dispose();
        gameStuff.particleGraphics.dispose();
        gameStuff.fulcrumGraphics.dispose();
        gameStuff.springGraphics.dispose();
    }
    gameStuff.airplane = newPlane;
    gameStuff.physicsSystem = new PhysicsSystem(newPlane);
    const physicsSystem = gameStuff.physicsSystem;
    gameStuff.faceGraphics = new FaceGraphics(scene, physicsSystem);
    gameStuff.labelGraphics = new LabelGraphics(scene, physicsSystem);
    gameStuff.particleGraphics = new ParticleGraphics(scene, physicsSystem);
    gameStuff.fulcrumGraphics = new FulcrumGraphics(scene, physicsSystem);
    gameStuff.springGraphics = new SpringGraphics(scene, physicsSystem);
}

loadPlane(new MyAirplane());

// debugger;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;

//controls.update() must be called after any manual changes to the camera's transform

// Camera position
camera.position.z = 10;
camera.position.y = 10;
controls.update();

const physicsSystem = gameStuff.physicsSystem;
let oldCenterOfMass = physicsSystem.centerOfMass();

const overlayElement = document.getElementById('overlay');


const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerMove(event) {

    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

}


window.addEventListener('pointermove', onPointerMove);


{
    let sky, sun;
    sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);

    sun = new THREE.Vector3();
    const uniforms = sky.material.uniforms;
    uniforms['turbidity'].value = 10;
    uniforms['rayleigh'].value = 3;
    uniforms['mieCoefficient'].value = 0.005;
    uniforms['mieDirectionalG'].value = 0.7;

    const phi = THREE.MathUtils.degToRad(90);
    const theta = THREE.MathUtils.degToRad(90);

    sun.setFromSphericalCoords(1, phi, theta);

    uniforms['sunPosition'].value.copy(sun);

    // renderer.toneMappingExposure = effectController.exposure;
    // renderer.render(scene, camera);

}



let uiState = {
    playing: true,
}

let angle1 = controls.getPolarAngle();
let angle2 = controls.getAzimuthalAngle();



let time = 0;

// Animation loop
function animate(timestamp: number) {
    requestAnimationFrame(animate);
    time = timestamp;

    const physicsSystem = gameStuff.physicsSystem;

    magicInput.step();

    gameStuff.airplane.handleInput(magicInput.input);

    // debugger;
    if (magicInput.input.axis_2) {
        // console.log(magicInput.input.axis_2, magicInput.input.axis_3);


        angle1 += (magicInput.input.axis_2 + 0.08) * 0.02;
        angle2 += (magicInput.input.axis_3 + 0.08) * 0.02;
        const x = 15 * Math.cos(angle1) * Math.cos(angle2) + oldCenterOfMass[0];
        const y = 15 * Math.sin(angle2) + oldCenterOfMass[1];
        const z = 15 * Math.sin(angle1) * Math.cos(angle2) + oldCenterOfMass[2];

        camera.position.set(x, y, z);
        camera.lookAt(new THREE.Vector3(oldCenterOfMass));

        controls.update();
        // debugger;

    }

    // controls.rotateLeft(0.01);

    if (uiState.playing) {
        // // Update physicsSystem.vertexPositions positions
        // for (let i = 0; i < physicsSystem.vertexPositions.length; i++) {
        //     physicsSystem.vertexPositions[i][0] += 0.01; // Increment x-coordinate
        // }

        // physicsSystem.leapfrogIntegrate(0.01, 10, 1);
        // console.log(physicsSystem.faces[0].force);
        // physicsSystem.handleGameController();


        physicsSystem.rk4Integrate(0.01, 10, 30);

        gameStuff.particleGraphics.update();


        // update labels
        gameStuff.labelGraphics.update();


        // Update points
        gameStuff.fulcrumGraphics.update();



        // Update lines
        gameStuff.springGraphics.update();

        // // Update faces
        // faceGeometry.setFromPoints(physicsSystem.faceVertexIndices.flatMap(f => f.map(vi => physicsSystem.vertexPositions[vi])).map(v => new THREE.Vector3(...v)));
        // faceGeometry.attributes.position.needsUpdate = true; // Important for updating the geometry
        // faceGeometry.computeVertexNormals(); // Recompute normals for proper lighting

        gameStuff.faceGraphics.update();
        // Update camera position
        // debugger;

        const newCenterOfMass = physicsSystem.centerOfMass();
        const [x, y, z] = newCenterOfMass;
        const [oldX, oldY, oldZ] = oldCenterOfMass;
        const [dx, dy, dz] = [x - oldX, y - oldY, z - oldZ];

        camera.position.x += x - oldX;
        camera.position.y += y - oldY;
        camera.position.z += z - oldZ;


        // camera.lookAt(new THREE.Vector3(...newCenterOfMass));
        oldCenterOfMass = newCenterOfMass;
        controls.target = new THREE.Vector3(...newCenterOfMass);
        controls.update();
    }
    renderer.render(scene, camera);

    // overlayElement.innerHTML = `Center of mass Y: ${y.toFixed(2)}. Yvelocity = ${(y - oldY).toFixed(2)}. Velocity: ${(Math.sqrt((x - oldX) ** 2 + (z - oldZ) ** 2) / 0.03).toFixed(2)}. Force: ${physicsSystem.faces[0].force.toFixed(2)}`;

    {
        // update the picking ray with the camera and pointer position
        raycaster.setFromCamera(pointer, camera);

        // calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(scene.children);


        // if (intersects.length > 0) {
        //     const object = intersects[0].object;
        //     // if (object.name.startsWith('triangle')) {
        //     //     const faceIdx = parseInt(object.name.split('-')[1]);
        //     //     physicsSystem.faces[faceIdx].force = 1;
        //     // }
        //     console.log(object.name);
        //     switch (object.name) {
        //         case 'cylinders':
        //             console.log('cylinders' + intersects[0].instanceId);
        //             break;
        //         case 'fulcrums':
        //             console.log('fulcrums' + intersects[0].instanceId);
        //             break;
        //     }
        //     if (object.name.startsWith('triangle')) {
        //         const triangleIdx = parseInt(object.name.split('-')[1]);
        //         console.log(triangleIdx);
        //         // debugger;
        //     }
        // }
    }
}

requestAnimationFrame(animate);




// let gamepad = null;

// window.addEventListener("gamepadconnected", function (e) {
//     debugger;
// });

const reactState = { oldCenterOfMass: [0, 0, 0] };

function loadAirplaneFromSrc(src: string) {
    // debugger;
    try {
        const newAirplane = (((Spring, Face, Engine, Airplane) =>
            new (eval("(" + src + ")"))
        )(Spring, Face, Engine, Airplane));
        // const newPlane = new newPlaneClass();
        // debugger;
        loadPlane(newAirplane);
        return [];
    }
    catch (e) {
        return [{ startLineNumber: 'unknown', message: e.message }];
    }

}
function transformTypeScriptCode(code: string) {
    // Remove import statements
    let transformedCode = code.replace(/^import.*;$/gm, '');

    // Change 'export class' to 'class'
    transformedCode = transformedCode.replace(/export class/g, 'class');

    return transformedCode;
}


/////// react shit
const MyComponent = ({ myPlaneText }) => {
    // State for the animated value
    const [value, setValue] = useState(0);
    const [planeCode, setPlaneCode] = useState(myPlaneText);
    const [errorMessages, setErrorMessages] = useState([]);
    const [showPlaneEditor, setShowPlaneEditor] = useState(true);
    var gamepads = navigator.getGamepads();

    const gamepad = gamepads[1];

    useEffect(() => {
        let frameId;

        // Function to update the animation
        const animate = () => {
            setValue(prevValue => prevValue + 1); // Update state with new value
            frameId = requestAnimationFrame(animate); // Schedule next frame
        };

        // Start the animation
        frameId = requestAnimationFrame(animate);

        // Cleanup function to cancel the animation
        return () => {
            cancelAnimationFrame(frameId);
        };
    }, []); // Empty dependency array means this runs once on mount

    // if (gamepad) {
    //     debugger;
    // }


    const newCenterOfMass = gameStuff.physicsSystem.centerOfMass();
    const [x, y, z] = newCenterOfMass;
    const [oldX, oldY, oldZ] = reactState.oldCenterOfMass;
    const [dx, dy, dz] = [x - oldX, y - oldY, z - oldZ];
    if (uiState.playing) {
        reactState.oldCenterOfMass = newCenterOfMass;
    }
    const heading = Math.atan2(z - oldZ, x - oldX);
    const horizontalSpeed = (Math.sqrt((x - oldX) ** 2 + (z - oldZ) ** 2) * 60);
    const verticalSpeed = dy * 60;

    if (magicInput.input.button_9) {
        const errorMessages = loadAirplaneFromSrc(planeCode);
        setTimeout(() => { setErrorMessages(errorMessages); }, 10);

    }
    // debugger;
    return <div>
        <div className='overlay-l'>
            <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="-1.2 -1.2 2.4 2.4">
                <circle cx="0" cy="0" r={horizontalSpeed / 400} stroke="white" strokeWidth="0.02" fill="none" />
                <circle cx="0" cy="0" r={Math.abs(verticalSpeed / 400)} stroke={verticalSpeed > 0 ? "green" : 'red'} strokeWidth="0.02" fill="none" />


                <line x1={Math.cos(heading)} y1={-Math.sin(heading)} x2="0" y2="0" stroke="red" strokeWidth="0.1" />
                <text x={Math.cos(heading)} y={-Math.sin(heading)} fill="red" fontSize="0.5" textAnchor="middle" dominantBaseline="middle">N</text>

                <line x1={-Math.cos(heading)} y1={Math.sin(heading)} x2="0" y2="0" stroke="white" strokeWidth="0.05" />
                <text x={-Math.cos(heading)} y={Math.sin(heading)} fill="white" fontSize="0.5" textAnchor="middle" dominantBaseline="middle">S</text>

                <line x1={Math.sin(heading)} y1={Math.cos(heading)} x2="0" y2="0" stroke="white" strokeWidth="0.05" />
                <text x={Math.sin(heading)} y={Math.cos(heading)} fill="white" fontSize="0.5" textAnchor="middle" dominantBaseline="middle">E</text>

                <line x1={-Math.sin(heading)} y1={-Math.cos(heading)} x2="0" y2="0" stroke="white" strokeWidth="0.05" />
                <text x={-Math.sin(heading)} y={-Math.cos(heading)} fill="white" fontSize="0.5" textAnchor="middle" dominantBaseline="middle">W</text>

                <line x1="0" y1="0" x2="0" y2="-1" stroke="pink" strokeWidth="0.01" />

            </svg>
            <div style={{ backgroundColor: y < 10 ? 'lightblue' : (y < 100 ? 'pink' : 'grey') }}>Altitude: {y.toFixed(0)}m</div>
            <div>Vertical speed: {verticalSpeed.toFixed(0)}m/s</div>
            <div>Horizontal speed: {horizontalSpeed.toFixed()}m/s</div>
            <div>Thrust: {(gameStuff.physicsSystem.faces[0].force / MAX_THRUST * 100).toFixed(0)}%</div>
            <div>Thrust: {gameStuff.physicsSystem.faces[0].force.toFixed(0)}</div>
            <div style={{ fontSize: 18 }}>Default controls are qweasd, as you'd know if you read the airplane's <code>handleInput</code> method.</div>
        </div>

        <div className='overlay-r'>
            <button onClick={() => { uiState.playing = !uiState.playing }}>play/pause</button>
            {showPlaneEditor ? <div>

                <button onClick={() => { setErrorMessages(loadAirplaneFromSrc(planeCode)) }}>load airplane</button>

                <button onClick={() => { setShowPlaneEditor(false); gameStuff.labelGraphics.setInvisible() }}>hide airplane editor</button>
                <div>See  <a href="https://github.com/search?q=repo%3Abshlgrs/planes%20MyPlane&type=code">here</a> for commented code.</div>

                <Editor options={{ fontSize: 16, minimap: false, wordWrap: 'on' }} height="60vh" defaultLanguage="javascript" defaultValue={myPlaneText} onChange={(val) => { setPlaneCode(val); }} onValidate={(e) => { setErrorMessages(e) }} />
                <div style={{ color: 'red', backgroundColor: 'white', padding: 20 }}>{errorMessages.map(e => (e.message.indexOf("Could not find name 'Airplane'") === -1) && `line ${e.startLineNumber}: ${e.message}`)}</div>


            </div> : <div>
                <button onClick={() => { setShowPlaneEditor(true); gameStuff.labelGraphics.setVisible() }}>show airplane editor</button>
            </div>}
            <div style={{ fontSize: '24px', fontFamily: 'sans-serif' }}>source at <a href="https://github.com/bshlgrs/planes">https://github.com/bshlgrs/planes</a>. The physics of this simulation are described in <a href="https://github.com/bshlgrs/planes/blob/main/physics.ts#L33"><code>PhysicsSystem.computeForces</code></a>.Game by <a href="https://twitter.com/bshlgrs">Buck Shlegeris</a></div>
        </div>
    </div >;
};

fetch('myAirplane.ts').then(r => r.text()).then(t => {
    ReactDOM.render(<MyComponent myPlaneText={transformTypeScriptCode(t)} />, document.getElementById('overlay'));
});

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}