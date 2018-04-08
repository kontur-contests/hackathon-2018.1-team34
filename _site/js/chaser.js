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

class WolfChaser extends BaseChaser{
    constructor(target) {
        super('wolf', target, 'wolf');
    }

    init(sprite) {
        super.init(sprite);
        sprite.animations.add('go');
        sprite.animations.play('go', 10, true);
    }
}

class CopChaser extends BaseChaser{
    constructor() {
        super('police', 'car', 'police');
    }

    init(sprite) {
        super.init(sprite);
        sprite.animations.add('go');
        sprite.animations.play('go', 10, true);
    }
}

class CopChaser extends BaseChaser{
    constructor() {
        super('police', 'car', 'police');
    }

    init(sprite) {
        super.init(sprite);
        sprite.animations.add('go');
        sprite.animations.play('go', 10, true);
    }
}