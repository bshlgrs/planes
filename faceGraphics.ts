
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
    }

    update() {

        for (let faceIdx = 0; faceIdx < this.physicsSystem.faces.length; faceIdx++) {
            const triangle = this.triangles[faceIdx];

            const positions = triangle.geometry.attributes.position; // Access the position attribute
            let vertexIndices = this.physicsSystem.faces[faceIdx].vertexIndices;

            for (let i = 0; i < vertexIndices.length; i++) {
                let vi = vertexIndices[i];
                let pos = this.physicsSystem.vertexPositions[vi];

                // Update the positions for each vertex
                positions.setXYZ(i, pos[0], pos[1], pos[2]);
            } positions.needsUpdate = true;

            if (this.physicsSystem.faces[faceIdx].force != 0) {
                const otherLightness = this.physicsSystem.faces[faceIdx].force / 5;
                triangle.material.color = new THREE.Color(otherLightness, otherLightness, 1);
                triangle.color_needs_update = true;
            }

            triangle.geometry.computeVertexNormals(); // Recompute normals for proper lighting
        }

    }
}
