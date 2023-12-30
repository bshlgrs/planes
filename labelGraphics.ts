
import * as THREE from 'three';
import { PhysicsSystem } from './physics';


function createTextSprite(message, fontsize, fontface, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${fontsize}px ${fontface}`;

    // Measure text width and set canvas size
    const metrics = context.measureText(message);
    const textWidth = metrics.width;
    canvas.width = textWidth;
    canvas.height = fontsize * 1.4; // Height based on font size

    // Text style and position
    context.fillStyle = 'rgba(255, 255, 255, 0.0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = `${fontsize}px ${fontface}`;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(message, canvas.width / 2, canvas.height / 2);

    // Create texture and sprite
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.4, 0.4, 1); // Adjust scale as needed

    return sprite;
}


export class LabelGraphics {
    scene: THREE.Scene;
    physicsSystem: PhysicsSystem;
    labels: THREE.Mesh[];

    constructor(scene: THREE.Scene, physicsSystem: PhysicsSystem) {
        this.scene = scene;
        this.physicsSystem = physicsSystem;


        // Store labels for easy access
        this.labels = [];

        // Create labels
        physicsSystem.vertexPositions.forEach((vertex, index) => {
            const label = createTextSprite(`${index}`, 48, 'Arial', 'rgba(255, 255, 0, 1)');
            label.position.set(...vertex);
            scene.add(label);
            this.labels.push(label); // Store the label
        });
    }

    update() {

        for (let i = 0; i < this.physicsSystem.vertexPositions.length; i++) {
            // Update label positions
            this.labels[i].position.set(...this.physicsSystem.vertexPositions[i]);
        }

    }

    dispose() {
        this.labels.forEach((label) => {
            this.scene.remove(label);
        });
    }

    setVisible() {
        this.labels.forEach((label) => {
            label.visible = true;
        });
    }

    setInvisible() {
        this.labels.forEach((label) => {
            label.visible = false;
        });
    }
}