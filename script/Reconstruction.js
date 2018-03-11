/**
 * Created by pc on 2018/3/5.
 * TODO: 优化,从执行过程入手,再细化整个结构
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
        selfShootCooldown: 0,
        shootCooldown: 0,
        randomShootCooldown: 0,
        randomLeaveCooldown: 0,
    };
    this.arrow = [];
    this.life = 3;
    this.isEnd = false;
}

Galaxian.prototype = {
    loadImage: function () {
        /*
         @explosion 顺序排列
         @enemy 越往上越强
         */
        let arr = {};
        for (let i = 0; i < 4; i++) {
            arr["explosion" + (i + 1)] = new Image();
            arr["explosion" + (i + 1)].src = "images/explosion_" + (i + 1) + ".png";
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
        this.initName();
        /*主计时器,目前计划有四个
         * arrow: 子弹
         * randomShoot: 随机发射
         * randomMove: 随机移动
         * randomLeave: 进攻
         */
        this.randomShoot();
        this.randomMove();
        this.randomLeave();
        this.loopArrow();


        //绑定事件
        this.bindEvent();
    },
    initTemple: function (opts) {
        //舰队模板
        if (opts.default === true || !opts.over) {
            this.template = [[0, 0, 0], [0, 0, 0, 1], [0, 0, 0, 1, 2], [0, 0, 0, 1, 2, 3], [0, 0, 0, 1, 2], [0, 0, 0, 1, 2], [0, 0, 0, 1, 2, 3], [0, 0, 0, 1, 2], [0, 0, 0, 1], [0, 0, 0]];
        } else {
            this.template = opts.over;
        }
    },
    initSelf: function () {
        //初始化时残计-1
        this.life -= 1;
        //引用外部函数,渲染剩余残机
        showLife(3 - this.life);

        this.self = new Self();
        this.self.setInfo({
            x: this.canvas.width / 2,
            y: this.canvas.height,
            width: 35,
            height: 35,
            speed: 5,
            rotation: 0,
            prev: {
                x: null,
                y: null,
            },
            image: this.image["plane"],
        });
        this.self.info.prev.x = this.self.info.x;
        this.self.info.prev.y = this.self.info.y;
        this.self.setCtx(this.ctx);
        //执行初始动画
        this.self.initAnimate(this.self.info.x, this.self.info.y, this.self.info.x, this.self.info.y - this.self.info.height, {direction: 1});
    },
    initEnemy: function (opts) {
        let template = this.template, enemy = [], image = this.image,
            startX = this.canvas.width / 2 - (opts.shipWidth * template.length / 2) - (opts.shipMargin * template.length / 2),
            endY = opts.startY + cloneObj(template).sort()[template.length - 1].length * (opts.shipHeight + opts.shipMargin),
            startY = -cloneObj(template).sort()[template.length - 1].length * (opts.shipHeight + opts.shipMargin);
        //按照模板初始化
        for (let i = 0; i < template.length; i++) {
            enemy[i] = [];
            for (let j = 0; j < template[i].length; j++) {
                let enemyShip = new Enemy();
                enemyShip.setInfo({
                    x: startX + (opts.shipWidth * i) + (opts.shipMargin * i),
                    y: startY + (opts.shipHeight * (template[i].length - j)) + (opts.shipMargin * (template[i].length - j)),
                    width: opts.shipWidth,
                    height: opts.shipHeight,
                    speed: 1,
                    prev: {
                        x: null,
                        y: null
                    },
                    rotation: 0,
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
                enemyShip.status = 1;
                enemyShip.initAnimate(enemyShip.info.x, enemyShip.info.y, enemyShip.info.x, endY - j * opts.shipHeight - j * opts.shipMargin + 100, {direction: 2});
                enemy[i][j] = enemyShip;
            }
        }
        //this.completeAnimate = true;
        this.enemy = enemy;
        this._enemy = this.enemyToArray();
        this.out_enemy = [];
    },
    initName: function () {
        this.name = (function () {
            let name = $("#userName").val();
            return {
                getName: function () {
                    return name;
                }
            }
        })()
    },
    enemyToArray: function () {
        //返回一个enemy数组的一维数组
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
        //定时渲染子弹
        let that = this;
        this.timer.arrow = requestAnimationFrame(loop);

        function loop() {
            let arrow = that.arrow;
            if (arrow.length > 0) {
                for (let i = 0; i < arrow.length; i++) {
                    let bullet = arrow[i];
                    /*
                     type: 子弹方向
                     1 up
                     2 down
                     3 track
                     */
                    if (bullet.type === 1) {
                        if (!that.checkArrow(bullet, 0, -bullet.info.speed)) {
                            //that.clearObj(bullet);
                            bullet.delete();
                        } else {
                            bullet.move(bullet, 0, -bullet.info.speed);
                        }
                    }
                    if (bullet.type === 2) {
                        if (!that.checkArrow(bullet, 0, bullet.info.speed)) {
                            //that.clearObj(bullet);
                            bullet.delete();
                        } else {
                            bullet.move(bullet, 0, bullet.info.speed);
                        }
                    }
                    //跟踪只会选取一个坐标，并不断向这个坐标前进
                    if (bullet.type === 3) {
                        let distance;
                        if (bullet.info.x > that.self.info.x) {
                            distance = -((bullet.info.x - bullet.track.x) / (1000 / 60) / 4);
                        } else {
                            distance = (bullet.track.x - bullet.info.x) / (1000 / 60) / 4;
                        }
                        if (!that.checkArrow(bullet, distance, bullet.info.speed)) {
                            arrow[i].delete();
                        } else {
                            bullet.move(bullet, distance, bullet.info.speed);
                        }
                    }
                    bullet.render(that.ctx, bullet);
                    //过滤已经被标记为删除的子弹
                    that.arrow = that.arrow.filter(item => item.isDelete !== true);
                }
            }
            requestAnimationFrame(loop);
        }
    },
    randomMove: function () {
        let that = this, result = true;

        this.timer.randomMove = requestAnimationFrame(move);
        /*
         * @direction
         * @1: 向左移动
         * @2: 向右移动
         */
        let direction = 1;

        function move() {
            if (checkAnimate()) {
                if (direction === 1) {
                    function getResult() {
                        for (let i = 0; i < that._enemy.length; i++) {
                            //wScale限制移动范围
                            if (!that.checkBorder(that._enemy[i], -that._enemy[i].info.speed, 0, {
                                    wScale: 0.75,
                                    hScale: 1
                                })) {
                                return false;
                            }
                        }
                        return true;
                    }

                    result = getResult();
                    if (result) {
                        that._enemy.forEach(item => item.move(item, -item.info.speed, 0));
                    } else {
                        that._enemy.forEach(item => item.move(item, item.info.speed, 0));
                        direction = 2;
                    }
                } else {
                    function getResult() {
                        for (let i = 0; i < that._enemy.length; i++) {
                            if (!that.checkBorder(that._enemy[i], that._enemy[i].info.speed, 0, {
                                    wScale: 0.75,
                                    hScale: 1
                                })) {
                                return false;
                            }
                        }
                        return true;
                    }

                    result = getResult();
                    if (result) {
                        that._enemy.forEach(item => item.move(item, item.info.speed, 0));
                    } else {
                        that._enemy.forEach(item => item.move(item, -item.info.speed, 0));
                        direction = 1;
                    }
                }
            }
            requestAnimationFrame(move);
        }

        //检查初始化动画是否进行完，放在这里是因为随机移动是第一个开始进行的计时器
        function checkAnimate() {
            //循环数组，在动画进行完后对象的completeAnimate属性将会被设置成true
            for (let i = 0; i < that._enemy.length; i++) {
                if (!that._enemy[i].completeAnimate) {
                    return false;
                }
            }
            that.isAnimateComplete = true;
            return true;
        }
    },
    randomShoot: function () {
        let that = this, shoot_cycle = getRandom(1000) + 500;

        this.timer.randomShoot = setInterval(function () {
            if (new Date().valueOf() - that.cooldown.selfShootCooldown > shoot_cycle && that.self.isAlive && that.isAnimateComplete && !!that._enemy.length) {
                let random_index = [], arr = that.enemy.filter(item => item.length !== 0);

                //随机选取几个前排，然后发射
                for (let i = 0; i < getRandom(3) + 2; i++) {
                    random_index.push(getRandom(arr.length - 1));
                }
                for (let i = 0; i < random_index.length; i++) {
                    let bullet = new Bullet();
                    bullet.setInfo({
                        x: Math.ceil(arr[random_index[i]][0].info.x + arr[random_index[i]][0].info.width / 2),
                        y: null,
                        width: 3,
                        height: 15,
                        speed: 20,
                        prev: {
                            x: null,
                            y: null,
                        }
                    });
                    bullet.info.y = arr[random_index[i]][0].info.y + arr[random_index[i]][0].info.height + bullet.info.height;
                    bullet.info.color = "red";
                    bullet.info.prev.x = bullet.info.x;
                    bullet.info.prev.y = bullet.info.y;
                    bullet.type = 2;
                    bullet.setCtx(that.ctx);

                    that.arrow.push(bullet);
                    that.cooldown.shootCooldown = new Date().valueOf();
                }
            }
        }, shoot_cycle);
    },
    randomLeave: function () {
        //@TODO 需要优化!!!
        let that = this, leave_cycle = getRandom(5000) + 7000, enemy = that.enemy;
        this.timer.randomLeave = setInterval(function () {
            if (that.self.isAlive && that.isAnimateComplete) {
                let obj, random = getRandom(2), path = [];
                //enemy = enemy.filter(item => item.length !== 0);
                //此处的if else两边都差不多
                if (random === 1) {
                    //从enemy中取出一个对象，并且删除它
                    let temp = enemy.filter(item => item.length !== 0);
                    obj = temp[0][temp[0].length - 1];
                    temp[0][temp[0].length - 1].status = 2;

                    enemy[0][enemy[0].length - 1] = null;
                    enemy[0] = enemy[0].filter(item => item !== null);
                    that._enemy = that._enemy.filter(item => item.status !== 2);
                    //将删除的对象移入到out_enemy中
                    that.out_enemy.push(obj);
                    let n = 0, r = 0, _default;
                    //根据敌机类型制作曲线，敌机越强，则曲线长度越短，运动的就越快
                    if (obj.type === 1) {
                        _default = 160;
                    } else if (obj.type === 2) {
                        _default = 140;
                    } else if (obj.type === 3) {
                        _default = 120;
                    } else {
                        _default = 100;
                    }

                    //获取贝塞尔曲线的点
                    for (let i = 0; i < 1; i += _default / 100 / 100 / 2) {
                        path.push(getBezierPoint(i, obj.info.x, obj.info.y, that.self.info.x, that.canvas.height + 20, obj.info.x - obj.info.width * 7, obj.info.y + obj.info.height));
                    }
                    leave();

                    function leave() {
                        if (path[n] && !obj.isDelete) {
                            if (that.checkBorder(obj, path[n].x - obj.info.x, path[n].y - obj.info.y) && that.checkShip(obj)) {
                                if (r <= 180) {
                                    //开始改变角度
                                    r += 10;
                                    obj.info.rotation = r;
                                }
                                if (n === Math.ceil(path.length / 2)) {
                                    let bullet = new Bullet();
                                    bullet.setInfo({
                                        x: Math.ceil(obj.info.x + obj.info.width / 2),
                                        y: null,
                                        width: 3,
                                        height: 15,
                                        speed: (function () {
                                            if (obj.type === 1) {
                                                return 30;
                                            } else if (obj.type === 2) {
                                                return 31;
                                            } else if (obj.type === 3) {
                                                return 32;
                                            } else {
                                                return 33;
                                            }
                                        })(),
                                        prev: {
                                            x: null,
                                            y: null,
                                        }
                                    });
                                    bullet.info.y = obj.info.y + obj.info.height + bullet.info.height;
                                    bullet.info.color = "red";
                                    bullet.info.prev.x = bullet.info.x;
                                    bullet.info.prev.y = bullet.info.y;
                                    bullet.type = 3;
                                    //设置跟踪坐标
                                    bullet.track = {
                                        x: that.self.info.x,
                                        y: that.self.info.y
                                    };
                                    bullet.setCtx(that.ctx);

                                    that.arrow.push(bullet);
                                }
                                obj.move(obj, path[n].x - obj.info.x, path[n].y - obj.info.y);
                                n++;
                                requestAnimationFrame(leave);
                            } else {
                                that.crashed(obj);
                            }
                        }
                    }
                } else {
                    let temp = enemy.filter(item => item.length !== 0);
                    obj = temp[temp.length - 1][temp[temp.length - 1].length - 1];
                    temp[temp.length - 1][temp[temp.length - 1].length - 1].status = 2;

                    enemy[enemy.length - 1][enemy[enemy.length - 1].length - 1] = null;
                    enemy[enemy.length - 1] = enemy[enemy.length - 1].filter(item => item !== null);
                    that._enemy = that._enemy.filter(item => item.status !== 2);
                    that.out_enemy.push(obj);
                    let n = 0, r = 0, _default;
                    if (obj.type === 1) {
                        _default = 160;
                    } else if (obj.type === 2) {
                        _default = 140;
                    } else if (obj.type === 3) {
                        _default = 120;
                    } else {
                        _default = 100;
                    }
                    for (let i = 0; i < 1; i += _default / 100 / 100 / 2) {
                        path.push(getBezierPoint(i, obj.info.x, obj.info.y, that.self.info.x, that.canvas.height + 20, obj.info.x + obj.info.width * 7, obj.info.y + obj.info.height));
                    }
                    leave();

                    function leave() {
                        if (path[n] && !obj.isDelete) {
                            if (that.checkBorder(obj, path[n].x - obj.info.x, path[n].y - obj.info.y) && that.checkShip(obj)) {
                                if (r <= 180) {
                                    obj.info.rotation = r;
                                    r += 5;
                                }
                                if (n === Math.ceil(path.length / 2)) {
                                    let bullet = new Bullet();
                                    bullet.setInfo({
                                        x: Math.ceil(obj.info.x + obj.info.width / 2),
                                        y: null,
                                        width: 3,
                                        height: 15,
                                        speed: (function () {
                                            if (obj.type === 1) {
                                                return 30;
                                            } else if (obj.type === 2) {
                                                return 31;
                                            } else if (obj.type === 3) {
                                                return 32;
                                            } else {
                                                return 33;
                                            }
                                        })(),
                                        prev: {
                                            x: null,
                                            y: null,
                                        }
                                    });
                                    bullet.info.y = obj.info.y + obj.info.height + bullet.info.height * 2;
                                    bullet.info.color = "red";
                                    bullet.info.prev.x = bullet.info.x;
                                    bullet.info.prev.y = bullet.info.y;
                                    bullet.type = 3;
                                    bullet.track = {
                                        x: that.self.info.x,
                                        y: that.self.info.y
                                    };
                                    bullet.setCtx(that.ctx);

                                    that.arrow.push(bullet);
                                }
                                obj.move(obj, path[n].x - obj.info.x, path[n].y - obj.info.y);
                                n++;
                                requestAnimationFrame(leave);
                            } else {
                                that.crashed(obj);
                            }
                        }
                    }
                }
            }
        }, leave_cycle);
    },
    bindEvent: function () {
        this.event = new Event();
        document.onkeydown = this.keyDown.bind(this);
        document.onkeyup = this.keyUp.bind(this);
    },
    unbindEvent: function () {
        document.onkeydown = null;
        document.onkeyup = null;
    },
    keyDown: function (e) {
        e.preventDefault();
        let event = this.event, self = this.self, that = this;
        //映射keyCode
        if (e.keyCode in event.keyMap) {
            event.keyMap[e.keyCode] = true;
        }
        //如果初始化动画还未结束，则不能移动
        if (this.isAnimateComplete) {
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
                    event.timer.selfShoot = setInterval(function () {
                        if (self.isAlive && event.keyMap[90]) {
                            if (new Date().valueOf() - that.cooldown.shootCooldown > 250) {
                                if (that.name.getName() !== "GOD FATHER") {
                                    let bullet = new Bullet();
                                    bullet.setInfo({
                                        x: Math.ceil(self.info.x + self.info.width / 2),
                                        y: null,
                                        width: 3,
                                        height: 15,
                                        speed: 20,
                                        prev: {
                                            x: null,
                                            y: null,
                                        }
                                    });
                                    //-10是用来进行偏移的
                                    bullet.info.y = self.info.y - bullet.info.height - 10;
                                    bullet.info.color = "white";
                                    bullet.info.prev.x = bullet.info.x;
                                    bullet.info.prev.y = bullet.info.y;
                                    bullet.type = 1;
                                    bullet.setCtx(that.ctx);

                                    that.arrow.push(bullet);
                                    that.cooldown.shootCooldown = new Date().valueOf();
                                } else {
                                    //GOD FATHER，无敌模式
                                    for (let i = 0; i < 5; i++) {
                                        let bullet = new Bullet();
                                        bullet.setInfo({
                                            x: Math.ceil(self.info.x + i * 5),
                                            y: null,
                                            width: 3,
                                            height: 15,
                                            speed: 20,
                                            prev: {
                                                x: null,
                                                y: null
                                            }
                                        });
                                        bullet.info.y = self.info.y - bullet.info.height - 10;
                                        bullet.info.color = "white";
                                        bullet.info.prev.x = bullet.info.x;
                                        bullet.info.prev.y = bullet.info.y;
                                        bullet.type = 1;
                                        bullet.setCtx(that.ctx);

                                        that.arrow.push(bullet);
                                        that.cooldown.shootCooldown = new Date().valueOf();
                                    }
                                }
                            }
                        }
                    }, 1000 / 60);
                }
            }
            if (!self.isAlive && [37, 39, 90].includes(e.keyCode) && this.life > 0) {
                this.initSelf();
            }
        }
    },
    keyUp: function (e) {
        let event = this.event;
        //解除keyCode映射
        if (e.keyCode in event.keyMap) {
            event.keyMap[e.keyCode] = false;
        }
        if (e.keyCode === 37) {
            // cancelAnimationFrame(event.timer.selfLeft);
            // event.timer.selfLeft = 0;
            event.clearTimer("selfLeft");
        }
        if (e.keyCode === 39) {
            // cancelAnimationFrame(event.timer.selfRight);
            // event.timer.selfRight = 0;
            event.clearTimer("selfRight");
        }
        if (e.keyCode === 90) {
            // cancelAnimationFrame(event.timer.selfShoot);
            // event.timer.selfShoot = 0;
            event.clearTimer("selfShoot");
        }
    },
    checkBorder: function (obj, Xoffset, Yoffset, opts) {
        let canvas = this.canvas;
        if (obj.info.x + Xoffset < (!!opts ? canvas.width * (1 - opts.wScale) / 2 : 0) ||
            obj.info.x + Xoffset + obj.info.width > (!!opts ? canvas.width - canvas.width * (1 - opts.wScale) / 2 : canvas.width) ||
            obj.info.y + Yoffset < 0 ||
            obj.info.y + Yoffset > canvas.height)
            return false;
        return true;
    },
    //检查子弹有无越界,或击中目标
    checkArrow: function (obj, Xoffset, Yoffset) {
        let canvas = this.canvas, self = this.self, enemy = this.enemy;
        //是否越界
        if (obj.info.x + Xoffset < 0 || obj.info.x + obj.info.width + Xoffset > canvas.width || obj.info.y + Yoffset < 0 || obj.info.y + Yoffset > canvas.height)
            return false;
        //击中子机
        if (obj.info.x >= self.info.x && obj.info.x <= self.info.x + self.info.width && obj.info.y + obj.info.height >= self.info.y && obj.info.y + obj.info.height <= self.info.y + self.info.height && this.self.isAlive) {
            this.crashed(self, {status: 2});
            return false;
        }
        //检测是否击中敌机
        for (let i = 0; i < enemy.length; i++) {
            for (let j = 0; j < enemy[i].length; j++) {
                if (obj.info.x >= this.enemy[i][j].info.x && obj.info.x <= this.enemy[i][j].info.x + this.enemy[i][j].info.width && obj.info.y >= this.enemy[i][j].info.y && obj.info.y <= this.enemy[i][j].info.y + this.enemy[i][j].info.height) {
                    this.crashed(this.enemy[i][j], {i: i, j: j});
                    return false;
                }
            }
        }
        //在外部移动的敌机不在enemy数组中，而是在外部的out_enemy的数组中，此处检查的是out_enemy数组
        for (let i = 0; i < this.out_enemy.length; i++) {
            let enemy = this.out_enemy[i];
            if (obj.info.x >= enemy.info.x && obj.info.x <= enemy.info.x + enemy.info.width && obj.info.y >= enemy.info.y && obj.info.y <= enemy.info.y + enemy.info.height) {
                this.crashed(enemy);
                return false;
            }
        }
        return true;
    },
    checkShip: function (obj) {
        if (Math.ceil(obj.info.x + obj.info.width / 2) >= this.self.info.x && Math.ceil(obj.info.x + obj.info.width / 2) <= this.self.info.x + this.self.info.width && Math.ceil(obj.info.y + obj.info.height / 2) >= this.self.info.y && Math.ceil(obj.info.y + obj.info.height / 2) <= this.self.info.y + this.self.info.height) {
            this.crashed(this.self, {status: 1});
            return false;
        }
        return true;
    },
    checkEnd: function (status) {
        /*
         * 1: 撞机
         * 2: 被子弹击落
         */

        //玩家还剩最后一条命,同归于尽
        if (status === 1 && this.life === 0 && this._enemy.length === 0 && this.out_enemy.length) {
            this.endAction(0);
        }
        //残机用完
        if (!this.self.isAlive && this.life === 0) {
            this.endAction(0);
        }
        //胜利
        if (this.self.isAlive && !this._enemy.length && !this.out_enemy.length) {
            this.endAction(1);
        }
    },
    crashed: function (obj, opts) {
        let that = this;
        if (obj instanceof Self) {
            //this.life -= 1;
            obj.explosion(obj.ctx, this.image["explosion1"], this.image["explosion2"], this.image["explosion3"], this.image["explosion4"]);
            this.checkEnd(opts.status);
        } else if (obj instanceof Enemy) {
            obj.delete();
            !!opts ? this.enemy[opts.i] = this.enemy[opts.i].filter(item => item.isDelete !== true) : this.enemy = (function () {
                    for (let i = 0; i < that.enemy.length; i++) {
                        that.enemy[i] = that.enemy[i].filter(item => item.isDelete !== true);
                    }
                    return that.enemy;
                })();
            this._enemy = this._enemy.filter(item => item.isDelete !== true);
            this.out_enemy = this.out_enemy.filter(item => item.isDelete !== true);
            this.checkEnd();
        }
    },
    endAction: function (result) {
        if (result && !this.isEnd) {
            this.isEnd = true;
            clearInterval(this.timer.randomShoot);
            clearInterval(this.timer.randomLeave);
            cancelAnimationFrame(this.timer.randomMove);
            this.event.clear();
            this.unbindEvent();
        } else if (!result && !this.isEnd) {
            this.isEnd = true;
            clearInterval(this.timer.randomShoot);
            clearInterval(this.timer.randomLeave);
            cancelAnimationFrame(this.timer.randomMove);
            this.event.clear();
            this.unbindEvent();
        }
        end(result);
    },
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

