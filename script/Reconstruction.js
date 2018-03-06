/**
 * Created by pc on 2018/3/5.
 */
function Galaxian(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.template = [];
    this.timer = {
        arrow: null,
        randomShoot: null,
        randomMove: null,
        randomLeave: null,
    };
    this.cooldown = {
        shootCooldown: 0,
    };
    this.arrow = [];
    this.life -= 1;
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
        //保证图片加载成功
        if (this.loadImage() === false) {
            setTimeout(this.inital.bind(this), 1000);
            return;
        }
        //初始化
        this.initTemple({default: true});
        this.initSelf();
        this.initEnemy({shipMargin: 20, shipWidth: 25, shipHeight: 25, startY: 5});
        /*主计时器,目前计划有四个
         * arrow: 子弹
         * randomShoot: 随机发射
         * randomMove: 随机移动
         * randomLeave: 进攻
         */
        this.loopArrow();
        this.randomShoot();
        this.randomMove();
        this.randomLeave();


        //绑定事件
        this.bindEvent();
    },
    initTemple: function (opts) {
        if (opts.default === true || !opts.over) {
            this.template = [[0, 0, 0], [0, 0, 0, 1], [0, 0, 0, 1, 2], [0, 0, 0, 1, 2, 3], [0, 0, 0, 1, 2], [0, 0, 0, 1, 2], [0, 0, 0, 1, 2, 3], [0, 0, 0, 1, 2], [0, 0, 0, 1], [0, 0, 0]];
        } else {
            this.template = opts.over;
        }
    },
    initSelf: function () {
        this.self = new Self();
        this.self.setInfo({
            x: this.canvas.width / 2,
            y: this.canvas.height,
            width: 35,
            height: 35,
            speed: 5,
            prev: {
                x: null,
                y: null,
            },
            image: this.image["plane"],
        });
        this.self.info.prev.x = this.self.info.x;
        this.self.info.prev.y = this.self.info.y;
        this.self.setCtx(this.ctx);
        this.self.initAnimate(this.self.info.x, this.self.info.y, this.self.info.x, this.self.info.y - this.self.info.height, {direction: 1});
    },
    initEnemy: function (opts) {
        let template = this.template;
        let enemy = [];
        let image = this.image;
        let startX = this.canvas.width / 2 - (opts.shipWidth * template.length / 2) - (opts.shipMargin * template.length / 2),
            endY = opts.startY + cloneObj(template).sort()[template.length - 1].length * (opts.shipHeight + opts.shipMargin),
            startY = -cloneObj(template).sort()[template.length - 1].length * (opts.shipHeight + opts.shipMargin);
        for (let i = 0; i < template.length; i++) {
            enemy[i] = [];
            for (let j = 0; j < template[i].length; j++) {
                let enemyShip = new Enemy();
                enemyShip.setInfo({
                    x: startX + (opts.shipWidth * i) + (opts.shipMargin * i),
                    y: startY + (opts.shipHeight * (template[i].length - j)) + (opts.shipMargin * (template[i].length - j)),
                    width: opts.shipWidth,
                    height: opts.shipHeight,
                    speed: 2,
                    prev: {
                        x: null,
                        y: null
                    },
                    image: (function () {
                        if (template[i][j] === 0) {
                            return image["enemy1"];
                        } else if (template[i][j] === 1) {
                            return image["enemy2"];
                        } else if (template[i][j] === 2) {
                            return image["enemy3"];
                        } else {
                            return image["enemy4"];
                        }
                    })()
                });
                enemyShip.info.prev.x = enemyShip.info.x;
                enemyShip.info.prev.y = enemyShip.info.y;
                enemyShip.setType(template[i][j] + 1);
                //速度将由type决定
                //enemyShip.info.speed = enemyShip.type + 1;
                enemyShip.setCtx(this.ctx);
                enemyShip.initAnimate(enemyShip.info.x, enemyShip.info.y, enemyShip.info.x, endY - j * opts.shipHeight - j * opts.shipMargin, {direction: 2});
                enemy[i][j] = enemyShip;
            }
        }
        this.enemy = enemy;
        this._enemy = this.enemyToArray();
    },
    enemyToArray: function () {
        let enemy = this.enemy, newArr = [];
        for (let i = 0; i < enemy.length; i++) {
            for (let j = 0; j < enemy[i].length; j++) {
                newArr.push(enemy[i][j]);
            }
        }
        return newArr;
    },
    GlobalRender: function () {
        //此函数作为全局的渲染函数使用
        this.self.render();
        this._enemy.forEach(item => item.render(this.ctx, item));
    },
    loopArrow: function () {
        let that = this;
        //放在内部避免循环失效
        this.timer.arrow = requestAnimationFrame(loop);

        function loop() {
            if (that.arrow.length > 0) {
                for (let i = 0; i < that.arrow.length; i++) {
                    let bullet = that.arrow[i];
                    if (bullet.type === 1) {
                        if (!that.checkArrow(bullet, 0, -bullet.info.speed)) {
                            that.clearObj(bullet);
                            that.arrow[i].delete();
                        } else {
                            bullet.move(bullet, 0, -bullet.info.speed);
                        }
                    } else if (bullet.type === 2) {
                        if (!that.checkArrow(bullet, 0, bullet.info.speed)) {
                            that.clearObj(bullet);
                            that.arrow[i].delete();
                        } else {
                            bullet.move(bullet, 0, bullet.info.speed);
                        }
                    } else if (bullet.type === 3) {

                    }
                    bullet.render(that.ctx, bullet);
                    that.arrow = that.arrow.filter(item => item.isDelete !== true);
                }
            }
            requestAnimationFrame(loop);
        }
    },
    randomMove: function () {

    },
    randomShoot: function () {

    },
    randomLeave: function () {

    },
    bindEvent: function () {
        this.event = new Event();
        document.onkeydown = this.keyDown.bind(this);
        document.onkeyup = this.keyUp.bind(this);
    },
    keyDown: function (e) {
        let event = this.event, self = this.self, that = this;
        if (e.keyCode in event.keyMap) {
            event.keyMap[e.keyCode] = true;
        }

        if (event.keyMap[37]) {
            if (!event.timer.selfLeft) {
                event.timer.selfLeft = requestAnimationFrame(left);

                function left() {
                    if (that.checkBorder(self, -self.info.speed, 0) && self.isAlive && event.keyMap[37]) {
                        self.move(self, -self.info.speed, 0);
                        self.render(self.ctx, self);
                        requestAnimationFrame(left);
                    }
                }
            }
        }
        if (event.keyMap[39]) {
            if (!event.timer.selfRight) {
                event.timer.selfRight = requestAnimationFrame(right);

                function right() {
                    if (that.checkBorder(self, self.info.speed, 0) && self.isAlive && event.keyMap[39]) {
                        self.move(self, self.info.speed, 0);
                        self.render(self.ctx, self);
                        requestAnimationFrame(right);
                    }
                }
            }
        }
        if (event.keyMap[90]) {
            if (!event.timer.selfShoot) {
                event.timer.selfShoot = requestAnimationFrame(shoot);

                function shoot(last) {
                    if (self.isAlive && event.keyMap[90]) {
                        if (!last || new Date().valueOf() - that.cooldown.shootCooldown > 1000) {
                            let bullet = new Bullet();
                            bullet.setInfo({
                                x: Math.ceil(self.info.x + self.info.width / 2),
                                y: null,
                                width: 3,
                                height: 15,
                                speed: 5,
                                prev: {
                                    x: null,
                                    y: null,
                                }
                            });
                            //-5是用来进行偏移的
                            bullet.info.y = self.info.y - bullet.info.height - 10;
                            bullet.info.color = "white";
                            bullet.info.prev.x = bullet.info.x;
                            bullet.info.prev.y = bullet.info.y;
                            bullet.type = 1;
                            bullet.setCtx(that.ctx);

                            that.arrow.push(bullet);
                            that.cooldown.shootCooldown = new Date().valueOf();
                            requestAnimationFrame(shoot);
                        }
                    }
                }
            }
        }
    },
    keyUp: function (e) {
        let event = this.event;
        if (e.keyCode in event.keyMap) {
            event.keyMap[e.keyCode] = false;
        }
        if (e.keyCode === 37) {
            cancelAnimationFrame(event.timer.selfLeft);
            event.timer.selfLeft = 0;
        }
        if (e.keyCode === 39) {
            cancelAnimationFrame(event.timer.selfRight);
            event.timer.selfRight = 0;
        }
        if (e.keyCode === 90) {
            cancelAnimationFrame(event.timer.selfShoot);
            event.timer.selfShoot = 0;
        }
    },
    checkBorder: function (obj, Xoffset, Yoffset) {
        if (obj.info.x + Xoffset < 0 || obj.info.x + Xoffset + obj.info.width > this.canvas.width || obj.info.y + Yoffset < 0 || obj.info.y + Yoffset > this.canvas.height)
            return false;
        return true;
    },
    //检查子弹有无越界,或击中目标
    checkArrow: function (obj, Xoffset, Yoffset) {
        let canvas = this.canvas, self = this.self, enemy = this.enemy;
        if (obj.info.x + Xoffset < 0 || obj.info.x + obj.info.width + Xoffset > canvas.width || obj.info.y + Yoffset < 0 || obj.info.y + Yoffset > canvas.height)
            return false;
        if (obj.info.x >= self.info.x && obj.info.x <= self.info.x + self.info.width && obj.info.y + obj.info.height >= self.info.y && obj.info.y + obj.info.height <= self.info.y + self.info.height) {
            this.crashed(self);
            return false;
        }
        for (let i = 0; i < enemy.length; i++) {
            for (let j = 0; j < enemy[i].length; j++) {
                if (obj.info.x >= this.enemy[i][j].info.x && obj.info.x <= this.enemy[i][j].info.x + this.enemy[i][j].info.width && obj.info.y >= this.enemy[i][j].info.y && obj.info.y <= this.enemy[i][j].info.y + this.enemy[i][j].info.height) {
                    this.crashed(this.enemy[i][j], {i: i, j: j});
                    return false;
                }
            }
        }
        return true;
    },
    checkEnd: function () {

    },
    clearObj: function (obj) {

    },
    crashed: function (obj, opts) {

    },
    // sort: function (obj) {
    //     obj = obj.filter(item => item.isDelete !== true);
    // },
    constructor: Galaxian
};

