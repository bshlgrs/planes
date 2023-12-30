import { Plane, Spring, Face, Engine } from './plane';

type Vector3 = [number, number, number];


const VERTEX_MASS = 1.4;

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
        // this.engine = plane.engine;
    }


    centerOfMass(): Vector3 {
        let centerOfMass = [0, 0, 0] as Vector3;
        let totalMass = 0;
        for (let i = 0; i < this.vertexPositions.length; i++) {
            centerOfMass = this.addVectors(centerOfMass, this.multiplyVectorByScalar(this.vertexPositions[i], 1));
            totalMass += 1;
        }
        return this.divideVectorByScalar(centerOfMass, totalMass);
    }

    getSpring(vertexIndex1: number, vertexIndex2: number): Spring | undefined {
        return this.springs.find(spring => {
            return (spring.fromIdx === vertexIndex1 && spring.toIdx === vertexIndex2) ||
                (spring.fromIdx === vertexIndex2 && spring.toIdx === vertexIndex1);
        });
    }


    handleKeyDown(event: KeyboardEvent) {

        // const otherSpring = this.getSpringByVertexIndices(16, 17);
        // const springToShorten = this.getSpringByVertexIndices(13, 17);
        // if (event.key === 'w') {
        //     otherSpring.restLength += 0.02;
        //     springToShorten.restLength -= 0.02;
        // }
        // if (event.key === 's') {
        //     otherSpring.restLength -= 0.02;
        //     springToShorten.restLength += 0.02;
        // }

        // const lspring = this.getSpringByVertexIndices(15, 17);
        // const rspring = this.getSpringByVertexIndices(14, 17);

        // if (event.key === 'a') {
        //     lspring.restLength -= 0.01;
        //     rspring.restLength += 0.01;
        // }
        // if (event.key === 'd') {
        //     lspring.restLength += 0.01;
        //     rspring.restLength -= 0.01;
        // }

        // if (event.key === 'q') {
        //     this.faces[0].force += 0.03;
        // }
        // if (event.key === 'e') {
        //     this.faces[0].force -= 0.03;
        //     if (this.faces[0].force < 0) {
        //         this.faces[0].force = 0;
        //     }
    }


    handleGameController() {
        // const gamepads = navigator.getGamepads();

        // const gamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];

        // if (!gamepad) {
        //     return;
        // }

        // if (gamepad.buttons[4].pressed) {
        //     this.faces[0].force += 0.03;
        // }
        // if (gamepad.buttons[5].pressed) {
        //     this.faces[0].force -= 0.03;
        // }
        // this.faces[0].force = Math.min(5, Math.max(0, this.faces[0].force));

        // const lspring = this.getSpringByVertexIndices(15, 17);
        // const rspring = this.getSpringByVertexIndices(14, 17);

        // lspring.restLength += gamepad.axes[0] * 0.01;
        // rspring.restLength -= gamepad.axes[0] * 0.01;


        // const otherSpring = this.getSpringByVertexIndices(16, 17);
        // const springToShorten = this.getSpringByVertexIndices(13, 17);

        // otherSpring.restLength -= gamepad.axes[1] * 0.01;
        // springToShorten.restLength += gamepad.axes[1] * 0.01;


    }

    computeForces(vertexPositions: Vector3[], vertexVelocities: Vector3[], dampingCoefficient: number): Vector3[] {
        const numVertices = vertexPositions.length;
        const forces: Vector3[] = new Array(numVertices).fill([0, 0, 0]);

        for (let i = 0; i < numVertices; i++) {
            const gravityForce = this.multiplyVectorByScalar([0, -3, 0], VERTEX_MASS);
            forces[i] = this.addVectors(forces[i], gravityForce);

            const y = vertexPositions[i][1];

            if (vertexPositions[i][0] > -5000 && vertexPositions[i][0] < 5000 && vertexPositions[i][2] > -5000 && vertexPositions[i][2] < 5000) {
                const groundForce = this.multiplyVectorByScalar([0, Math.max(0, 0.5 - y), 0], 100);
                forces[i] = this.addVectors(forces[i], groundForce);

            }

            // const dragForce = this.multiplyVectorByScalar(vertexVelocities[i], (y > 2 ? -0.001 : 0.01));
            // forces[i] = this.addVectors(forces[i], dragForce);
            // console.log('vertex', this.norm(forces[i]));
        }

        for (const [index, spring] of this.springs.entries()) {
            const vertex1 = spring.fromIdx;
            const vertex2 = spring.toIdx;
            const position1 = vertexPositions[vertex1];
            const position2 = vertexPositions[vertex2];
            const velocity1 = vertexVelocities[vertex1];
            const velocity2 = vertexVelocities[vertex2];

            const springVector = this.subtractVectors(position2, position1);
            const springLength = this.norm(springVector);
            const springVectorNormalized = springLength !== 0 ? this.divideVectorByScalar(springVector, springLength) : ([0, 0, 0] as Vector3);

            // multiply by this.springStrengths[index] if you want
            const forceMagnitude = (springLength - spring.restLength) * 450;
            // const stretchFactor = springLength / (spring.restLength + spring);
            // const forceMagnitude = Math.sign(springLength - spring.restLength) * 1;
            const springForce = this.multiplyVectorByScalar(springVectorNormalized, forceMagnitude);

            const relativeVelocity = this.subtractVectors(velocity1, velocity2);
            const dampingForce = this.multiplyVectorByScalar(relativeVelocity, -dampingCoefficient);

            const totalForce = this.multiplyVectorByScalar(this.addVectors(springForce, dampingForce), 0.5);
            // const totalForce = springForce;
            // console.log('spring', this.norm(totalForce));

            forces[vertex1] = this.addVectors(forces[vertex1], totalForce);
            forces[vertex2] = this.subtractVectors(forces[vertex2], totalForce);
        }
        for (const face of this.faces) {
            const [idx1, idx2, idx3] = face.vertexIndices;
            const normal = this.calculateNormal(vertexPositions[idx1], vertexPositions[idx2], vertexPositions[idx3]);

            // const triangleArea = this.norm(normal) / 2;
            const thrustMagnitude = face.force * 8;

            const averageVelocity = this.divideVectorByScalar(this.addVectors(vertexVelocities[idx1], this.addVectors(vertexVelocities[idx2], vertexVelocities[idx3])), 3);

            // console.log('average', this.norm(averageVelocity));

            const windForceStrength = -this.dotProduct(normal, averageVelocity) * 0.15;

            // const windForce = this.multiplyVectorByScalar(normal, windForceStrength);

            const DRAG_STRENGTH = 0.001;
            const dragForce = this.multiplyVectorByScalar(averageVelocity, -DRAG_STRENGTH);

            const force = this.addVectors(this.multiplyVectorByScalar(normal, thrustMagnitude + windForceStrength), dragForce);
            // console.log('face', this.norm(force));

            // if (this.norm(force) > 1000) {
            //     debugger;
            // }
            face.vertexIndices.forEach((vertexIndex: number) => {
                forces[vertexIndex] = this.addVectors(forces[vertexIndex], this.divideVectorByScalar(force, 3));

            });

        }
        // // debugger if forces is Nan
        // for (let i = 0; i < forces.length; i++) {
        //     if (isNaN(forces[i][0]) || forces[i][0] === Infinity) {
        //         debugger;
        //     }
        // }

        return forces;
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
        const vertexMass = VERTEX_MASS; // Assuming VERTEX_MASS is defined elsewhere

        for (let step = 0; step < numSteps; step++) {
            // Compute forces for the initial state
            let forces = this.computeForces(vertexPositions, vertexVelocities, dampingCoefficient);

            // Calculate k1 (initial slope)
            let k1Velocity = forces.map(force => this.multiplyVectorByScalar(force, dt / vertexMass));
            let k1Position = vertexVelocities.map(velocity => this.multiplyVectorByScalar(velocity, dt));

            // Calculate k2 (slope at midpoint using k1)
            let midVelocities = vertexVelocities.map((v, i) => this.addVectors(v, this.multiplyVectorByScalar(k1Velocity[i], 0.5)));
            let midPositions = vertexPositions.map((p, i) => this.addVectors(p, this.multiplyVectorByScalar(k1Position[i], 0.5)));
            // forces = this.computeForces(midPositions, midVelocities, dampingCoefficient);
            let k2Velocity = forces.map(force => this.multiplyVectorByScalar(force, dt / vertexMass));
            let k2Position = midVelocities.map(velocity => this.multiplyVectorByScalar(velocity, dt));

            // Calculate k3 (slope at midpoint using k2)
            midVelocities = vertexVelocities.map((v, i) => this.addVectors(v, this.multiplyVectorByScalar(k2Velocity[i], 0.5)));
            midPositions = vertexPositions.map((p, i) => this.addVectors(p, this.multiplyVectorByScalar(k2Position[i], 0.5)));
            forces = this.computeForces(midPositions, midVelocities, dampingCoefficient);
            let k3Velocity = forces.map(force => this.multiplyVectorByScalar(force, dt / vertexMass));
            let k3Position = midVelocities.map(velocity => this.multiplyVectorByScalar(velocity, dt));

            // Calculate k4 (slope at endpoint using k3)
            let endVelocities = vertexVelocities.map((v, i) => this.addVectors(v, k3Velocity[i]));
            let endPositions = vertexPositions.map((p, i) => this.addVectors(p, k3Position[i]));
            forces = this.computeForces(endPositions, endVelocities, dampingCoefficient);
            let k4Velocity = forces.map(force => this.multiplyVectorByScalar(force, dt / vertexMass));
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
