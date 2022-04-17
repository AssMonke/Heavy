const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const minigun_audio = document.getElementById("minigun");
const stopMinigun_audio = document.getElementById("stopMinigun");
const flamethrower_audio = document.getElementById("flamethrower");
const stopFlamethrower_audio = document.getElementById("stopFlamethrower");

const scattergun_audio = document.getElementById("scattergun");
const scream_audio = document.getElementById("scream");
const lifeLost_audio = document.getElementById("lifeLost");
const buy_audio = document.getElementById("buy");

canvas.width = "600"
canvas.height = "600"

const renderRate = 20;
const bloodPool = document.getElementById("bloodPool");
const playerSize = 70;
const moveSpeed = 4;
const bulletSpeed = 10;
const enemeyMoveSpeed = 0.01;
const enemeyFireRate = 70;
const enemyBulletSpeed = 10;
const maxEnemies = 3;
var maxBloodEffects = 25;
const enemyRef = document.getElementById("scout");

chrome.storage.sync.get(['mbe'], function(result) 
{
    console.log(result.mbe);
    
    if(result.mbe == undefined)
    {
        chrome.storage.sync.set({mbe: 25});
        return;
    }

    maxBloodEffects = result.mbe;
});

var shootKey = 32;
var storeKey = 69;
var exitKey = 88;
chrome.storage.sync.get(['shoot'], function(result) 
{
    if(result.shoot == undefined)
    {
        chrome.storage.sync.set({shoot: [32, "space"]});
        return;
    }
    
    shootKey = result.shoot[0];
});
chrome.storage.sync.get(['store'], function(result) 
{
    if(result.store == undefined)
    {
        chrome.storage.sync.set({store: [69, "e"]});
        return;
    }
    
    storeKey = result.store[0];
});
chrome.storage.sync.get(['exit'], function(result) 
{
    if(result.exit == undefined)
    {
        chrome.storage.sync.set({exit: [88, "x"]});
        return;
    }
    
    exitKey = result.exit[0];
});

var player = new Image(document.getElementById("heavy"), 300, 400, playerSize, playerSize, 0);
const upgradeStand = new Image(document.getElementById("upgradeStand"), 300, 300, 50, 50, 0);

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

var currentShootSounds = [minigun_audio, stopMinigun_audio];

var playerBullets = [];
var currentBullet = null;
var enemyBullets = [];
var enemies = [];
var blood = [];
var canShoot = true;
var timer = 0;
var score = 0;
var money = 0;
var currentSpeed = moveSpeed;
var isPlayingMinigun = false;
var isUpgrading = false;
var isGameOver = false;
var bulletLifetime = 1000;
var fireRate = 150;
var bulletCollider = 20;
var shootingSpeed = 2;
var currentUpgradeTimer = 0;
var lives = 2;
var hearts = [ new Image(document.getElementById("life"), 40, 40, 40, 40, 0), new Image(document.getElementById("life"), 80, 40, 40, 40, 0)]
var hasUpgraded = false;

chrome.storage.sync.get(['highscore'], function(result) 
{
    if(result.highscore == undefined)
    {
        chrome.storage.sync.set({highscore: 0});
    }
});

var buyButton = {
    x:200,
    y:500,
    width:200,
    height:50
};

var unlockableCharacters = 
[
    {
        name: "Pyro",

        cost: 999,

        image: new Image(document.getElementById("pyro"), 0, 0, playerSize, playerSize, 0),

        preview: new Image(document.getElementById("pyroPreview"), 160, 170, 350, 350, 0),

        buy: () => {  
            player.ref = document.getElementById("pyro");
            currentShootSounds[0] = flamethrower_audio;
            currentShootSounds[1] = stopFlamethrower_audio;
            currentBullet = new Image(document.getElementById("flame"), 0, 0, 50, 50, 0);
            fireRate = 50;
            bulletCollider = 50;
            bulletLifetime = 450;
            shootingSpeed = 3;
            currentUpgradeTimer = 500; // 1000 (miliseconds) / render rate
        }
    }
]

