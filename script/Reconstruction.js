/**
 * Created by pc on 2018/3/5.
 */
function Galaxian(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
}
Galaxian.prototype = {
    loadImage: function () {
        /*
         @explosion 顺序排列
         @enemy 越往上越强
         */
        let arr = {};
        for (let i = 0; i < 4; i++) {
            arr["explosion_" + i + 1] = new Image();
            arr["explosion_" + i + 1].src = "images/explosion_" + (i + 1) + ".png";
        }
        arr["enemy1"] = new Image();
        arr["enemy1"].src = "images/bee_small.png";
        arr["enemy2"] = new Image();
        arr["enemy2"].src = "images/bee_red.png";
        arr["enemy3"] = new Image();
        arr["enemy3"].src = "images/bee_green.png";
        arr["enemy4"] = new Image();
        arr["enemy4"].src = "images/bee_blue.png";
        arr['plane'] = new Image();
        arr['plane'].src = "images/plane.png";
        arr['life'] = new Image();
        arr['life'].src = "images/life.png";
        this.image = arr;
        for (let key in arr) {
            if (arr[key].complete === false)
                return false
        }
    },
    inital: function () {
        if (this.loadImage() === false) {
            setTimeout(this.inital.bind(this), 1000);
            return;
        }
    },
    checkEnd: function () {

    },
    constructor: Galaxian
};

function getBezierPoint(t, startPointX, startPointY, endPointX, endPointY, controlPointX, controlPointY) {
    let tmp = 1 - t;
    return {
        x: tmp * tmp * startPointX + 2 * t * tmp * controlPointX + t * t * endPointX,
        y: tmp * tmp * startPointY + 2 * t * tmp * controlPointY + t * t * endPointY,
    }
}

function getRandom(number) {
    return Math.ceil(Math.random() * number);
}

function DrawAble() {
    this.render = function (ctx, obj) {
        ctx.clearRect(obj.info.prev.x, obj.info.prev.y, obj.info.width, obj.info.height);
        ctx.save();
        if (obj.info.color)
            ctx.fillStyle = obj.info.color;
        !!obj.info.image ? ctx.drawImage(
                obj.info.image, 0, 0, obj.info.image.width, obj.info.image.height, obj.info.x, obj.info.y, obj.info.width, obj.info.height
            ) : ctx.fillRect(obj.info.x, obj.info.y, obj.info.width, obj.info.height);
        ctx.restore();
    };
    this.move = function (obj, xOffset, yOffset) {
        obj.prev.x = obj.x;
        obj.prev.y = obj.y;
        obj.x += xOffset;
        obj.y += yOffset;
        this.render();
    }
}

function SpaceShip(info) {
    this.isAlive = true;
    !!info ? this.info = {
            x: null,
            y: null,
            width: null,
            height: null,
            speed: null,
            prev: {
                x: null,
                y: null
            },
            image: null,
        } : this.info = info;
    this.initAnimate = function () {

    }
}

SpaceShip.prototype = new DrawAble();

function Enemy() {
    this.type = null;
}

Enemy.prototype = new SpaceShip();

function Self() {
    this.explosion = function (ctx, ex1, ex2, ex3, ex4) {
        //测试
        this.isAlive = false;
        this.info.prev.x = this.info.x;
        this.info.prev.y = this.info.y;

        this.swapImage(ex1);
        this.render(ctx, this);

        setTimeout(function () {
            this.swapImage(ex2);
            this.render(ctx, this);
        }.bind(this), 100);

        setTimeout(function () {
            this.swapImage(ex3);
            this.render(ctx, this);
        }.bind(this), 100);

        setTimeout(function () {
            this.swapImage(ex4);
            this.render(ctx, this);
        }.bind(this), 100);

        //@Test
        setTimeout(function () {
            this.info.width = 0;
            this.info.height = 0;
            this.render(ctx, this);
        }.bind(this), 100);
    };
    this.swapImage = function () {

    };
}

Self.prototype = new SpaceShip();

function Entity(info) {
    !!info ? this.info = {
            x: null,
            y: null,
            width: null,
            height: null,
            speed: null,
            prev: {
                x: null,
                y: null
            }
        } : this.info = info;
}

Entity.prototype = new DrawAble();

function Bullet() {
    /*@type: 1 up
     2 down
     3 track
     */
    this.type = null;
    this.info.color = null;
}

Bullet.prototype = new Entity();

let game = new Galaxian(document.querySelector("canvas"));
game.inital();