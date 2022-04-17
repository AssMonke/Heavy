var mbe = document.getElementById("mbe");
var mbeLabel = document.getElementById("mbeLabel");
var back_button = document.getElementById("back");

var shoot_button = document.getElementById("shoot");
var store_button = document.getElementById("store");
var exit_button = document.getElementById("exit");

var isChangingKey = false;
var currentKey = null;
var canChangeKey = true; //to avoid errors with space triggering the button press

var shootKey = null;
var storeKey = null;
var exitKey = null;

chrome.storage.sync.get(['shoot'], function(result) 
{
    shootKey = result.shoot[0];
    shoot_button.innerHTML = result.shoot[1];
});
chrome.storage.sync.get(['store'], function(result) 
{
    storeKey = result.store[0];
    store_button.innerHTML = result.store[1];
});
chrome.storage.sync.get(['exit'], function(result) 
{
    exitKey = result.exit[0];
    exit_button.innerHTML = result.exit[1];
});

chrome.storage.sync.get(['mbe'], function(result) 
{
    mbe.value = result.mbe;
    mbeLabel.innerHTML = "Max Blood Effects: " + mbe.value;
});

back_button.onclick = () => 
{
    chrome.storage.sync.set({mbe: mbe.value});

    window.location.href = "/game/index.html";
}

mbe.oninput = () => mbeLabel.innerHTML = "Max Blood Effects: " + mbe.value;

// controls

shoot_button.onclick = async function() 
{
    if(isChangingKey || !canChangeKey){ return; }
    
    let og = shoot_button.innerHTML;
    shoot_button.innerHTML = "---";
    isChangingKey = true;

    await new Promise((resolve, reject) => 
    {
        let t = setTimeout(() => {
            shoot_button.innerHTML = og;
            isChangingKey = false;
            reject();
        }, 5000); //auto reject after 5 secs if user doesn't submit a key
        let i = setInterval(() => {
            if(currentKey != null){
                clearInterval(i);
                clearTimeout(t);

                canChangeKey = false;
                setTimeout(() => canChangeKey = true, 500)

                shoot_button.innerHTML = currentKey[1];

                chrome.storage.sync.set({shoot: currentKey});

                currentKey = null;
            }
        }, 10);
        resolve();
    });
}
store_button.onclick = async function() 
{
    if(isChangingKey || !canChangeKey){ return; }
    
    let og = store_button.innerHTML;
    store_button.innerHTML = "---";
    isChangingKey = true;

    await new Promise((resolve, reject) => 
    {
        let t = setTimeout(() => {
            store_button.innerHTML = og;
            isChangingKey = false;
            reject();
        }, 5000); //auto reject after 5 secs if user doesn't submit a key
        let i = setInterval(() => {
            if(currentKey != null){
                clearInterval(i);
                clearTimeout(t);

                canChangeKey = false;
                setTimeout(() => canChangeKey = true, 500)

                store_button.innerHTML = currentKey[1];

                chrome.storage.sync.set({store: currentKey});

                currentKey = null;
            }
        }, 10);
        resolve();
    });
}
exit_button.onclick = async function() 
{
    if(isChangingKey || !canChangeKey){ return; }
    
    let og = exit_button.innerHTML;
    exit_button.innerHTML = "---";
    isChangingKey = true;

    await new Promise((resolve, reject) => 
    {
        let t = setTimeout(() => {
            exit_button.innerHTML = og;
            isChangingKey = false;
            reject();
        }, 5000); //auto reject after 5 secs if user doesn't submit a key
        let i = setInterval(() => {
            if(currentKey != null){
                clearInterval(i);
                clearTimeout(t);

                canChangeKey = false;
                setTimeout(() => canChangeKey = true, 500)

                exit_button.innerHTML = currentKey[1];

                chrome.storage.sync.set({exit: currentKey});

                currentKey = null;
            }
        }, 10);
        resolve();
    });
}

document.addEventListener('keydown', (e) => 
{
    if(!isChangingKey){ return; }

    currentKey = [e.keyCode, e.keyCode == 32 ? "space" : e.key];
    isChangingKey = false;
});