//Function to get the mouse position
function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}
//Function to check whether a point is inside a rectangle
function isInside(pos, rect){ return pos.x > rect.x && pos.x < rect.x+rect.width && pos.y < rect.y+rect.height && pos.y > rect.y }

canvas.addEventListener('click', function(evt) {
    var mousePos = getMousePos(canvas, evt);

    // GUI
    if (isInside(mousePos, retryButton) && isGameOver) {
        window.location.reload(true);
    }
    if (isInside(mousePos, settingsButton) && isGameOver) {
        window.location.href = "/settingsMenu/index.html";
    }
    
    if (isInside(mousePos, buyButton) && isUpgrading) {
        ctx.fillStyle = 'red';
        ctx.textAlign = "center";
        ctx.font = "40px Arial";
            
        if(hasUpgraded){ ctx.fillText("Upgrade Currently In Progress!", 300, 585); return;}
        if(money < unlockableCharacters[0].cost){ ctx.fillText("Not Enough Money!", 300, 585); return; }
        
        unlockableCharacters[0].buy();
        
        buy_audio.play();
        money -= unlockableCharacters[0].cost;
        unlockableCharacters[0].cost *= 4;
        ctx.fillStyle = 'red';
        ctx.font = "40px Arial";
        isUpgrading = false;
        hasUpgraded = true;
    }
}, false);