//@test 显示帧率
let showFps = (function () {
    let last = performance.now(), fps = 0, offset, frame = 0;

    function go() {
        //时间差
        offset = performance.now() - last;
        frame += 1;
        //说明已经超出一秒了
        if (offset >= 1000) {
            last = performance.now();
            fps = frame;
            frame = 0;
        }
        requestAnimationFrame(go);
    }

    function getFps() {
        return fps;
    }

    return {
        go: go,
        getFps: getFps,
    }
})();

//基类
function DrawAble() {
    this.ctx = null;
    this.setCtx = function (ctx) {
        this.ctx = ctx;
    };
    this.render = function (ctx, obj) {
        //-5是由于旋转有bug...
        ctx.clearRect(obj.info.prev.x - 5, obj.info.prev.y - 5, obj.info.width + 10, obj.info.height + 10);

        ctx.save();

        //设置目标颜色
        if (obj.info.color)
            ctx.fillStyle = obj.info.color;
        //转移绘图原点
        ctx.translate(Math.ceil(obj.info.x + obj.info.width / 2), Math.ceil(obj.info.y + obj.info.height / 2));
        //在目标中心旋转
        ctx.rotate(obj.info.rotation * Math.PI / 180);
        //ctx.clearRect(-(Math.ceil(obj.info.width / 2)) - 12, -(Math.ceil(obj.info.height / 2)) - 12, obj.info.width + 24, obj.info.height + 24);
        ctx.translate(-Math.ceil(obj.info.x + obj.info.width / 2), -Math.ceil(obj.info.y + obj.info.height / 2));
        //在转换回来

        //先检测目标有没有image，如果没有，则直接绘制他的宽高，颜色在前面有设置
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
    this.delete = function () {
        this.ctx.clearRect(this.info.x - 10, this.info.y - 10, this.info.width + 20, this.info.height + 20);
        this.isDelete = true;
        this.info.x = -1000;
        this.info.y = -1000;
    }
}

//所有的飞船届继承自此对象
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
        rotation: null,
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
            } else {
                this.completeAnimate = true;
            }
        } else if (opts.direction === 2) {
            if (startX >= endX && startY <= endY) {
                this.move(this, 0, +this.info.speed);
                this.render(this.ctx, this);
                requestAnimationFrame(function () {
                    that.initAnimate(that.info.x, that.info.y, endX, endY, {direction: 2});
                })
            } else {
                this.completeAnimate = true;
            }
        }
    };
    // this.animate = function (path) {
    //
    // }
}

