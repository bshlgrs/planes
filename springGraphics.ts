
import * as THREE from 'three';
import { PhysicsSystem } from './physics';

export class SpringGraphics {
    scene: THREE.Scene;
    physicsSystem: PhysicsSystem;
    cylindersInstancedMesh: THREE.InstancedMesh;

    constructor(scene: THREE.Scene, physicsSystem: PhysicsSystem) {
        this.scene = scene;
        this.physicsSystem = physicsSystem;

        // Create points

        const cylinderGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1);
        const cylinderMaterial = new THREE.MeshPhysicalMaterial();
        const instanceCount = physicsSystem.springs.length; // Number of instances
        this.cylindersInstancedMesh = new THREE.InstancedMesh(cylinderGeometry, cylinderMaterial, instanceCount);
        this.cylindersInstancedMesh.frustumCulled = false;

        this.cylindersInstancedMesh.name = 'cylinders';

        scene.add(this.cylindersInstancedMesh);

    }

    update() {
        for (let i = 0; i < this.physicsSystem.springs.length; i++) {
            const spring = this.physicsSystem.springs[i];
            const from = new THREE.Vector3(...this.physicsSystem.vertexPositions[spring.fromIdx]);
            const to = new THREE.Vector3(...this.physicsSystem.vertexPositions[spring.toIdx]);
            const direction = new THREE.Vector3().subVectors(to, from);
            const orientation = new THREE.Matrix4();

            // Calculate midpoint and scale
            const midpoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
            const scale = direction.length();

            // Create a quaternion for the rotation
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());

            // Combine rotation and translation in the matrix
            orientation.makeRotationFromQuaternion(quaternion);
            orientation.setPosition(midpoint);

            // Apply the scale
            const scaleMatrix = new THREE.Matrix4().makeScale(1, scale, 1);
            orientation.multiply(scaleMatrix);

            this.cylindersInstancedMesh.setMatrixAt(i, orientation);

            let color: THREE.Color;
            const stretchFactor = (scale / (scale + spring.restLength) + 0.5) ** 5 - 0.5;

            if (stretchFactor > 0.5) {
                color = new THREE.Color(stretchFactor, 1 - stretchFactor, 1 - stretchFactor);
            } else {
                color = new THREE.Color(1 - stretchFactor, 1 - stretchFactor, stretchFactor);
            }

            // console.log(color);
            this.cylindersInstancedMesh.setColorAt(i, color);
        }
        this.cylindersInstancedMesh.instanceColor.needsUpdate = true;
        this.cylindersInstancedMesh.instanceMatrix.needsUpdate = true;
    }
}