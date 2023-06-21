/**  @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext('2d');
const CANVAS_WIDTH = canvas.width = 1000
const CANVAS_HEIGHT = canvas.height = 750;
const FRAME_RATE = 41.666;//20.83333 = 48fps;
let lastTimeStamp = 0;
let frameTime = 1;
let frameTimeDeficit = 0;
let worstFrameTime = 0;
let timerGame = 0;
let timerNative = 0;
let loaded = false;
const keyRecord = {
    a:{pressed:false},
    d:{pressed:false}}; 


window.addEventListener('keydown', (e) =>{
    keyRecord[e.key] = { pressed:true, key: e.key } 
    

})
window.addEventListener('keyup', (e) => {
    keyRecord[e.key].pressed = false;
})

const swordSprite = JSON.parse(JSON.stringify({"frames": {

    "0":
    {
        "frame": {"x":0,"y":0,"w":764,"h":628},
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": {"x":0,"y":0,"w":764,"h":628},
        "sourceSize": {"w":764,"h":628}
    },
    "1":
    {
        "frame": {"x":764,"y":0,"w":764,"h":628},
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": {"x":0,"y":0,"w":764,"h":628},
        "sourceSize": {"w":764,"h":628}
    },
    "2":
    {
        "frame": {"x":1528,"y":0,"w":764,"h":628},
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": {"x":0,"y":0,"w":764,"h":628},
        "sourceSize": {"w":764,"h":628}
    },
    "3":
    {
        "frame": {"x":2292,"y":0,"w":764,"h":628},
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": {"x":0,"y":0,"w":764,"h":628},
        "sourceSize": {"w":764,"h":628}
    },
    "4":
    {
        "frame": {"x":3056,"y":0,"w":764,"h":628},
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": {"x":0,"y":0,"w":764,"h":628},
        "sourceSize": {"w":764,"h":628}
    },
    "5":
    {
        "frame": {"x":0,"y":628,"w":764,"h":628},
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": {"x":0,"y":0,"w":764,"h":628},
        "sourceSize": {"w":764,"h":628}
    },
    "6":
    {
        "frame": {"x":764,"y":628,"w":764,"h":628},
        "rotated": false,
        "trimmed": false,
        "skippable": true,
        "spriteSourceSize": {"x":0,"y":0,"w":764,"h":628},
        "sourceSize": {"w":764,"h":628},
        "skippable":true
    },
    "7":
    {
        "frame": {"x":1528,"y":628,"w":764,"h":628},
        "rotated": false,
        "trimmed": false,
        "skippable": true,
        "spriteSourceSize": {"x":0,"y":0,"w":764,"h":628},
        "sourceSize": {"w":764,"h":628},
        "skippable":true
    },
    "8":
    {
        "frame": {"x":2292,"y":628,"w":764,"h":628},
        "rotated": false,
        "trimmed": false,
        "skippable": true,
        "spriteSourceSize": {"x":0,"y":0,"w":764,"h":628},
        "sourceSize": {"w":764,"h":628},
        "skippable":true
    },
    "9":
    {
        "frame": {"x":3056,"y":628,"w":764,"h":628},
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": {"x":0,"y":0,"w":764,"h":628},
        "sourceSize": {"w":764,"h":628}
    },
    "10":
    {
        "frame": {"x":0,"y":1256,"w":764,"h":628},
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": {"x":0,"y":0,"w":764,"h":628},
        "sourceSize": {"w":764,"h":628}
    },
    "11":
    {
        "frame": {"x":764,"y":1256,"w":764,"h":628},
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": {"x":0,"y":0,"w":764,"h":628},
        "sourceSize": {"w":764,"h":628}
    },
    "12":
    {
        "frame": {"x":1528,"y":1256,"w":764,"h":628},
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": {"x":0,"y":0,"w":764,"h":628},
        "sourceSize": {"w":764,"h":628}
    },
    "13":
    {
        "frame": {"x":2292,"y":1256,"w":764,"h":628},
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": {"x":0,"y":0,"w":764,"h":628},
        "sourceSize": {"w":764,"h":628}
    },
    "14":
    {
        "frame": {"x":3056,"y":1256,"w":764,"h":628},
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": {"x":0,"y":0,"w":764,"h":628},
        "sourceSize": {"w":764,"h":628}
    }},
    "meta": {
        "app": "Adobe Animate",
        "version": "23.0.1.70",
        "image": "sword_updated.png",
        "format": "RGBA8888",
        "size": {"w":4096,"h":2048},
        "scale": "1"
    }
    }));


swordSprite.image = new Image();
swordSprite.image.src = swordSprite.meta.image;
swordSprite.offSetWidth = 0+CANVAS_WIDTH*0.1;
swordSprite.offSetHeight = 0+CANVAS_HEIGHT*0.15;


const player = {
    sprite: swordSprite,
    currentFrame: 7,
    destination: { left: 0, right:14, neutral:7},
    skipFrames: false,
    framesToSkip: [5,6,7,8,9],
    frameIncrement: 1,
    lastInput: 'none',
    input: 'none',
    newInputDelayFrames: 0
}

function drawFromFrame(sprite,frameNumber){
    const frame = sprite.frames[frameNumber];
    ctx.drawImage(sprite.image, frame.frame.x, frame.frame.y, 
        frame.frame.w, frame.frame.h,
        sprite.offSetWidth, sprite.offSetHeight,
        frame.sourceSize.w, frame.sourceSize.h);
}




function updatePlayerAnimation(){
    
    player.input = parsePlayerInput(player.lastInput);

    if (player.newInputDelayFrames > 0){
        player.input = player.lastInput
        player.newInputDelayFrames -= 1;
    }
    if (player.input !== player.lastInput){
        player.newInputDelayFrames = 3;
    }
    player.lastInput = player.input;
       

    switch (player.input){
        case 'd': {
            destination = 14;
            break;
        }
        case 'a': {
            destination = 0;
            break
        }
        default: { destination = player.destination.neutral };
    }
    let frameDifference = destination-player.currentFrame
    player.frameIncrement = Math.sign(frameDifference)
    player.skipFrames = 
        player.framesToSkip.includes(destination) || player.framesToSkip.includes(player.currentFrame)
        ? false
        : true

    if ((player.currentFrame !== 15 && player.currentFrame !== -1) && frameDifference !== 0){
    
        player.currentFrame += player.frameIncrement;
        while (player.skipFrames){
            if (player.framesToSkip.includes(player.currentFrame)) player.currentFrame += player.frameIncrement;
            else break;
        }
    }
    
    console.log(player.currentFrame)

}

function parsePlayerInput(lastInput){
    let inputCandidate = 'none';
    if (keyRecord.d.pressed) inputCandidate = 'd'
    if (keyRecord.a.pressed) inputCandidate = 'a'
    let input = lastInput === 'none' || !keyRecord[lastInput].pressed ? 
            inputCandidate : lastInput;
    return input;
}

function animate(timestamp){

    //calculate game frames due per real canvas frame ()
    frameTime = timestamp - lastTimeStamp;
    lastTimeStamp = timestamp;
    frameTimeDeficit += frameTime;
    const framesDue = Math.floor(frameTimeDeficit/FRAME_RATE);
    frameTimeDeficit = frameTimeDeficit % FRAME_RATE;
    
    for (let i = 0; i < framesDue; i++){
        //update game state here
        ctx.clearRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
        

        updatePlayerAnimation(player)
        drawFromFrame(player.sprite, player.currentFrame);
        
        timerGame ++;
        document.getElementById("game_timer").innerHTML = timerGame;
    }
    
    timerNative++;
    
    if (frameTime > worstFrameTime && loaded) worstFrameTime = Math.floor(frameTime*1000)/1000;

    document.getElementById("game_label").innerHTML = `game frames (${FRAME_RATE}ms, ${Math.floor(1000/FRAME_RATE)}fps): `
    document.getElementById("native_label").innerHTML = 
        `real frames (${Math.floor(frameTime*1000)/1000}ms,
         ${Math.floor(1000/frameTime)}fps)
         average: ${Math.floor((timerNative/timerGame)*1000/FRAME_RATE)}fps:`;
    document.getElementById("native_timer").innerHTML = Math.floor(timerNative);
    
    
    requestAnimationFrame(animate);  
}

animate(0);
