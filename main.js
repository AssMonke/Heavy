const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const minigun_audio = document.getElementById("minigun");
const stopMinigun_audio = document.getElementById("stopMinigun");
const scattergun_audio = document.getElementById("scattergun");
const scream_audio = document.getElementById("scream");

canvas.width = "600"
canvas.height = "600"

const renderRate = 20;
const bloodPool = document.getElementById("bloodPool");
const playerSize = 70;
const fireRate = 150;
const moveSpeed = 4;
const shootingSpeed = 2;
const bulletSpeed = 10;
const enemeyMoveSpeed = 0.01;
const enemeyFireRate = 70;
const enemyBulletSpeed = 10;
const maxEnemies = 3;
const maxBloodEffects = 50;
const enemyRefs = 
[
    {ref: document.getElementById("scout"), scale: 80}
];

var player = new Image(document.getElementById("heavy"), 300, 300, playerSize, playerSize, 0);

var input = [];
var handleInput = (event) => { input[event.keyCode] = event.type == 'keydown'; }
document.addEventListener('keydown', handleInput);
document.addEventListener('keyup', handleInput);
var mousePos = { x: 0, y: 0 }
document.addEventListener('mousemove', (event) => 
{
    mousePos.x = event.x;
    mousePos.y = event.y;
});

var playerBullets = [];
var enemyBullets = [];
var enemies = [];
var blood = [];
var canShoot = true;
var timer = 0;
var score = 0;
var currentSpeed = moveSpeed;
var isPlayingMinigun = false;

chrome.storage.sync.get(['highscore'], function(result) 
{
    if(result.highscore == undefined)
    {
        chrome.storage.sync.set({highscore: 0});
    }
});

function Render()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height); //clear
    timer++;

    ctx.textAlign = "center";
    ctx.fillStyle = 'white';
    ctx.font = "30px Arial";
    ctx.fillText(score, 300, 30);

    let l = playerBullets.length;
    for(let i = 0; i < l; i++){ playerBullets[i].update(); }
    l = enemyBullets.length;
    for(let i = 0; i < l; i++)
    { 
        enemyBullets[i].update();

        if(CheckDistance(enemyBullets[i], player, 20)){ EndGame(); }
    }
    l = blood.length;
    for(let i = 0; i < l; i++){ blood[i].update(); }
    if(blood.length > maxBloodEffects){ blood.shift(); }
    if(enemies.length < maxEnemies) { SpawnEnemy(); }
    for(let i = 0; i < enemies.length; i++)
    { 
        enemies[i].update();
        let dir = { x: player.x - enemies[i].x, y: player.y - enemies[i].y }
        enemies[i].vX = dir.x * enemeyMoveSpeed;
        enemies[i].vY = dir.y * enemeyMoveSpeed;
        enemies[i].angle = Math.PI - AngleTo(dir);

        if(enemies[i].targetTime < timer){ ShootEnemyBullet(dir, enemies[i]); enemies[i].targetTime = timer+enemeyFireRate}

        for(let  g = 0; g < playerBullets.length; g++){ 
            if(CheckDistance(playerBullets[g], enemies[i], 20)){  
                let e = enemies[i];
                blood.push(new Image(bloodPool, e.x-25, e.y-25, 150, 150));

                blood.push(new ParticleExplosion(6, new Circle(e.x, e.y, 2, "#720505"), 2));
                setTimeout(() => { blood.pop(); }, 500);
                scream_audio.currentTime = 0;
                scream_audio.play();
                enemies.splice(i, 1);
                score += 20;
                break;
            } 
        }
    }
    
    player.update();

    if(input[87] && player.y > 0) { player.y -= currentSpeed; }
    if(input[65] && player.x > 0) { player.x -= currentSpeed; }
    if(input[83] && player.y < canvas.height-playerSize) { player.y += currentSpeed; }
    if(input[68] && player.x < canvas.width-playerSize) { player.x += currentSpeed; }

    let dir = { x: mousePos.x - player.x, y: mousePos.y - player.y }
    player.angle = Math.PI - AngleTo(dir);
    if(input[32])
    { 
        currentSpeed = shootingSpeed;
        if(!isPlayingMinigun){ minigun_audio.currentTime = 0; minigun_audio.play(); isPlayingMinigun = true;}
        
        if(!canShoot){return;}
        ShootBullet(dir); 
        canShoot = false; 
        setTimeout(() => { canShoot = true; }, fireRate); 
        currentSpeed = shootingSpeed; 
        return;
    }
    currentSpeed = moveSpeed;
    minigun_audio.pause();
    if(isPlayingMinigun){ stopMinigun_audio.play(); }
    isPlayingMinigun = false;
}
var updateLoop = window.setInterval(Render, renderRate);

function AngleTo(dir)
{
    let magnitude = Math.sqrt((dir.x * dir.x) + (dir.y * dir.y))
    dir.x /= magnitude;
    dir.y /= magnitude;

    return Math.atan2(dir.x, dir.y)
}

