class BaseChaser {
    constructor(name, target, spriteName) {
        this.name = name;
        this.target = target;
        this.spriteName = spriteName;
    }

    init(sprite) {
        sprite.loadTexture(this.spriteName);
    }

}

class CowChaser extends BaseChaser{
    constructor() {
        super('cow', 'cow', 'cow');
    }

    init(sprite) {
        super.init(sprite);
        sprite.animations.add('go');
        sprite.animations.play('go', 10, true);
    }
}