//获取曲线坐标
function getBezierPoint(t, startPointX, startPointY, endPointX, endPointY, controlPointX, controlPointY) {
    let tmp = 1 - t;
    return {
        x: tmp * tmp * startPointX + 2 * t * tmp * controlPointX + t * t * endPointX,
        y: tmp * tmp * startPointY + 2 * t * tmp * controlPointY + t * t * endPointY,
    }
}

//获取随机数
function getRandom(number) {
    return Math.ceil(Math.random() * number);
}

//深拷贝
function cloneObj(obj) {
    let str, newobj = obj.constructor === Array ? [] : {};
    if (typeof obj !== 'object') {
        return;
    } else if (window.JSON) {
        str = JSON.stringify(obj); //系列化对象
        newobj = JSON.parse(str); //还原
    } else {
        for (let i in obj) {
            newobj[i] = typeof obj[i] === 'object' ?
                cloneObj(obj[i]) : obj[i];
        }
    }
    return newobj;
}

function DrawAble() {
    this.ctx = null;
    this.setCtx = function (ctx) {
        this.ctx = ctx;
    };
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
        obj.info.prev.x = obj.info.x;
        obj.info.prev.y = obj.info.y;
        obj.info.x += xOffset;
        obj.info.y += yOffset;
        this.render(this.ctx, obj);
    };
    this.isDelete = false;
}

