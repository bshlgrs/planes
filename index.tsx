
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

// Basic setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const physicsSystem = new PhysicsSystem();


const light = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

{
    const planeGeometry = new THREE.PlaneGeometry(10000, 10000); // Adjust size as needed
    const loader = new THREE.TextureLoader();
    const texture = loader.load('grass.jpg'); // Replace with your image path
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(100, 100); // Adjust the repeat values as needed
    const planeMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2; // Rotate the plane to be horizontal
    scene.add(plane);
}

{

    // Create a thousand spheres
    const sphereGeometry = new THREE.SphereGeometry(10, 32, 32); // Radius is 50, as diameter is 100
    const sphereMaterial = new THREE.MeshPhysicalMaterial({ color: 0xff0000 });

    for (let i = 0; i < 1000; i++) {
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

        // Random position within the box (200 units above the plane)
        sphere.position.x = Math.random() * 10000 - 5000;
        sphere.position.y = Math.random() * 200; // Between 200 and 400 units above the plane
        sphere.position.z = Math.random() * 10000 - 5000;

        scene.add(sphere);
    }

}



const faceGraphics = new FaceGraphics(scene, physicsSystem);
const labelGraphics = new LabelGraphics(scene, physicsSystem);
const particleGraphics = new ParticleGraphics(scene, physicsSystem);
const fulcrumGraphics = new FulcrumGraphics(scene, physicsSystem);
const springGraphics = new SpringGraphics(scene, physicsSystem);

const controls = new OrbitControls(camera, renderer.domElement);

//controls.update() must be called after any manual changes to the camera's transform

// Camera position
camera.position.z = 5;
camera.position.y = 5;
controls.update();

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





// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // debugger;
    {

        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];
        if (gamepad) {
            angle1 += gamepad.axes[2] * 0.02;
            angle2 += gamepad.axes[3] * 0.02;
            const x = 15 * Math.cos(angle1) * Math.cos(angle2) + oldCenterOfMass[0];
            const y = 15 * Math.sin(angle2) + oldCenterOfMass[1];
            const z = 15 * Math.sin(angle1) * Math.cos(angle2) + oldCenterOfMass[2];

            camera.position.set(x, y, z);
            camera.lookAt(new THREE.Vector3(oldCenterOfMass));

            // controls.update();
            // debugger;

        }

    }
    // controls.rotateLeft(0.01);

    if (uiState.playing) {
        // // Update physicsSystem.vertexPositions positions
        // for (let i = 0; i < physicsSystem.vertexPositions.length; i++) {
        //     physicsSystem.vertexPositions[i][0] += 0.01; // Increment x-coordinate
        // }

        // physicsSystem.leapfrogIntegrate(0.01, 10, 1);
        // console.log(physicsSystem.faces[0].force);
        physicsSystem.handleGameController();
        physicsSystem.rk4Integrate(0.01, 10, 30);

        particleGraphics.update();



        // physicsSystem.deleteVerticesBelowGround();
        // update labels
        labelGraphics.update();


        // Update points
        fulcrumGraphics.update();



        // Update lines
        springGraphics.update();

        // // Update faces
        // faceGeometry.setFromPoints(physicsSystem.faceVertexIndices.flatMap(f => f.map(vi => physicsSystem.vertexPositions[vi])).map(v => new THREE.Vector3(...v)));
        // faceGeometry.attributes.position.needsUpdate = true; // Important for updating the geometry
        // faceGeometry.computeVertexNormals(); // Recompute normals for proper lighting

        faceGraphics.update();
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
animate();

window.addEventListener('keydown', (e) => {
    physicsSystem.handleKeyDown(e);
})



// let gamepad = null;

// window.addEventListener("gamepadconnected", function (e) {
//     debugger;
// });

/////// react shit
const MyComponent = () => {
    // State for the animated value
    const [value, setValue] = useState(0);
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

    const newCenterOfMass = physicsSystem.centerOfMass();
    const [x, y, z] = newCenterOfMass;
    const [oldX, oldY, oldZ] = oldCenterOfMass;
    const [dx, dy, dz] = [x - oldX, y - oldY, z - oldZ];

    return <div>
        <p style={{ backgroundColor: y < 10 ? 'lightblue' : (y < 100 ? 'pink' : 'grey') }}>Altitude: {y.toFixed(0)}</p>
        {/* <p>Vertical speed: {(-dy / 0.03).toFixed(1)}</p>
        <p>Horizontal speed: {(Math.sqrt((x - oldX) ** 2 + (z - oldZ) ** 2) / 0.03).toFixed(1)}</p> */}
        <button onClick={() => { uiState.playing = !uiState.playing }}>play/pause</button>

    </div>;
};


ReactDOM.render(<MyComponent />, document.getElementById('overlay'));
