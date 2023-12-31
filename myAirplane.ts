import { Airplane, Face, Engine } from "./airplaneBuilder.js";
export class MyAirplane extends Airplane {
    constructor() {
        super();

        // the x direction is east, y is up, z is north
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

        // Springs are added by specifying a pair of vertices. When you add a spring, its rest length is set to its current length.
        this.addSpring(0, 1);
        this.addSpring(2, 3);
        this.addSpring(4, 5);
        this.addSpring(6, 7);
        this.addSpring(8, 9);

        // You can also add a sequence of springs by specifying a list of vertices; this will produce a spring between each adjacent vertex in the list.
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
        // if you want, you can get the Spring object returned from addSpring and change its rest length
        const specialSpring = this.addSpring(13, 16);
        specialSpring.restLength *= 1.1;


        // The thrust of the engine is determined by the cross product of the vectors describing its sides.
        // So if you swap two of the vertices, the thrust will be in the opposite direction.
        this.engine = new Engine(11, 3, 2);
        this.faces = [
            new Face(0, 8, 15),
            new Face(1, 9, 14),
            new Face(16, 13, 17),
            new Face(8, 9, 17),
        ];
    }

    handleInput(input) {
        // Input is an object with a property for every letter key, gamepad button, and gamepad axis.
        // Values for buttons and keys are 1 if pressed, 0 if not pressed.
        // Values for axes are between -1 and 1.
        // To see your game controller mapping, use https://jsfiddle.net/5nwodauf/ 
        this.addThrust((input.q - input.e + input.button_4 - input.button_5) * 0.1);

        const steeringChange = (input.a - input.d) * 0.04 + (input.axis_0) * 0.04;
        this.getSpring(15, 17).restLength += steeringChange;
        this.getSpring(14, 17).restLength -= steeringChange;

        const pitchChange = (input.w - input.s) * 0.04 + (-input.axis_1) * 0.04;
        this.getSpring(16, 17).restLength += pitchChange;
        this.getSpring(13, 17).restLength -= pitchChange;
    }
}
