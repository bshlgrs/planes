
import * as THREE from 'three';
import { PhysicsSystem } from './physics';

export class FaceGraphics {
    scene: THREE.Scene;
    physicsSystem: PhysicsSystem;
    triangles: THREE.Mesh[];

    constructor(scene: THREE.Scene, physicsSystem: PhysicsSystem) {
        this.scene = scene;
        this.physicsSystem = physicsSystem;


        const faceMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xc7b29b,
            roughness: 1,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        const engineMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            roughness: 0,
            side: THREE.DoubleSide
        });


        // Create triangles
        this.triangles = []; // Store your triangles here

        for (let i = 0; i < physicsSystem.faces.length; i++) {
            const geometry = new THREE.BufferGeometry();
            geometry.name = `triangle-${i}`;

            const [a, b, c] = physicsSystem.faces[i].vertexIndices;
            // Add vertices for each triangle

            geometry.setFromPoints([a, b, c].map((x) => new THREE.Vector3(...physicsSystem.vertexPositions[x])));

            // Create a mesh and add it to the scene
            const triangle = new THREE.Mesh(geometry, physicsSystem.faces[i].constructor.name == 'Engine' ? engineMaterial : faceMaterial);
            scene.add(triangle);
            triangle.frustumCulled = false; // Important for updating the geometry

            // Store the triangle for later manipulation
            this.triangles.push(triangle);

            triangle.name = `triangle-${i}`;
        }
        this.update();
    }

    update() {

        for (let faceIdx = 0; faceIdx < this.physicsSystem.faces.length; faceIdx++) {
            const triangle = this.triangles[faceIdx];

            const positions = triangle.geometry.attributes.position; // Access the position attribute
            let vertexIndices = this.physicsSystem.faces[faceIdx].vertexIndices;

            for (let i = 0; i < vertexIndices.length; i++) {
                let vi = vertexIndices[i];
                let pos = this.physicsSystem.vertexPositions[vi];
                // console.log(pos);

                // Update the positions for each vertex
                positions.setXYZ(i, pos[0], pos[1], pos[2]);
            } positions.needsUpdate = true;



            if (faceIdx == 0) { // this is the engine
                const force = this.physicsSystem.faces[faceIdx].force;

                triangle.material.color = new THREE.Color(
                    Math.min(force, 1) - Math.max(force - 3.5, 0), // Red
                    Math.max(Math.min(force - 1.5, 1), 0) * 0.8, // Green
                    Math.max(Math.min(force - 2.5, 1), 0) // Blue
                );
                triangle.color_needs_update = true;
            }

            triangle.geometry.computeVertexNormals(); // Recompute normals for proper lighting
        }
        // debugger;
    }

    dispose() {
        this.triangles.forEach((triangle) => {
            this.scene.remove(triangle);
            triangle.geometry.dispose();
            triangle.material.dispose();
        });
    }
}