function Render()
{
    if(CheckDistance(upgradeStand, player, 100) && input[storeKey]){
        isUpgrading = true;
    }

    if(maxBloodEffects == 0){ blood.length = 0; }

    if(isUpgrading)
    { 
        currentShootSounds[0].pause();

        if(input[exitKey]){ isUpgrading = false; return; }

        let l = unlockableCharacters.length;

        for(let i = 0; i < l; i++)
        {
            ctx.fillStyle = 'red';
            ctx.font = "40px Arial";
            ctx.textAlign = "center";
            ctx.fillText("$" + unlockableCharacters[i].cost, 300, 100);
            ctx.fillRect(buyButton.x, buyButton.y, buyButton.width, buyButton.height);
            ctx.fillStyle = 'black';
            ctx.fillText("Buy " + unlockableCharacters[i].name, 300, 540);
            unlockableCharacters[i].preview.update();
        }
        
        return; 
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height); //clear
    timer++;

    if(currentUpgradeTimer != 0){
        currentUpgradeTimer--;

        ctx.fillStyle = 'red';
        ctx.font = "40px Arial";
        ctx.fillText((currentUpgradeTimer*renderRate)/1000 + "s", 300, 60);

        if(currentUpgradeTimer == 0){
            hasUpgraded = false;
            flamethrower_audio.pause();
            player.ref = document.getElementById("heavy");
            currentShootSounds[0] = minigun_audio;
            currentShootSounds[1] = stopMinigun_audio;
            currentBullet = null;
            fireRate = 150;
            bulletCollider = 20;
            bulletLifetime = 1000;
            shootingSpeed = 2;
        }
    }

    ctx.textAlign = "center";
    ctx.fillStyle = 'white';
    ctx.font = "30px Arial";
    ctx.fillText(score, 300, 30);
    ctx.fillText("$" + money, 500, 30);

    upgradeStand.update();

    let l = playerBullets.length;
    for(let i = 0; i < l; i++){ playerBullets[i].update(); }
    for(let i = 0; i < enemyBullets.length; i++)
    { 
        enemyBullets[i].update();
        if(CheckDistance(enemyBullets[i], player, 20) && !hasUpgraded){ 
            lives--;
            lifeLost_audio.play();
            hearts.pop();
            enemyBullets.splice(i, 1);
            if(lives < 1) { EndGame(); }
        }
    }
    l = hearts.length;
    for(let i = 0; i < l; i++){ hearts[i].update(); }
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
            if(CheckDistance(playerBullets[g], enemies[i], bulletCollider)){  
                let e = enemies[i];
                blood.push(new Image(bloodPool, e.x-25, e.y-25, 75, 75));

                blood.push(new ParticleExplosion(6, new Circle(e.x, e.y, 2, "#720505"), 2));
                setTimeout(() => { blood.pop(); }, 700);
                scream_audio.currentTime = 0;
                scream_audio.play();
                enemies.splice(i, 1);
                score += 20;
                money += 100;
                break;
            } 
        }
    }
    
    player.update();

    if((input[87] || input[38]) && player.y > 0) { player.y -= currentSpeed; }
    if((input[65] || input[37]) && player.x > 0) { player.x -= currentSpeed; }
    if((input[83] || input[40]) && player.y < canvas.height-playerSize) { player.y += currentSpeed; }
    if((input[68] || input[39]) && player.x < canvas.width-playerSize) { player.x += currentSpeed; }

    let dir = { x: mousePos.x - player.x, y: mousePos.y - player.y }
    player.angle = Math.PI - AngleTo(dir);
    if(input[shootKey]){ 
        currentSpeed = shootingSpeed;
        if(!isPlayingMinigun){ currentShootSounds[0].currentTime = 0; currentShootSounds[0].play(); isPlayingMinigun = true;}
        
        if(!canShoot){return;}
        ShootBullet(dir); 
        canShoot = false; 
        setTimeout(() => { canShoot = true; }, fireRate); 
        currentSpeed = shootingSpeed; 
        return;
    }
    currentSpeed = moveSpeed;
    currentShootSounds[0].pause();
    if(isPlayingMinigun){ currentShootSounds[1].play(); }
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
    if(currentBullet != null){
        bullet = currentBullet.copy();
        bullet.x = player.x;
        bullet.y = player.y;
        bullet.angle = player.angle;
    }

    bullet.vX = direction.x * bulletSpeed;
    bullet.vY = direction.y * bulletSpeed;
    playerBullets.push(bullet);
    setTimeout(() => { playerBullets.shift(); }, bulletLifetime);
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
    let enemey = new Image(enemyRef, (-600 * RandomInt(0, 2)) + RandomInt(450, 600), (-600 * RandomInt(0, 2)) + RandomInt(450, 600), playerSize, playerSize, Math.PI);
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

    this.targetTime = timer+enemeyFireRate; // Specific to Enemy

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

    this.copy = function() { return new Image(ref, x, y, w, h, angle) }
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
var settingsButton = {
    x:200,
    y:300,
    width:200,
    height:50
};
function EndGame()
{
    clearInterval(updateLoop);
    currentShootSounds[0].pause();

    isGameOver = true;

    ctx.textAlign = "center";

    ctx.fillStyle = 'red';
    ctx.font = "50px Arial";
    ctx.fillText("Game Over!", 300, 200);

    ctx.fillRect(retryButton.x, retryButton.y, retryButton.width, retryButton.height);
    ctx.fillStyle = 'black';
    ctx.font = "50px Arial";
    ctx.fillText("Retry", 300, 265);

    ctx.fillStyle = 'red';
    ctx.fillRect(settingsButton.x, settingsButton.y, settingsButton.width, settingsButton.height);
    ctx.fillStyle = 'black';
    ctx.font = "50px Arial";
    ctx.fillText("Settings", 300, 340);

    chrome.storage.sync.get(['highscore'], function(result) 
    {
        if(result.highscore < score)
        {
            chrome.storage.sync.set({highscore: score}, function() 
            {
                ctx.fillStyle = 'red';
                ctx.font = "50px Arial";
                ctx.fillText("New High Score is " + score + "!", 300, 400);
            });
        }
        else
        {
            ctx.fillStyle = 'red';
            ctx.font = "50px Arial";
            ctx.fillText("High Score is " + result.highscore, 300, 400);
        }
    });
}