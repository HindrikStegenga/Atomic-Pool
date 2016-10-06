/**
 * Created by jornv on 9/30/2016.
 */
class Cue extends GameObject {
    constructor() {
        let geometry = new THREE.CylinderGeometry(0.05, 0.05, 5);
        let material = new THREE.MeshPhongMaterial({color: "brown"});
        super(geometry, material);

        this.pivotPoint = new THREE.Object3D();
        this.mesh.rotateX(Math.PI / 2);
        this.mesh.position.set(0, 0, 0);
        console.log(this);

        const touchingBallZ = -this.mesh.geometry.parameters.height / 2;
        const defaultZ = touchingBallZ - 0.5;

        let currentPos = {z: defaultZ};

        let that = this;
        this.forwardTween = new TWEEN.Tween(currentPos).to({z: touchingBallZ}, 500)
            .easing(TWEEN.Easing.Exponential.In)
            .onUpdate(function () {
                that.mesh.position.setZ(this.z);
            })
            .onComplete(function () {
                GAME.scene.updateMatrixWorld();
                let ballWorldPos = new THREE.Vector3();
                ballWorldPos.setFromMatrixPosition(GAME.whiteBall.mesh.matrixWorld);

                let cueWorldPos = new THREE.Vector3();
                cueWorldPos.setFromMatrixPosition(GAME.cue.mesh.matrixWorld);

                let direction = ballWorldPos.clone().sub(cueWorldPos.clone());

                console.log(direction);
                GAME.whiteBall.movement = direction.setLength(8);
            });

        this.backwardTween = new TWEEN.Tween(currentPos).to({z: defaultZ}, 1000)
            .easing(TWEEN.Easing.Linear.None)
            .onUpdate(function () {
                that.mesh.position.setZ(this.z);
            });

        this.forwardTween.chain(this.backwardTween);

        GAME.cuecam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.mesh.add(GAME.cuecam);
        GAME.useCueCam = false;
        GAME.cuecam.rotateX(Math.PI / 2);
        GAME.cuecam.rotateZ(Math.PI);
        GAME.cuecam.position.setZ(-1);

        this.mesh.position.setZ(defaultZ);
        this.pivotPoint.add(this.mesh);
        this.pivotPoint.rotateX(Math.PI / 8);


        window.addEventListener('keydown', function (data) {
            let rotationQuaternion;
            switch (data.keyCode) {
                case 37: // Left
                    rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -0.15);
                    GAME.cue.pivotPoint.quaternion.premultiply(rotationQuaternion);
                    break;

                case 39: // Right
                    rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.15);
                    GAME.cue.pivotPoint.quaternion.premultiply(rotationQuaternion);
                    break;

                case 32: // Space
                    GAME.cue.play();
                    break;
            }

        }, false);

        GAME.registerForUpdates(this.updatePosition, this);
    }

    //noinspection JSMethodCanBeStatic
    updatePosition(that) {
        if (!GAME.whiteBall.isMoving && !GAME.whiteBall.isInPocket) {
            that.pivotPoint.position.set(GAME.whiteBall.mesh.position.x, GAME.whiteBall.mesh.position.y, GAME.whiteBall.mesh.position.z);
        }
    }

    play() {
        if (GAME.areAllBallsStationary()) {
            this.forwardTween.start();
        }
    }
}