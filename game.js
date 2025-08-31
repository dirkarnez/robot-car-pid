// class Example extends Phaser.Scene
// {
//     constructor ()
//     {
//         super();
//     }

//     preload ()
//     {
//         this.load.setBaseURL('https://labs.phaser.io');
//         this.load.image('alien', 'assets/shaders/alien.png');
//         this.load.image('sandbox', 'assets/shaders/sandbox.png');
//         this.load.image('logo', 'assets/sprites/phaser-large.png');
//     }

//     create ()
//     {
//         const base = new Phaser.Display.BaseShader('wobble', frag);
//         const base2 = new Phaser.Display.BaseShader('laser', frag2, null, { alpha: { type: '1f', value: 1 } });

//         const shader1 = this.add.shader(base, 400, 400, 800, 800);
//         const shader2 = this.add.shader(base2, 400, 400, 800, 800);

//         const alien = this.add.image(400, 1200, 'alien');

//         this.add.image(400, 350, 'logo');
//         this.add.image(400, 450, 'sandbox').setScale(0.5);

//         this.tweens.add({
//             targets: alien,
//             y: -400,
//             duration: 4000,
//             ease: 'Sine.easeInOut',
//             yoyo: true,
//             repeat: -1
//         });

//         const v = {
//             alpha: 1
//         };

//         this.tweens.add({
//             targets: v,
//             delay: 2000,
//             repeatDelay: 4000,
//             hold: 4000,
//             alpha: 0,
//             duration: 2000,
//             yoyo: true,
//             repeat: -1,
//             onUpdate: () => {
//                 shader2.setUniform('alpha.value', v.alpha);
//             }
//         });
//     }
// }

// const game = new Phaser.Game({
//     type: Phaser.WEBGL,
//     parent: 'phaser-example',
//     width: 800,
//     height: 800,
//     scale: {
//         mode: Phaser.Scale.FIT,
//         autoCenter: Phaser.Scale.CENTER_BOTH
//     },
//     scene: Example
// });

// const frag = `
// #ifdef GL_ES
// precision mediump float;
// #endif

// #extension GL_OES_standard_derivatives : enable

// uniform vec2 resolution;
// uniform float time;

// /*
// * @author Hazsi (kinda)
// */
// mat2 m(float a) {
//     float c=cos(a), s=sin(a);
//     return mat2(c,-s,s,c);
// }

// float map(vec3 p) {
//     p.xz *= m(time * 0.4);p.xy*= m(time * 0.1);
//     vec3 q = p * 2.0 + time;
//     return length(p+vec3(sin(time * 0.7))) * log(length(p) + 1.0) + sin(q.x + sin(q.z + sin(q.y))) * 0.5 - 1.0;
// }

// void main() {
//     vec2 a = gl_FragCoord.xy / resolution.y - vec2(0.9, 0.5);
//     vec3 cl = vec3(0.0);
//     float d = 2.5;

//     for (int i = 0; i <= 5; i++) {
//         vec3 p = vec3(0, 0, 4.0) + normalize(vec3(a, -1.0)) * d;
//         float rz = map(p);
//         float f =  clamp((rz - map(p + 0.1)) * 0.5, -0.1, 1.0);
//         vec3 l = vec3(0.1, 0.3, 0.4) + vec3(5.0, 2.5, 3.0) * f;
//         cl = cl * l + smoothstep(2.5, 0.0, rz) * 0.6 * l;
//         d += min(rz, 1.0);
//     }

//     gl_FragColor = vec4(cl, 1.0);
// }
// `;

// const frag2 = `
// precision mediump float;

// uniform float time;
// uniform float alpha;
// uniform vec2 resolution;

// void main(void) {
// 	vec2 uPos = ( gl_FragCoord.xy / resolution.xy );
// 	uPos -= .5;
// 	vec3 color = vec3(-0.1);
// 	float vertColor = 0.0;
// 	for( float i = 0.; i < 6.5; ++i ) {
// 		uPos.y += sin( uPos.x*(i+1.0) + (time * 1.5)   +i/0.00000001 ) * 0.1;
// 		float fTemp = abs(1.0 / uPos.y / 100.0);
// 		vertColor += fTemp;
// 		color += vec3( fTemp*(10.0-i)/10.0, fTemp*i/10.0, pow(fTemp,0.99)*1.5 );
// 	}
// 	gl_FragColor = vec4(color * alpha, alpha);
// }
// `;

class CarScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CarScene' });
        this.leftWheelSpeed = 0;
        this.rightWheelSpeed = 0;
    }

    preload() {
        // No assets to load, car is drawn with primitives
    }

    create() {
        // Draw car: rectangle body, two wheels
        this.car = this.add.container(400, 300);
        const body = this.add.rectangle(0, 0, 60, 24, 0x66ccff);
        const rearMiddle = this.add.rectangle(20, 0, 10, 16, 0x333333);
        // Two wheels only (differential drive, left and right)
        const leftWheel = this.add.rectangle(-20, -12, 12, 18, 0x333333);
        const rightWheel = this.add.rectangle(-20, 12, 12, 18, 0x333333);

        this.car.add([body, leftWheel, rightWheel, rearMiddle]);


        this.car.x = 400;
        this.car.y = 300;
        this.car.angle = 0;

        this.carPhysics = {
            x: 400,
            y: 300,
            angle: 0
        };

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey('W');
        this.keyA = this.input.keyboard.addKey('A');
        this.keyS = this.input.keyboard.addKey('S');
        this.keyD = this.input.keyboard.addKey('D');

        // Draw a simple track
        this.track = this.add.graphics();
        this.track.lineStyle(4, 0xffffff, 0.2);
        this.track.strokeEllipse(400, 300, 600, 400);

        this.speedText = this.add.text(10, 10, '', { color: '#fff', backgroundColor: '#222', fontSize: 16 });
    }

    update() {
        const wheelAccel = 0.05;
        const maxWheelSpeed = 2;
        // Gradual friction
        this.leftWheelSpeed *= 0.98;
        this.rightWheelSpeed *= 0.98;

        // Controls
        if (this.cursors.up.isDown || this.keyW.isDown) {
            this.leftWheelSpeed = Phaser.Math.Clamp(this.leftWheelSpeed + wheelAccel, -maxWheelSpeed, maxWheelSpeed);
            this.rightWheelSpeed = Phaser.Math.Clamp(this.rightWheelSpeed + wheelAccel, -maxWheelSpeed, maxWheelSpeed);
        }
        if (this.cursors.down.isDown || this.keyS.isDown) {
            this.leftWheelSpeed = Phaser.Math.Clamp(this.leftWheelSpeed - wheelAccel, -maxWheelSpeed, maxWheelSpeed);
            this.rightWheelSpeed = Phaser.Math.Clamp(this.rightWheelSpeed - wheelAccel, -maxWheelSpeed, maxWheelSpeed);
        }
        if (this.cursors.left.isDown || this.keyA.isDown) {
            this.leftWheelSpeed = Phaser.Math.Clamp(this.leftWheelSpeed - wheelAccel, -maxWheelSpeed, maxWheelSpeed);
            this.rightWheelSpeed = Phaser.Math.Clamp(this.rightWheelSpeed + wheelAccel, -maxWheelSpeed, maxWheelSpeed);
        }
        if (this.cursors.right.isDown || this.keyD.isDown) {
            this.leftWheelSpeed = Phaser.Math.Clamp(this.leftWheelSpeed + wheelAccel, -maxWheelSpeed, maxWheelSpeed);
            this.rightWheelSpeed = Phaser.Math.Clamp(this.rightWheelSpeed - wheelAccel, -maxWheelSpeed, maxWheelSpeed);
        }

        // Differential drive kinematics
        const wheelBase = 36;
        const v = (this.leftWheelSpeed + this.rightWheelSpeed) / 2.0;
        const omega = (this.rightWheelSpeed - this.leftWheelSpeed) / wheelBase * 180 / Math.PI;

        this.carPhysics.x += Math.cos(Phaser.Math.DegToRad(this.carPhysics.angle)) * v;
        this.carPhysics.y += Math.sin(Phaser.Math.DegToRad(this.carPhysics.angle)) * v;
        this.carPhysics.angle += omega;

        this.car.x = this.carPhysics.x;
        this.car.y = this.carPhysics.y;
        this.car.angle = this.carPhysics.angle;

        // Update wheel speeds display
        this.speedText.setText(`Left Wheel: ${this.leftWheelSpeed.toFixed(2)}\nRight Wheel: ${this.rightWheelSpeed.toFixed(2)}`);
    }
}


const game = new Phaser.Game({
    type: Phaser.WEBGL,
    parent: 'phaser-example',
    width: 800,
    height: 800,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: CarScene
});
