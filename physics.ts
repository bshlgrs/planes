import { Plane, Spring, Face, Engine } from './plane';

type Vector3 = [number, number, number];


const VERTEX_MASS = 1.1;
const SPRING_MASS = 0.1;
const SPRING_CONSTANT = 500;
const GRAVITY_ACCELERATION = 1.5;
const WIND_FORCE_CONSTANT = 1;

export class PhysicsSystem {
    plane: Plane;
    vertexVelocities: Vector3[];
    vertexPositions: Vector3[];
    springs: Spring[];

    faces: Face[];
    engine: Engine;

    constructor(plane: Plane) {
        this.plane = plane;
        this.vertexVelocities = new Array(plane.vertexPositions.length).fill([0, 0, 0]);

        // TODO extremely cursed. I'm copying the arrays by reference so that both objects can freely manipulate them.
        this.vertexPositions = plane.vertexPositions;
        this.faces = plane.faces;
        this.springs = plane.springs;
        this.faces.unshift(plane.engine);
        this.engine = plane.engine;
    }

    computeForces(vertexPositions: Vector3[], vertexVelocities: Vector3[], dampingCoefficient: number): Vector3[] {
        /*
        This function describes almost all the physics of this game.

        The only important dynamic not described here is that when vertices go below 2cm above the ground, they are clamped to the ground.
        */


        const numVertices = vertexPositions.length;

        // Every vertex is pulled downward by gravity.
        const forces: Vector3[] = new Array(numVertices).fill([0, - GRAVITY_ACCELERATION * VERTEX_MASS, 0]);

        for (let i = 0; i < numVertices; i++) {
            const y = vertexPositions[i][1];

            // Vertices experience an upward force when they're within 0.5 units of the ground (which is a 10km square centered on the origin)
            if (vertexPositions[i][0] > -5000 && vertexPositions[i][0] < 5000 && vertexPositions[i][2] > -5000 && vertexPositions[i][2] < 5000) {
                const groundForce = this.multiplyVectorByScalar([0, Math.max(0, 0.5 - y), 0], 100);
                forces[i] = this.addVectors(forces[i], groundForce);
            }

            // vertices experience linear drag when close to the ground
            const dragForce = this.multiplyVectorByScalar(vertexVelocities[i], (y > 0.5 ? 0 : 0.002));
            forces[i] = this.addVectors(forces[i], dragForce);
        }

        for (const [index, spring] of this.springs.entries()) {
            // Each spring is a Hookean spring. Rest lengths differ, spring constants are the same.
            const vertex1 = spring.fromIdx;
            const vertex2 = spring.toIdx;
            const position1 = vertexPositions[vertex1];
            const position2 = vertexPositions[vertex2];
            const velocity1 = vertexVelocities[vertex1];
            const velocity2 = vertexVelocities[vertex2];

            const springVector = this.subtractVectors(position2, position1);
            const springLength = this.norm(springVector);
            const springVectorNormalized = springLength !== 0 ? this.divideVectorByScalar(springVector, springLength) : ([0, 0, 0] as Vector3);

            const forceMagnitude = (springLength - spring.restLength) * SPRING_CONSTANT;
            const springForce = this.multiplyVectorByScalar(springVectorNormalized, forceMagnitude);

            const relativeVelocity = this.subtractVectors(velocity1, velocity2);
            const dampingForce = this.multiplyVectorByScalar(relativeVelocity, -dampingCoefficient);

            const totalForce = this.multiplyVectorByScalar(this.addVectors(springForce, dampingForce), 0.5);

            forces[vertex1] = this.addVectors(forces[vertex1], totalForce);
            forces[vertex2] = this.subtractVectors(forces[vertex2], totalForce);

            // The springs have mass, which loads the vertices they're attached to
            forces[vertex1][1] -= SPRING_MASS / 2 * GRAVITY_ACCELERATION;
            forces[vertex2][1] -= SPRING_MASS / 2 * GRAVITY_ACCELERATION;
        }
        for (const face of this.faces) {
            const [idx1, idx2, idx3] = face.vertexIndices;

            // Faces experience a force in the direction of their normal from two sources.
            const normal = this.calculateNormal(vertexPositions[idx1], vertexPositions[idx2], vertexPositions[idx3]);
            const faceArea = this.norm(normal) / 2;
            const normalDirection = this.divideVectorByScalar(normal, this.norm(normal));

            // Firstly, they experience pressure proportional to the dot of their normal and their velocity. This is a janky approximation
            // of the pressure caused by the air colliding with the face.
            const averageVelocity = this.divideVectorByScalar(this.addVectors(vertexVelocities[idx1], this.addVectors(vertexVelocities[idx2], vertexVelocities[idx3])), 3);

            const windForceStrength = -this.dotProduct(normalDirection, averageVelocity) * faceArea * WIND_FORCE_CONSTANT;

            // Secondly, they experience a pressure from engine thrust.
            const thrustMagnitude = face.force * faceArea;

            const normalForces = this.multiplyVectorByScalar(normalDirection, thrustMagnitude + windForceStrength)

            // Faces also experience drag, which is proportional to their velocity.
            const DRAG_STRENGTH = 0.001;
            const dragForce = this.multiplyVectorByScalar(averageVelocity, -DRAG_STRENGTH);

            const force = this.addVectors(normalForces, dragForce);

            face.vertexIndices.forEach((vertexIndex: number) => {
                forces[vertexIndex] = this.addVectors(forces[vertexIndex], this.divideVectorByScalar(force, 3));
            });

        }

        return forces;
    }

