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
        game.load.image('bullet', 'assets/games/invaders/bullet.png');
        game.load.image('enemyBullet', 'assets/games/cowcar/textures/wall.png');
        game.load.spritesheet('invader', 'assets/games/invaders/invader32x32x4.png', 32, 32);
        game.load.image('ship', 'assets/games/cowcar/icons/car.png');
        game.load.spritesheet('kaboom', 'assets/games/invaders/explode.png', 128, 128);
        game.load.image('background', 'assets/games/cowcar/textures/grass.jpg');
        game.load.image('road', 'assets/games/cowcar/textures/asphalt.png');
        game.load.spritesheet('cow', 'assets/games/cowcar/icons/cow.png', 40, 80);
        game.load.spritesheet('cowStanding', 'assets/games/cowcar/icons/cow_standing.png', 75, 50);
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
            this.current = Math.min(this.current, this.max);
            this.current = Math.max(this.current, this.min);
        }
    };

    var player;
    var aliens;
    var bullets;
    var cursors;
    var background;
    var score = 0;
    var scoreString = '';
    var scoreText;
    var firingTimer = 0;
    var stateText;
    var explosions;
    var roadTextures;
    var roadBorders;

    function create() {

        game.physics.startSystem(Phaser.Physics.ARCADE);

        background = game.add.tileSprite(0, 0, 800, 600, 'background');

        bullets = game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;
        bullets.createMultiple(30, 'bullet');
        bullets.setAll('anchor.x', 0.5);
        bullets.setAll('anchor.y', 1);
        bullets.setAll('outOfBoundsKill', true);
        bullets.setAll('checkWorldBounds', true);
        
        roadTextures = game.add.group();
        roadTextures.enableBody = true;
        roadTextures.physicsBodyType = Phaser.Physics.ARCADE;

        for (var i = 0; i < 30; ++i)
        {
            game.add.tileSprite(road.x, 0, road.width, 90, 'road', 0, roadTextures);
        }

        roadTextures.setAll('anchor.x', 0.5);
        roadTextures.setAll('anchor.y', 1);
        roadTextures.setAll('outOfBoundsKill', true);
        roadTextures.setAll('checkWorldBounds', true);
        roadTextures.forEachAlive(function (x) {
            x.kill();
        });

        roadBorders = game.add.group();
        roadBorders.enableBody = true;
        roadBorders.physicsBodyType = Phaser.Physics.ARCADE;
        roadBorders.createMultiple(30, 'cowStanding');
        roadBorders.setAll('anchor.x', 0.5);
        roadBorders.setAll('anchor.y', 1);
        roadBorders.setAll('outOfBoundsKill', true);
        roadBorders.setAll('checkWorldBounds', true);
        roadBorders.forEach(function (x) {
            x.animations.add('nod', [0, 1, 2, 3, 2, 1, 0]);
        }, this);

        player = game.add.sprite(400, 500, 'cow', 0);
        player.anchor.setTo(0.5, 0.5);
        player.animations.add('go');
        player.animations.play('go', 10, true);
        game.physics.enable(player, Phaser.Physics.ARCADE);

        scoreString = 'Score : ';
        scoreText = game.add.text(10, 10, scoreString + score, { font: '34px Arial', fill: '#fff' });

        stateText = game.add.text(game.world.centerX,game.world.centerY,' ', { font: '84px Arial', fill: '#fff' });
        stateText.anchor.setTo(0.5, 0.5);
        stateText.visible = false;

        explosions = game.add.group();
        explosions.createMultiple(30, 'kaboom');
        explosions.forEach(function (explosion) {
            explosion.anchor.x = 0.5;
            explosion.anchor.y = 0.5;
            explosion.animations.add('kaboom');
        }, this);

        cursors = game.input.keyboard.createCursorKeys();

    }

    function update() {

        background.tilePosition.y += playerSpeed.current / 60;

        if (player.alive)
        {
            player.body.velocity.setTo(0, 0);

            if (cursors.left.isDown)
            {
                player.body.velocity.x = -200;
            }
            else if (cursors.right.isDown)
            {
                player.body.velocity.x = 200;
            }

            if (game.time.now > firingTimer)
            {
                enemyFires();
            }

            game.physics.arcade.overlap(roadBorders, player, playerHitsBorder, null, this);
        }

    }

    function render() {
    }

    function playerHitsBorder (player, border) {

        playerSpeed.add(-playerSpeed.current * 0.25 - 200);

        var explosion = explosions.getFirstExists(false);

        if (explosion) {
            explosion.reset(player.body.x, player.body.y);
            explosion.play('kaboom', 30, false, true);
        }

        if (player.x > border.x) {
            player.x += 50;
        } else {
            player.x -= 50;
        }


    }

    function enemyFires () {
        playerSpeed.add(game.rnd.integerInRange(0, 50));

        road.width += game.rnd.integerInRange(-50, 50);
        road.width = Math.min(road.width, road.maxWidth);
        road.width = Math.max(road.width, road.minWidth);

        road.x += game.rnd.integerInRange(-50, 50);
        road.x = Math.min(road.x, gameWidth - road.width / 2);
        road.x = Math.max(road.x, road.width / 2);
        
        var roadTexture = roadTextures.getFirstExists(false);
        if (roadTexture) {
            roadTexture.reset(road.x, 0);
            roadTexture.width = road.width;
            game.physics.arcade.moveToXY(roadTexture, road.x, gameHeight, playerSpeed.current);
        }
        
        
        var borders = roadBorders.getAll('exists', false);
        var left = borders[0];
        var right = borders[1];
        
        if (left) {
            var leftX = road.x - road.width / 2;
            left.reset(leftX, 0);
            left.animations.play('nod', 10, true);
            game.physics.arcade.moveToXY(left, leftX, gameHeight, playerSpeed.current);
        }

        if (right) {
            var rightX = road.x + road.width / 2;
            right.reset(rightX, 0);
            right.animations.play('nod', 10, true);
            game.physics.arcade.moveToXY(right, rightX, gameHeight, playerSpeed.current);
        }

        roadBorders.forEachAlive(function (obj) {
            obj.body.velocity.y = playerSpeed.current;
        });
        
        roadTextures.forEachAlive(function (obj) {
            obj.body.velocity.y = playerSpeed.current;
        });

        firingTimer = game.time.now + 60000 / playerSpeed.current;
    }

    function restart () {

        lives.callAll('revive');
        aliens.removeAll();

        player.revive();
        stateText.visible = false;

    }
})();
