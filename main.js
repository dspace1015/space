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
        return [1,0,0,0,c,s,0,-s,c];
    }else if(axis =="y"){
        return [c,0,-s,0,1,0,s,0,c];
    }else{
        return [c,s,0,-s,c,0,0,0,1];
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
        if(width>0){
            var w = screen.canvas.height/Math.tan(camFOV*Math.PI/360)*width/(depth3d(v1)+depth3d(v2));
        }else{
            var w = -width;
        }
        drawline(p1[0],p1[1],p2[0],p2[1],w);
    }
}
function drawsphere3d(v,r){
    if(depth3d(v)>0){
        p = proj3d(v);
        drawCircle(p[0],p[1],0.5*r/depth3d(v)*screen.canvas.height/Math.tan(camFOV*Math.PI/360),0,true);
    }
}
function drawGrid(vertSteps,horSteps,M){
    var u = 0;
    while(u<2*Math.PI){
        var v = 0;
        while(v<Math.PI){
            var p1 = [Math.cos(u)*Math.sin(v),Math.sin(u)*Math.sin(v),Math.cos(v)];
            var p2 = [Math.cos(u+2*Math.PI/horSteps)*Math.sin(v),Math.sin(u+2*Math.PI/horSteps)*Math.sin(v),Math.cos(v)];
            var p3 = [Math.cos(u)*Math.sin(v+Math.PI/vertSteps),Math.sin(u)*Math.sin(v+Math.PI/vertSteps),Math.cos(v+Math.PI/vertSteps)];
            p1 = Mvec(p1,M);
            p2 = Mvec(p2,M);
            p3 = Mvec(p3,M);
            p1 = addvec(p1,camV);
            p2 = addvec(p2,camV);
            p3 = addvec(p3,camV);
            drawline3d(p1,p2,-1);
            drawline3d(p1,p3,-1);
            v += Math.PI/vertSteps;
        }
        u += 2*Math.PI/horSteps;
    }
}
function orbit2xyz(a,e,i,L,w,v,vP){
    //a-semimajoraxis,e-eccentricity,i-inclination,L-longitude of ascending node,w-arg of peri,v-true anomaly
    //vP is position of object orbit is centered around
    var v = [Math.cos(v*Math.PI/180)*a*(1-e*e)/(1+e*Math.cos(v*Math.PI/180)),Math.sin(v*Math.PI/180)*a*(1-e*e)/(1+e*Math.cos(v*Math.PI/180)),0]
    v = Mvec(v,RotM("z",w));
    v = Mvec(v,RotM("x",i));
    v = Mvec(v,RotM("z",L));
    v = addvec(v,vP);
    return v;
}
function meanAnom2TrueAnom(e,M){
    var M2 = M % 360;
    var E = (M2 + 180/Math.PI*e*Math.sin(Math.PI/180*M2));
    var i = 0;
    var dE = Infinity;
    while(i<1000 || Math.abs(dE)>1e-8){
        dE = (M2-(E - 180/Math.PI*e*Math.sin(Math.PI/180*E)))/(1-e*Math.cos(Math.PI/180*E));
        E += dE;
        i += 1;
    }
    return 360/Math.PI*Math.atan(Math.sqrt((1+e)/(1-e))*Math.tan(Math.PI/360*E));
}
function drawOrbit(a,e,i,L,w,vP,steps,width){
    var ang = 0;
    while(ang<360){
        p1 = orbit2xyz(a,e,i,L,w,ang,vP);
        p2 = orbit2xyz(a,e,i,L,w,ang+360/steps,vP);
        drawline3d(p1,p2,-width);
        ang += 360/steps;
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
var camD = 3;
camM = MtimesM(camM,RotM("z",-105));
camM = MtimesM(camM,RotM("y",25));
camV = [-2*camM[0],-2*camM[3],-2*camM[6]];
var camFOV = 90;
var pressedKeys = {};
var mouse = {x:0,y:0,d:false};
var mouseOld = {x:0,y:0,d:false};
window.onkeyup = function(e){pressedKeys[e.keyCode] = false;}
window.onkeydown = function(e) {pressedKeys[e.keyCode] = true;}
window.onmousemove = function(e){mouse.x = e.clientX, mouse.y = e.clientY};
window.onmouseup = function(e){mouse.d = false};
window.onmousedown = function(e){mouse.d = true};
window.ondrag = function(e){mouse.x = e.clientX, mouse.y = e.clientY};
window.onwheel = function(e){camD *= Math.exp(0.25*(e.deltaY/100))};

function UpdateBodies(){

}
function UpdateCamera(){
    //update camera
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
    if(mouseOld.d){
        camP += -270*(mouse.y-mouseOld.y)/screen.canvas.height;
        camY += 270*(mouse.x-mouseOld.x)/screen.canvas.height;
    }
    if(camP>90){
        camP = 90;
    }
    if(camP<-90){
        camP = -90;
    }
    camM = [1,0,0,0,1,0,0,0,1];
    camM = MtimesM(camM,RotM("z",camY));
    camM = MtimesM(camM,RotM("y",camP));
    camV = [-camD*camM[0],-camD*camM[3],-camD*camM[6]];
    //update old mouse values to compare for next frame:
    mouseOld.x = mouse.x;
    mouseOld.y = mouse.y;
    mouseOld.d = mouse.d;
}
function Render(){
    resizeWindow();
    fillScreen("#000000");
    fillScreen("#ffffff");
    drawGrid(12,24,RotM("x",0));
    setColor("#0000ff");
    drawline3d([0,0,0],[0,0,1],-3);
    setColor("#00ff00");
    drawline3d([0,0,0],[0,1,0],-3);
    setColor("#ff0000");
    drawline3d([0,0,0],[1,0,0],-3);
    setColor("#0080ff");
    drawOrbit(1,0.6,0,0,0,[0,0,0],120,3);
    var p = orbit2xyz(1,0.6,0,0,0,meanAnom2TrueAnom(0.6,45*T),[0,0,0])

    drawsphere3d(p,0.1);
}
function mainLoop(){
    //time handling
    Told = currentT;
    currentT = new Date().getTime()/1000;
    dt = currentT - Told; // deltatime
    T = currentT;
    requestAnimationFrame(mainLoop);
    UpdateCamera();
    Render();
}

function initLoop(){
    currentT = new Date().getTime/1000;
    Told = T;
    requestAnimationFrame(mainLoop);
};
requestAnimationFrame(initLoop);