SpaceShip.prototype = new DrawAble();

//敌机对象
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

//自机对象
function Self() {
    this.explosion = function (ctx, ex1, ex2, ex3, ex4) {
        //自机的爆炸函数
        this.isAlive = false;
        this.info.prev.x = this.info.x;
        this.info.prev.y = this.info.y;

        this.swapImage(ex1);
        this.render(ctx, this);

        //回调函数=-=？
        setTimeout(function () {
            this.swapImage(ex2);
            this.render(ctx, this);
            setTimeout(function () {
                this.swapImage(ex3);
                this.render(ctx, this);
                setTimeout(function () {
                    this.swapImage(ex4);
                    this.render(ctx, this);
                    //@Test
                    setTimeout(function () {
                        // this.info.prev.x = this.info.x;
                        // this.info.prev.y = this.info.y;
                        this.ctx.clearRect(this.info.x, this.info.y, this.info.width, this.info.height);
                        this.info.width = 0;
                        this.info.height = 0;
                        this.render(ctx, this);
                    }.bind(this), 100);
                }.bind(this), 100);
            }.bind(this), 100);
        }.bind(this), 100);
    };
    this.swapImage = function (image) {
        this.info.image = image;
    };
}

Self.prototype = new SpaceShip();

//实体对象
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
    /*
     type: 子弹方向
     1 up
     2 down
     3 track
     */
    this.type = null;
    this.info.color = null;
    this.track = {
        x: null,
        y: null
    };
}

Bullet.prototype = new Entity();

function Event() {
    this.keyMap = {
        37: false,
        39: false,
        90: false,
        32: false
    };
    this.timer = {
        selfLeft: null,
        selfRight: null,
        selfShoot: null,
    };
    this.clearTimer = function (timer) {
        cancelAnimationFrame(this.timer[timer]);
        this.timer[timer] = 0;
    };
    this.clear = function () {
        for (let key in this.timer) {
            cancelAnimationFrame(this.timer[key]);
            this.timer[key] = 0;
        }
    }
}

let game = new Galaxian(document.querySelector("canvas"));
//game.inital();