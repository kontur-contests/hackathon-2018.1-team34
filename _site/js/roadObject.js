class BaseRoadObject {
    constructor(name, standingSpriteName) {
        this.name = name;
        this.standingSpriteName = standingSpriteName;
    }

    init(game){
        this.group = game.add.group();
        this.group.physicsBodyType = Phaser.Physics.ARCADE;
        this.group.enableBody = true;
        this.group.createMultiple(30, this.standingSpriteName);
        this.group.setAll('anchor.x', 0.5);
        this.group.setAll('anchor.y', 1);
        this.group.setAll('outOfBoundsKill', true);
        this.group.setAll('checkWorldBounds', true);
        this.group.forEach(function (x) {
            this.addAnimations(x);
        }, this);
    }

    addAnimations(sprite){    }
    playAnimation(sprite){    }

    turnTo(sprite) {}

    getEffects(name){
        return [];
    }
}


class Cow extends BaseRoadObject {
    constructor(){
        super('cow', 'cowStanding')
    }

    addAnimations(sprite) {
        sprite.animations.add('nod', [0, 1, 2, 3, 2, 1, 0]);
    }

    playAnimation(sprite) {
        sprite.animations.play('nod', 10, true);
    }

    getEffects(){
        return {
            'car': [turnTo(this.name)],
            'cow': [speedUp()]
        };
    }

    turnTo(sprite) {
        sprite.loadTexture('cow');
    }
}

class Car extends BaseRoadObject {
    constructor(){
        super('car', 'ship')
    }

    addAnimations(sprite) {
        //sprite.animations.add('nod', [0, 1, 2, 3, 2, 1, 0]);
    }


    getEffects() {
        return {
            'car': [speedDown()],
            'cow': [turnTo(this.name)]
        };
    }

    turnTo(sprite) {
        sprite.loadTexture('ship');
    }
}

function speedUp(value = 200) {
    return {
        id: 'speedChange',
        value: value
    };
}


function speedDown(value = 200) {
    return {
        id: 'speedChange',
        value: -value
    };
}

function turnTo(name) {
    return {
        id: 'turnTo',
        name: name
    }
}