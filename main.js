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
function addvec(v1,v2){
    return [v1[0]+v2[0],v1[1]+v2[1],v1[2]+v2[2]];
}
function RotM(axis,theta){
    //returns rotation matrix for rotating around axis by theta degrees
    var ang = theta*Math.PI/180;
    var c = Math.cos(ang);
    var s = Math.sin(ang);
    if(axis =="x"){
        return [1,0,0,0,c,-s,0,s,c];
    }else if(axis =="y"){
        return [c,0,s,0,1,0,-s,0,c];
    }else{
        return [c,-s,0,s,c,0,0,0,1];
    }
};
function MtimesM(M1,M2){
    //Matrix multiply M2*M1
    v1 = Mvec([M1[0],M1[1],M1[2]],M2);
    v2 = Mvec([M1[3],M1[4],M1[5]],M2);
    v3 = Mvec([M1[6],M1[7],M1[8]],M2);
    return [v1[0],v1[1],v1[2],v2[0],v2[1],v2[2],v3[0],v3[1],v3[2]];
}
function proj3d(v){
    //projects 3d point v to a point onscren
    var vrel = Mvec([v[0]-camV[0],v[1]-camV[1],v[2]-camV[2]],camM);
    return [-screen.canvas.height/(2*Math.tan(Math.PI*camFOV/360))*vrel[1]/vrel[0],screen.canvas.height/(2*Math.tan(Math.PI*camFOV/360))*vrel[2]/vrel[0]];
};
function depth3d(v){
    var vrel = Mvec([v[0]-camV[0],v[1]-camV[1],v[2]-camV[2]],camM);
    var dist = Math.sqrt(Math.pow(vrel[0],2)+Math.pow(vrel[1],2)+Math.pow(vrel[2],2));
    if(vrel[0]>0){
        return dist;
    }else{
        return -dist;
    }
}
function drawline3d(v1,v2,width){
    if(depth3d(v1)>0 && depth3d(v2)>0){
        var p1 = proj3d(v1);
        var p2 = proj3d(v2);
        drawline(p1[0],p1[1],p2[0],p2[1],screen.canvas.height/Math.tan(camFOV*Math.PI/360)*width/(depth3d(v1)+depth3d(v2)));
    }
}
var currentT = 0;
var T = 0;
var Told = 0;
var dt = 0;
var camV = [-3,0,0];
var camM = [1,0,0,0,1,0,0,0,1];
var camP = 0;
var camY = 0;
camM = MtimesM(camM,RotM("z",-105));
camM = MtimesM(camM,RotM("y",25));
camV = [-3*camM[0],-3*camM[3],-3*camM[6]];
var camFOV = 90;
var pressedKeys = {};
window.onkeyup = function(e){pressedKeys[e.keyCode] = false;}
window.onkeydown = function(e) {pressedKeys[e.keyCode] = true;}

resizeWindow();
fillScreen("Black");
setColor("orange");
drawline(50,50,100,100,2);
setColor("#0c8dcf");
drawCircle(150,150,10,2,true);

function mainLoop(){
    //time handling
    Told = currentT;
    currentT = new Date().getTime()/1000;
    dt = currentT - Told; // deltatime
    T = currentT;
    requestAnimationFrame(mainLoop);
    if(pressedKeys[65]){
        camY += 90*dt;
    }
    if(pressedKeys[68]){
        camY -= 90*dt;
    }
    if(pressedKeys[83]){
        camP -= 90*dt;
    }
    if(pressedKeys[87]){
        camP += 90*dt;
    }
    camM = [1,0,0,0,1,0,0,0,1];
    camM = MtimesM(camM,RotM("z",camY));
    camM = MtimesM(camM,RotM("y",camP));
    camV = [-3*camM[0],-3*camM[3],-3*camM[6]];
    resizeWindow();
    fillScreen("#000000");
    setColor("#0000ff");
    drawline3d([0,0,0],[0,0,1],0.1);
    setColor("#00ff00");
    drawline3d([0,0,0],[0,1,0],0.1);
    setColor("#ff0000");
    drawline3d([0,0,0],[1,0,0],0.1);
};

function initLoop(){
    currentT = new Date().getTime/1000;
    Told = T;
    requestAnimationFrame(mainLoop);
};
requestAnimationFrame(initLoop);