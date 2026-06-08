const mainCanvas = document.getElementById("MainCanvas");
const screen = mainCanvas.getContext("2d");
mainCanvas.border = 0.0;
screen.setTransform(1,0,0,-1,screen.canvas.width/2,screen.canvas.height/2);
function resizeWindow(){
    mainCanvas.width = document.documentElement.clientWidth;
    mainCanvas.height = document.documentElement.clientHeight;
    screen.setTransform(1,0,0,-1,screen.canvas.width/2,screen.canvas.height/2);
};
function leadingzeros(x,y){
    var s = String((Math.round(x)));
    while(s.length<y){
        s = "0"+s;
    }
    return s;
}
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
function mod(x,y){
    return (x % y + y) % y;
}
function atan2(x,y){
    if(x<0){
        return 180/Math.PI*Math.atan(y/x)+180;
    }else if(x>0){
        return 180/Math.PI*Math.atan(y/x);
    }else if(x==0){
        if(y>0){
            return 90;
        }else if(y<0){
            return 270;
        }else{
            return 0;
        }
    }
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
        var p = proj3d(v);
        if(r>0){
        var r2 = 0.5*r/depth3d(v)*screen.canvas.height/Math.tan(camFOV*Math.PI/360);
        }else{
            r2 = -r;
        }
        drawCircle(p[0],p[1],r2,0,true);
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
function drawText(text,screenpos,Align,font){
    screen.setTransform(1,0,0,1,0,0);
    screen.fillStyle = screen.strokeStyle;
    screen.textBaseline = "top";
    screen.textAlign = Align;
    screen.font = font;
    screen.fillText(text,screenpos[0]+screen.canvas.width/2,screen.canvas.height/2-screenpos[1]);
    screen.setTransform(1,0,0,-1,screen.canvas.width/2,screen.canvas.height/2);
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
    while(i<1000 && Math.abs(dE)>1e-8){
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
function addObjectOrbit(a,e,i,L,w,M0,t0,Parent,P){
    var period = P;
    if(period == ""){
        period = 2*Math.PI*Math.sqrt(Math.pow(a,3)/1.32712440018e20);
    }
    orbitalParams.push({Parent:Parent,a:a,e:e,i:i,L:L,w:w,M0:M0,t0:t0,P:period});
    objectPos.push([0,0,0]);
}
function updateOrbit(id,a0,da,e0,de,i0,di,L0,dL,w0,dw,M0,dM,t0){
    var epoch = (T-t0);
    orbitalParams[id].a = (a0 + da*epoch);
    orbitalParams[id].e = e0 + de*epoch;
    orbitalParams[id].i = i0 + di*epoch;
    orbitalParams[id].L = L0 + dL*epoch;
    orbitalParams[id].w = w0 + dw*epoch;
    orbitalParams[id].M0 = M0;
    orbitalParams[id].P = 360/dM;
    orbitalParams[id].t0 = t0;
}
function addObject(name,R,color){
    objectNames.push(name);
    objectRadii.push(R);
    objectColor.push(color);
}
function updateObjectId(id){
    var orb = orbitalParams[id];
    var v = meanAnom2TrueAnom(orb.e,orb.M0+360*(T-orb.t0)/orb.P);
    if(orb.Parent == -1){
        var parentpos = [0,0,0];
    }else{
        var parentpos = objectPos[orb.Parent];
    }
    objectPos[id] = orbit2xyz(orb.a,orb.e,orb.i,orb.L,orb.w,v,parentpos);
}
var orbitalParams = [];
var objectPos = []
var objectNames = [];
var objectRadii = [];
var objectColor = [];
var currentT = 0.0;
var T = 0.0;
var TimeSpeed = 1;
var Told = 0.0;
var dt = 0;
var camV = [-3,0,0];
var camM = [1,0,0,0,1,0,0,0,1];
var camP = 0;
var camY = 0;
var camD = 1.4e11;
var drawOrbits = true;
camM = MtimesM(camM,RotM("z",-105));
camM = MtimesM(camM,RotM("y",25));
camV = [-2*camM[0],-2*camM[3],-2*camM[6]];
var camFOV = 70;
var pressedKeys = {};
var mouse = {x:0,y:0,d:false};
var mouseOld = {x:0,y:0,d:false};
var selectedBody = 0;
window.onkeyup = function(e){pressedKeys[e.keyCode] = false;if(e.keyCode == 79){drawOrbits = 1-drawOrbits;}}
window.onkeydown = function(e) {pressedKeys[e.keyCode] = true;if(e.keyCode == 68){selectedBody = mod((selectedBody + 1),objectNames.length)};if(e.keyCode == 65){selectedBody = mod((selectedBody - 1),objectNames.length)};if(e.keyCode == 191){TimeSpeed *= -1}}
window.onmousemove = function(e){mouse.x = e.clientX, mouse.y = e.clientY};
window.onmouseup = function(e){mouse.d = false};
window.onmousedown = function(e){mouse.d = true};
window.ondrag = function(e){mouse.x = e.clientX, mouse.y = e.clientY};
window.onwheel = function(e){camD *= Math.exp(0.25*(e.deltaY/100))};

function UpdateOrbits(){
    var AU = 149.598e9;
    var cenTosec = 36525*86400;
    var yrTosec = 365.25*86400;
    var J2000 = new Date(2000,0,1,12,0,0,0);
    J2000 = J2000.getTime()/1000 - 60*(J2000.getTimezoneOffset());
    updateOrbit(1,1.00000261*AU,0.00000562*AU/cenTosec,0.01671123,-0.00004392/cenTosec,-0.00001531,-0.01294668/cenTosec,0.0,0.0/cenTosec,102.93768193,0.32327364/cenTosec,100.46457166-102.93768193,(35999.37244981-0.32327364)/cenTosec,J2000);
    updateOrbit(2,384400e3,3.8/cenTosec,0.0554,0,5.16,0,125.08,-360/(18.600*yrTosec),318.15,360/(5.997*yrTosec),135.27,360/(27.322*86400) - 360/(5.997*yrTosec) + 360/(18.600*yrTosec),J2000);
    updateOrbit(3,0.38709843*AU,0.00000000*AU/cenTosec,0.20563661,0.00002123/cenTosec,7.00559432,-0.00590158/cenTosec,48.33961819,-0.12534081/cenTosec,77.45771895-48.33961819,(0.16047689+0.12534081)/cenTosec,252.25166724-77.45771895,(149472.67486623-0.15940013)/cenTosec,J2000)
    updateOrbit(4,0.72333566*AU,0.00000390*AU/cenTosec,0.00677672,-0.00004107/cenTosec,3.39467605,-0.00078890/cenTosec,76.67984255,-0.27769418/cenTosec,131.60246718-76.67984255,(0.00268329+0.27769418)/cenTosec,181.97909950-131.60246718,(58517.81538729 - 0.00268329)/cenTosec,J2000);
    updateOrbit(5,1.52371034*AU,0.00001847*AU/cenTosec,0.09339410,0.00007882/cenTosec,1.84969142,-0.00813131/cenTosec,49.55953891,-0.29257343/cenTosec,-23.94362959 - 49.55953891,(0.44441088 + 0.29257343)/cenTosec,-4.55343205 + 23.94362959,(19140.30268499 -0.44441088)/cenTosec,J2000);
}
function UpdateBodies(){
    var i = 0;
    while(i<objectNames.length){
        updateObjectId(i);
        i += 1;
    }
}
function UpdateCamera(){
    //update camera
    if(mouseOld.d == true && mouse.d == false){
        var m = [mouse.x-screen.canvas.width/2,screen.canvas.height/2 - mouse.y];
        var i = 0
        while(i<objectNames.length){
            var p = proj3d(objectPos[i]);
            var Dist2d = Math.sqrt(Math.pow(p[0]-m[0],2)+Math.pow(p[1]-m[1],2));
            if(Dist2d < 20){
                selectedBody = i;
                camD = Math.sqrt(Math.pow(camV[0]-objectPos[i][0],2)+Math.pow(camV[1]-objectPos[i][1],2)+Math.pow(camV[2]-objectPos[i][2],2));
                camY = -atan2(objectPos[i][0]-camV[0],objectPos[i][1]-camV[1]);
                camP = atan2(Math.sqrt(Math.pow(camV[0]-objectPos[i][0],2)+Math.pow(camV[1]-objectPos[i][1],2)),objectPos[i][2]-camV[2],);
                break;
            }
            i += 1;
        }
    }
    if(mouseOld.d){
        camP += -270*(mouse.y-mouseOld.y)/screen.canvas.height;
        camY += 270*(mouse.x-mouseOld.x)/screen.canvas.height;
    }
    if(pressedKeys[190]){
        TimeSpeed *= Math.exp(3*dt);
    }
    if(pressedKeys[188]){
        TimeSpeed *= Math.exp(-3*dt);
    }
    if(pressedKeys[82]){
        TimeSpeed = 1;
        T = currentT;
    }
    if(pressedKeys[83]){
        camD *= Math.exp(3*dt);
    }
    if(pressedKeys[87]){
        camD *= Math.exp(-3*dt);
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
    camV = addvec(camV,objectPos[selectedBody]);
    //update old mouse values to compare for next frame:
    mouseOld.x = mouse.x;
    mouseOld.y = mouse.y;
    mouseOld.d = mouse.d;
}
function Render(){
    resizeWindow();
    fillScreen("#ffffff");
    setColor("#404040");
    drawGrid(12,24,MtimesM([1e15,0,0,0,1e15,0,0,0,1e15],RotM("x",0)));
    setColor("#0000ff");
    drawline3d([0,0,0],[0,0,1],-3);
    setColor("#00ff00");
    drawline3d([0,0,0],[0,1,0],-3);
    setColor("#ff0000");
    drawline3d([0,0,0],[1,0,0],-3);
    if(drawOrbits){
        var i = 0;
        while(i<objectNames.length){
            var orb = orbitalParams[i];
            setColor(objectColor[i]);
            if(orb.Parent == -1){
                var parentpos = [0,0,0];
            }else{
                var parentpos = objectPos[orb.Parent];
            }
            var distance = Math.sqrt(Math.pow(objectPos[i][0]-camV[0],2)+Math.pow(objectPos[i][1]-camV[1],2)+Math.pow(objectPos[i][2]-camV[2],2));
            if(0.1<camD/orb.a && camD/orb.a<20){
                drawOrbit(orb.a,orb.e,orb.i,orb.L,orb.w,parentpos,120,3);
            }
            i += 1;
        }
    }
    var i = objectNames.length - 1;
    while(i>=0){
        setColor(objectColor[i]);
        drawsphere3d(objectPos[i],objectRadii[i]);
        drawsphere3d(objectPos[i],-1);
        var p = proj3d(objectPos[i]);
        p[1] -= 0.5*objectRadii[i]/depth3d(objectPos[i])*screen.canvas.height/Math.tan(camFOV*Math.PI/360);
        if(depth3d(objectPos[i])>0){
            drawText(objectNames[i],p,"center","12px arial")
        }
        i -= 1;
    }
    RenderUI();
}
function RenderUI(){
    var now = new Date(T*1000);
    var month = now.getMonth();
    if(month == 0){
        month = "Jan";
    }else if(month == 1){
        month = "Feb";
    }else if(month == 2){
        month = "Mar";
    }else if(month == 3){
        month = "Apr";
    }else if(month == 4){
        month = "May";
    }else if(month == 5){
        month = "Jun";
    }else if(month == 6){
        month = "Jul";
    }else if(month == 7){
        month = "Aug";
    }else if(month == 8){
        month = "Sep";
    }else if(month == 9){
        month = "Oct";
    }else if(month == 10){
        month = "Nov";
    }else{
        month = "Dec";
    }
    setColor("#ffffff");
    drawText(leadingzeros(now.getHours(),2)+":"+leadingzeros(now.getMinutes(),2)+":"+leadingzeros(now.getSeconds(),2)+" "+month+" "+now.getDate()+" "+now.getFullYear(),[-screen.canvas.width/2+5,screen.canvas.height/2-5],"left","24px courier")
    drawText(Math.round(TimeSpeed*100)/100+"x",[-screen.canvas.width/2+5,screen.canvas.height/2-5-24],"left","24px courier");
    drawText("Selected Object:\n"+objectNames[selectedBody],[screen.canvas.width/2-5,screen.canvas.height/2-5],"right","24px courier");
}
function mainLoop(){
    //time handling
    Told = currentT;
    currentT = new Date().getTime()/1000;
    dt = currentT - Told; // deltatime
    if(dt != dt){ //Error correct because for some reason Date can return NaN
        dt = 0;
    }
    T += TimeSpeed*dt;
    requestAnimationFrame(mainLoop);
    UpdateOrbits();
    UpdateBodies();
    UpdateCamera();
    Render();
}

function initLoop(){
    currentT = new Date().getTime()/1000;
    Told = 0;
    T = currentT;
    requestAnimationFrame(mainLoop);
};
var AU = 149.598e9;
var J2000 = 946684800;
addObject("Sun",696e6,"#ffffaa");
addObjectOrbit(0,0,0,0,0,0,J2000,-1,Infinity);
addObject("Earth",6378009,"#0080ff");
addObjectOrbit(AU,0.01671123,-0.00001531,0.0,102.93768193,-2.47311027,J2000,0,"");
addObject("Moon",1738100,"#808080");
addObjectOrbit(0.3844e9,0.0549,5.145,125.08,318.15,135.27,J2000,1,2371843.604625);
addObject("Mercury",2439.7e3,"#a0a0a0");
addObjectOrbit(0.38709893*AU,0.20563593,7.0049790,48.33961819,29.11810076,174.79394829,J2000,0,"");
addObject("Venus",6052e3,"#ffffee");
addObjectOrbit(0.72333199*AU,0.00677672,3.39467605,76.67984255,54.92262463,50.37663232,J2000,0,"");
addObject("Mars",3389.5e3,"#a08040");
addObjectOrbit(1.52366231*AU,0.09339410,1.84969142,49.55953891,-73.5031685,19.39019754,J2000,0,"");
addObject("Jupiter",69911e3,"#ffa080");
addObjectOrbit(5.20336301*AU,0.04838624,1.30439695,100.47390909,-85.74542926,19.66796068,J2000,0,"");
addObject("Saturn",58232e3,"#ffffa0");
addObjectOrbit(9.53707032*AU,0.05386179,2.48599187,113.63998702,-20.77862639,-42.78564734,J2000,0,"");
addObject("Uranus",25362e3,"#c6e7e7");
addObjectOrbit(19.18916464*AU,0.04725744,0.77263783,74.01692503,96.93735127,142.28382821,J2000,0,"");
addObject("Neptune",24622e3,"#b0d0e0");
addObjectOrbit(30.06992276*AU,0.00859048,1.77004347,131.78422574,-86.81946347,-100.08479196,J2000,0,"");





requestAnimationFrame(initLoop);