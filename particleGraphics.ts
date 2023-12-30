
import * as THREE from 'three';
import { PhysicsSystem } from './physics';


export class ParticleGraphics {
    scene: THREE.Scene;
    physicsSystem: PhysicsSystem;
    positions: Float32Array;
    velocities: Float32Array;
    lifetimes: Float32Array;
    colors: Float32Array;
    nextIndex: number;
    particleCount: number;
    particlesGeometry: THREE.BufferGeometry;
    particlesSystem: THREE.Points;
    oldCenterOfMass: number[];

    constructor(scene: THREE.Scene, physicsSystem: PhysicsSystem) {
        this.scene = scene;
        this.physicsSystem = physicsSystem;



        this.particleCount = 2000;
        const particleCount = this.particleCount;
        this.particlesGeometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(particleCount * 3);
        this.velocities = new Float32Array(particleCount * 3);
        this.lifetimes = new Float32Array(particleCount);
        this.nextIndex = 0; // Next index to write to in the circular buffer
        this.colors = new Float32Array(particleCount * 3); // color for each particle (r, g, b)

        for (let i = 0; i < particleCount * 3; i++) {
            this.colors[i] = Math.random(); // Random color
        }

        // Create material for particles
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true, // Enable vertex colors
            transparent: true,
            opacity: 0.75
        });

        // Create particle system
        const particleSystem = new THREE.Points(this.particlesGeometry, particlesMaterial);
        particleSystem.frustumCulled = false; // Important for updating the geometry
        scene.add(particleSystem);
        this.particlesSystem = particleSystem;

        this.particlesGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.particlesGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3)); // Add color attribute


        this.oldCenterOfMass = physicsSystem.centerOfMass();
    }

    // Function to spawn a particle
    spawnParticle(x: number, y: number, z: number, vx: number, vy: number, vz: number, speed: number) {
        const nextIndex = this.nextIndex;
        this.positions[nextIndex * 3] = x;
        this.positions[nextIndex * 3 + 1] = y;
        this.positions[nextIndex * 3 + 2] = z;
        this.velocities[nextIndex * 3] = vx;
        this.velocities[nextIndex * 3 + 1] = vy;
        this.velocities[nextIndex * 3 + 2] = vz;
        this.lifetimes[nextIndex] = Math.round(Math.random() * 10); // Set the lifetime of the particle

        // const speed = Math.hypot(vx, vy, vz);
        // console.log(speed);
        this.nextIndex = (nextIndex + 1) % this.particleCount;

        const force = this.physicsSystem.faces[0].force;
        // Assign a random color
        // const rand = Math.random() * 0.2 + 0.8;
        // const rand = 1;


        this.colors[nextIndex * 3] = Math.min(force, 1) - Math.max(force - 3.5, 0); // Red
        this.colors[nextIndex * 3 + 1] = Math.max(Math.min(force - 1.5, 1), 0) * 0.8; // Green
        this.colors[nextIndex * 3 + 2] = Math.max(Math.min(force - 2.5, 1), 0); // Blue

    }
    // Function to update particle positions
    updateParticles() {
        const particleCount = this.particleCount;
        const positions = this.positions;
        const velocities = this.velocities;
        const lifetimes = this.lifetimes;

        for (let i = 0; i < particleCount; i++) {
            if (lifetimes[i] > 0) {
                positions[i * 3] += velocities[i * 3];
                positions[i * 3 + 1] += velocities[i * 3 + 1];
                if (positions[i * 3 + 1] < 0) {
                    positions[i * 3 + 1] = - positions[i * 3 + 1];
                    velocities[i * 3 + 1] = - velocities[i * 3 + 1];
                }
                positions[i * 3 + 2] += velocities[i * 3 + 2];
                lifetimes[i]--;
            } else {
                positions[i * 3] = 0;
                positions[i * 3 + 1] = -10;
                positions[i * 3 + 2] = 0;
            }
        }
        this.particlesGeometry.attributes.position.needsUpdate = true;

        this.particlesGeometry.attributes.color.needsUpdate = true;
    }

    update() {
        // Spawn a random number of particles
        const engine = this.physicsSystem.faces[0];
        const numberToSpawn = Math.floor(10 * engine.force ** 2);

        // const numberToSpawn = 50;
        const [x1, y1, z1] = this.physicsSystem.vertexPositions[engine.vertexIndices[0]];
        const [x2, y2, z2] = this.physicsSystem.vertexPositions[engine.vertexIndices[1]];
        const [x3, y3, z3] = this.physicsSystem.vertexPositions[engine.vertexIndices[2]];

        const [avg_x, avg_y, avg_z] = [(x1 + x2 + x3) / 3, (y1 + y2 + y3) / 3, (z1 + z2 + z3) / 3];


        const [nx, ny, nz] = this.physicsSystem.calculateNormal([x1, y1, z1], [x2, y2, z2], [x3, y3, z3]);



        const newCenterOfMass = this.physicsSystem.centerOfMass();
        const [x, y, z] = newCenterOfMass;
        const [oldX, oldY, oldZ] = this.oldCenterOfMass;
        const [dx, dy, dz] = [x - oldX, y - oldY, z - oldZ];
        this.oldCenterOfMass = newCenterOfMass;

        for (let i = 0; i < numberToSpawn; i++) {
            const scale = Math.random();
            const scale2 = Math.random();
            this.spawnParticle(avg_x - scale2 * dx, avg_y - scale2 * dy, avg_z - scale2 * dz, (-nx) / 0.4 * scale, (-ny) / 0.4 * scale, (-nz) / 0.4 * scale,
                Math.hypot(dx, dy, dz));
        }

        // Update particles
        this.updateParticles();

    }

    dispose() {


        this.scene.remove(this.particlesGeometry);
        this.particlesGeometry.dispose();
        this.particlesSystem.material.dispose();
        this.scene.remove(this.particlesSystem);


    }

}