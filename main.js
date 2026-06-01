const mainCanvas = document.getElementById("MainCanvas");
const screen = mainCanvas.getContext("2d");
mainCanvas.border = 0.0;
screen.setTransform(1,0,0,-1,screen.canvas.width/2,screen.canvas.height/2);
function resizeWindow(){
    mainCanvas.width = document.documentElement.clientWidth;
    mainCanvas.height = document.documentElement.clientHeight;
};
function drawline(x0,y0,x1,y1,width){
    screen.lineWidth = width;
    screen.beginPath();
    screen.moveTo(x0,y0);
    screen.lineTo(x1,y1);
    screen.stroke();
};
function drawCircle(cx,cy,r,width,fill){
    if(fill){
        screen.fillStyle = screen.strokeStyle;
    };
    screen.beginPath();
    screen.ellipse(cx,cy,r,r,0,0,2*Math.PI);
    screen.closePath();
    if(fill){
        screen.fill();
    };
    screen.stroke();
};
function fillScreen(color){
    screen.setTransform(1,0,0,1,0,0);
    setColor(color);
    screen.beginPath;
    screen.rect(0,0,screen.canvas.width,screen.canvas.height);
    screen.fill();
    screen.setTransform(1,0,0,-1,screen.canvas.width/2,screen.canvas.height/2);
};
function setColor(color){
    screen.strokeStyle = color;
};
function proj3D(x,y,z){

}
var camX = 0;
var camY = 0;
var camZ = 0;
var camFOV = 0;

resizeWindow();
fillScreen("Black");
setColor("orange");
drawline(50,50,100,100,2);
setColor("#0c8dcf");
drawCircle(150,150,10,2,true);

