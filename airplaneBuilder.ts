
const MAX_THRUST_CHANGE = 1;
export const MAX_THRUST = 200;

export abstract class Airplane {
    vertexPositions: number[][];
    springs: Spring[];
    faces: Face[];
    engine: Engine;

    constructor() {
        this.vertexPositions = [[0, 0, 0]];
        this.springs = [];
        this.faces = [];
        this.engine = null;
    }

    addSpring(fromIdx: number, toIdx: number): Spring {
        if (fromIdx >= this.vertexPositions.length || fromIdx < 0) {
            throw new Error(`Vertex ${fromIdx} does not exist.`);
        }
        if (toIdx >= this.vertexPositions.length || toIdx < 0) {
            throw new Error(`Vertex ${toIdx} does not exist.`);
        }
        this.springs.push(new Spring(fromIdx, toIdx, Math.hypot(...this.vertexPositions[fromIdx].map((x, i) => x - this.vertexPositions[toIdx][i]))));
        return this.springs[this.springs.length - 1];
    }

    addSpringSeries(vertexIndices: number[]) {
        for (let i = 0; i < vertexIndices.length - 1; i++) {
            this.addSpring(vertexIndices[i], vertexIndices[i + 1]);
        }
    }

    getSpring(fromIdx: number, toIdx: number) {
        const spring = this.springs.find(spring => spring.fromIdx == fromIdx && spring.toIdx == toIdx || spring.fromIdx == toIdx && spring.toIdx == fromIdx);
        if (spring === undefined) {
            throw new Error(`Spring between vertices ${fromIdx} and ${toIdx} does not exist.`);
        }
        return spring;
    }

    addThrust(thrust: number) {
        // limit rate of change of thrust
        const clampedThrustChange = Math.min(Math.abs(thrust), MAX_THRUST_CHANGE) * Math.sign(thrust);

        this.engine.force += clampedThrustChange;

        // limit thrust
        this.engine.force = Math.max(0, Math.min(MAX_THRUST, this.engine.force));
    }

    update() {
        this.engine.update();
        this.faces.forEach(face => face.update());
        this.springs.forEach(spring => spring.update(this.vertexPositions));
    }
}



export class Spring {
    fromIdx: number;
    toIdx: number;
    restLength: number;
    initialRestLength: number;

    constructor(fromIdx: number, toIdx: number, restLength: number) {
        this.fromIdx = fromIdx;
        this.toIdx = toIdx;
        this.restLength = restLength;
        this.initialRestLength = restLength;
    }
}

export class Face {
    vertexIndices: number[];
    force: number = 0;

    constructor(v1: number, v2: number, v3: number) {
        this.vertexIndices = [v1, v2, v3];
    }
}

// subclass of Face
export class Engine extends Face {
    constructor(v1: number, v2: number, v3: number) {
        super(v1, v2, v3);
    }

}