function SpaceShip() {
    this.isAlive = true;
    this.info = {
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
    };
    this.setInfo = function (info) {
        this.info = info;
    };
    this.initAnimate = function (startX, startY, endX, endY, opts) {
        //@TODO 加入水平，垂直
        /*@param opts -> direction 1 up
                         direction 2 down
        */
        let that = this;
        if (opts.direction === 1) {
            if (startX <= endX && startY >= endY) {
                this.move(this, 0, -this.info.speed);
                this.render(this.ctx, this);
                requestAnimationFrame(function () {
                    that.initAnimate(that.info.x, that.info.y, endX, endY, {direction: 1});
                });
            }
        } else if (opts.direction === 2) {
            if (startX >= endX && startY <= endY) {
                this.move(this, 0, +this.info.speed);
                this.render(this.ctx, this);
                requestAnimationFrame(function () {
                    that.initAnimate(that.info.x, that.info.y, endX, endY, {direction: 2});
                })
            }
        }
    }
}

SpaceShip.prototype = new DrawAble();

function Enemy() {
    this.type = null;
    this.setType = function (type) {
        this.type = type;
    };
    /*
     @Deprecated
     this.info.index = null;
    */

    //@status {1 fleet} {2 leave}
    this.status = null;
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
    this.swapImage = function (image) {
        this.info.image = image;
    };
}

Self.prototype = new SpaceShip();

function Entity() {
    this.info = {
        x: null,
        y: null,
        width: null,
        height: null,
        speed: null,
        prev: {
            x: null,
            y: null
        }
    };
    this.setInfo = function (info) {
        this.info = info;
    }
}

Entity.prototype = new DrawAble();

function Bullet() {
    /*@type: 1 up
             2 down
             3 track
     */
    this.type = null;
    this.info.color = null;
    this.delete = function () {
        this.ctx.clearRect(this.info.x, this.info.y, this.info.width, this.info.height);
        this.isDelete = true;
        this.info.x = -1000;
        this.info.y = -1000;
    }
}

Bullet.prototype = new Entity();

function Event() {
    this.keyMap = {
        37: false,
        39: false,
        90: false,
    };
    this.timer = {
        selfLeft: null,
        selfRight: null,
        selfShoot: null,
    };
}

let game = new Galaxian(document.querySelector("canvas"));
game.inital();