    centerOfMass(): Vector3 {
        let centerOfMass = [0, 0, 0] as Vector3;
        let masses = this.vertexMasses();
        let totalMass = 0;

        for (let i = 0; i < this.vertexPositions.length; i++) {
            centerOfMass = this.addVectors(centerOfMass, this.multiplyVectorByScalar(this.vertexPositions[i], masses[i]));
            totalMass += masses[i];
        }
        return this.divideVectorByScalar(centerOfMass, totalMass);
    }

    getSpring(vertexIndex1: number, vertexIndex2: number): Spring | undefined {
        return this.springs.find(spring => {
            return (spring.fromIdx === vertexIndex1 && spring.toIdx === vertexIndex2) ||
                (spring.fromIdx === vertexIndex2 && spring.toIdx === vertexIndex1);
        });
    }

    countSprings(vertexIndex: number): number {
        return this.springs.filter(spring => spring.fromIdx === vertexIndex || spring.toIdx === vertexIndex).length;
    }

    private addVectors(a: Vector3, b: Vector3): Vector3 {
        return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    }

    private subtractVectors(a: Vector3, b: Vector3): Vector3 {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    private multiplyVectorByScalar(v: Vector3, scalar: number): Vector3 {
        return [v[0] * scalar, v[1] * scalar, v[2] * scalar];
    }

    private divideVectorByScalar(v: Vector3, scalar: number): Vector3 {
        return [v[0] / scalar, v[1] / scalar, v[2] / scalar];
    }

    norm(v: Vector3): number {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    }
    private crossProduct(a: Vector3, b: Vector3): Vector3 {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }

    private dotProduct(a: Vector3, b: Vector3): number {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    calculateNormal(a: Vector3, b: Vector3, c: Vector3): Vector3 {
        const u = this.subtractVectors(b, a);
        const v = this.subtractVectors(c, a);
        return this.crossProduct(u, v); // Cross product of u and v gives the normal
    }

    vertexMasses(): number[] {
        const res = this.vertexPositions.map(position => VERTEX_MASS);
        for (let i = 0; i < this.springs.length; i++) {
            const spring = this.springs[i];
            res[spring.fromIdx] += 0.5;
            res[spring.toIdx] += 0.5;
        }
        return res;
    }

    leapfrogIntegrate(dt: number, numSteps: number, dampingCoefficient: number): Vector3[][] {
        let vertexPositions = [...this.vertexPositions];
        let vertexVelocities = [...this.vertexVelocities];

        for (let step = 0; step < numSteps; step++) {
            // 1. Half-step update for velocities
            let forces = this.computeForces(vertexPositions, vertexVelocities, dampingCoefficient);
            vertexVelocities = vertexVelocities.map((velocity, i) => this.addVectors(velocity, this.multiplyVectorByScalar(forces[i], 0.5 * dt / VERTEX_MASS)));
            // clamp velocities
            vertexVelocities = vertexVelocities.map(velocity => {
                const norm = this.norm(velocity);
                if (norm > 50) {
                    return this.multiplyVectorByScalar(velocity, 1 / norm);
                }
                return velocity;
            });

            // 2. Full-step update for positions
            vertexPositions = vertexPositions.map((position, i) => position[1] > 0.02 ?
                this.addVectors(position, this.multiplyVectorByScalar(vertexVelocities[i], dt)) :
                [position[0], 0.02, position[2]]);

            // 3. Another half-step update for velocities
            forces = this.computeForces(vertexPositions, vertexVelocities, dampingCoefficient);
            vertexVelocities = vertexVelocities.map((velocity, i) => this.addVectors(velocity, this.multiplyVectorByScalar(forces[i], 0.5 * dt / VERTEX_MASS)));
        }

        this.vertexVelocities = vertexVelocities;
        this.vertexPositions = vertexPositions;
    }
    rk4Integrate(dt, numSteps, dampingCoefficient) {
        let vertexPositions = [...this.vertexPositions];
        let vertexVelocities = [...this.vertexVelocities];
        const vertexMasses = this.vertexMasses(); // Assuming VERTEX_MASS is defined elsewhere

        for (let step = 0; step < numSteps; step++) {
            // Compute forces for the initial state
            let forces = this.computeForces(vertexPositions, vertexVelocities, dampingCoefficient);

            // Calculate k1 (initial slope)
            let k1Velocity = forces.map((force, i) => this.multiplyVectorByScalar(force, dt / vertexMasses[i]));
            let k1Position = vertexVelocities.map(velocity => this.multiplyVectorByScalar(velocity, dt));

            // Calculate k2 (slope at midpoint using k1)
            let midVelocities = vertexVelocities.map((v, i) => this.addVectors(v, this.multiplyVectorByScalar(k1Velocity[i], 0.5)));
            let midPositions = vertexPositions.map((p, i) => this.addVectors(p, this.multiplyVectorByScalar(k1Position[i], 0.5)));
            // forces = this.computeForces(midPositions, midVelocities, dampingCoefficient);
            let k2Velocity = forces.map((force, i) => this.multiplyVectorByScalar(force, dt / vertexMasses[i]));
            let k2Position = midVelocities.map(velocity => this.multiplyVectorByScalar(velocity, dt));

            // Calculate k3 (slope at midpoint using k2)
            midVelocities = vertexVelocities.map((v, i) => this.addVectors(v, this.multiplyVectorByScalar(k2Velocity[i], 0.5)));
            midPositions = vertexPositions.map((p, i) => this.addVectors(p, this.multiplyVectorByScalar(k2Position[i], 0.5)));
            forces = this.computeForces(midPositions, midVelocities, dampingCoefficient);
            let k3Velocity = forces.map((force, i) => this.multiplyVectorByScalar(force, dt / vertexMasses[i]));
            let k3Position = midVelocities.map(velocity => this.multiplyVectorByScalar(velocity, dt));

            // Calculate k4 (slope at endpoint using k3)
            let endVelocities = vertexVelocities.map((v, i) => this.addVectors(v, k3Velocity[i]));
            let endPositions = vertexPositions.map((p, i) => this.addVectors(p, k3Position[i]));
            forces = this.computeForces(endPositions, endVelocities, dampingCoefficient);
            let k4Velocity = forces.map((force, i) => this.multiplyVectorByScalar(force, dt / vertexMasses[i]));
            let k4Position = endVelocities.map(velocity => this.multiplyVectorByScalar(velocity, dt));
            // debugger;
            // Update positions and velocities using weighted average of slopes
            for (let i = 0; i < vertexVelocities.length; i++) {
                vertexVelocities[i] = this.addVectors(
                    vertexVelocities[i],
                    this.multiplyVectorByScalar(
                        this.addVectors(
                            this.addVectors(k1Velocity[i], this.multiplyVectorByScalar(this.addVectors(k2Velocity[i], k3Velocity[i]), 2)),
                            k4Velocity[i]),
                        1 / 6)
                );

                if (vertexPositions[i][1] > 0.02 || vertexPositions[i][0] < -5000 || vertexPositions[i][0] > 5000 || vertexPositions[i][2] < -5000 || vertexPositions[i][2] > 5000) {
                    vertexPositions[i] = this.addVectors(
                        vertexPositions[i],

                        this.multiplyVectorByScalar(
                            this.addVectors(
                                this.addVectors(k1Position[i], this.multiplyVectorByScalar(this.addVectors(k2Position[i], k3Position[i]), 2)),
                                k4Position[i]),
                            1 / 6)
                    );
                } else {
                    vertexPositions[i][1] = 0.02;
                    vertexVelocities[i] = [0, 0, 0];
                }
            }
        }

        this.vertexVelocities = vertexVelocities;
        this.vertexPositions = vertexPositions;
    }
}
