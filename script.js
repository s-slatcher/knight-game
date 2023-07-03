window.addEventListener('load', function(){
    this.alert("loaded")
    /**  @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext('2d');
const canvas2 = document.getElementById("canvas2")
const ctx2 = canvas2.getContext('2d')
const CANVAS_WIDTH = canvas.width = 1000
const CANVAS_HEIGHT = canvas.height = 750;
canvas2.height = 750;
canvas2.width = 1000;
let FRAME_RATE = 20.8333;//20.8333 = 48fps;
let lastTimeStamp = 0;
let frameTime = 1;
let frameTimeDeficit = 0;
let projectiles = [];
let timerGame = 0;
let timerNative = 0;


const keyRecord = {
    a: { pressed: false },
    d: { pressed: false },
    ' ': { pressed: false }
};
const sfx = { clink: new Audio() };


window.addEventListener('keydown', (e) => {
    keyRecord[e.key] = { pressed: true, key: e.key }
    if (e.key === ' ') e.preventDefault();
})
window.addEventListener('keyup', (e) => {
    keyRecord[e.key].pressed = false;
})

canvas.addEventListener('click', (e) => {
    // sfx.clink.src = `./clink-sfx/${Math.floor(Math.random()*6)}.wav`
    // sfx.clink.play();
    projectiles.push(new Projectile(e.clientX, e.clientY))

})

document.getElementById("volume").addEventListener('change', changeVolume)
document.getElementById("fps").addEventListener('change', (e) => (FRAME_RATE = 1000 / e.target.value))

function changeVolume(event) {
    for (const [key, value] of Object.entries(sfx)) {
        sfx[key].volume = event.target.value / 100;
    }
    console.log(event.target.value)
}

class Projectile {
    constructor(x, y) {
        this.width = 30;
        this.height = 30;
        this.positionX = x - this.width / 2
        this.positionY = y - this.height / 2
        this.totalVelocity = 20;
        this.velocityX = Math.random() * 5 * Math.sign((Math.random() - 0.5));
        this.velocityY = Math.sqrt(Math.pow(this.totalVelocity, 2) - Math.pow(this.velocityX, 2))
        this.gravity = 1;
        this.lifeTime = 0;
        this.alpha = 1;
        this.rotation = (Math.random() * 360 * Math.PI / 180)
    }
    update() {
        if (this.positionY > CANVAS_HEIGHT + 100) return;
        this.positionX += this.velocityX;
        this.positionY -= this.velocityY;
        this.velocityY -= this.gravity;
        this.lifeTime += 1;
        this.alpha = this.alpha > 0 ? 1 - (this.lifeTime / 50) : 0;
        this.rotation += this.velocityX / 50

    }
}


class Player {
    constructor() {
        this.blockSprite,
            this.attackSprite,
            this.moveFrame = 18;
        this.attackFrame = 0;
        this.targetFrame = { a: 0, d: 34, neutral: 18 };
        this.framesToSkip = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
        this.frameIncrement = 1;
        this.lastInput = 'neutral';
        this.input = 'neutral';
        this.inputDelayCounter = 0;
        this.frameCounter = 0;
        this.isAttacking = false;
        this.blockDirection = { left: false, right: false }
        this.attackDirection = { left: false, neutral: false, right: false }
    }
    readMovementInput() {

        let inputCandidate = 'neutral';
        if (keyRecord.d.pressed) inputCandidate = 'd'
        if (keyRecord.a.pressed) inputCandidate = 'a'
        this.input = this.lastInput === 'neutral' || !keyRecord[this.lastInput].pressed ?
            inputCandidate : this.lastInput;


        if (this.inputDelayCounter > 0) {
            this.input = this.lastInput
            this.inputDelayCounter -= 1;
        }
        if (this.input !== this.lastInput) {
            this.inputDelayCounter = 4;
        }
        this.lastInput = this.input;

        if (keyRecord[' '].pressed && this.inputDelayCounter === 0) {
            Object.values(this.blockDirection).forEach((e) => e = false)
            this.inputDelayCounter = this.attackSprite.frames.length
            this.isAttacking = true;
        }
    }
    update() {
        this.readMovementInput();
        this.updateBounceModifier();
        this.updateBlockAnimation();
    }
    updateBounceModifier() {
        this.bounceModifier = Math.sin(this.frameCounter / 10) * 15;
        this.swayModifier = Math.cos(this.frameCounter / 20) * 10;
        if (this.bounceModifier > 0)
            this.bounceModifier *= -1;
        if (this.swayModifier > 0)
            this.swayModifier *= -1;
    }
    drawAttackAnimation() {
        const attackSprite = this.attackSprite;
        const frame = attackSprite.frames[this.attackFrame].frame
        ctx2.globalAlpha = 0;
        if (this.isAttacking) {
            ctx2.globalAlpha = 1;
            this.attackFrame++
        }
        if (this.attackFrame === 1) {
            ctx2.translate(500,0);
            ctx2.scale(-1,1);
            ctx2.translate(-500,0);
        }
        if (this.attackFrame > 0) { ctx.drawImage(
            attackSprite.image,
            frame.x, frame.y,
            frame.w, frame.h,
            attackSprite.offSetWidth + 200,
            attackSprite.offSetHeight + 200,
            frame.w, frame.h); }
        if (this.attackFrame === attackSprite.frames.length - 1) {
            this.isAttacking = false;
            this.attackFrame = 0;
        }

    }
    updateBlockAnimation() {
        let target = this.targetFrame[this.input]
        let frameDifference = target - this.moveFrame
        if (frameDifference === 0) return;

        let skipFrame = (!this.framesToSkip.includes(target) && !this.framesToSkip.includes(this.moveFrame))
        this.frameIncrement = Math.sign(frameDifference)
        this.moveFrame += (this.frameIncrement);
        if (skipFrame && (Math.abs(frameDifference) > 20)) sfx.swipe.play();
        if (skipFrame && this.framesToSkip.includes(this.moveFrame)) {
            this.moveFrame = 18 + this.frameIncrement * (Math.ceil(this.framesToSkip.length / 2))
        }

    }

    draw() {
        this.drawMovement();
        this.drawAttackAnimation();
    }

    drawMovement() {
        const blockSprite = this.blockSprite
        const frame = blockSprite.frames[this.moveFrame].frame;
        const attackLength = this.attackSprite.frames.length - 1;
        let alpha = 1; 

        if (this.isAttacking) alpha = 0;
        if(this.attackFrame <= attackLength*(1/10)) {
            alpha = 0.1 * (10 - this.attackFrame)
            console.log(this.attackFrame)
        }
        if (this.attackFrame >= attackLength*(9/10)) {
            alpha = 1 - (0.1 * (attackLength - this.attackFrame))
        }
        alpha += alpha < 0 ? alpha*-1 : 0;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(
            blockSprite.image,
            frame.x, frame.y,
            frame.w, frame.h,
            blockSprite.offSetWidth  + this.swayModifier,
            blockSprite.offSetHeight + this.blockSprite.movementHeight + this.bounceModifier,
            frame.w, frame.h);
        ctx.restore();
    }

}
let player = new Player();


(async () => {
    const res = await Promise.all([
        fetch("./sword48.json"),
        fetch("./sword-attack-1.json"),
        //fetch("./crossbow-attack.json")
    ]);
    const data = await Promise.all(res.map(r => r.json()))
    console.log(data.flat());
    data.forEach((json) => {
        json.image = new Image();
        json.image.src = `./${json.meta.image}`;
        json.offSetWidth = 0 + CANVAS_WIDTH * 0.1;
        json.offSetHeight = 0 + CANVAS_HEIGHT * 0.15;
        json.movementWidth = 0;
        json.movementHeight = 0;
        json.alpha = 1;
        player[json.meta.name] = json;
    })
    loadSound();
    animate(0);
})();

function loadSound() {
    sfx.music = new Audio();
    sfx.music.src = './Loop_The_Bards_Tale.wav'
    sfx.music.playbackRate = 1;
    sfx.music.volume = 0;
    sfx.music.loop = true;
    sfx.music.play();
    sfx.swipe = new Audio();
    sfx.swipe.volume = 0;
    sfx.swipe.src = './swish-9.wav'
    sfx.swipe.playbackRate = 1;

}




function getFramesDue(timestamp) {
    frameTime = timestamp - lastTimeStamp;
    lastTimeStamp = timestamp;
    frameTimeDeficit += frameTime;
    const framesDue = Math.floor(frameTimeDeficit / FRAME_RATE);
    frameTimeDeficit = frameTimeDeficit % FRAME_RATE;
    return framesDue;
}

function animate(timestamp) {
    let framesDue = getFramesDue(timestamp);
    for (let i = 0; i < framesDue; i++) {
        ctx2.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        player.update();
        player.draw();
        player.frameCounter++
        timerGame++;


        projectiles.forEach((e) => {
            e.update();
            ctx.save();
            ctx.translate(e.positionX, e.positionY)
            ctx.rotate(e.rotation);
            ctx.translate(-e.positionX, -e.positionY)
            ctx.fillStyle = "#0e87cc"
            ctx.globalAlpha = e.alpha;
            ctx.fillRect(e.positionX, e.positionY, 40, 40);
            ctx.restore();
        })
    }
    timerNative++;
    displayFrameInfo();
    requestAnimationFrame(animate);
}



function displayFrameInfo() {
    document.getElementById("game_timer").innerHTML = timerGame;
    document.getElementById("game_label").innerHTML = `game frames (${FRAME_RATE}ms, ${Math.floor(1000 / FRAME_RATE)}fps): `
    document.getElementById("native_label").innerHTML =
        `real frames (${Math.floor(frameTime * 1000) / 1000}ms,
    ${Math.floor(1000 / frameTime)}fps)
    average: ${Math.floor((timerNative / timerGame) * 1000 / FRAME_RATE)}fps:`;
    document.getElementById("native_timer").innerHTML = Math.floor(timerNative);
}  

})