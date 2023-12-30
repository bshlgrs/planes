
export class MagicInput {
    values: { [key: string]: number };

    constructor() {
        this.values = {};

        // Initialize all letter keys (a-z) with a value of 0
        for (let i = 65; i <= 90; i++) {
            this.values[String.fromCharCode(i).toLowerCase()] = 0;
        }

        for (let i = 0; i < 20; i++) {
            this.values[`button_${i}`] = 0;
        }

        for (let i = 0; i < 4; i++) {
            this.values[`axis_${i}`] = 0;
        }


        // Setup event listeners for keyboard
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }


    onKeyDown(event) {
        this.values[event.key.toLowerCase()] = 1;
    }

    onKeyUp(event) {
        this.values[event.key.toLowerCase()] = 0;

    }

    step() {
        // Update gamepad inputs
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];

        if (gamepad) {

            gamepad.buttons.forEach((button, index) => {
                this.values[`button_${index}`] = button.pressed ? 1 : 0;
            });
            gamepad.axes.forEach((axis, index) => {
                this.values[`axis_${index}`] = axis;
            });
        }
    }

    get input() {
        return {
            ...this.values
        };
    }
}