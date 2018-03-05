function Galaxian() {
    let canvas = $("#galaxian")[0];
    this.canvas = {
        main: canvas,
        width: canvas.width,
        height: canvas.height
    };
    this.image = (function () {
        let background = new Image(), self = new Image(), enemy0 = new Image(), enemy1 = new Image(),
            enemy2 = new Image(), enemy3 = new Image(), explosion0 = new Image(), explosion1 = new Image(),
            explosion2 = new Image(), explosion3 = new Image();
        background.src = "images/background.png";
        self.src = "images/plane.png";
        enemy0.src = "images/bee_small.png";
        enemy1.src = "images/bee_red.png";
        enemy2.src = "images/bee_green.png";
        enemy3.src = "images/bee_blue.png";
        explosion0.src = "images/explosion_1.png";
        explosion1.src = "images/explosion_2.png";
        explosion2.src = "images/explosion_3.png";
        explosion3.src = "images/explosion_4.png";
        return {
            background: background,
            self: self,
            enemy0: enemy0,
            enemy1: enemy1,
            enemy2: enemy2,
            enemy3: enemy3,
            explosion0: explosion0,
            explosion1: explosion1,
            explosion2: explosion2,
            explosion3: explosion3,
        }
    })();
    this.life = 3;
    this.ctx = this.canvas.main.getContext("2d");
}

