
import * as THREE from 'three';
import { PhysicsSystem } from './physics';

export class FulcrumGraphics {
    scene: THREE.Scene;
    physicsSystem: PhysicsSystem;
    fulcrumsInstancedMesh: THREE.InstancedMesh;

    constructor(scene: THREE.Scene, physicsSystem: PhysicsSystem) {
        this.scene = scene;
        this.physicsSystem = physicsSystem;


        // Create points
        {
            const pointSphereGeometry = new THREE.SphereGeometry(0.06);
            const material = new THREE.MeshPhongMaterial();
            const instanceCount = physicsSystem.vertexPositions.length; // Number of instances
            this.fulcrumsInstancedMesh = new THREE.InstancedMesh(pointSphereGeometry, material, instanceCount);
            this.fulcrumsInstancedMesh.frustumCulled = false;

            for (let i = 0; i < instanceCount; i++) {
                const matrix = new THREE.Matrix4();

                matrix.setPosition(new THREE.Vector3(physicsSystem.vertexPositions[i]));
                this.fulcrumsInstancedMesh.setMatrixAt(i, matrix);

            }

            this.fulcrumsInstancedMesh.instanceMatrix.needsUpdate = true;
            scene.add(this.fulcrumsInstancedMesh);
            this.fulcrumsInstancedMesh.name = 'fulcrums';
        }


    }

    update() {
        for (let i = 0; i < this.physicsSystem.vertexPositions.length; i++) {
            // Update Position
            const matrix = new THREE.Matrix4();
            const newPosition = new THREE.Vector3(...this.physicsSystem.vertexPositions[i]);
            matrix.setPosition(newPosition);
            this.fulcrumsInstancedMesh.setMatrixAt(i, matrix);

        }
        this.fulcrumsInstancedMesh.instanceMatrix.needsUpdate = true;

    }
}