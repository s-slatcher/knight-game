window.addEventListener('load', function(){


const canvas = document.getElementById("canvas1");
const pauseMenu = document.getElementById("pauseMenu")
const canvasContainer = document.getElementById("canvas-container")
const resumeButton = document.getElementById("resume-btn")
const startButton = document.getElementById("start-btn")
const ctx = canvas.getContext('2d');
const keyRecord = [];
const touchRecord = {touchX:[], touchY:[], multiTouch: false};
canvas.width = 1000;
canvas.height = 1000;
canvas.style.aspectRatio = 1/1



startButton.addEventListener('click',() => {
    fetchSprites();
    canvas.requestFullscreen();
    startButton.classList.add("disabled")
})

resumeButton.addEventListener('click', () => {
    canvas.requestFullscreen();
    resumeButton.classList.add("disabled")

})


window.addEventListener('keydown', (e) => {
    let key = e.key.length > 1 ? e.key : e.key.toLowerCase();
    if (keyRecord.indexOf(key) === -1) keyRecord.push(key)
    if (key.length === 1) 
    if (key === ' ' || key === 'Escape') e.preventDefault();
})
window.addEventListener('keyup', (e) => {
    let key = e.key.length > 1 ? e.key : e.key.toLowerCase();
    keyRecord.splice(keyRecord.indexOf(key),1)
})

window.addEventListener('blur', () => keyRecord.splice(0,keyRecord.length))




document.getElementById("fps").addEventListener('change', (e) => (console.log(e.target.value)))




window.addEventListener("touchstart", handleStart);
window.addEventListener("touchmove", handleMove);
window.addEventListener("touchend", handleEnd);
window.addEventListener("touchcancel", handleEnd);

function handleStart(e){
    touchRecord.multiTouch = [...e.changedTouches].length > 1 ? true : false;
    touchRecord.touchY.push([...e.changedTouches][0].pageY)
    touchRecord.touchX.push([...e.changedTouches][0].pageX)
    console.log([...e.changedTouches][0].pageX)
}
function handleEnd(e){
    //window.addEventListener("touchstart", handleStart)    
    touchRecord.touchY = [];
    touchRecord.touchX = [];
    
}
function handleMove(e){
    touchRecord.multiTouch = [...e.changedTouches].length > 1 ? true : false;
    //if (touchRecord.multiTouch === true) e.preventDefault();  ** doesnt work, need new solution for pinch zoom
    touchRecord.touchY.push([...e.changedTouches][0].pageY)
    touchRecord.touchX.push([...e.changedTouches][0].pageX)
}

// (function jsonRewrite(){
//     let json = {
//         "frames": [
//             {
//                 "filename": "sword-attack-v20002",
//                 "frame": {
//                     "x": 1068,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20003",
//                 "frame": {
//                     "x": 1602,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20004",
//                 "frame": {
//                     "x": 2136,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20005",
//                 "frame": {
//                     "x": 2670,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20006",
//                 "frame": {
//                     "x": 3204,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20007",
//                 "frame": {
//                     "x": 3738,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20008",
//                 "frame": {
//                     "x": 4272,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20009",
//                 "frame": {
//                     "x": 4806,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20010",
//                 "frame": {
//                     "x": 5340,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20011",
//                 "frame": {
//                     "x": 5874,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20012",
//                 "frame": {
//                     "x": 6408,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20013",
//                 "frame": {
//                     "x": 6942,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20014",
//                 "frame": {
//                     "x": 7476,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20015",
//                 "frame": {
//                     "x": 0,
//                     "y": 871,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20016",
//                 "frame": {
//                     "x": 534,
//                     "y": 871,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20017",
//                 "frame": {
//                     "x": 1068,
//                     "y": 871,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20018",
//                 "frame": {
//                     "x": 1602,
//                     "y": 871,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20019",
//                 "frame": {
//                     "x": 2136,
//                     "y": 871,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20020",
//                 "frame": {
//                     "x": 2670,
//                     "y": 871,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20021",
//                 "frame": {
//                     "x": 3204,
//                     "y": 871,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20022",
//                 "frame": {
//                     "x": 3738,
//                     "y": 871,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20023",
//                 "frame": {
//                     "x": 4272,
//                     "y": 871,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20024",
//                 "frame": {
//                     "x": 4806,
//                     "y": 871,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20025",
//                 "frame": {
//                     "x": 5340,
//                     "y": 871,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20026",
//                 "frame": {
//                     "x": 5874,
//                     "y": 871,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             },
//             {
//                 "filename": "sword-attack-v20027",
//                 "frame": {
//                     "x": 6408,
//                     "y": 871,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "rotated": false,
//                 "trimmed": false,
//                 "spriteSourceSize": {
//                     "x": 0,
//                     "y": 0,
//                     "w": 534,
//                     "h": 871
//                 },
//                 "sourceSize": {
//                     "w": 534,
//                     "h": 871
//                 }
//             }
//         ],
//         "meta": {
//             "app": "Adobe Animate",
//             "version": "23.0.1.70",
//             "image": "sword-attack-v2.png",
//             "format": "RGBA8888",
//             "size": {
//                 "w": 8192,
//                 "h": 4096
//             },
//             "scale": "1"
//         }
//     }
//     let frames = json["frames"]
//     frames.forEach((frame) => {
        
//     })
//     console.log(json)
// })()


class Input{
    constructor(keyRecord, touchRecord){
        this.keys = keyRecord
        this.touchs = touchRecord
    }
}



class Game{
    constructor(ctx, width, height, playerSprites, backgroundSprites){
        console.log(playerSprites.attack)
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.lastTimeStamp = 0;
        this.frameTimeDeficit = 0;
        this.fps = 48;
        this.framesSinceLastEnemy = 0;
        this.totalFrames = 0;
        this.speedModifier = 1;
        this.foregroundStart = this.height - 600//first value will need to go up as height value increases, or road will pop off screen 
        this.maxPerspectiveScale = 2.7 //value comes from the perspective built into the road animation
        this.backgroundSpeed = 1.2 //pixels/frame -> value comes from speed built into the road animation
        this.roadTriangleHeight = 1000  //estimated from image
        this.foregroundRoadtopDistance = this.foregroundStart+(this.roadTriangleHeight-this.height)
        this.backgroundSprites = backgroundSprites
        this.player = new Player(this, playerSprites)
        this.background = new Background(this, backgroundSprites)
        this.enemies = [];
        this.projectiles = [];
        this.trees = [];
        this.fpsSlider = document.getElementById("fps")
        this.castleBg = new GameImage('./castle_bg.jpg',1.2,-300)
        this.castleBg.dy = -700
        
    }
    update(timestamp, keyRecord, touchRecord){
        if (!document.fullscreenElement) {
            const resume = document.getElementById("resume-btn")
            resume.classList.remove("disabled")
            return
        }
        this.fps = this.fpsSlider.value
        let framesDue = this.getFramesDue(timestamp)
        for (let i = 0; i < framesDue; i++) {
            this.totalFrames++;
            this.handleEnemies();
            this.handleBackground();
            this.player.update(keyRecord, touchRecord)
            this.background.update()
            this.updatePerpectiveImages()
            this.draw(this.ctx);
        }
    }
    handleBackground(){
        if (this.totalFrames % 24/this.speedModifier === 1) {
            this.trees.unshift(new GameImage("./tree.png",0.6,300)) 
            this.trees.unshift(new GameImage("./tree.png",0.6,-300)) 
            this.trees[0].alpha = 0;
            this.trees[1].alpha = 0;  
            this.trees = this.trees.filter((e) => e.dh < this.height)
            
        }
        this.trees.forEach((e) => e.moveWithPerspective(this))
        
        
    }   
    handleEnemies(){
        if (this.framesSinceLastEnemy > 50 && Math.random()>0.95) {
            let randomSign = Math.sign(Math.random()-0.5)
            let newEnemy;
            newEnemy = new GameImage('./gaurd_bolt.png',0.25,150*randomSign)
            newEnemy.alpha = 0;
            if (randomSign > 0) newEnemy.flipped = true;
            this.enemies.unshift(newEnemy)
            this.framesSinceLastEnemy = 0;
        } else this.framesSinceLastEnemy ++;
        this.enemies.forEach((e) => { e.framesAlive++})
    }
    updatePerpectiveImages(){
        this.enemies.forEach((e) => e.moveWithPerspective(this))
        this.enemies = this.enemies.filter((e) => e.dh < this.height)
        this.enemies.forEach((e) => {
           if (e.heightTraveled / (this.height-(this.foregroundStart)) > 0.2) {
            e.image.src = './gaurd_nobolt.png'
           }
        })
        
    }
    
    fireArrow(rightSide){
        
    }
    draw(ctx){
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        
        this.background.draw(ctx);
        this.trees.forEach((e) => e.draw(ctx))
        this.enemies.forEach((e) => e.draw(ctx))
        
        this.player.draw();
    }
    getFramesDue(timestamp){
        let frameTime = timestamp - this.lastTimeStamp;
        this.lastTimeStamp = timestamp;
        this.frameTimeDeficit += frameTime;
        const framesDue = Math.floor(this.frameTimeDeficit / (1000/this.fps));
        this.frameTimeDeficit = this.frameTimeDeficit % (1000/this.fps);
        return framesDue;
    }
}

class Enemy{
    constructor(enemyType, scale, centerOffset, baseImageSrc, 
                attackImageSrc, killedImageSrc, attackRange){
        this.enemyType = enemyType
        this.gameImage = new GameImage(baseImageSrc,scale,centerOffset)
        this.killed = false;
        this.hasAttacked = false;
        this.inAttackRange = false;
        this.attackImageSrc = attackImageSrc
        this.killedImageSrc = killedImageSrc
        this.attackRange = attackRange        
    }
    update(){
            if (this.heightPercentTraveled > this.attackRange) this.attackPlayer();
            if (this.heightPercentTraveled > 0.6) this.recieveAttack();
        }
    attackPlayer(){
        if (!this.hasAttacked && !this.killed) {
            this.gameImage.image.src = this.attackImageSrc
            this.hasAttacked = true;
        }
    }
    recieveAttack(){
        if (this.inAttackRange) {
            this.killed = true;
            this.gameImage.image.src = this.killed.imageSrc
    }
    }
}

class Crossbowman extends Enemy {
    constructor(centerOffset){
        super('crossbowman', 0.25, centerOffset, './gaurd_bolt.png',
            './gaurd_nobolt.png', './gaurd_dead.png')
    }
}

class Pikeman extends Enemy {
    constructor(centerOffset){
        //super()
    }
}



class Background{
    constructor(game, sprites){
        this.game = game;
        this.road = sprites.road
            this.road.offSetWidth = this.game.width/2 - this.road.dw/2
            this.road.offSetHeight = this.game.foregroundStart 
            console.log(this.road.sw)
    }
    update(){
        const road = this.road;
        road.frame += 1;
        if (road.frame>road.frames.length-1) road.frame = 0;
        if (this.game.totalFrames % 5 === 1) this.game.castleBg.dy += 1;
       
        road.updateSourceDimensions()
    }
 
    draw(ctx){
        const {road, game} = this;
        ctx.save()
        const gradient = ctx.createLinearGradient(0,0,0,200)
        gradient.addColorStop(1,"#b5dae5")
        gradient.addColorStop(0,"#0072b6")
        ctx.fillStyle = gradient;        
        ctx.fillRect(0,0,game.width,game.height)
        ctx.fillStyle = '#439544'
        ctx.fillRect(0, game.foregroundStart+2, game.width, game.height-game.foregroundStart)
        ctx.restore();
        road.draw(ctx);
        
    }
}
class GameImage{
    constructor(fileSrc, initScale = 1, centerOffset = 0){
    this.scale = initScale
    this.image = new Image()
    this.image.src = fileSrc
    this.sw = this.image.width;
    this.sh = this.image.height
    this.sx = 0
    this.sy = 0
    this.dx = 0 + centerOffset
    this.dy = 0
    this.dw = this.sw*this.scale
    this.dh = this.sh*this.scale
    this.centerOffset = centerOffset
    this.heightTraveled = 0;
    this.alpha = 1
    this.flipped = false;
    this.framesAlive = 0;
    this.sway = 0;
    this.bounce = 0;
    }
    draw(ctx){
        const {image, sx, sy, sw, sh, dx, dy, dw, dh} = this;
        ctx.save()
        if (this.flipped) this.flipHorizontal(ctx);    
        
        ctx.globalAlpha = this.alpha
        ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
        ctx.restore();
    }
    flipHorizontal(ctx){
        ctx.translate(this.dx+(this.dw/2),0)
        ctx.scale(-1,1)
        ctx.translate(-(this.dx+(this.dw/2)),0)
    }
    fadeAlpha(increment){
        if (increment === 0) return;
        let alpha = this.alpha + increment
        if (alpha > 1) alpha = 1;
        if (alpha < 0) alpha = 0;
        this.alpha = alpha;
    }
    moveWithPerspective({width, height, foregroundRoadtopDistance, foregroundStart, maxPerspectiveScale, backgroundSpeed}){
        this.heightPercentTraveled = this.heightTraveled / (height-(foregroundStart))
        let speedMultiplier = foregroundRoadtopDistance / (Math.sqrt(Math.pow(foregroundRoadtopDistance,2) + Math.pow(this.centerOffset,2)))
        let perspectiveScale = (1+(this.heightPercentTraveled*(maxPerspectiveScale-1)))
        let speed = Math.pow(perspectiveScale,2) * (backgroundSpeed*speedMultiplier)
        let heightDistributionAdjustment = ((this.sh * this.scale) - (this.dh)) * 0.5
        let widthDistributionAdjustment = ((this.sw * this.scale) - (this.dw)) * (this.centerOffset/(width*0.5))
        this.heightTraveled += speed
        this.dw =  perspectiveScale * this.sw * this.scale
        this.dh =  perspectiveScale * this.sh * this.scale
        this.dy = (foregroundStart - this.dh + this.heightTraveled - heightDistributionAdjustment)
        this.dx = width/2 - this.dw/2 + (this.centerOffset * perspectiveScale) - widthDistributionAdjustment
        
        if (this.heightTraveled < 100) {
            this.fadeAlpha(0.075)
        }
        if (this.heightTraveled > height - foregroundStart - 20) this.fadeAlpha(-0.15)
    }
}

class Sprite extends GameImage{
    constructor(sprite, scale){
        super(`./${sprite.meta.image}`, scale)
        this.offSetWidth = 0;
        this.offSetHeight = 0;
        this.frame = 0;
        this.sprite = sprite;
        this.frames = sprite.frames
        this.dx = 0;
        this.dy = 0;
        this.dw = this.frames[this.frame].frame.w
        this.dh = this.frames[this.frame].frame.h
        
    }
    updateSourceDimensions(){
        let frame = this.frames[this.frame].frame 
        this.sx = frame.x
        this.sy = frame.y 
        this.sw = frame.w
        this.sh = frame.h
        this.dw = frame.w * this.scale
        this.dh = frame.h * this.scale
        this.dx = this.heightTraveled ? this.dx + this.offSetWidth + this.sway : this.offSetWidth + this.sway       //this will break perspective trick, unless calculated right b
        this.dy = this.heightTraveled ? this.dx + this.offSetHeight + this.bounce : this.offSetHeight + this.bounce
    }
    
    
}


class Player{
    constructor(game, sprites){
        this.game = game;
        this.ctx = this.game.ctx
        this.block = sprites.block
            this.block.frame = 18;
            this.block.updateSourceDimensions();
            this.block.offSetWidth = this.game.width * 0.1;
            this.block.offSetHeight =  this.game.height - this.block.dh* 0.9;
            
            this.block.frameIncrement = 1;
            this.block.frameQueue = [18];
            this.block.positionInQueue = 0;
            this.block.frameDestinations = {'none':18, 'a':0, 'd':35} 
            this.block.middleSkipRange = [12,26] 
            this.block.earlyFramesToSkip = 5
            this.block.inputDelayCounter = 0;
            this.sway = 0;
            this.bounce = 0;
        this.attack = sprites.attack
            this.attack.frame = 0;
            this.attack.updateSourceDimensions();
            this.attack.offSetWidth = this.game.width * 0.3;
            this.attack.offSetHeight = this.game.height - this.attack.dh*0.75
            
            this.attack.direction = 'none'
            this.block.inputDelayCounter = 0;
        this.input = 'none'
        this.attackInput = true;
        this.isAttacking = false;
        this.state = {block:false, attack:false}
    }
    readKeyboard(keyRecord){
        let newInput;
        if (keyRecord.length === 0) this.input = 'none'
        else if (!keyRecord.includes(this.Input)){
            newInput = 'none'
            if (keyRecord.includes('a')) newInput = 'a'
            if (keyRecord.includes('d')) newInput = 'd'
            this.input = newInput;
        }
        if(keyRecord.includes(" ")) this.attackTransition()   
    }
    readTouch(touchRecord){
        if (touchRecord.touchX.length === 0) return;
        const touchY = touchRecord.touchY
        const touchX = touchRecord.touchX
        let newInput = 'none'
        if (touchX[touchX.length-1] < window.innerWidth/3) newInput = 'a'
        if (touchX[touchX.length-1] > window.innerWidth*(2/3)) newInput = 'd'
        if (touchRecord.multiTouch) newInput = 'none';
        if (touchY[touchY.length-2] - touchY[touchY.length-1] > 15) this.attackTransition();
        this.input = newInput;
        //* if player swipes up both fingers left and right, that should trigger the middle attack */
        // so i need to check for two swipe events from two touches.
    }
    update(keyRecord, touchRecord){
        this.readKeyboard(keyRecord)
        this.readTouch(touchRecord)
        this.updateBounceSway()
        this.isAttacking ? this.updateAttack() : this.updateBlock();
    }
    draw(){
        if (this.isAttacking ) {
            this.ctx.save()
            this.directAttack()
            this.attack.draw(this.ctx)
            this.ctx.restore();
            this.block.fadeAlpha(-0.2)
        } else {
            this.block.fadeAlpha(0.2);
            this.attack.alpha = 0;
        }
        this.block.draw(this.ctx);
        
    }
    attackTransition(){
        this.isAttacking = true;
        
    }
    updateAttack(){
        const attack = this.attack
        if (attack.frame === 0) this.attackDirection = this.input;
        attack.frame++;
        if (attack.frame < 10) attack.fadeAlpha(0.2)
        if(attack.frame > 20) attack.fadeAlpha(-0.2)
        if (attack.frame === attack.frames.length) {
            attack.frame = 0; 
            this.isAttacking = false;
        }

        attack.updateSourceDimensions()
    };
    updateBlock(){
        const block = this.block;
        if (--block.inputDelayCounter >= 0) this.input = block.oldInput
        if (this.input !== block.oldInput) {
            block.inputDelayCounter = 4;
            this.makeFrameQueue(block, this.input)
        }
        block.oldInput = this.input;
        if (block.positionInQueue !== block.frameQueue.length) block.frame = block.frameQueue[block.positionInQueue++]
        block.updateSourceDimensions()
    }
    makeFrameQueue(sprite, newInput){
        sprite.frameQueue = [];
        sprite.positionInQueue = 0;
        let frameEnd = sprite.frameDestinations[newInput]; 
        let increment = Math.sign(frameEnd-sprite.frame)
        if (Object.values(sprite.frameDestinations).includes(sprite.frame)) {
            sprite.frame += sprite.earlyFramesToSkip * increment
        }
        for (let i = sprite.frame + increment; i !== frameEnd + increment; i += increment){
            sprite.frameQueue.push(i)
        }
        if(Math.abs(sprite.frame - frameEnd) > sprite.frames.length/2) {
            sprite.frameQueue = sprite.frameQueue.filter((e) => e < sprite.middleSkipRange[0] || e > sprite.middleSkipRange[1])
        }
        
    }
    updateBounceSway() {
        let counter = this.game.totalFrames;
        let bounceModifier = Math.sin(counter / 7.5) * 15;
        let swayModifier = Math.cos(counter / 15) * 10;
        if (bounceModifier > 0) bounceModifier *= -1;
        if (swayModifier > 0) swayModifier *= -1;
        this.block.sway = this.attack.sway = swayModifier;
        this.block.bounce = this.attack.bounce = bounceModifier;
    }
    directAttack(){
        const ctx = this.ctx;
        let xTranslation = 0;
        ctx.translate(this.game.width/2, this.game.height)
        ctx.scale(1.35,1)
        if (this.attackDirection === 'd'){
            ctx.rotate(0.75)
            ctx.scale(-1.35,1)
            
        } else if (this.attackDirection === 'a') {
            ctx.rotate(-0.75)
        }
        ctx.translate(-this.game.width/2, -this.game.height+300)
        
        
    }
    setState(){
        this.state.block = false;
        this.state.attack = false;
        if (this.block.frame > 30) this.state.block = 'd' 
        if (this.block.frame < 6) this.state.block = 'a' 
        if (this.attack.isAttacking) this.state.block = false;
        if (this.attack.frame > 18 && this.attack.frame < 28){
            this.state.attack = this.attack.attackDirection
        }
        
    }
}


async function fetchSprites(){
    let playerSprites = {}
    let backgroundSprites = {}
    const [atkRep, blockRep, roadRep] = await Promise.all([
        fetch("./sword-attack-v2-compressed.json"),
        fetch("./sword48.json"),
        fetch("./road_background_v3.json")])
    await atkRep.json().then((sprite) => playerSprites.attack = new Sprite(sprite, 2));
    await blockRep.json().then((sprite) => playerSprites.block = new Sprite(sprite, 1));
    await roadRep.json().then((sprite) => backgroundSprites.road = new Sprite(sprite, 1));
    startGame(playerSprites,backgroundSprites);
};

function startGame(playerSprites,backgroundSprites){ 
  let game = new Game(ctx, canvas.width, canvas.height, playerSprites, backgroundSprites)
  animate(0,game);  
}
function animate(timestamp, game){
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.update(timestamp, keyRecord, touchRecord)
    requestAnimationFrame((timestamp)=>{
        animate(timestamp, game)
    })
}


});