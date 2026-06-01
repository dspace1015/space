const mainCanvas = document.getElementById("MainCanvas");
const screen = mainCanvas.getContext("2d");
mainCanvas.border = 0.0;
screen.setTransform(1,0,0,-1,screen.canvas.width/2,screen.canvas.height/2);
function resizeWindow(){
    mainCanvas.width = document.documentElement.clientWidth;
    mainCanvas.height = document.documentElement.clientHeight;
    screen.setTransform(1,0,0,-1,screen.canvas.width/2,screen.canvas.height/2);
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

function Mvec(v,M){
    //Returns the vector result of matrix M*v with v as a column vec
    //where matrix M is defined by indecies in M:
    //[[0,3,6],
    // [1,4,7],
    // [2,5,8]]
    return [M[0]*v[0]+M[3]*v[1]+M[6]*v[2],
            M[1]*v[0]+M[4]*v[1]+M[7]*v[2],
            M[2]*v[0]+M[5]*v[1]+M[8]*v[2]];
};
function RotM(axis,theta){
    //returns rotation matrix for rotating around axis by theta degrees
    var ang = theta*Math.PI/180;
    var c = Math.cos(ang);
    var s = Math.sin(ang);

};
function proj3d(v){
    //projects 3d point v to a point onscren
    var vrel = Mvec([v[0]-camX,v[1]-camY,v[2]-camZ],camM);
    return [screen.canvas.height/2*Math.tan(Math.PI*camFOV/360)*vrel[1]/vrel[0],screen.canvas.height/2*Math.tan(Math.PI*camFOV/360)*vrel[2]/vrel[0]];
};
var camX = 0;
var camY = 0;
var camZ = 0;
var camM = [1,0,0,0,1,0,0,0,1];
var camFOV = 70;

resizeWindow();
fillScreen("Black");
setColor("orange");
drawline(50,50,100,100,2);
setColor("#0c8dcf");
drawCircle(150,150,10,2,true);

