var IDE_HOOK = false;
var VERSION = '2.7.7';

(function () {

    var gameWidth = 800;
    var gameHeight = 600;

    var game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, 'phaser-example', {
        preload: preload,
        create: create,
        update: update,
        render: render
    });

    function preload() {
        game.load.image('wall', 'assets/games/cowcar/textures/wall.png');
        game.load.spritesheet('invader', 'assets/games/invaders/invader32x32x4.png', 32, 32);
        game.load.image('car', 'assets/games/cowcar/icons/car.png');
        game.load.image('carStanding', 'assets/games/cowcar/icons/car_standing.png');
        game.load.spritesheet('kaboom', 'assets/games/invaders/explode.png', 128, 128);
        game.load.image('background', 'assets/games/cowcar/textures/grass.jpg');
        game.load.image('road', 'assets/games/cowcar/textures/asphalt.png');
        game.load.image('grass', 'assets/games/cowcar/icons/grass.png');
        game.load.spritesheet('cow', 'assets/games/cowcar/icons/cow.png', 40, 80);
        game.load.spritesheet('cowStanding', 'assets/games/cowcar/icons/cow_standing.png', 75, 50);
        game.load.spritesheet('turningEffect', 'assets/games/cowcar/icons/effect.png', 256, 256);
        game.load.spritesheet('speedUpEffect', 'assets/games/cowcar/icons/speedup_effect.png', 109, 104);
    }

    var road = {
        x: gameWidth / 2,
        width: 600,
        minWidth: 450,
        maxWidth: 700
    };

    var playerSpeed = {
        current: 420,
        max: 1000,
        min: 100,
        add: function (speed) {
            this.current += speed;

            const maxSpeed = this.max * (terrains[currentTerrain].speedCoefficients[currentClass.name] || 1);

            this.current = Math.min(this.current, maxSpeed);
            this.current = Math.max(this.current, this.min);
        },
        coefficient: 1
    };

    var speedString;
    var speedText;

    var player;
    var cursors;
    var background;
    var score = 0;
    var scoreString = '';
    var scoreText;
    var timeString;
    var timeText;
    var timeLeft = 60;
    var buildBordersTimer = 0;
    var addRandomObjectTimer = 0;
    var changeTerrainTimer = 0;
    var addSpeedTimer = 0;
    var stateText;
    var explosions;
    var roadBorders;
    var roadObjects;
    var currentClass;
    var turningEffects;
    var speedUpEffects;
    var lastUpdateTime;
    var gameFinished = false;

    var terrains = {
        'asphalt': {
            texture: 'road',
            speedCoefficients: {
                'car': 1.5,
                'cow': 0.8
            }
        },
        'grass': {
            texture: 'background',
            speedCoefficients: {
                'car': 0.2,
                'cow': 1
            }
        }
    };
    const terrainsArray = ['asphalt', 'grass'];
    let currentTerrain = terrainsArray[0];

    function create() {

        game.physics.startSystem(Phaser.Physics.ARCADE);

        background = game.add.tileSprite(0, 0, 800, 600, 'background');

        terrainsArray.forEach(id => {
            const terrain = terrains[id];

            const textures = game.add.group();
            textures.enableBody = true;
            textures.physicsBodyType = Phaser.Physics.ARCADE;
            for (let i = 0; i < 30; ++i) {
                game.add.tileSprite(road.x, 0, road.width, 90, terrain.texture, 0, textures);
            }

            textures.setAll('anchor.x', 0.5);
            textures.setAll('anchor.y', 1);
            textures.setAll('outOfBoundsKill', true);
            textures.setAll('checkWorldBounds', true);
            textures.forEachAlive(function (x) {
                x.kill();
            });

            terrain.group = textures;
        });

        roadBorders = game.add.group();
        roadBorders.enableBody = true;
        roadBorders.physicsBodyType = Phaser.Physics.ARCADE;
        roadBorders.createMultiple(30, 'wall');
        roadBorders.setAll('anchor.x', 0.5);
        roadBorders.setAll('anchor.y', 1);
        roadBorders.setAll('outOfBoundsKill', true);
        roadBorders.setAll('checkWorldBounds', true);

        roadObjects = [new Cow(), new Car(), new Grass()];
        roadObjects.forEach(c => {
            c.init(game);
        });

        currentClass = roadObjects[1];

        player = game.add.sprite(400, 500, 'car');
        player.anchor.setTo(0.5, 0.5);
        game.physics.enable(player, Phaser.Physics.ARCADE);

        scoreString = 'Пройдено: ';
        scoreText = game.add.text(10, 10, scoreString + score, {font: '34px Arial', fill: '#fff'});

        timeString = 'Осталось: ';
        timeText = game.add.text(550, 10, timeString + timeLeft + ' с', {font: '34px Arial', fill: '#fff'});

        speedString = 'Скорость: ';
        speedText = game.add.text(10, 550, speedString + playerSpeed.current, {font: '34px Arial', fill: '#fff'});

        stateText = game.add.text(game.world.centerX, game.world.centerY, '', {
            font: '84px Arial',
            fill: '#fff',
            align: 'center'
        });
        stateText.anchor.setTo(0.5, 0.5);
        stateText.visible = false;

        explosions = game.add.group();
        explosions.createMultiple(30, 'kaboom');
        explosions.forEach(function (explosion) {
            explosion.anchor.x = 0.5;
            explosion.anchor.y = 0.5;
            explosion.animations.add('kaboom');
        }, this);

        turningEffects = game.add.group();
        turningEffects.createMultiple(30, 'turningEffect');
        turningEffects.forEach(function (effect) {
            effect.anchor.x = 0.5;
            effect.anchor.y = 0.5;
            effect.animations.add('turningEffect');
        }, this);

        speedUpEffects = game.add.group();
        speedUpEffects.createMultiple(30, 'speedUpEffect');
        speedUpEffects.forEach(function (effect) {
            effect.anchor.x = 0.5;
            effect.anchor.y = 0.5;
            effect.animations.add('speedUpEffect');
        }, this);

        cursors = game.input.keyboard.createCursorKeys();

        lastUpdateTime = game.time.now;
    }

    function update() {

        if (gameFinished) {
            return;
        }

        let pathPassed = playerSpeed.current / 60;

        score += pathPassed / 100;
        scoreText.text = scoreString + Math.floor(score);

        const now = game.time.now;

        timeLeft -= (now - lastUpdateTime) / 1000;
        timeLeft = Math.max(0, timeLeft);

        if (timeLeft < 1) {
            player.kill();
            roadBorders.forEach(x => x.kill());
            roadObjects.forEach(c => c.group.forEach(x => x.kill()));
            terrainsArray.map(t => terrains[t]).forEach(t => t.group.forEach(x => x.kill()));
            stateText.text = 'Вы проехали\r\n' + Math.floor(score);
            stateText.visible = true;
            gameFinished = true;
        }

        lastUpdateTime = now;

        timeText.text = timeString + Math.floor(timeLeft) + ' с';

        background.tilePosition.y += pathPassed;

        if (player.alive) {
            player.body.velocity.setTo(0, 0);

            checkCursors();

            if (game.time.now > buildBordersTimer) {
                buildBorders();
            }
            game.physics.arcade.overlap(roadBorders, player, playerHitsBorder, null, this);

            if (game.time.now > addRandomObjectTimer) {
                addRandomObject();
            }

            if (game.time.now > changeTerrainTimer) {
                changeTerrain();
            }

            if (game.time.now > addSpeedTimer) {
                playerSpeed.add(10);

                addSpeedTimer = game.time.now + 100;
            }


            roadObjects.forEach(c => game.physics.arcade.overlap(c.group, player, (player, item) => {

                item.kill();

                let effects = c.getEffects();

                if (effects[currentClass.name]) {
                    effects[currentClass.name].forEach(applyEffect);
                }


            }, null, this));
        }

        speedText.text = speedString + ' ' + Math.floor(playerSpeed.current);
    }

    function render() {
    }

    function applyEffect(effect) {
        switch (effect.id) {
            case 'speedChange':
                playerSpeed.add(effect.value);

                if (effect.explode) {
                    explode(player.body.x + 30, player.body.y);
                } else if (effect.value > 0) {
                    var speedUpEffect = speedUpEffects.getFirstExists(false);

                    if (speedUpEffect) {
                        speedUpEffect.reset(player.body.x + 20, player.body.y + 100);
                        speedUpEffect.play('speedUpEffect', 30, false, true);
                    }
                }

                break;
            case 'turnTo':
                currentClass = roadObjects.filter(x => x.name === effect.name)[0];
                currentClass.turnTo(player);

                var turningEffect = turningEffects.getFirstExists(false);

                if (turningEffect) {
                    turningEffect.reset(player.body.x, player.body.y);
                    turningEffect.play('turningEffect', 30, false, true);
                }

                break;
        }
    }

    function addRandomObject() {
        var roadClass = roadObjects[game.rnd.integerInRange(0, roadObjects.length - 1)];
        var item = roadClass.group.getFirstExists(false);

        if (item) {
            var x = game.rnd.integerInRange(road.x - road.width / 2 + 100, road.x + road.width / 2 - 100);
            item.reset(x, 0);
            roadClass.playAnimation(item);

            game.physics.arcade.moveToXY(item, x, gameHeight, playerSpeed.current);

            addRandomObjectTimer = game.time.now + 1000;
        }

        return roadClass;
    }

    function changeTerrain() {
        currentTerrain = terrainsArray[game.rnd.integerInRange(0, terrainsArray.length - 1)];

        changeTerrainTimer = game.time.now + game.rnd.integerInRange(3, 5)*1000;
    }

    function checkCursors() {
        if (cursors.left.isDown) {
            player.body.velocity.x = -200;
        }
        else if (cursors.right.isDown) {
            player.body.velocity.x = 200;
        }
    }

    function playerHitsBorder(player, border) {

        playerSpeed.add(-playerSpeed.current * 0.5);

        explode(player.body.x, player.body.y);

        if (player.x > border.x) {
            player.x += 50;
        } else {
            player.x -= 50;
        }
    }

    function explode(x, y) {
        var explosion = explosions.getFirstExists(false);

        if (explosion) {
            explosion.reset(x, y);
            explosion.play('kaboom', 30, false, true);
        }
    }


    function buildBorders() {

        road.width += game.rnd.integerInRange(-50, 50);
        road.width = Math.min(road.width, road.maxWidth);
        road.width = Math.max(road.width, road.minWidth);

        road.x += game.rnd.integerInRange(-50, 50);
        road.x = Math.min(road.x, gameWidth - road.width / 2);
        road.x = Math.max(road.x, road.width / 2);


        const terrainSprite = terrains[currentTerrain].group.getFirstExists(false);
        if (terrainSprite) {
            terrainSprite.reset(road.x, 0);
            terrainSprite.width = road.width;
            game.physics.arcade.moveToXY(terrainSprite, road.x, gameHeight, playerSpeed.current);
        }

        var borders = roadBorders.getAll('exists', false);
        var left = borders[0];
        var right = borders[1];

        if (left) {
            var leftX = road.x - road.width / 2;
            left.reset(leftX, 0);
            game.physics.arcade.moveToXY(left, leftX, gameHeight, playerSpeed.current);
            roadBorders.sendToBack(left);
        }

        if (right) {
            var rightX = road.x + road.width / 2;
            right.reset(rightX, 0);
            game.physics.arcade.moveToXY(right, rightX, gameHeight, playerSpeed.current);
            roadBorders.sendToBack(right);
        }

        syncObjectsVelocityWithPlayer(roadBorders);
        roadObjects.forEach(x => syncObjectsVelocityWithPlayer(x.group));
        terrainsArray.map(t => terrains[t]).forEach(x => syncObjectsVelocityWithPlayer(x.group));

        buildBordersTimer = game.time.now + 60000 / playerSpeed.current;
    }


    function syncObjectsVelocityWithPlayer(objects) {
        objects.forEachAlive(function (obj) {
            obj.body.velocity.y = playerSpeed.current;
        });
    }
})();