Galaxian.prototype = {
    inital: function () {
        this.initSelf();
        this.template = [
            [0, 0, 0], [0, 0, 0, 1], [0, 0, 0, 1, 2], [0, 0, 0, 1, 2, 3], [0, 0, 0, 1, 2], [0, 0, 0, 1, 2], [0, 0, 0, 1, 2, 3], [0, 0, 0, 1, 2], [0, 0, 0, 1], [0, 0, 0]
        ];
        this.initEnemy();

        this.keyMap = {
            90: false,
            37: false,
            39: false
        };
        this.keyTimer = {
            shootTimer: null,
            leftTimer: null,
            rightTimer: null
        };
        this.arrow = [];
        this.arrowCooldown = -Infinity;


        this.render();
        this.bindEvent();
        this.randomMove();
        //this.randomShoot();
        this.randomLeave();
    },
    initSelf: function () {
        this.self = {
            width: 40,
            height: 40,
            x: this.canvas.width * 0.5 - 40,
            y: this.canvas.height * 0.97,
            direction: null,
            isAlive: true,
            prev: {},
        };
        this.self.prev.x = this.self.x;
        this.self.prev.y = this.self.y;
    },
    initEnemy: function () {
        this.enemy = [];
        const startX = this.self.x - 30 * 5 - 25 * 5;
        const startY = 6 * 30 + 70;
        for (let i = 0; i < this.template.length; i++) {
            this.enemy[i] = [];
            for (let j = 0; j < this.template[i].length; j++) {
                this.enemy[i][j] = {
                    type: this.template[i][j],
                    x: startX + 30 * i + 25 * i,
                    y: startY - 40 * j,
                    width: 30,
                    height: 30,
                    isAlive: true,
                    mode: "fleet",
                    col: i,
                    index: j,
                };
                this.enemy[i][j].prev = {
                    x: this.enemy[i][j].x,
                    y: this.enemy[i][j].y
                }
            }
        }
    },
    render: function () {
        let that = this;
        //this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        //this.renderBackground();
        if (this.self.isAlive) {
            this.renderSelf();
        }
        if (!this.arrowTimer) {
            this.renderArrow();
        }
        this.renderEnemy();
    },
    renderBackground: function () {
        this.ctx.drawImage(
            this.image.background,
            0, 0, this.image.background.width, this.image.background.height,
            0, 0, this.canvas.width, this.canvas.height
        );
    },
    renderSelf: function () {
        this.ctx.clearRect(this.self.direction === "left" ? this.self.x + 4 : this.self.x - 4, this.self.y - this.self.height, this.self.width, this.self.height);
        this.ctx.drawImage(
            this.image.self,
            0, 0, this.image.self.width, this.image.self.height,
            this.self.x, this.self.y - this.self.height, this.self.width, this.self.height
        );
    },
    renderArrow: function () {
        let that = this;
        if (this.arrow.length) {
            this.arrowTimer = setInterval(function () {
                for (let i = 0; i < that.arrow.length; i++) {
                    if (that.arrow[i].direction === "up")
                        that.upArrow(that.arrow[i], i);
                    else if (that.arrow[i].direction === "down") {
                        that.downArrow(that.arrow[i], i);
                    }
                }
                that.render();
                that.arrow = that.arrow.filter(item => item !== null);
            }, 10);
        } else {
            clearInterval(this.arrowTimer);
            this.arrowTimer = null;
        }
    },
    upArrow: function (obj, index) {
        this.ctx.save();
        this.ctx.clearRect(obj.x, obj.y + 5, obj.width, obj.height);
        this.ctx.fillStyle = obj.color;
        this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        this.ctx.restore();
        if (this.checkArrow(obj, index))
            return;
        obj.y -= 5;
        if (obj.y < 0) {
            this.ctx.clearRect(obj.x, obj.y + 5, obj.width, obj.height);
            this.arrow[index] = null;
        }
    },
    downArrow: function (obj, index) {
        this.ctx.save();
        this.ctx.clearRect(obj.x, obj.y - 2, obj.width, obj.height);
        this.ctx.fillStyle = obj.color;
        this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        this.ctx.restore();
        if (this.checkArrow(obj, index))
            return;
        obj.y += 2;
        if (obj.y > this.canvas.height) {
            this.ctx.clearRect(obj.x, obj.y - 2, obj.width, obj.height);
            this.arrow[index] = null;
        }
    },
    renderEnemy: function () {
        let that = this;
        for (let i = 0; i < this.enemy.length; i++) {
            for (let j = 0; j < this.enemy[i].length; j++) {
                this.ctx.clearRect(this.enemy[i][j].prev.x, this.enemy[i][j].prev.y, this.enemy[i][j].width, this.enemy[i][j].height);
                let image = (function () {
                    if (that.enemy[i][j].type === 0) {
                        return that.image.enemy0;
                    } else if (that.enemy[i][j].type === 1) {
                        return that.image.enemy1;
                    } else if (that.enemy[i][j].type === 2) {
                        return that.image.enemy2;
                    } else {
                        return that.image.enemy3;
                    }
                })();
                this.ctx.drawImage(
                    image,
                    0, 0, image.width, image.height,
                    this.enemy[i][j].x, this.enemy[i][j].y, this.enemy[i][j].width, this.enemy[i][j].height
                )
            }
        }
    },
    checkArrow: function (obj, index) {
        for (let i = 0; i < this.enemy.length; i++) {
            for (let j = 0; j < this.enemy[i].length; j++) {
                if (obj.x >= this.enemy[i][j].x && obj.x <= this.enemy[i][j].x + this.enemy[i][j].width && obj.y >= this.enemy[i][j].y && obj.y <= this.enemy[i][j].y + this.enemy[i][j].height) {
                    this.ctx.clearRect(this.enemy[i][j].x, this.enemy[i][j].y, this.enemy[i][j].width, this.enemy[i][j].height);
                    this.ctx.clearRect(obj.x, obj.y, obj.width, obj.height);
                    this.enemy[i][j] = null;
                    this.enemy[i] = this.enemy[i].filter(item => item !== null);
                    this.arrow[index] = null;
                    this.arrow = this.arrow.filter(item => item !== null);
                    return true;
                } else if (obj.x >= this.self.x && obj.x <= this.self.x + this.self.width && obj.y >= this.self.y - this.self.height && obj.y <= this.self.y && this.self.isAlive) {
                    this.ctx.clearRect(obj.x, obj.y, obj.width, obj.height);
                    this.ctx.clearRect(this.self.x, this.self.y - this.self.height, this.self.width, this.self.height);
                    this.arrow[index] = null;
                    this.arrow = this.arrow.filter(item => item !== null);
                    this.explosion();
                    return true;
                }
            }
        }
    },
    explosion: function () {
        this.self.isAlive = false;
        this.clearEvent();
        let that = this;
        this.ctx.clearRect(this.self.x, this.self.y - this.self.height, this.self.width, this.self.height);
        this.ctx.drawImage(
            this.image.explosion0,
            0, 0, this.image.explosion0.width, this.image.explosion0.height,
            this.self.x, this.self.y - this.self.height, this.self.width, this.self.height
        );
        setTimeout(function () {
            that.ctx.clearRect(that.self.x, that.self.y - that.self.height, that.self.width, that.self.height);
            that.ctx.drawImage(
                that.image.explosion1,
                0, 0, that.image.explosion1.width, that.image.explosion1.height,
                that.self.x, that.self.y - that.self.height, that.self.width, that.self.height
            );
            setTimeout(function () {
                that.ctx.clearRect(that.self.x, that.self.y - that.self.height, that.self.width, that.self.height);
                that.ctx.drawImage(
                    that.image.explosion2,
                    0, 0, that.image.explosion2.width, that.image.explosion2.height,
                    that.self.x, that.self.y - that.self.height, that.self.width, that.self.height
                );
                setTimeout(function () {
                    that.ctx.clearRect(that.self.x, that.self.y - that.self.height, that.self.width, that.self.height);
                    that.ctx.drawImage(
                        that.image.explosion3,
                        0, 0, that.image.explosion3.width, that.image.explosion3.height,
                        that.self.x, that.self.y - that.self.height, that.self.width, that.self.height
                    );
                    setTimeout(function () {
                        that.ctx.clearRect(that.self.x, that.self.y - that.self.height, that.self.width, that.self.height);
                    }, 100)
                }, 100)
            }, 100)
        }, 100)
    },
    bindEvent: function () {
        let that = this;
        document.onkeydown = function (e) {
            if (e.keyCode in that.keyMap) {
                that.keyMap[e.keyCode] = true;
            }
            if (that.keyMap[37]) {
                if (!that.keyTimer.leftTimer) {
                    that.keyTimer.leftTimer = requestAnimationFrame(left);

                    function left() {
                        if (that.keyMap[37] && that.self.isAlive) {
                            requestAnimationFrame(left);
                            that.self.x - 4 > 0 ? that.self.x -= 4 : null;
                            that.self.direction = "left";
                            that.render();
                        }
                    }
                }
            }
            if (that.keyMap[39]) {
                if (!that.keyTimer.rightTimer) {
                    that.keyTimer.rightTimer = requestAnimationFrame(right);

                    function right() {
                        if (that.keyMap[39] && that.self.isAlive) {
                            requestAnimationFrame(right);
                            that.self.x + 4 + that.self.width < that.canvas.width ? that.self.x += 4 : null;
                            that.self.direction = "right";
                            that.render();
                        }
                    }
                }
            }
            if (that.keyMap[90]) {
                if (!that.keyTimer.shootTimer) {
                    that.keyTimer.shootTimer = setInterval(function () {
                        if (new Date() - that.arrowCooldown > 500 && that.self.isAlive) {
                            that.arrow.push(
                                {
                                    x: that.self.x + that.self.width / 2,
                                    y: that.self.y - that.self.height - 15,
                                    width: 3,
                                    height: 15,
                                    direction: "up",
                                    color: "white",
                                }
                            );
                            that.arrowCooldown = new Date();
                            that.render();
                        }
                    }, 20);
                }
            }
            if (!that.self.isAlive && e.keyCode) {
                that.initSelf();
                that.render();
            }
        };
        document.onkeyup = function (e) {
            if (e.keyCode in that.keyMap) {
                that.keyMap[e.keyCode] = false;
            }
            if (e.keyCode === 37) {
                cancelAnimationFrame(that.keyTimer.leftTimer);
                that.keyTimer.leftTimer = null;
            } else if (e.keyCode === 90) {
                clearInterval(that.keyTimer.shootTimer);
                that.keyTimer.shootTimer = null;
            } else if (e.keyCode === 39) {
                cancelAnimationFrame(that.keyTimer.rightTimer);
                that.keyTimer.rightTimer = null;
            }
        };
    },
    clearEvent: function () {
        cancelAnimationFrame(this.keyTimer.leftTimer);
        this.keyTimer.leftTimer = null;
        clearInterval(this.keyTimer.shootTimer);
        this.keyTimer.shootTimer = null;
        cancelAnimationFrame(this.keyTimer.rightTimer);
        this.keyTimer.rightTimer = null;
        // clearInterval(this.moveTimer);
        // clearInterval(this.shootTimer);
        // clearInterval(this.leaveTimer);
        //document.onkeydown = null;
        //document.onkeyup = null;
    },
    loadImage: function () {

    },
    randomMove: function () {
        let that = this, move_cycle = getRandom(1000) + 400, range = getRandom(10) + 5;
        this.moveTimer = setInterval(function () {
            let direction = getRandom(2);
            direction === 1 ? direction = "left" : direction = "right";
            let result;
            direction === "left" ? result = that.move(-range, direction, true) : result = that.move(range, direction, true);
            that.render();
        }, move_cycle);
    },
    move: function (range, direction, check) {
        if (check) {
            for (let i = 0; i < this.enemy.length; i++) {
                for (let n = 0; n < this.enemy[i].length; n++) {
                    if (this.checkMove(this.enemy[i][n], direction, range) === false)
                        return false;
                }
            }
        }
        for (let i = 0; i < this.enemy.length; i++) {
            for (let j = 0; j < this.enemy[i].length; j++) {
                if (this.enemy[i][j].mode === "fleet") {
                    this.enemy[i][j].prev.x = this.enemy[i][j].x;
                    this.enemy[i][j].prev.y = this.enemy[i][j].y;
                    this.enemy[i][j].x += range;
                }
            }
        }
        return true;
    },
    randomShoot: function () {
        let that = this, shoot_cycle = getRandom(1000) + 1000;
        this.shootTimer = setInterval(function () {
            if (that.self.isAlive) {
                let random_index = [], arr = that.enemy.filter(item => item.length !== 0);
                for (let i = 0; i < getRandom(3) + 2; i++) {
                    random_index.push(getRandom(arr.length - 1));
                }
                for (let i = 0; i < random_index.length; i++) {
                    if (arr[random_index[i]][0].mode === "fleet") {
                        that.arrow.push(
                            {
                                x: arr[random_index[i]][0].x + arr[random_index[i]][0].width / 2,
                                y: arr[random_index[i]][0].y + arr[random_index[i]][0].height + 15,
                                width: 3,
                                height: 15,
                                direction: "down",
                                color: "red",
                            }
                        );
                    }
                }
            }
        }, shoot_cycle);
    },
    checkMove: function (obj, direction, range) {
        let value = range;
        if (obj.x + value <= 0 || obj.x + value + obj.width >= this.canvas.width) {
            return false;
        }
        return true;
    },
    randomLeave: function () {
        let that = this;
        leave_cycle = getRandom(5000) + 5000;
        this.leaveTimer = setInterval(function () {
            if (that.self.isAlive) {
                let arr = that.enemy.filter(item => item.length !== 0), obj, path = [];
                let temp = [];
                arr.forEach(items => temp.push(items.filter(item => item.mode !== "leave")));
                temp = temp.filter(item => item.length !== 0);
                window.temp = temp;
                if (temp.length === 0) {
                    return;
                }

                let random = getRandom(2);
                random === 1 ? obj = temp[0][temp[0].length - 1] : obj = temp[temp.length - 1][temp[temp.length - 1].length - 1];
                let controlPoint = {
                    x: random === 1 ? obj.x - 10 * obj.width : obj.x + 10 * obj.width,
                    y: obj.y - 5 * obj.height,
                };

                for (let i = 0; i < 1; i += 0.01) {
                    path.push(getBezierPoint(i, obj.x, obj.y, that.self.x + that.self.width / 2, that.self.y + that.self.height, controlPoint.x, controlPoint.y));
                }
                //window.path = path;
                that.shipLeaveTimer = requestAnimationFrame(leave);
                let n = 0;

                function leave() {
                    if (path[n]) {
                        requestAnimationFrame(leave);
                        obj.prev.x = obj.x;
                        obj.prev.y = obj.y;
                        obj.mode = "leave";
                        obj.x = path[n].x;
                        obj.y = path[n].y;
                        n += 1;
                        that.render();
                        that.checkShip(obj);
                    }
                }
            }
        }, leave_cycle)
    },
    checkShip: function (obj) {
        if (obj.x >= this.self.x && obj.x <= this.self.x + this.self.width && obj.y >= this.self.y - this.self.height && obj.y <= this.self.y && this.self.isAlive) {
            this.ctx.clearRect(this.self.x, this.self.y - this.self.height, this.self.width, this.self.height);
            this.ctx.clearRect(obj.x, obj.y, obj.width, obj.height);
            this.life -= 1;
            this.checkEnd("crashed");
            for (let i = 0; i < this.enemy[obj.col].length; i++) {
                if (this.enemy[obj.col][i].index === obj.index) {
                    this.enemy[obj.col][i] = null;
                    this.enemy[obj.col] = this.enemy[obj.col].filter(item => item !== null);
                    break;
                }
            }
            this.render();
            this.explosion();
        } else if (obj.y >= this.canvas.height) {
            this.ctx.clearRect(obj.x, obj.y, obj.width, obj.height);
            this.checkEnd();
            for (let i = 0; i < this.enemy[obj.col].length; i++) {
                if (this.enemy[obj.col][i].index === obj.index) {
                    this.enemy[obj.col][i] = null;
                    this.enemy[obj.col] = this.enemy[obj.col].filter(item => item !== null);
                    break;
                }
            }
            this.render();
        }
    },
    checkEnd: function (status) {
        //只在发生碰撞时发生
        if (this.life === -1 && status === " crashed" && this.enemy.filter(item => item.length !== 0).length === 1) {
            this.endAction("lose");
        }
    },
    endAction: function () {

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

//以下是重写模板
function DrawAble() {
    this.render = function () {

    }
}

function SpaceShip() {
    this.isAlive = true;
    this.info = {
        x: null,
        y: null,
        width: null,
        height: null,
        prev: null
    }
}

SpaceShip.prototype = new DrawAble();

function Enemy() {

}

Enemy.prototype = new SpaceShip();

function Self() {

}

Self.prototype = new SpaceShip();

function Entity() {

}

Entity.prototype = new DrawAble();

function Bullet() {

}

Bullet.prototype = new Entity();
let game = new Galaxian();
game.inital();