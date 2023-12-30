class MyPlane extends Plane {
    constructor() {
        super();
        this.vertexPositions = [
            [0, 0.5, 0.3],
            [1, 0.5, 0.3],
            [-0.3, 0.5, 1],
            [1.3, 0.5, 1],
            [0, 0.5, 2],
            [1, 0.5, 2],
            [0, 0.5, 3],
            [1, 0.5, 3],
            [-1, 1, 4],
            [2, 1, 4],
            [0.5, 1.5, 0.4],
            [0.5, 1.8, 1.2],
            [0.5, 1.5, 2.5],
            [0.5, 2.5, 3.5],
            [4, 3, 3],
            [-3, 3, 3],
            [0.5, 0.6, 4.1],
            [0.5, 1, 6]
        ];

        this.addSpring(0, 1);
        this.addSpring(2, 3);
        this.addSpring(4, 5);
        this.addSpring(6, 7);
        this.addSpring(8, 9);

        this.addSpringSeries([0, 2, 4, 6, 8]);
        this.addSpringSeries([1, 3, 5, 7, 9]);
        this.addSpringSeries([10, 11, 12, 13]);
        this.addSpringSeries([0, 10, 1]);
        this.addSpringSeries([2, 10, 3]);
        this.addSpringSeries([2, 11, 3]);
        this.addSpringSeries([4, 11, 5]);
        this.addSpringSeries([4, 12, 5]);
        this.addSpringSeries([6, 12, 7]);
        this.addSpringSeries([6, 13, 7]);
        this.addSpringSeries([8, 13, 9]);

        this.addSpringSeries([3, 14, 9])
        this.addSpringSeries([2, 15, 8])

        this.addSpringSeries([8, 16, 9])
        this.addSpringSeries([16, 17, 13])


        this.addSpringSeries([15, 10, 14]);
        this.addSpringSeries([15, 11, 14]);
        this.addSpringSeries([15, 12, 14]);
        this.addSpringSeries([15, 13, 14]);
        this.addSpringSeries([15, 17, 14]);


        this.addSpringSeries([4, 10, 5]);


        this.addSpringSeries([0, 3, 4, 7, 8]);
        this.addSpringSeries([1, 2, 5, 6, 9]);

        this.addSpringSeries([6, 16, 7]);
        this.addSpringSeries([0, 11, 1]);

        this.addSpring(14, 15);
        this.addSpring(13, 16);

        this.engine = new Engine([11, 3, 2]);
        this.faces = [
            new Face([0, 8, 15]),
            new Face([1, 9, 14]),
            new Face([16, 13, 17]),
            new Face([8, 9, 17]),
        ];
    }

    handleInput(input: Object) {
        this.addThrust((input.q - input.e + input.gamepad_button_4 - input.gamepad_button_5) * 0.1);

        const steeringChange = (input.w - input.s) * 0.01 + (input.gamepad_axis_2) * 0.01;
        this.getSpring(15, 17).restLength += steeringChange;
        this.getSpring(14, 17).restLength -= steeringChange;

        const pitchChange = (input.w - input.s) * 0.01 + (input.gamepad_axis_1) * 0.01;
        this.getSpring(16, 17).restLength += pitchChange;
        this.getSpring(13, 17).restLength -= pitchChange;
    }
}

abstract class Plane {
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

    addSpring(fromIdx: number, toIdx: number) {
        this.springs.push(new Spring(fromIdx, toIdx));
    }

    addSpringSeries(vertexIndices: number[]) {
        for (let i = 0; i < vertexIndices.length - 1; i++) {
            this.addSpring(vertexIndices[i], vertexIndices[i + 1]);
        }
    }

    getSpring(fromIdx: number, toIdx: number) {
        return this.springs.find(spring => spring.fromIdx == fromIdx && spring.toIdx == toIdx || spring.fromIdx == toIdx && spring.toIdx == fromIdx);
    }

    addThrust(thrust: number) {
        this.engine.force = thrust;
    }

    update() {
        this.engine.update();
        this.faces.forEach(face => face.update());
        this.springs.forEach(spring => spring.update(this.vertexPositions));
    }
}


class Spring {
    fromIdx: number;
    toIdx: number;
    restLength: number;

    constructor(fromIdx: number, toIdx: number, restLength: number) {
        this.fromIdx = fromIdx;
        this.toIdx = toIdx;
        this.restLength = restLength;
    }
}

class Face {
    vertexIndices: number[];
    force: number = 0;

    constructor(vertexIndices: number[]) {
        this.vertexIndices = vertexIndices;
    }
}

// subclass of Face
class Engine extends Face {
    constructor(vertexIndices: number[]) {
        super(vertexIndices);
    }

}