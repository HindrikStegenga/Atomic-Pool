class Game {
    constructor(playername1, playername2) {
        // Setup Three.js base
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.y = 6;
        this.camera.position.x = 4;

        let body = $("body");
        body.css("background-color", "black");
        this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
        this.renderer.setSize(body.width(), body.height());

        body.append(this.renderer.domElement);

        // Initialize update array
        this.updateList = [];

        this.collisionController = new CollisionController();

        this.orbitControls = new THREE.OrbitControls(this.camera, document, this.renderer.domElement);
        this.registerForUpdates(function (controls) {
            controls.update();
        }, this.orbitControls);

        // Setup frametime clock
        this.clock = new THREE.Clock(true);
        this.frameTime = 0;
        this.registerForUpdates(this.updateFrametime, this);

        this.player1Display = $("#player1");
        this.player2Display = $("#player2");

        this.player1Display.find(".name").text(playername1);
        this.player2Display.find(".name").text(playername2);


        this.playerManager = new PlayerManager(playername1, playername2);


        this.registerForUpdates(this.updateGUI, this);

        window.addEventListener('keydown', function (data) {
            if(data.keyCode == 70) // F
            {
                    GAME.useCueCam = !GAME.useCueCam;
            }
        }, false);

        this.infofeed = new InfoFeed();
    }

    //noinspection JSMethodCanBeStatic
    updateFrametime(that) {
        that.frameTime = that.clock.getDelta();
    }

    render() {
        this.collisionController.checkCollisions();
        TWEEN.update();
        GAME.updateList.forEach(function (element) {
            element.function(element.that);
        });

        requestAnimationFrame(function () {
            GAME.render()
        });
        if (GAME.useCueCam) GAME.renderer.render(GAME.scene, GAME.cuecam);
        else GAME.renderer.render(GAME.scene, GAME.camera);

    }

    // Registers a function and the object it belongs to, this makes it run every frame
    registerForUpdates(func, that) {
        this.updateList.push({function: func, that: that});
    }

    updateGUI(that) {
        if(that.playerManager.currentPlayer === that.playerManager.players[0]) {
            that.player1Display.css("background-color", that.playerManager.players[0].color.name);
            that.player2Display.css("background-color", "rgba(0,0,0,0.6");
        }
        else {
            that.player2Display.css("background-color", that.playerManager.players[1].color.name);
            that.player1Display.css("background-color", "rgba(0,0,0,0.6");
        }



        that.player1Display.find(".color").text(that.playerManager.players[0].color.name == "green" ? "undecided" : that.playerManager.players[0].color.name);
        let player1Balls = that.playerManager.players[0].getRemainingBalls();
        if(player1Balls === undefined) player1Balls = 7;
        that.player1Display.find(".ballAmount").text(player1Balls);

        that.player2Display.find(".color").text(that.playerManager.players[1].color.name == "green" ? "undecided" : that.playerManager.players[1].color.name);
        let player2Balls = that.playerManager.players[1].getRemainingBalls();
        if(player2Balls === undefined) player2Balls = 7;
        that.player2Display.find(".ballAmount").text(player2Balls);
    }

    areAllBallsStationary() {
        for (let i = 0; i < this.balls.length; ++i) {
            if (this.balls[i].isMoving) return false;
        }
        return true;
    }

    createObjects() {
        GAME.registerForUpdates(this.playerManager.update, this.playerManager);

        this.poolTable = new PoolTable(5, 8);
        this.scene.add(this.poolTable.group);

        this.skyBox = new SkyBox("Positive X.jpg", "Negative X.jpg", "Positive Y.jpg", "Negative Y.jpg", "Positive Z.jpg", "Negative Z.jpg");
        this.scene.add(this.skyBox.mesh);

        // Light
        this.sun = new Sun();
        this.scene.add(this.sun);

        this.ambientLight = new THREE.AmbientLight(0x404040);

        this.light = new THREE.SpotLight("white", 0.9);

        this.light.position.set(0,6,0);
        GAME.scene.add(this.light);
        GAME.scene.add(this.ambientLight);

        this.grass = this.createGrass();
        GAME.scene.add(this.grass);

        this.addPockets();

        this.addBalls();

        this.cue = new Cue();
        GAME.scene.add(this.cue.pivotPoint);
    }

    //noinspection JSMethodCanBeStatic
    createGrass() {
        let tcl = new THREE.TextureLoader();

        let grassTex = tcl.load("imgs/grass.jpg");

        grassTex.wrapT = grassTex.wrapS = THREE.RepeatWrapping;
        grassTex.repeat.set(125, 125);

        let planeGeom = new THREE.PlaneGeometry(1000, 1000);
        planeGeom.rotateX(-Math.PI / 2);
        let planeMat = new THREE.MeshPhysicalMaterial({
            reflectivity: 0,
            roughness: 0.70,
            map: grassTex
        });
        return new THREE.Mesh(planeGeom, planeMat);
    }

    addPockets() {
        this.pockets = [];

        let pocketLeftMiddle = new Pocket(2.5,0, 0.25, 0.5,0,0);
        let pocketRightMiddle = new Pocket(-2.5,0, 0.25, 0.5,0,0);

        let pocketLeftBottom = new Pocket(2.5,-4,   0.5, 0.6, -0.13, 0.05);
        let pocketRightBottom = new Pocket(-2.5,-4, 0.5, 0.6,  0.13, 0.05);

        let pocketLeftTop = new Pocket(  2.5,4, 0.5, 0.6, -0.13, -0.05);
        let pocketRightTop = new Pocket(-2.5,4, 0.5, 0.6,  0.13, -0.05);

        pocketLeftMiddle.opposite = pocketRightMiddle;

        pocketRightMiddle.opposite = pocketLeftMiddle;

        pocketLeftTop.opposite = pocketRightBottom;

        pocketLeftBottom.opposite = pocketRightTop;

        pocketRightTop.opposite = pocketLeftBottom;

        pocketRightBottom.opposite = pocketLeftTop;

        this.scene.add(pocketLeftMiddle.mesh);
        this.scene.add(pocketLeftMiddle.blackHoleMesh);
        this.pockets.push(pocketLeftMiddle);

        this.scene.add(pocketRightMiddle.mesh);
        this.scene.add(pocketRightMiddle.blackHoleMesh);
        this.pockets.push(pocketRightMiddle);

        this.scene.add(pocketRightBottom.mesh);
        this.scene.add(pocketRightBottom.blackHoleMesh);
        this.pockets.push(pocketRightBottom);

        this.scene.add(pocketRightTop.mesh);
        this.scene.add(pocketRightTop.blackHoleMesh);
        this.pockets.push(pocketRightTop);

        this.scene.add(pocketLeftBottom.mesh);
        this.scene.add(pocketLeftBottom.blackHoleMesh);
        this.pockets.push(pocketLeftBottom);

        this.scene.add(pocketLeftTop.mesh);
        this.scene.add(pocketLeftTop.blackHoleMesh);
        this.pockets.push(pocketLeftTop);
    }



    addBalls() {
        this.balls = [];

        this.whiteBall = new BallObject(0, new THREE.SphereGeometry(0.1, 30, 30), new THREE.MeshPhysicalMaterial({
            color: "white",
            metalness: 0.05
        }), true);

        for(let i = 1; i < 16; ++i)
        {
            if(i == 8)
                continue;

            let color;
            if(i < 8)
                color = "red";
            else
                color = "blue";

            let ball = new BallObject(i, new THREE.SphereGeometry(0.1, 30  , 30), new THREE.MeshPhysicalMaterial({
                color: color,
                metalness: 0.05
            }), true);

            ball.mesh.translateY(this.poolTable.plateY + ball.distanceToGround);
            ball.mesh.translateZ(2);
            this.scene.add(ball.mesh);
            this.balls.push(ball);
        }

        let rad = this.balls[0].mesh.geometry.parameters.radius + 0.01;

        shuffle(this.balls);



        this.balls[0].mesh.translateZ(0);
        this.balls[0].mesh.translateX(0);


        this.balls[1].mesh.translateZ(rad * 2);
        this.balls[1].mesh.translateX(- rad);

        this.balls[2].mesh.translateZ(rad * 2);
        this.balls[2].mesh.translateX(rad);

        this.balls[3].mesh.translateZ(rad * 4);
        this.balls[3].mesh.translateX(rad * 2);

        this.balls[4].mesh.translateZ(rad * 4);
        this.balls[4].mesh.translateX(-rad * 2);

        this.balls[5].mesh.translateZ(rad * 6);
        this.balls[5].mesh.translateX(-rad);

        this.balls[6].mesh.translateZ(rad * 6);
        this.balls[6].mesh.translateX(rad);

        this.balls[7].mesh.translateZ(rad * 6);
        this.balls[7].mesh.translateX(rad * 3);

        this.balls[8].mesh.translateZ(rad * 6);
        this.balls[8].mesh.translateX(- rad * 3);

        this.balls[9].mesh.translateZ(rad * 8);
        this.balls[9].mesh.translateX(- rad * 2);

        this.balls[10].mesh.translateZ(rad * 8);
        this.balls[10].mesh.translateX(rad * 2);

        this.balls[11].mesh.translateZ(rad * 8);
        this.balls[11].mesh.translateX(- rad * 4);

        this.balls[12].mesh.translateZ(rad * 8);
        this.balls[12].mesh.translateX(rad * 4);

        this.balls[13].mesh.translateZ(rad * 8);

        let blackBall = new BallObject(8, new THREE.SphereGeometry(0.1, 30, 30), new THREE.MeshPhysicalMaterial({
            color: "black",
            metalness: 0.05
        }), true);
        blackBall.mesh.translateY(this.poolTable.plateY + blackBall.distanceToGround);
        blackBall.mesh.translateZ(2);
        blackBall.mesh.translateZ(rad * 4);
        this.scene.add(blackBall.mesh);
        this.balls.push(blackBall);
        this.blackBall = blackBall;

        this.whiteBall.mesh.translateY(this.poolTable.plateY + this.whiteBall.distanceToGround);
        this.scene.add(this.whiteBall.mesh);
        this.balls.push(this.whiteBall);
    }
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}