function ShootBullet(direction)
{
    let bullet = new Rect(player.x, player.y, 5, 5, "yellow");
    bullet.vX = direction.x * bulletSpeed;
    bullet.vY = direction.y * bulletSpeed;
    playerBullets.push(bullet);
    setTimeout(() => { playerBullets.shift(); }, 1000);
}
function ShootEnemyBullet(direction, position)
{
    scattergun_audio.currentTime = 0;
    scattergun_audio.play();
    let bullet = new Rect(position.x, position.y, 7, 7, "red");
    bullet.vX = direction.x * enemyBulletSpeed;
    bullet.vY = direction.y * enemyBulletSpeed;
    enemyBullets.push(bullet);
    setTimeout(() => { enemyBullets.shift(); }, 1000);
}

function SpawnEnemy()
{
    let i = enemyRefs[Math.floor(Math.random() * enemyRefs.length)];
    let enemey = new Image(i.ref, (-600 * RandomInt(0, 2)) + RandomInt(450, 600), (-600 * RandomInt(0, 2)) + RandomInt(450, 600), i.scale, i.scale, Math.PI);
    enemies.push(enemey);
}

function CheckDistance(e1, e2, thresh)
{
    let e1X = e1.x + (e1.w/2);
    let e1Y = e1.y + (e1.h/2);
    
    let x = Math.abs(e2.x - e1X);
    let y = Math.abs(e2.y - e1Y);
    return x < thresh && y < thresh;
}

function Image(ref, x, y, w, h, angle)
{
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.angle = angle;
    this.ref = ref;

    this.vX = 0; // Velocity
    this.vY = 0;

    this.targetTime = timer+enemeyFireRate;//specific to enemy

    this.update = function update()
    {
        this.x += this.vX;
        this.y += this.vY;
        
        ctx.translate(this.x, this.y);

        ctx.rotate(this.angle);

        ctx.drawImage(this.ref, -playerSize/2, -playerSize/2, this.w, this.h);

        ctx.rotate(-this.angle);

        ctx.translate(-this.x, -this.y);
    }
}

function Rect(x, y, w, h, color)
{
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;

    this.vX = 0; // Velocity
    this.vY = 0;

    this.update = function()
    {
        this.x += this.vX;
        this.y += this.vY;

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}

function ParticleExplosion(amount, shape, speed)
{
    this.amount = amount;
    this.shape = shape;
    this.speed = speed;
    
    this.shapes = [];

    for(let i = 0; i < this.amount; i++){
        this.shapes.push(this.shape.copy());
    }
    
    this.update = function()
    {
        let l = this.shapes.length;
        for(let i = 0; i < l; i++)
        {
            this.shapes[i].vX = Math.cos(i) * this.speed;
            this.shapes[i].vY = Math.sin(i) * this.speed;
            this.shapes[i].update();
        }
    }
}

function Circle(x, y, r, color)
{
    this.x = x;
    this.y = y;
    this.r = r;
    this.color = color;

    this.vX = 0; // Velocity
    this.vY = 0;

    this.isPickedUp = false; // specific to the flag
    
    this.update = function()
    {
        this.x += this.vX;
        this.y += this.vY;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    this.copy = function() { return new Circle(x, y, r, color) }
}

function RandomInt(min, max) 
{
    return Math.floor(Math.random() * (max - min) ) + min;
}

var retryButton = {
    x:200,
    y:225,
    width:200,
    height:50
};
function EndGame()
{
    clearInterval(updateLoop);
    minigun_audio.pause();

    ctx.fillStyle = 'red';
    ctx.font = "50px Arial";
    ctx.fillText("Game Over!", 300, 200);

    ctx.fillRect(retryButton.x, retryButton.y, retryButton.width, retryButton.height);
    ctx.fillStyle = 'black';
    ctx.font = "50px Arial";
    ctx.fillText("Retry", 300, 265);

    chrome.storage.sync.get(['highscore'], function(result) 
    {
        if(result.highscore < score)
        {
            chrome.storage.sync.set({highscore: score}, function() 
            {
                ctx.fillStyle = 'red';
                ctx.font = "50px Arial";
                ctx.fillText("New High Score is " + score + "!", 300, 320);
            });
        }
        else
        {
            ctx.fillStyle = 'red';
            ctx.font = "50px Arial";
            ctx.fillText("High Score is " + result.highscore, 300, 320);
        }
    });
}

//Function to get the mouse position
function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}
//Function to check whether a point is inside a rectangle
function isInside(pos, rect){
    return pos.x > rect.x && pos.x < rect.x+rect.width && pos.y < rect.y+rect.height && pos.y > rect.y
}

canvas.addEventListener('click', function(evt) {
    var mousePos = getMousePos(canvas, evt);

    if (isInside(mousePos, retryButton)) {
        window.location.reload(true);
    }
}, false);