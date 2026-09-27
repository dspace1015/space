var orbitalParams = [];
var orbitalRates = [];
var objectPos = []
var objectNames = [];
var objectRadii = [];
var objectColor = [];
var objectMass = [];
var bodyAxis = [];
var rotP = [];
var rotL0 = [];
var maxT = 253402300800;
var minT = -156806496560;
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
var long = 0.0;
var lat = 0.0;
var drawOrbits = true;
var camFOV = 70;
var pressedKeys = {};
var mouse = {x:0,y:0,d:false};
var mouseDrag = {x:0,y:0,d:false};
var mouseOld = {x:0,y:0,d:false};
var selectedBody = -1;
var currentBody = 0;
var aspect = window.innerWidth / window.innerHeight;

var bin0 = [];
    var bin1 = [];
    var bin2 = [];
    var bin3 = [];
    var bin4 = [];
    var bin5 = [];
    var bin6 = [];
    var bin7 = [];
    var bin8 = [];
    var bin9 = [];

const G = 6.6743015e-11;
const c = 2.99792458e8;
const yr = 365.25*86400;
const lr = yr*c;

var vert = [];
var draw = [];
var drawDist = [];
var drawOrder = [];

const mainCanvas = document.getElementById("MainCanvas");
const screen = mainCanvas.getContext("2d");

if(screen === null){
    alert("WebGL could not initialize, try restart your browser");
}

//Functions ______________________________________________________________
function resizeWindow(){
    //scales window to fit the whole screen
    mainCanvas.width = document.documentElement.clientWidth;
    mainCanvas.height = document.documentElement.clientHeight;
    screen.setTransform(1,0,0,-1,screen.canvas.width/2,screen.canvas.height/2);
};
function leadingzeros(x,y){
    //adds leading zeros so the number stayes the same length, ex: 08, 09, 10...
    var s = String((Math.round(x)));
    while(s.length<y){
        s = "0"+s;
    }
    return s;
}
function name2Id(x,y){
    //returns location of element y in list x
    var i = 0
    while(i<x.length){
        if(x[i]==y){
            return i;
        }
        i+=1;
    }
    return -1;
}
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
    //adds the vectors together
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
function cross(x,y){
    //returns the cross product of x and y
    return [x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];
}
function MtimesM(M1,M2){
    //Matrix multiply M2*M1
    //where matrix M is defined by indecies in M:
    //[[0,3,6],
    // [1,4,7],
    // [2,5,8]]
    var v1 = Mvec([M1[0],M1[1],M1[2]],M2);
    var v2 = Mvec([M1[3],M1[4],M1[5]],M2);
    var v3 = Mvec([M1[6],M1[7],M1[8]],M2);
    return [v1[0],v1[1],v1[2],v2[0],v2[1],v2[2],v3[0],v3[1],v3[2]];
}
function mod(x,y){
    //correcting javascript's stupid mod function
    return (x % y + y) % y;
}
function atan2(x,y){
    //returns the angle around the x axis of point (x,y)
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
function cos(x){
    return Math.cos(Math.PI/180*x);
}
function sin(x){
    return Math.sin(Math.PI/180*x);
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

function orbit2xyz(a,e,i,L,w,v,vP,frame){
    //a-semimajoraxis,e-eccentricity,i-inclination,L-longitude of ascending node,w-arg of peri,v-true anomaly
    //vP is position of object orbit is centered around
    var v = [Math.cos(v*Math.PI/180)*a*(1-e*e)/(1+e*Math.cos(v*Math.PI/180)),Math.sin(v*Math.PI/180)*a*(1-e*e)/(1+e*Math.cos(v*Math.PI/180)),0]
    v = Mvec(v,RotM("z",w));
    v = Mvec(v,RotM("x",i));
    v = Mvec(v,RotM("z",L));
    if(frame == "Equitorial"){
        v = Mvec(v,RotM("x",-23.43928));
    }else if(frame =="Ecliptic"){
        v = v;
    }else if(frame instanceof Array){
        v = Mvec(v,frame);
    }
    v = addvec(v,vP);
    return v;
}
function latLong2xyz(id,long,lat){
    var v = [objectRadii[id]*cos(long)*cos(lat),objectRadii[id]*sin(long)*cos(lat),objectRadii[id]*sin(lat)];
    v = Mvec(v,RotM("z",rotL0[id] + 360*(T-946728000)/(rotP[id])));
    v = Mvec(v,bodyAxis[id]);
    v = addvec(v,objectPos[id]);
    return v;
}
function latLong2frame(id,long,lat){
    var M = [1,0,0,0,1,0,0,0,1];
    M = MtimesM(M,RotM("y",lat-90));
    M = MtimesM(M,RotM("z",long + 180 + rotL0[id] + 360*(T-946728000)/(rotP[id])));
    M = MtimesM(M,bodyAxis[id]);
    return M;
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

//Draw Functions: ____________________________________________________________________________________________________________________________________
function drawline(x0,y0,x1,y1,width){
    //draws 2d line from (x0,y0)to(x1,y1)
    screen.lineWidth = width;
    screen.beginPath();
    screen.moveTo(x0,y0);
    screen.lineTo(x1,y1);
    screen.stroke();
};
function drawCircle(cx,cy,r,width,fill){
    //draws 2d circle
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

function setColor(color){
    //sets stroke color
    screen.strokeStyle = color;
};
function fillScreen(color){
    //fills screen with color specified
    screen.setTransform(1,0,0,1,0,0);
    setColor(color);
    screen.beginPath;
    screen.rect(0,0,screen.canvas.width,screen.canvas.height);
    screen.fill();
    screen.setTransform(1,0,0,-1,screen.canvas.width/2,screen.canvas.height/2);
};
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
function drawRect(x,y,w,h){
    screen.fillStyle = screen.strokeStyle;
    screen.beginPath();
    screen.moveTo(x,y)
    screen.lineTo(x+w,y);
    screen.lineTo(x+w,y+h);
    screen.lineTo(x,y+h);
    screen.fill();
}
function drawpolygon3d(vlist){
    var i = 0;
    var draw = true;
    while(i<vlist.length){
        if(depth3d(vlist[i])<=0){
            draw == false;
        }
        i += 1;
    }
    if(draw){
        screen.beginPath();
        screen.moveTo(proj3d(vlist[0])[0],proj3d(vlist[0])[1]);
        i = 0;
        while(i<vlist.length){
            screen.lineTo(proj3d(vlist[i])[0],proj3d(vlist[i])[1]);
            i += 1;
        }
        screen.fill();
    }
}
function drawsphere3d(v,r,M){
    screen.fillStyle = screen.strokeStyle;
    var U = 0;
    var dphi = 10;
    
    while(U<360){
        var V = 0;
        while(V<180){
            var p1 = Mvec([r*cos(U)*sin(V),r*sin(U)*sin(V),r*cos(V)],M);
            var p2 = Mvec([r*cos(U+dphi)*sin(V),r*sin(U+dphi)*sin(V),r*cos(V)],M);
            var p3 = Mvec([r*cos(U)*sin(V+dphi),r*sin(U)*sin(V+dphi),r*cos(V+dphi)],M);
            var p4 = Mvec([r*cos(U+dphi)*sin(V+dphi),r*sin(U+dphi)*sin(V+dphi),r*cos(V+dphi)],M);
            p1 = addvec(p1,v);
            p2 = addvec(p2,v);
            p3 = addvec(p3,v);
            p4 = addvec(p4,v);
            if(depth3d(p1)>0 && depth3d(p2)>0 && depth3d(p3)>0 && depth3d(p4)>0){
                drawpolygon3d([p1,p3,p4,p2]);
            }
            V += dphi;
        }
        U += dphi;
    }
}
function drawdot3d(v,r){
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
function drawOrbit(a,e,i,L,w,vP,frame,steps,width,col){
    var ang = 0;
    while(ang<360){
        var p1 = orbit2xyz(a,e,i,L,w,ang,vP,frame);
        var p2 = orbit2xyz(a,e,i,L,w,ang+360/steps,vP,frame);
        setColor(col);
        drawline3d(p1,p2,-width);
        ang += 360/steps;
    }
}
function addObjectOrbit(a,e,i,L,w,M0,t0,Parent,P,frame){
    var period = P;
    if(period == ""){
        period = 2*Math.PI*Math.sqrt(Math.pow(a,3)/objectMass[Parent]);
    }
    orbitalParams.push({Parent:Parent,a:a,e:e,i:i,L:L,w:w,M0:M0,t0:t0,P:period,frame:frame});
    objectPos.push(orbit2xyz(a,e,i,L,w,meanAnom2TrueAnom(e,M0),[0,0,0],frame));
}
function addObjectOrbitRate(da,de,di,dL,dw,dM){
    orbitalRates.push({da:da,de:de,di:di,dL:dL,dw:dw});
    if(dM != 0 && dM == dM){
        orbitalParams[orbitalParams.length-1].P = 360/dM;
    }
}












































//Add draw objects:

function appendLine(p1,p2,w,col,priority){
    if (p1.length == 3 && p2.length == 3){
        vert.push(p1);
        vert.push(p2);
        draw.push(["l",vert.length-2,vert.length-1,w,col,priority]);
    };
}
function appendTri(p1,p2,p3,col,priority){
    if (p1.length == 3 && p2.length == 3 && p3.length == 3){
        vert.push(p1);
        vert.push(p2);
        vert.push(p3);
        draw.push(["t",vert.length-3,vert.length-2,vert.length-1,col,priority]);
    };
}
function appendDot(p1,r1,col,priority){
    if (p1.length ==3){
        vert.push(p1);
        draw.push(["d",vert.length-1,r1,0,col,priority]);
    };
}
function appendText(p1,size,col,priority,text){
    if (p1.length ==3){
        vert.push(p1);
        draw.push(["text",vert.length-1,size,text,col,priority]);
    };
}





function getDrawDist(){
    drawDist = [];
    drawOrder = [];
    var i = 0;
    var d;
    var type;
    while(i<draw.length){
        type = draw[i][0];
        if(type == "text"){
            d = depth3d(vert[draw[i][1]]);
        }else if (type =="d"){
            d = Math.sqrt(Math.pow(depth3d(vert[draw[i][1]]),2)-Math.pow(draw[i][2],2));
        }else if (type =="l"){
            d = (depth3d(vert[draw[i][1]]) + depth3d(vert[draw[i][2]]))/2;
        }else if (type =="t"){
            d = (depth3d(vert[draw[i][1]]) + depth3d(vert[draw[i][2]]) + depth3d(vert[draw[i][3]]))/3;
        }
        if(d>0){
            d = Math.log(d);
            d = d/(100*Math.log(10));
            d = Math.round(1e8*(d+10));
        }else{
            d = 0;
        }
        drawDist.push(d);
        drawOrder.push(i);
        i += 1;
    }

}

function sortdraw(b){
    bin0 = [];
    bin1 = [];
    bin2 = [];
    bin3 = [];
    bin4 = [];
    bin5 = [];
    bin6 = [];
    bin7 = [];
    bin8 = [];
    bin9 = [];

    var i = 0
    while(i<drawOrder.length){
        var val = drawDist[drawOrder[i]];
        var rem = mod(Math.floor(val/Math.pow(10,b)),10);
        if(rem==0){
            bin0 = bin0.concat(drawOrder[i]);
        }else if (rem==1){
            bin1 = bin1.concat(drawOrder[i]);
        }else if (rem==2){
            bin2 = bin2.concat(drawOrder[i]);
        }else if (rem==3){
            bin3 = bin3.concat(drawOrder[i]);
        }else if (rem==4){
            bin4 = bin4.concat(drawOrder[i]);
        }else if (rem==5){
            bin5 = bin5.concat(drawOrder[i]);
        }else if (rem==6){
            bin6 = bin6.concat(drawOrder[i]);
        }else if (rem==7){
            bin7 = bin7.concat(drawOrder[i]);
        }else if (rem==8){
            bin8 = bin8.concat(drawOrder[i]);
        }else if (rem==9){
            bin9 = bin9.concat(drawOrder[i]);
        }
        i += 1;
    }
    drawOrder = [];
    drawOrder = drawOrder.concat(bin0);
    drawOrder = drawOrder.concat(bin1);
    drawOrder = drawOrder.concat(bin2);
    drawOrder = drawOrder.concat(bin3);
    drawOrder = drawOrder.concat(bin4);
    drawOrder = drawOrder.concat(bin5);
    drawOrder = drawOrder.concat(bin6);
    drawOrder = drawOrder.concat(bin7);
    drawOrder = drawOrder.concat(bin8);
    drawOrder = drawOrder.concat(bin9);
}



function coastline(data){
    i = 0;
    var x = data[i];
    var y = data[i+1];
    x -= 180;
    y = 90 - y;
    var p = latLong2xyz(1,x,y);
    while (i<data.length){
        pOld = p;
        x = data[i];
        y = data[i+1];
        x -= 180;
        y = 90 - y;
        p = latLong2xyz(1,x,y);
        appendLine(p,pOld,-1,"#ffffff");
        i += 2*4;
    }
}




function addObject(name,R,color,Mass){
    objectNames.push(name);
    objectRadii.push(R);
    objectColor.push(color);
    objectMass.push(Mass);
}
function updateObjectId(id){
    var orb2 = getOrbitNow(id);
    var v = meanAnom2TrueAnom(orb2.e,orb2.M0+360*(T-orb2.t0)/orb2.P);
    var parentpos = objectPos[orb2.Parent];
    objectPos[id] = orbit2xyz(orb2.a,orb2.e,orb2.i,orb2.L,orb2.w,v,parentpos,orb2.frame);
}
window.onkeyup = function(e){pressedKeys[e.keyCode] = false;if(e.keyCode == 79){drawOrbits = 1-drawOrbits;}}

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

window.onkeydown = function(e) {
    pressedKeys[e.keyCode] = true;
    if(e.keyCode == 191){
        TimeSpeed *= -1
    };
    if(e.keyCode == 190){
        if(Math.abs(TimeSpeed)<1e10){
            if(Math.abs(TimeSpeed)>1){
                if(((Math.abs(TimeSpeed))/(Math.pow(10,Math.floor(Math.log10(Math.abs(TimeSpeed))+1e-10)))) == 1){
                    TimeSpeed *= 2.5;
                }else{
                    TimeSpeed *= 2;
                }
            }else if(Math.abs(TimeSpeed) == 1){
                TimeSpeed = 5 * TimeSpeed/Math.abs(TimeSpeed);
            }else{
                TimeSpeed = 1;
            }
        }
    };
    if(e.keyCode == 188){
        if(Math.abs(TimeSpeed)>1){
            if(Math.abs(TimeSpeed)>1){
                if(((Math.abs(TimeSpeed))/(Math.pow(10,Math.floor(Math.log10(Math.abs(TimeSpeed))+1e-10)))) == 2.5){
                    TimeSpeed /= 2.5;
                }else{
                    TimeSpeed /= 2;
                }
            }else if(Math.abs(TimeSpeed) == 1){
                TimeSpeed = TimeSpeed/Math.abs(TimeSpeed);
            }
        }else{
            TimeSpeed = 0;
        }
    }
    if(e.keyCode == 82){
        TimeSpeed = 1;
        T = currentT;
    }
}
window.onmousemove = function(e){mouse.x = e.clientX, mouse.y = e.clientY};
window.ontouchmove = function(e){mouse.x = e.touches[0].clientX, mouse.y = e.touches[0].clientY};
window.ontouchstart = function(e){mouse.d = true,mouse.x = e.touches[0].clientX, mouse.y = e.touches[0].clientY};
window.ontouchend = function(e){mouse.d = false};
window.onmouseup = function(e){mouse.d = false};
window.onmousedown = function(e){mouse.d = true};
window.ondrag = function(e){mouse.x = e.clientX, mouse.y = e.clientY};
window.onwheel = function(e){camD *= Math.exp(0.25*(e.deltaY/100))};
function getOrbitNow(id){
    var orb = {...orbitalParams[id]};
    var orbR = orbitalRates[id];
    if(typeof orbR != 'undefined'){
        orb.a = orb.a + orbR.da*(T-orb.t0);
        orb.e = orb.e + orbR.de*(T-orb.t0);
        orb.i = orb.i + orbR.di*(T-orb.t0);
        orb.L = orb.L + orbR.dL*(T-orb.t0);
        orb.w = orb.w + orbR.dw*(T-orb.t0);
    }
    return orb;
}
function UpdateBodies(){
    var i = 0;
    while(i<objectNames.length){
        if(orbitalParams[i].Parent != -1){
            updateObjectId(i);
        }
        i += 1;
    }
}
function UpdateScene(){
    vert = [];
    draw = [];
    var i = 0;
    while(i<objectNames.length){
        if((Math.abs(depth3d(objectPos[i])/objectRadii[i])) < 50){
            appendDot(objectPos[i],objectRadii[i],objectColor[i],0);
            appendDot(objectPos[i],-1,objectColor[i],0);
        }else{
            if ((Math.abs(depth3d(objectPos[i])/objectRadii[i])) > 1e7){
                setColor(objectColor[i]);
                drawdot3d(objectPos[i],objectRadii[i]);
                setColor(objectColor[i]);
                drawdot3d(objectPos[i],-1);
            }else{
                appendDot(objectPos[i],objectRadii[i],objectColor[i],0);
                appendDot(objectPos[i],-1,objectColor[i],0);
            }
        }
        setColor(objectColor[i]);
        drawdot3d(objectPos[i],-1);
        var d = depth3d(objectPos[i]);
        if(d>0){
        if((0.1<d/orbitalParams[i].a && d/orbitalParams[i].a<10 && orbitalParams[i].Parent != -1) || (d/objectRadii[i] <1000) || (orbitalParams[i].Parent == -1 && (d/lr<1 || camD/lr >5))){
            var p = objectPos[i];
            p = addvec(p,[-objectRadii[i]*camM[2],-objectRadii[i]*camM[5],-objectRadii[i]*camM[8]]);
            appendText(p,-20,objectColor[i],0,objectNames[i]);
        }}
        i += 1;
    }
    if(drawOrbits){
        var i = 0;
        while(i<objectNames.length){
            var orb = getOrbitNow(i);
            setColor(objectColor[i]);
            if(orb.Parent == -1){
                var parentpos = [0,0,0];
            }else{
                var parentpos = objectPos[orb.Parent];
                var distance = Math.sqrt(Math.pow(objectPos[i][0]-camV[0],2)+Math.pow(objectPos[i][1]-camV[1],2)+Math.pow(objectPos[i][2]-camV[2],2));
                if(0.1<camD/orb.a && camD/orb.a<50){
                    drawOrbit(orb.a,orb.e,orb.i,orb.L,orb.w,parentpos,orb.frame,120,1,objectColor[i]);
                }
            }
            i += 1;
        }
    }
}
function UpdateCamera(){
    //update camera
    if(mouseOld.d && !mouse.d && !mouseDrag.d){
        var m = [mouse.x-window.innerWidth/2,window.innerHeight/2 - mouse.y];
        var i = 0
        var hit = 0;
        while(i<objectNames.length){
            var p = proj3d(objectPos[i]);
            var d =depth3d(objectPos[i]);
            var Dist2d = Math.sqrt(Math.pow(p[0]-m[0],2)+Math.pow(p[1]-m[1],2));
            if((Dist2d < 20 || Dist2d<0.5*objectRadii[i]/d*screen.canvas.height/Math.tan(camFOV*Math.PI/360)) && d>0){
                if(selectedBody == i){
                    currentBody = i;
                }else{
                    selectedBody = i;
                }
                hit = 1;
                break;
            }

            i += 1;
        }
        if(hit == 0){
            selectedBody = -1;
        }
        
    }
    if(mouseOld.d && !mouse.d && !mouseDrag.d && (mouse.x<300) && (mouse.y>screen.canvas.height-30)){
        ans = parseFloat(prompt("input Latitude"));
        if(ans == ans){
            lat = ans;
        }
        ans = parseFloat(prompt("input Longitude"));
        if(ans == ans){
            long = ans;
        }
        currentBody = -1;
    }
    if(!mouseOld.d && mouse.d){
        mouseDrag.x = mouse.x
        mouseDrag.y = mouse.y
    }
    if(!mouse.d && mouseOld.d){
        mouseDrag.d = false;
    }
    if(Math.sqrt(Math.pow(mouse.x-mouseDrag.x,2)+Math.pow(mouse.y-mouseDrag.y,2))>20 && (mouseOld.d)){
        mouseDrag.d = true;
    }
    if(mouseOld.d && mouse.d){
        camP += -3*camFOV*(mouse.y-mouseOld.y)/window.innerHeight;
        camY += 3*camFOV*(mouse.x-mouseOld.x)/window.innerHeight;
    }
    if(T>maxT){
        T = maxT;
        TimeSpeed = 1;
    }
    if(T<minT){
        T = minT;
        TimeSpeed = -1;
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
    if(currentBody == -1){
        camM = latLong2frame(1,long,lat);
        camM = [camM[0],camM[3],camM[6],camM[1],camM[4],camM[7],camM[2],camM[5],camM[8]];
        camV = latLong2xyz(1,long,lat);
    }else{
        camV = objectPos[currentBody];
    }
    camM = MtimesM(camM,RotM("z",camY));
    camM = MtimesM(camM,RotM("y",camP));
    camV = addvec(camV,[-camD*camM[0],-camD*camM[3],-camD*camM[6]]);
    //update old mouse values to compare for next frame:
    mouseOld.x = mouse.x;
    mouseOld.y = mouse.y;
    mouseOld.d = mouse.d;
}
function Render(){
    setColor("#404040");
    if(currentBody==-1){
        var M = MtimesM([1e300,0,0,0,1e300,0,0,0,1e300],latLong2frame(1,long,lat));
        drawGrid(12,24,M);
        setColor("#909090");
        p0 = Mvec([1,0,0],M);
        if(depth3d(p0)>0){
            drawText("N",[proj3d(p0)[0],proj3d(p0)[1]+12],"center","24px Courier");
        }
        p0 = Mvec([-1,0,0],M);
        if(depth3d(p0)>0){
            drawText("S",[proj3d(p0)[0],proj3d(p0)[1]+12],"center","24px Courier");
        }
        p0 = Mvec([0,1,0],M);
        if(depth3d(p0)>0){
            drawText("W",[proj3d(p0)[0],proj3d(p0)[1]+12],"center","24px Courier");
        }
        p0 = Mvec([0,-1,0],M);
        if(depth3d(p0)>0){
            drawText("E",[proj3d(p0)[0],proj3d(p0)[1]+12],"center","24px Courier");
        }
        p0 = Mvec([0,0,1],M);
        if(depth3d(p0)>0){
            drawText("UP",[proj3d(p0)[0],proj3d(p0)[1]+12],"center","24px Courier");
        }
        p0 = Mvec([0,0,-1],M);
        if(depth3d(p0)>0){
            drawText("DOWN",[proj3d(p0)[0],proj3d(p0)[1]+12],"center","24px Courier");
        }
    }else{
        var M = [1e300,0,0,0,1e300,0,0,0,1e300];
        setColor("#404040");
        drawGrid(12,24,M);
    }
    /*setColor("#0000ff");
    drawline3d([0,0,0],[0,0,1e10],-3);
    setColor("#00ff00");
    drawline3d([0,0,0],[0,1e10,0],-3);
    setColor("#ff0000");
    drawline3d([0,0,0],[1e10,0,0],-3);
    */
    var ind = draw.length -1;
    while (ind>=0){
        var i = drawOrder[ind];
        var type = draw[i][0];
        if (type == "d"){
            setColor(draw[i][4]);
            var d = depth3d(vert[draw[i][1]]);
            if(d/draw[i][2] < 50){
                drawsphere3d(vert[draw[i][1]],draw[i][2],[1,0,0,0,1,0,0,0,1]);
            }else{
                drawdot3d(vert[draw[i][1]],draw[i][2]);
            }
        }else if(type == "l"){
            setColor(draw[i][4]);
            drawline3d(vert[draw[i][1]],vert[draw[i][2]],draw[i][3]);
        }else if(type == "t"){
            setColor(draw[i][4]);
            drawpolygon3d([vert[draw[i][1]],vert[draw[i][2]],vert[draw[i][3]]]);
        }else if(type == "text"){
            setColor(draw[i][4]);
            var d = depth3d(vert[draw[i][1]]);
            if(d>0){
                var p = proj3d(vert[draw[i][1]]);
                setColor(draw[i][4]);
                if(draw[i][2]<0){
                    drawText(draw[i][3],p,"center",Math.round(-draw[i][2])+"px courier");
                }else{
                    var s = 0.5*draw[i][2]/d*screen.canvas.height/Math.tan(camFOV*Math.PI/360);
                    drawText(draw[i][3],p,"center",Math.round(s)+"px courier");
                }
            }
        }
        ind-=1;
    }
    RenderUI();
}
function RenderUI(){
    var now = new Date(T*1000);
    var month = now.getMonth();
    var timezone = -now.getTimezoneOffset()/60;
    if(timezone>0){
        timezone = "UTC+"+timezone;
    }else{
        timezone = "UTC"+timezone;
    }
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
    drawText(leadingzeros(now.getHours(),2)+":"+leadingzeros(now.getMinutes(),2)+":"+leadingzeros(now.getSeconds(),2)+" "+month+" "+leadingzeros(now.getDate(),2)+" "+now.getFullYear()+" "+timezone,[-screen.canvas.width/2+5,screen.canvas.height/2-5],"left","24px courier")
    drawText(Math.round(TimeSpeed*100)/100+"x",[-screen.canvas.width/2+5,screen.canvas.height/2-5-24],"left","24px courier");
    if(selectedBody != -1){
        drawText("Selected Object:\n"+objectNames[selectedBody],[screen.canvas.width/2-5,screen.canvas.height/2-5],"right","24px courier");
        var p = objectPos[selectedBody];
        var d = depth3d(p);
        if(depth3d(p)>0){
            var p2 = proj3d(p);
            d = Math.sqrt(Math.pow(d,2)-Math.pow(objectRadii[selectedBody],2));
            setColor("#ffffff");
            drawCircle(p2[0],p2[1],(1+0.1*Math.sin(currentT*Math.PI*2))*(10+1.3*(screen.canvas.height*0.5*objectRadii[selectedBody]/(d*Math.tan(camFOV*Math.PI/360)))),1,false);
        }
    }
    setColor("#808080");
    drawRect(-screen.canvas.width/2,-screen.canvas.height/2,300,30);
    setColor("#000000")
    drawText(" View From Location",[-screen.canvas.width/2,-screen.canvas.height/2+26],"left","24px courier");
    setColor("#ffffff")
    if(T>=maxT){
        drawText("MAXIMUM TIME REACHED",[0,-screen.canvas.height/2+100],"center","50px courier");
    }
    if(T<=minT){
        
        drawText("MINIMUM TIME REACHED",[0,-screen.canvas.height/2+100],"center","50px courier");
    }
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
    resizeWindow();
    UpdateBodies();
    UpdateCamera();
    resizeWindow();
    fillScreen("#000000");

    UpdateScene();
    coastline(A1);
    coastline(A2);
    coastline(A3);

    getDrawDist();
    var i = 0;
    while(i<10){
        sortdraw(i);
        i += 1;
    }   
    Render();
    if(objectNames[0]!="Sun" || objectNames[1]!="Earth"){
        alert("error loading objects, please refresh the page");
    }
}

function initLoop(){
    currentT = new Date().getTime()/1000;
    Told = 0;
    T = currentT;
    requestAnimationFrame(mainLoop);
};

fetch("Objects.json").then(response => response.json()).then(data => loadObjects(data)).catch(error => alert("an error occured, please refresh page (bad data)"));
fetch("Craft.json").then(response => response.json()).then(data => loadObjects(data)).catch(error => alert("an error occured, please refresh page (bad data)"));
fetch("Stars.json").then(response => response.json()).then(data => loadObjects(data)).catch(error => alert("an error occured, please refresh page (bad data)"));


const EarthTex = document.getElementById("Textures/EarthTrueColor.png");

function loadObjects(file){
    var list = Object.entries(file);
    var i = 0;
    while(i<list.length){
        var name = list[i][0];
        var obj = list[i][1];
        if(typeof obj.Pos != 'undefined'){
            var orb = {Parent:-1,frame:"Equitorial",a:obj.Pos.R,e:0,i:obj.Pos.DE,L:obj.Pos.RA-90,w:90,M0:0,t0:0,P:Infinity};
        }else if(typeof obj.orbit != 'undefined'){
            var orb = obj.orbit;
            orb.Parent = name2Id(objectNames,orb.Parent);
            var orbR = obj.orbitRate;
        }else if(typeof obj.tle != 'undefined'){
            var orb = {Parent:1,frame:"Equitorial",a:0,e:0,i:0,L:0,w:0,M0:0,t0:0,P:Infinity}
            var orbR = {da:0,de:0,di:0,dL:0,dw:0,dM:0};
            var tle = obj.tle;
            var t0 = parseFloat(tle.substring(18,20));
            t0 = Math.floor(((t0+3)/4)+Math.floor(365*t0))+parseFloat(tle.substring(20,32)) - 1;
            t0 = 86400*t0 + 946728000 - 12*3600;
            orb.t0 = t0;
            orb.i = parseFloat(tle.substring(8+69,16+69));
            orb.e = parseFloat("0."+tle.substring(27+69,33+69));
            orb.L = parseFloat(tle.substring(17+69,25+69));
            orb.w = parseFloat(tle.substring(34+69,42+69));
            orb.M0 = parseFloat(tle.substring(43+69,51+69));
            orb.P = 86400/parseFloat(tle.substring(52+69,63+69));
            orb.a = Math.pow(objectMass[orb.Parent]*Math.pow(orb.P/(2*Math.PI),2),1/3);
            orbR.dL = 180/Math.PI*(-1.5*(Math.pow(objectRadii[orb.Parent],2)/Math.pow(orb.a*(1-orb.e*orb.e),2))*(1.08262668e-3*Math.sqrt(objectMass[orb.Parent]/Math.pow(orb.a,3)))*cos(orb.i));
        }else{
           console.error("Object does not have position type: \n",obj);
           var orb;
        }
        if(orb.t0 =="J2000"){
            orb.t0 = 946728000;
        }
        addObject(name,obj.Params.Radius,obj.Params.Color,obj.Params.Mass);
        addObjectOrbit(orb.a,orb.e,orb.i,orb.L,orb.w,orb.M0,orb.t0,orb.Parent,orb.P,orb.frame);
        if(typeof orbR != 'undefined'){
            addObjectOrbitRate(orbR.da,orbR.de,orbR.di,orbR.dL,orbR.dw,orbR.dM);
        }else{
            orbitalRates.push({da:0,de:0,di:0,dL:0,dw:0});
        }
        if(typeof obj.Rotation != 'undefined'){
            var rot = obj.Rotation;
            if(typeof rot.AxisRA !='undefined' && typeof rot.AxisDE !='undefined'){
                var M = [1,0,0,0,1,0,0,0,1];
                M = MtimesM(M,RotM("z",-rot.AxisRA));
                M = MtimesM(M,RotM("y",90-rot.AxisDE));
                M = MtimesM(M,RotM("z",rot.AxisRA));
                M = MtimesM(M,RotM("x",-23.43928));
                bodyAxis.push(M);
            }else{
                bodyAxis.push([1,0,0,0,1,0,0,0,1]);
            }
            if(typeof rot.Long0 != 'undefined'){
                rotL0.push(rot.Long0);
            }else{
                rotL0.push(0);
            }
            if(typeof rot.Period != 'undefined'){
                rotP.push(rot.Period);
            }
        }else{
            bodyAxis.push([1,0,0,0,1,0,0,0,1]);
            rotL0.push(0);
            rotP.push(Infinity);
        }
        i += 1;
    }
}

//waits till other objects are loaded.
window.onload = function(){
    requestAnimationFrame(initLoop);
};



//And now for the coastline data:\

//Gotten from the wikepidia Image https://en.wikipedia.org/wiki/Equirectangular_projection#/media/File:Plate_Carr%C3%A9e_with_Tissot's_Indicatrices_of_Distortion.svg
//Antarctica:
const A1 = [
121.386 ,154.152,
120.955 ,154.368,
120.211 ,154.211,
119.388 ,154.309,
118.703 ,154.544,
117.978 ,154.799,
117.488 ,155.093,
117.351 ,155.485,
117.41 ,155.857,
117.88 ,156.19,
117.194 ,156.426,
116.254 ,156.504,
115.706 ,156.837,
115.118 ,157.15,
114.492 ,157.582,
114.335 ,157.954,
114.687 ,158.365,
115.216 ,158.679,
116.039 ,158.914,
116.803 ,159.228,
117.214 ,159.619,
117.429 ,159.992,
117.723 ,160.384,
118.193 ,160.717,
118.487 ,161.089,
118.624 ,162.01,
118.918 ,162.382,
118.996 ,162.774,
119.31 ,163.166,
119.173 ,163.695,
118.624 ,164.107,
118.037 ,164.44,
116.705 ,164.577,
116.254 ,164.93,
115.647 ,165.263,
114.139 ,165.635,
112.807 ,165.792,
111.554 ,166.007,
110.202 ,166.223,
109.399 ,166.634,
107.793 ,166.674,
106.03 ,166.634,
104.444 ,166.713,
103.76 ,166.713,
102.76 ,166.713,
103.073 ,167.105,
104.601 ,167.281,
105.717 ,167.555,
106.344 ,167.908,
105.227 ,168.222,
103.504 ,168.124,
102.074 ,168.378,
102.015 ,168.79,
101.976 ,169.182,
103.151 ,169.515,
103.367 ,169.887,
104.64 ,170.26,
106.755 ,170.416,
108.557 ,170.691,
109.987 ,171.004,
111.808 ,171.318,
114.296 ,171.474,
116.744 ,171.749,
118.448 ,172.043,
120.309 ,172.376,
121.288 ,172.846,
121.778 ,173.218,
122.992 ,172.866,
124.637 ,172.572,
126.38 ,172.258,
128.456 ,172.004,
130.239 ,171.729,
132.726 ,171.71,
135.174 ,171.847,
137.192 ,172.082,
137.838 ,171.651,
139.229 ,171.357,
141.755 ,171.337,
143.733 ,171.122,
145.614 ,170.906,
147.69 ,170.769,
149.903 ,170.593,
151.45 ,170.338,
150.745 ,169.985,
150.314 ,169.633,
150.314 ,169.26,
148.375 ,169.299,
146.319 ,169.456,
145.36 ,169.456,
144.36 ,169.456,
144.086 ,169.084,
144.223 ,168.339,
144.673 ,168.124,
146.103 ,167.889,
147.788 ,167.653,
149.002 ,167.36,
150.216 ,167.066,
151.117 ,166.674,
152.488 ,166.497,
153.84 ,166.36,
154.525 ,166.282,
156.072 ,166.243,
157.541 ,166.105,
158.775 ,165.909,
159.99 ,165.674,
161.086 ,165.439,
162.477 ,165.126,
163.358 ,164.793,
164.299 ,164.499,
164.592 ,164.107,
163.535 ,163.872,
163.887 ,163.46,
164.553 ,163.147,
165.591 ,162.951,
166.688 ,162.715,
167.706 ,162.402,
168.49 ,162.01,
168.98 ,161.54,
169.704 ,161.265,
170.899 ,161.324,
171.389 ,161.657,
172.583 ,161.697,
172.623 ,161.324,
173.132 ,160.932,
174.209 ,161.03,
174.464 ,161.403,
175.658 ,161.461,
176.951 ,161.285,
178.205 ,161.167,
179.341 ,161.226,
179.771 ,161.638,
180.868 ,161.305,
181.887 ,161.128,
183.023 ,160.991,
184.139 ,160.854,
185.158 ,160.619,
186.274 ,160.462,
187.136 ,160.247,
187.743 ,159.894,
188.487 ,160.149,
189.525 ,160.011,
190.25 ,160.482,
190.818 ,160.834,
191.954 ,160.638,
192.404 ,160.247,
193.423 ,159.972,
194.735 ,160.031,
195.127 ,160.403,
195.949 ,160.031,
197.027 ,159.913,
198.202 ,159.874,
199.259 ,159.894,
200.376 ,160.011,
201.453 ,160.07,
201.923 ,160.403,
202.569 ,160.697,
203.666 ,160.521,
204.841 ,160.482,
204.977 ,160.482,
205.977 ,160.482,
207.094 ,160.462,
208.093 ,160.325,
209.15 ,160.207,
210.032 ,159.933,
210.972 ,159.757,
211.99 ,159.659,
212.754 ,159.384,
213.302 ,158.836,
213.87 ,158.503,
214.908 ,158.659,
215.3 ,159.012,
216.162 ,159.247,
217.2 ,159.169,
217.905 ,159.521,
218.649 ,159.776,
219.668 ,159.541,
220.02 ,159.11,
220.921 ,158.934,
221.959 ,158.601,
222.939 ,158.463,
224.114 ,158.267,
224.897 ,158.052,
225.72 ,157.817,
226.503 ,157.601,
227.443 ,157.719,
228.344 ,157.366,
228.991 ,157.092,
229.931 ,157.111,
230.753 ,156.876,
230.949 ,156.523,
231.792 ,156.249,
232.614 ,156.053,
233.613 ,155.896,
234.534 ,155.818,
235.415 ,155.877,
236.355 ,155.975,
237.158 ,156.249,
237.256 ,156.68,
238.137 ,157.013,
238.745 ,157.288,
239.939 ,157.405,
240.605 ,157.68,
241.428 ,157.954,
242.387 ,158.013,
243.19 ,157.817,
244.052 ,157.405,
244.992 ,157.621,
245.972 ,157.738,
246.912 ,157.856,
247.891 ,157.934,
248.89 ,157.934,
249.713 ,158.973,
249.673 ,159.228,
249.556 ,159.678,
248.596 ,159.933,
247.813 ,160.305,
247.95 ,160.697,
249.066 ,160.678,
248.929 ,161.069,
248.42 ,161.442,
247.95 ,161.853,
248.714 ,162.167,
249.869 ,162.265,
251.025 ,162.088,
251.573 ,161.697,
251.906 ,161.324,
252.455 ,161.011,
253.081 ,160.717,
253.336 ,160.364,
253.865 ,159.874,
254.492 ,159.776,
255.628 ,159.737,
256.626 ,159.619,
257.645 ,159.463,
258.135 ,159.071,
258.428 ,158.698,
259.114 ,158.326,
260.093 ,158.072,
260.935 ,157.876,
261.484 ,157.542,
262.052 ,157.366,
262.776 ,157.209,
263.775 ,157.307,
264.676 ,157.209,
265.656 ,157.092,
266.752 ,157.15,
267.477 ,156.876,
267.986 ,156.21,
268.358 ,156.484,
268.828 ,156.955,
269.671 ,157.15,
270.63 ,157.229,
271.59 ,157.111,
272.609 ,157.19,
273.549 ,157.209,
274.175 ,157.111,
275.018 ,157.17,
275.781 ,157.386,
276.682 ,157.249,
276.76 ,157.249,
277.76 ,157.249,
278.68 ,157.111,
279.718 ,157.249,
280.384 ,156.915,
280.893 ,156.582,
281.579 ,156.308,
282.832 ,155.563,
283.479 ,155.7,
284.243 ,155.975,
284.908 ,156.328,
286.182 ,156.935,
287.161 ,156.955,
288.081 ,156.955,
289.159 ,156.837,
290.236 ,156.7,
291.058 ,156.426,
291.744 ,156.132,
292.86 ,156.092,
293.605 ,155.877,
294.388 ,156.073,
294.897 ,156.386,
295.602 ,156.7,
296.699 ,156.661,
297.385 ,156.915,
298.579 ,157.17,
299.833 ,157.268,
300.871 ,157.19,
301.654 ,156.876,
302.32 ,156.563,
303.221 ,156.484,
304.122 ,156.621,
305.16 ,156.719,
306.1 ,156.563,
307.001 ,156.563,
307.883 ,156.661,
308.803 ,156.759,
309.704 ,156.582,
310.781 ,156.426,
311.8 ,156.386,
311.936 ,156.386,
312.936 ,156.386,
313.856 ,156.288,
314.757 ,156.21,
315.032 ,155.72,
315.071 ,155.309,
315.697 ,155.583,
315.874 ,156.034,
316.207 ,156.445,
316.618 ,156.778,
317.46 ,156.955,
318.596 ,156.896,
319.908 ,156.876,
320.809 ,156.817,
321.122 ,156.817,
322.122 ,156.817,
323.062 ,156.798,
324.374 ,156.837,
325.49 ,156.915,
326.196 ,157.229,
326 ,157.601,
326.646 ,157.895,
327.723 ,158.13,
328.84 ,158.385,
330.132 ,158.561,
331.484 ,158.718,
332.502 ,158.875,
333.638 ,158.895,
334.285 ,158.561,
335.166 ,158.836,
335.93 ,159.149,
336.811 ,159.384,
338.026 ,159.482,
339.181 ,159.6,
339.671 ,159.992,
340.807 ,160.227,
341.57 ,160.58,
342.687 ,160.736,
343.842 ,160.717,
344.92 ,160.776,
346.114 ,160.756,
347.309 ,160.834,
348.426 ,160.971,
349.464 ,161.207,
350.502 ,161.403,
351.207 ,161.697,
351.089 ,162.088,
350.56 ,162.441,
350.11 ,162.892,
349.757 ,163.245,
349.287 ,163.656,
347.975 ,163.813,
347.387 ,164.165,
346.095 ,164.381,
345.644 ,164.773,
344.959 ,165.145,
344.234 ,165.459,
343.823 ,165.87,
343.568 ,166.243,
343.47 ,166.693,
343.49 ,167.066,
344.058 ,167.457,
344.273 ,167.83,
344.743 ,168.183,
346.604 ,168.32,
346.996 ,168.751,
345.194 ,168.907,
343.666 ,169.123,
341.766 ,169.162,
340.924 ,169.73,
340.748 ,170.201,
340.317 ,170.573,
339.788 ,170.945,
341.12 ,171.279,
341.629 ,171.69,
342.491 ,172.062,
343.705 ,172.395,
345.096 ,172.709,
346.604 ,173.022,
348.896 ,173.336,
349.405 ,173.826,
352.284 ,174.041,
352.477 ,174.118,
353.224 ,174.414,
355.986 ,174.159,
358.277 ,174.473,
360 ,174.713,
360 ,175,
360 ,176,
360 ,177,
360 ,178,
360 ,179,
360 ,180,
360 ,180,
359 ,180,
358 ,180,
357 ,180,
356 ,180,
355 ,180,
354 ,180,
353 ,180,
352 ,180,
351 ,180,
350 ,180,
349 ,180,
348 ,180,
347 ,180,
346 ,180,
345 ,180,
344 ,180,
343 ,180,
342 ,180,
341 ,180,
340 ,180,
339 ,180,
338 ,180,
337 ,180,
336 ,180,
335 ,180,
334 ,180,
333 ,180,
332 ,180,
331 ,180,
330 ,180,
329 ,180,
328 ,180,
327 ,180,
326 ,180,
325 ,180,
324 ,180,
323 ,180,
322 ,180,
321 ,180,
320 ,180,
319 ,180,
318 ,180,
317 ,180,
316 ,180,
315 ,180,
314 ,180,
313 ,180,
312 ,180,
311 ,180,
310 ,180,
309 ,180,
308 ,180,
307 ,180,
306 ,180,
305 ,180,
304 ,180,
303 ,180,
302 ,180,
301 ,180,
300 ,180,
299 ,180,
298 ,180,
297 ,180,
296 ,180,
295 ,180,
294 ,180,
293 ,180,
292 ,180,
291 ,180,
290 ,180,
289 ,180,
288 ,180,
287 ,180,
286 ,180,
285 ,180,
284 ,180,
283 ,180,
282 ,180,
281 ,180,
280 ,180,
279 ,180,
278 ,180,
277 ,180,
276 ,180,
275 ,180,
274 ,180,
273 ,180,
272 ,180,
271 ,180,
270 ,180,
269 ,180,
268 ,180,
267 ,180,
266 ,180,
265 ,180,
264 ,180,
263 ,180,
262 ,180,
261 ,180,
260 ,180,
259 ,180,
258 ,180,
257 ,180,
256 ,180,
255 ,180,
254 ,180,
253 ,180,
252 ,180,
251 ,180,
250 ,180,
249 ,180,
248 ,180,
247 ,180,
246 ,180,
245 ,180,
244 ,180,
243 ,180,
242 ,180,
241 ,180,
240 ,180,
239 ,180,
238 ,180,
237 ,180,
236 ,180,
235 ,180,
234 ,180,
233 ,180,
232 ,180,
231 ,180,
230 ,180,
229 ,180,
228 ,180,
227 ,180,
226 ,180,
225 ,180,
224 ,180,
223 ,180,
222 ,180,
221 ,180,
220 ,180,
219 ,180,
218 ,180,
217 ,180,
216 ,180,
215 ,180,
214 ,180,
213 ,180,
212 ,180,
211 ,180,
210 ,180,
209 ,180,
208 ,180,
207 ,180,
206 ,180,
205 ,180,
204 ,180,
203 ,180,
202 ,180,
201 ,180,
200 ,180,
199 ,180,
198 ,180,
197 ,180,
196 ,180,
195 ,180,
194 ,180,
193 ,180,
192 ,180,
191 ,180,
190 ,180,
189 ,180,
188 ,180,
187 ,180,
186 ,180,
185 ,180,
184 ,180,
183 ,180,
182 ,180,
181 ,180,
180 ,180,
179 ,180,
178 ,180,
177 ,180,
176 ,180,
175 ,180,
174 ,180,
173 ,180,
172 ,180,
171 ,180,
170 ,180,
169 ,180,
168 ,180,
167 ,180,
166 ,180,
165 ,180,
164 ,180,
163 ,180,
162 ,180,
161 ,180,
160 ,180,
159 ,180,
158 ,180,
157 ,180,
156 ,180,
155 ,180,
154 ,180,
153 ,180,
152 ,180,
151 ,180,
150 ,180,
149 ,180,
148 ,180,
147 ,180,
146 ,180,
145 ,180,
144 ,180,
143 ,180,
142 ,180,
141 ,180,
140 ,180,
139 ,180,
138 ,180,
137 ,180,
136 ,180,
135 ,180,
134 ,180,
133 ,180,
132 ,180,
131 ,180,
130 ,180,
129 ,180,
128 ,180,
127 ,180,
126 ,180,
125 ,180,
124 ,180,
123 ,180,
122 ,180,
121 ,180,
120 ,180,
119 ,180,
118 ,180,
117 ,180,
116 ,180,
115 ,180,
114 ,180,
113 ,180,
112 ,180,
111 ,180,
110 ,180,
109 ,180,
108 ,180,
107 ,180,
106 ,180,
105 ,180,
104 ,180,
103 ,180,
102 ,180,
101 ,180,
100 ,180,
99 ,180,
98 ,180,
97 ,180,
96 ,180,
95 ,180,
94 ,180,
93 ,180,
92 ,180,
91 ,180,
90 ,180,
89 ,180,
88 ,180,
87 ,180,
86 ,180,
85 ,180,
84 ,180,
83 ,180,
82 ,180,
81 ,180,
80 ,180,
79 ,180,
78 ,180,
77 ,180,
76 ,180,
75 ,180,
74 ,180,
73 ,180,
72 ,180,
71 ,180,
70 ,180,
69 ,180,
68 ,180,
67 ,180,
66 ,180,
65 ,180,
64 ,180,
63 ,180,
62 ,180,
61 ,180,
60 ,180,
59 ,180,
58 ,180,
57 ,180,
56 ,180,
55 ,180,
54 ,180,
53 ,180,
52 ,180,
51 ,180,
50 ,180,
49 ,180,
48 ,180,
47 ,180,
46 ,180,
45 ,180,
44 ,180,
43 ,180,
42 ,180,
41 ,180,
40 ,180,
39 ,180,
38 ,180,
37 ,180,
36 ,180,
35 ,180,
34 ,180,
33 ,180,
32 ,180,
31 ,180,
30 ,180,
29 ,180,
28 ,180,
27 ,180,
26 ,180,
25 ,180,
24 ,180,
23 ,180,
22 ,180,
21 ,180,
20 ,180,
19 ,180,
18 ,180,
17 ,180,
16 ,180,
15 ,180,
14 ,180,
13 ,180,
12 ,180,
11 ,180,
10 ,180,
9 ,180,
8 ,180,
7 ,180,
6 ,180,
5 ,180,
4 ,180,
3 ,180,
2 ,180,
1 ,180,
0 ,180,
0 ,179.713,
0 ,178.713,
0 ,177.713,
0 ,176.713,
0 ,175.713,
0 ,174.713,
0.058 ,174.721,
0.941 ,174.139,
2.743 ,174.453,
2.859 ,174.418,
3.138 ,174.334,
3.476 ,174.232,
3.77 ,174.143,
3.915 ,174.099,
4.066 ,174.102,
4.17 ,174.118,
5.617 ,174.534,
6.883 ,174.118,
7.111 ,174.061,
10.049 ,173.885,
11 ,174.118,
11.47 ,174.237,
12.978 ,174.57,
15.818 ,174.825,
18.07 ,175.139,
21.929 ,175.374,
24.808 ,175.1,
29.058 ,175.296,
31.467 ,175.609,
34.111 ,175.315,
36.892 ,175.041,
37.108 ,174.57,
33.171 ,174.531,
29.939 ,174.296,
29.097 ,173.904,
26.414 ,173.689,
26.59 ,173.238,
26.962 ,172.827,
27.334 ,172.454,
27.138 ,172.043,
25.474 ,171.768,
24.71 ,171.416,
23.163 ,171.102,
25.591 ,171.161,
27.902 ,171.004,
29.352 ,171.337,
31.134 ,171.043,
32.779 ,170.671,
33.582 ,170.338,
33.23 ,169.926,
31.937 ,169.652,
30.468 ,169.358,
28.412 ,169.299,
26.61 ,169.162,
24.671 ,169.064,
24.024 ,168.692,
22.732 ,168.378,
21.948 ,168.026,
21.635 ,166.889,
22.125 ,166.987,
23.025 ,167.301,
24.671 ,167.203,
26.257 ,167.066,
27.08 ,167.497,
28.666 ,167.399,
29.998 ,167.183,
31.252 ,166.909,
32.388 ,166.576,
33.896 ,166.478,
33.856 ,166.105,
33.504 ,165.733,
33.798 ,165.38,
35.09 ,165.204,
35.678 ,165.537,
37.206 ,165.341,
38.361 ,165.086,
39.791 ,165.067,
41.142 ,164.969,
42.494 ,164.734,
43.571 ,164.518,
44.785 ,164.303,
45.569 ,164.361,
46.254 ,164.44,
47.743 ,164.303,
49.075 ,164.479,
50.446 ,164.459,
51.758 ,164.322,
53.109 ,164.42,
54.598 ,164.518,
55.989 ,164.479,
57.438 ,164.499,
58.926 ,164.518,
60.297 ,164.479,
61.316 ,164.185,
62.53 ,164.028,
63.784 ,164.244,
64.978 ,164.068,
66.056 ,163.715,
66.702 ,164.028,
67.055 ,164.381,
67.701 ,164.714,
68.739 ,164.42,
69.934 ,164.793,
71.285 ,164.91,
72.441 ,165.184,
73.851 ,165.126,
75.124 ,164.949,
76.632 ,164.988,
77.983 ,165.126,
79.354 ,165.302,
79.883 ,164.871,
79.237 ,164.538,
78.747 ,164.185,
77.455 ,164.107,
76.887 ,163.734,
76.671 ,163.362,
76.319 ,162.618,
77.083 ,162.755,
78.395 ,162.813,
79.687 ,162.755,
80.863 ,162.911,
81.881 ,163.205,
82.312 ,163.558,
83.663 ,163.617,
84.956 ,163.48,
86.327 ,163.284,
87.561 ,163.166,
88.579 ,163.401,
89.911 ,163.323,
90.773 ,162.559,
91.576 ,163.009,
92.732 ,163.186,
93.985 ,163.088,
94.808 ,163.48,
96.12 ,163.519,
97.334 ,163.636,
98.529 ,163.852,
99.313 ,163.48,
99.704 ,163.127,
100.703 ,163.519,
102.074 ,163.421,
103.093 ,163.636,
103.778 ,163.97,
105.11 ,163.872,
106.148 ,163.656,
107.166 ,163.401,
108.381 ,163.264,
109.791 ,163.147,
111.064 ,163.009,
112.043 ,162.794,
112.631 ,162.48,
112.866 ,162.049,
112.748 ,161.638,
112.435 ,161.246,
112.083 ,160.854,
111.769 ,160.462,
111.515 ,160.109,
111.456 ,159.717,
111.554 ,159.326,
112.024 ,158.953,
112.416 ,158.542,
112.572 ,158.15,
112.376 ,157.719,
112.259 ,157.327,
112.748 ,156.876,
113.297 ,156.582,
113.943 ,156.21,
114.629 ,155.896,
115.432 ,155.603,
115.823 ,155.171,
116.372 ,154.897,
116.999 ,154.642,
117.958 ,154.584,
118.585 ,154.27,
119.29 ,154.074,
120.113 ,153.957,
120.837 ,153.702,
121.405 ,153.388,
122.189 ,153.271,
122.776 ,153.525,
122.404 ,153.859
];


//Australia:
const A2 = [
323.562, 103.764,
323.922, 104.548,
324.564, 104.171,
324.895, 104.594,
325.375, 104.985,
325.272, 105.428,
325.485, 106.286,
325.637, 106.785,
325.889, 106.907,
326.16, 107.762,
326.064, 108.28,
326.387, 108.958,
327.471, 109.481,
328.178, 109.956,
328.848, 110.391,
328.717, 110.633,
329.289, 111.261,
329.678, 112.343,
330.077, 112.123,
330.483, 112.556,
330.727, 112.402,
330.9, 113.462,
331.609, 114.076,
332.074, 114.458,
332.855, 115.268,
333.136, 116.071,
333.162, 116.641,
333.093, 117.26,
333.569, 118.11,
333.512, 118.995,
333.339, 119.458,
333.069, 120.35,
333.09, 120.924,
332.892, 121.64,
332.45, 122.55,
331.709, 123.041,
331.344, 123.816,
331.011, 124.31,
330.714, 125.173,
330.328, 125.672,
330.075, 126.42,
329.946, 127.109,
329.997, 127.425,
329.424, 127.773,
328.305, 127.809,
327.382, 128.219,
326.922, 128.607,
326.318, 129.036,
325.49, 128.594,
324.877, 128.417,
325.032, 127.896,
324.486, 128.085,
323.61, 128.809,
322.745, 128.538,
322.178, 128.38,
321.607, 128.309,
320.639, 128.019,
319.992, 127.403,
319.807, 126.644,
319.574, 126.138,
319.083, 125.733,
318.121, 125.612,
318.449, 125.127,
318.208, 124.385,
317.719, 125.077,
316.829, 125.261,
317.352, 124.707,
317.504, 124.13,
317.89, 123.64,
317.81, 122.9,
316.997, 123.753,
316.372, 124.095,
315.989, 124.89,
315.208, 124.479,
315.239, 123.948,
314.613, 123.223,
314.086, 122.848,
314.274, 122.617,
312.991, 122.011,
312.288, 121.983,
311.326, 121.496,
309.536, 121.59,
308.241, 121.948,
307.103, 122.282,
306.149, 122.216,
305.089, 122.729,
304.222, 122.959,
304.029, 123.484,
303.66, 123.89,
302.811, 123.914,
302.183, 124.003,
301.299, 123.821,
300.58, 123.93,
299.894, 123.976,
299.299, 124.509,
299.007, 124.464,
298.506, 124.747,
298.025, 125.065,
297.296, 125.025,
296.625, 125.025,
295.564, 124.386,
295.027, 124.197,
295.049, 123.623,
295.545, 123.487,
295.715, 123.26,
295.679, 122.9,
295.802, 122.205,
295.69, 121.612,
295.161, 120.602,
294.997, 120.031,
295.04, 119.461,
294.642, 118.81,
294.616, 118.516,
294.174, 118.118,
294.049, 117.335,
293.477, 116.543,
293.339, 116.117,
293.778, 116.549,
293.441, 115.621,
293.937, 115.911,
294.233, 116.298,
294.216, 115.786,
293.721, 114.999,
293.625, 114.684,
293.394, 114.385,
293.502, 113.806,
293.707, 113.56,
293.843, 113.06,
293.737, 112.475,
294.15, 111.756,
294.225, 112.517,
294.648, 111.83,
295.46, 111.495,
295.947, 111.069,
296.712, 110.702,
297.166, 110.624,
297.442, 110.747,
298.23, 110.374,
298.836, 110.263,
298.988, 110.044,
299.252, 109.953,
299.805, 109.977,
300.856, 109.684,
301.4, 109.24,
301.655, 108.705,
302.242, 108.198,
302.287, 107.799,
302.313, 107.255,
303.013, 106.405,
303.434, 107.269,
303.859, 107.069,
303.503, 106.597,
303.817, 106.111,
304.258, 106.328,
304.38, 105.567,
304.926, 105.075,
305.167, 104.68,
305.67, 104.51,
305.686, 104.231,
306.125, 104.347,
306.143, 104.096,
306.583, 103.953,
307.066, 103.818,
307.805, 104.277,
308.36, 104.869,
308.986, 104.876,
309.621, 104.97,
309.41, 104.421,
309.889, 103.619,
310.339, 103.357,
310.184, 103.108,
310.618, 102.536,
311.223, 102.184,
311.735, 102.302,
312.575, 102.114,
312.557, 101.603,
311.825, 101.274,
312.357, 101.129,
313.02, 101.376,
313.551, 101.787,
314.393, 102.042,
314.679, 101.941,
315.298, 102.249,
315.883, 101.962,
316.258, 102.049,
316.492, 101.857,
316.952, 102.352,
316.685, 102.887,
316.305, 103.291,
315.962, 103.325,
316.078, 103.724,
315.784, 104.224,
315.429, 104.715,
315.5, 104.998,
316.295, 105.55,
317.065, 105.871,
317.58, 106.215,
318.303, 106.808,
318.585, 106.807,
319.109, 107.063,
319.261, 107.372,
320.215, 107.711,
320.875, 107.369,
321.071, 106.832,
321.274, 106.389,
321.398, 105.841,
321.702, 105.045,
321.563, 104.561,
321.636, 104.27,
321.52, 103.698,
321.651, 102.945,
321.843, 102.742,
321.687, 102.408,
321.929, 101.877,
322.118, 101.328,
322.144, 101.043,
322.515, 100.668,
322.797, 101.157,
322.867, 101.785,
323.116, 101.906,
323.159, 102.326,
323.522, 102.834,
323.597, 103.4
];




//The America's:
const A3 = [
89.453, 20.502,
89.448, 21.525,
90.785, 20.741,
91.98, 21.385,
91.682, 22.127,
92.65, 22.801,
93.694, 22.078,
94.423, 21.216,
94.478, 20.118,
95.899, 20.195,
97.378, 20.342,
98.72, 20.838,
98.78, 21.334,
98.036, 21.867,
98.741, 22.403,
98.614, 22.889,
96.656, 23.588,
95.265, 23.743,
94.231, 23.442,
93.932, 23.944,
92.969, 24.787,
92.677, 25.224,
91.517, 25.901,
90.086, 25.967,
89.296, 26.39,
89.23, 27.04,
88.067, 27.165,
86.843, 27.975,
85.758, 29.101,
85.371, 29.89,
85.315, 31.051,
86.785, 31.218,
87.235, 32.154,
87.703, 32.913,
89.102, 32.715,
90.961, 33.148,
91.96, 33.528,
92.676, 34.001,
93.929, 34.276,
94.988, 34.697,
96.64, 34.755,
97.727, 34.852,
97.564, 35.718,
97.875, 36.723,
98.599, 37.842,
100.087, 38.792,
100.857, 38.466,
101.398, 37.438,
100.876, 35.859,
100.17, 35.332,
101.771, 34.864,
102.904, 34.162,
103.459, 33.466,
103.377, 32.797,
102.698, 31.948,
101.483, 31.195,
102.663, 30.147,
102.227, 29.242,
101.893, 27.68,
102.589, 27.45,
104.304, 27.721,
105.332, 27.819,
106.16, 27.556,
107.091, 27.895,
108.323, 28.475,
108.626, 28.863,
110.41, 28.938,
110.38, 29.779,
110.712, 31.043,
111.625, 31.199,
112.35, 31.788,
113.798, 31.233,
114.755, 30.129,
115.417, 29.664,
116.195, 30.557,
117.498, 31.833,
118.604, 33.032,
118.201, 33.661,
119.531, 34.224,
120.43, 34.796,
122.025, 35.055,
122.667, 35.373,
123.063, 36.22,
123.842, 36.352,
124.244, 36.729,
124.317, 37.853,
123.591, 38.229,
122.873, 38.58,
121.225, 38.936,
119.967, 39.757,
118.276, 39.919,
116.138, 39.709,
114.637, 39.702,
113.601, 39.771,
112.764, 40.489,
111.489, 40.932,
110.046, 42.255,
108.896, 43.178,
109.745, 43.014,
111.35, 41.7,
113.448, 40.867,
114.944, 40.767,
115.829, 41.258,
114.885, 41.929,
115.201, 43.007,
115.528, 43.761,
116.827, 44.261,
118.479, 44.116,
119.482, 42.992,
119.551, 43.717,
120.197, 44.08,
118.96, 44.735,
116.745, 45.33,
115.753, 45.734,
114.636, 46.455,
113.877, 46.381,
113.838, 45.535,
115.575, 44.708,
113.974, 44.741,
112.863, 44.862,
113.035, 45.19,
111.968, 45.675,
110.94, 46.02,
109.884, 46.316,
109.31, 46.97,
109.185, 47.135,
109.175, 47.665,
109.505, 48.195,
109.92, 48.22,
109.815, 47.855,
110.115, 48.077,
110.035, 48.363,
109.36, 48.525,
108.88, 48.505,
108.14, 48.68,
107.705, 48.73,
107.124, 48.779,
106.29, 49.069,
107.759, 48.88,
108.055, 49.07,
106.655, 49.37,
106.018, 49.372,
106.048, 49.249,
105.743, 49.526,
106.038, 49.572,
105.822, 50.291,
105.094, 51.06,
105.02, 50.804,
104.8, 50.752,
104.472, 50.502,
104.68, 51.04,
104.917, 51.219,
104.943, 51.596,
104.623, 51.984,
104.06, 52.783,
103.969, 52.743,
104.278, 52.063,
103.767, 51.681,
103.65, 50.85,
103.457, 51.282,
103.671, 51.917,
103.04, 51.767,
103.698, 52.082,
103.741, 53.034,
104.028, 53.103,
104.132, 53.449,
104.273, 54.449,
103.637, 55.192,
102.602, 55.488,
101.945, 56.075,
101.446, 56.139,
100.939, 56.506,
100.797, 56.841,
99.699, 57.491,
99.135, 57.967,
98.664, 58.56,
98.51, 59.27,
98.686, 59.964,
99.02, 60.82,
99.464, 61.528,
99.47, 61.96,
99.943, 63.12,
99.912, 63.794,
99.869, 64.183,
99.619, 64.794,
99.32, 64.92,
98.828, 64.799,
98.67, 64.36,
98.29, 64.13,
97.76, 63.27,
97.295, 62.505,
97.145, 62.114,
97.35, 61.45,
97.07, 60.9,
96.29, 60.063,
95.9, 59.91,
94.891, 60.364,
94.712, 60.314,
94.227, 59.847,
93.6, 59.6,
92.47, 59.726,
91.582, 59.615,
90.82, 59.684,
90.395, 59.824,
90.586, 60.106,
90.57, 60.511,
90.782, 60.709,
90.592, 60.84,
90.221, 60.693,
89.845, 60.883,
89.12, 60.851,
88.373, 60.323,
87.501, 60.448,
86.774, 60.216,
86.152, 60.286,
85.31, 60.52,
84.4, 61.261,
83.406, 61.693,
82.86, 62.17,
82.63, 62.62,
82.62, 63.31,
82.67, 63.79,
82.86, 64.13,
82.861, 64.132,
82.858, 64.134,
82.472, 65.008,
82.297, 65.728,
82.224, 67.067,
82.128, 67.556,
82.301, 68.101,
82.611, 68.589,
82.811, 69.365,
83.474, 70.109,
83.708, 70.68,
84.099, 71.172,
85.161, 71.437,
85.574, 71.856,
86.451, 71.576,
87.214, 71.475,
87.963, 71.295,
88.592, 71.124,
89.228, 70.716,
89.466, 70.133,
89.549, 69.292,
89.721, 69,
90.399, 68.738,
91.456, 68.506,
92.342, 68.541,
92.948, 68.456,
93.188, 68.669,
93.154, 69.15,
92.617, 69.745,
92.379, 70.354,
92.563, 70.528,
92.414, 70.96,
92.163, 71.74,
91.909, 71.483,
91.7, 71.5,
91.704, 71.647,
91.893, 71.651,
91.877, 71.923,
91.715, 72.356,
91.802, 72.51,
91.697, 72.868,
91.76, 72.964,
91.645, 73.469,
91.448, 73.734,
91.268, 73.766,
91.069, 74.113,
91.395, 74.294,
91.482, 74.144,
91.775, 74.272,
91.879, 74.311,
92.098, 74.135,
92.384, 74.121,
92.477, 74.203,
92.632, 74.153,
93.097, 74.243,
93.559, 74.217,
93.881, 74.107,
93.998, 73.995,
94.317, 74.046,
94.556, 74.114,
94.818, 74.091,
95.016, 74.004,
95.473, 74.143,
95.632, 74.165,
95.937, 74.352,
96.226, 74.576,
96.59, 74.729,
96.853, 75.004,
96.767, 75.1,
96.716, 75.323,
96.818, 75.689,
96.588, 76.03,
96.48, 76.432,
96.448, 76.873,
96.502, 77.131,
96.527, 77.581,
96.374, 77.679,
96.28, 78.107,
96.349, 78.371,
96.145, 78.627,
96.191, 78.897,
96.344, 79.061,
96.598, 79.604,
96.984, 80.007,
97.454, 80.434,
97.813, 80.792,
97.792, 81.004,
98.191, 81.049,
98.286, 80.968,
98.561, 81.214,
99.053, 81.141,
99.478, 80.889,
100.085, 80.687,
100.427, 80.388,
100.979, 80.447,
100.942, 80.545,
101.499, 80.58,
101.944, 80.752,
102.271, 81.053,
102.647, 81.33,
103.163, 81.361,
103.914, 80.663,
104.325, 80.557,
104.335, 80.226,
104.52, 79.381,
105.093, 78.917,
105.723, 78.898,
105.803, 78.69,
106.585, 78.773,
107.372, 78.268,
107.762, 78.044,
108.246, 77.563,
108.6, 77.624,
108.863, 77.887,
108.668, 78.224,
108.64, 78.46,
108.053, 78.577,
108.379, 79.031,
108.367, 79.554,
107.926, 80.134,
108.304, 80.928,
108.735, 80.863,
108.96, 80.14,
108.65, 79.788,
108.599, 79.031,
109.845, 78.625,
109.706, 78.153,
110.057, 77.838,
110.416, 78.54,
111.117, 78.557,
111.767, 79.114,
111.806, 79.445,
112.704, 79.454,
113.772, 79.351,
114.345, 79.799,
115.11, 79.923,
115.671, 79.61,
115.682, 79.359,
116.921, 79.298,
118.119, 79.284,
117.27, 79.58,
117.612, 80.052,
118.411, 80.127,
119.169, 80.619,
119.329, 81.42,
119.85, 81.397,
120.242, 81.633,
120.898, 82.001,
121.517, 82.652,
121.545, 83.167,
121.922, 83.191,
122.458, 83.679,
122.853, 84.027,
124.051, 84.227,
124.158, 84.047,
124.967, 83.975,
126.042, 84.243,
126.382, 84.354,
127.118, 84.59,
128.177, 85.434,
128.342, 85.844,
128.683, 85.797,
128.93, 86.349,
129.491, 88.099,
130.026, 88.263,
130.053, 88.954,
129.301, 89.777,
129.612, 90.078,
131.38, 90.235,
131.416, 91.238,
132.175, 90.582,
133.433, 90.941,
135.094, 91.552,
135.582, 92.138,
135.418, 92.691,
136.581, 92.383,
138.527, 92.912,
140.021, 92.873,
141.5, 93.701,
142.777, 94.821,
143.547, 95.109,
144.402, 95.149,
144.765, 95.465,
145.104, 96.738,
145.27, 97.343,
144.872, 98.996,
144.363, 99.649,
142.953, 101.041,
142.316, 102.171,
141.576, 103.038,
141.326, 103.058,
141.047, 103.793,
141.118, 105.667,
140.839, 107.208,
140.733, 107.868,
140.417, 108.262,
140.239, 109.599,
139.225, 110.904,
139.055, 111.937,
138.246, 112.371,
138.012, 112.97,
136.925, 112.968,
135.352, 113.352,
134.648, 113.797,
133.528, 114.089,
132.351, 114.885,
131.505, 115.877,
131.359, 116.624,
131.525, 117.176,
131.339, 118.186,
131.112, 118.674,
130.413, 119.224,
129.303, 120.984,
128.424, 121.778,
127.744, 122.245,
127.288, 123.197,
126.626, 123.768,
126.194, 124.397,
125.064, 124.953,
124.326, 124.753,
123.785, 124.86,
122.86, 124.43,
122.182, 124.463,
121.573, 123.909,
121.505, 124.432,
122.774, 125.288,
122.638, 125.977,
123.263, 126.413,
123.212, 126.901,
122.251, 128.184,
120.768, 128.72,
118.763, 128.928,
117.664, 128.828,
117.874, 129.424,
117.669, 130.173,
117.854, 130.677,
117.254, 131.029,
116.229, 131.167,
115.268, 130.803,
114.882, 131.064,
115.021, 132.058,
115.697, 132.359,
116.244, 132.044,
116.542, 132.563,
115.621, 132.873,
114.818, 133.495,
114.671, 134.501,
114.435, 135.037,
113.49, 135.04,
112.706, 135.552,
112.419, 136.302,
113.403, 137.034,
114.359, 137.236,
114.015, 138.133,
112.834, 138.697,
112.184, 139.87,
111.271, 140.264,
110.862, 140.732,
111.185, 141.771,
111.85, 142.35,
111.429, 142.299,
110.539, 142.292,
110.057, 142.538,
109.155, 142.899,
108.994, 143.833,
108.57, 143.856,
107.442, 143.531,
106.297, 142.835,
105.053, 142.263,
104.74, 141.629,
105.023, 141.043,
104.52, 140.378,
104.392, 138.674,
104.817, 137.712,
105.873, 136.939,
104.356, 136.648,
105.308, 135.764,
105.648, 134.103,
106.76, 134.455,
107.282, 132.383,
106.611, 132.117,
106.299, 133.366,
105.668, 133.225,
105.982, 131.795,
106.323, 129.942,
106.782, 129.259,
106.495, 128.283,
106.412, 127.156,
106.833, 127.124,
107.447, 125.509,
108.138, 123.909,
108.562, 122.419,
108.331, 120.921,
108.63, 120.096,
108.51, 118.861,
109.095, 117.64,
109.275, 115.706,
109.596, 113.629,
109.909, 111.393,
109.836, 109.756,
109.628, 108.348,
108.625, 107.774,
108.538, 107.363,
106.555, 106.359,
104.762, 105.266,
103.991, 104.649,
103.577, 103.823,
103.741, 103.535,
102.894, 102.223,
101.908, 100.378,
100.963, 98.387,
100.554, 97.931,
100.24, 97.194,
99.463, 96.542,
98.75, 96.137,
99.074, 95.69,
98.589, 94.737,
98.9, 94.036,
99.698, 93.405,
100.23, 92.657,
100.013, 92.221,
99.631, 92.685,
99.032, 92.247,
99.235, 91.965,
99.066, 91.057,
99.417, 90.907,
99.601, 90.284,
99.979, 89.64,
99.909, 89.232,
100.457, 89.017,
101.145, 88.619,
101.009, 88.309,
101.382, 88.234,
101.338, 87.733,
101.572, 87.37,
102.068, 87.303,
102.49, 86.675,
102.872, 86.15,
102.504, 85.912,
102.692, 85.332,
102.467, 84.417,
102.681, 84.155,
102.523, 83.309,
102.118, 82.776,
101.785, 82.488,
101.571, 81.948,
101.818, 81.681,
101.565, 81.612,
101.378, 81.282,
100.88, 81.004,
100.442, 81.068,
100.24, 81.416,
99.836, 81.667,
99.617, 81.701,
99.519, 81.91,
99.996, 82.453,
99.723, 82.58,
99.579, 82.729,
99.114, 82.779,
98.94, 82.182,
98.81, 82.352,
98.481, 82.293,
98.279, 81.891,
97.869, 81.825,
97.609, 81.708,
97.18, 81.709,
97.149, 81.926,
97.034, 81.775,
96.492, 81.553,
96.289, 81.343,
96.404, 81.169,
96.367, 80.948,
96.09, 80.709,
95.697, 80.513,
95.352, 80.385,
95.287, 80.092,
95.024, 79.913,
95.089, 80.204,
94.889, 80.443,
94.661, 80.166,
94.339, 80.067,
94.203, 79.865,
94.208, 79.561,
94.341, 79.246,
94.058, 79.105,
94.287, 78.911,
93.942, 78.596,
93.474, 78.193,
93.254, 77.856,
92.833, 77.542,
92.331, 77.09,
92.443, 76.935,
92.608, 77.086,
92.683, 77.015,
92.511, 76.703,
92.207, 76.615,
92.096, 76.851,
91.517, 76.836,
91.157, 76.74,
90.743, 76.541,
90.188, 76.479,
89.904, 76.265,
89.391, 76.09,
88.768, 76.072,
88.31, 75.874,
87.772, 75.461,
86.641, 74.385,
86.125, 74.06,
85.308, 73.799,
84.75, 73.872,
83.947, 74.248,
83.443, 74.346,
82.736, 74.083,
81.987, 73.893,
81.052, 73.434,
80.303, 73.294,
79.17, 72.829,
78.334, 72.351,
78.081, 72.084,
77.522, 72.024,
76.499, 71.708,
76.083, 71.251,
75.008, 70.684,
74.507, 70.053,
74.269, 69.566,
74.602, 69.468,
74.499, 69.183,
74.729, 68.924,
74.734, 68.578,
74.397, 68.129,
74.307, 67.731,
73.971, 67.226,
73.09, 66.232,
72.085, 65.451,
71.598, 64.828,
70.74, 64.419,
70.556, 64.175,
70.708, 63.557,
70.199, 63.324,
69.608, 62.838,
69.359, 62.14,
68.821, 62.059,
68.24, 61.532,
67.772, 61.045,
67.728, 60.733,
67.19, 59.979,
66.836, 59.213,
66.851, 58.829,
66.128, 58.432,
65.794, 58.476,
65.224, 58.2,
65.063, 58.607,
65.229, 59.086,
65.326, 59.837,
65.669, 60.25,
66.411, 60.938,
66.576, 61.174,
66.728, 61.245,
66.86, 61.589,
67.038, 61.575,
67.238, 62.22,
67.542, 62.474,
67.755, 62.828,
68.383, 63.337,
68.715, 64.267,
69.012, 64.705,
69.29, 65.174,
69.345, 65.701,
69.827, 65.734,
70.228, 66.189,
70.591, 66.635,
70.567, 66.814,
70.146, 67.182,
69.969, 67.177,
69.705, 66.569,
69.05, 65.999,
68.329, 65.516,
67.818, 65.261,
67.851, 64.53,
67.699, 63.988,
67.223, 63.678,
66.535, 63.232,
66.403, 63.36,
66.151, 63.1,
65.534, 62.858,
64.945, 62.277,
65.018, 62.202,
65.43, 62.258,
65.801, 61.885,
65.838, 61.434,
65.068, 60.721,
64.481, 60.444,
64.113, 59.819,
63.742, 59.164,
63.279, 58.364,
62.872, 57.465,
62.704, 56.954,
62.056, 56.379,
61.589, 56.259,
61.48, 55.972,
60.919, 55.922,
60.561, 55.651,
59.632, 55.553,
59.377, 55.391,
59.256, 54.843,
58.285, 53.838,
57.453, 52.448,
57.488, 52.216,
57.047, 51.886,
56.273, 51.048,
56.135, 50.233,
55.602, 49.687,
55.821, 48.858,
55.786, 48,
55.467, 47.234,
55.858, 46.292,
56.101, 44.477,
55.92, 43.135,
55.604, 42.28,
55.313, 41.815,
55.434, 41.62,
56.88, 41.96,
57.413, 42.904,
57.66, 42.64,
57.5, 41.82,
57.16, 41,
57.026, 40.997,
55.09, 40.015,
54.375, 39.583,
52.564, 39.169,
52.007, 38.284,
52.15, 37.67,
50.87, 37.245,
50.695, 36.438,
49.485, 35.712,
49.464, 35.197,
48.914, 34.821,
48.033, 34.502,
47.75, 33.63,
46.461, 32.821,
45.922, 31.877,
44.962, 31.812,
43.372, 31.788,
42.2, 31.5,
40.132, 30.462,
39.175, 30.273,
37.426, 29.916,
36.041, 30.001,
34.075, 29.541,
32.886, 29.115,
31.776, 29.327,
31.982, 30.022,
31.429, 30.086,
30.272, 30.294,
29.392, 30.632,
28.284, 30.844,
28.141, 30.255,
28.59, 29.274,
29.653, 28.966,
29.379, 28.716,
28.104, 29.273,
27.422, 29.938,
25.981, 30.65,
26.713, 31.135,
25.768, 31.854,
24.693, 32.272,
23.692, 32.577,
23.444, 33.02,
21.883, 33.536,
21.567, 34.006,
20.397, 34.433,
19.71, 34.356,
18.777, 34.635,
17.762, 34.976,
16.931, 35.31,
15.214, 35.596,
15.058, 35.428,
16.152, 34.961,
17.13, 34.652,
18.196, 34.105,
19.436, 33.992,
19.93, 33.582,
21.316, 32.983,
21.539, 32.783,
22.277, 32.43,
22.45, 31.672,
22.958, 31.081,
21.805, 31.384,
21.483, 31.212,
20.941, 31.576,
20.288, 31.068,
20.019, 31.427,
19.645, 30.929,
18.645, 31.329,
18.031, 31.328,
17.945, 30.733,
18.126, 30.366,
17.482, 30.01,
16.182, 30.202,
15.338, 29.732,
14.654, 29.492,
14.649, 28.926,
13.879, 28.5,
14.266, 27.925,
15.081, 27.367,
15.438, 26.854,
16.247, 26.781,
16.933, 26.94,
17.74, 26.458,
18.466, 26.544,
19.227, 26.234,
19.042, 25.777,
18.482, 25.597,
19.222, 25.211,
18.608, 25.223,
17.547, 25.44,
17.242, 25.661,
16.454, 25.441,
15.039, 25.553,
13.575, 25.313,
13.155, 24.911,
11.89, 24.33,
13.295, 23.912,
15.525, 23.423,
16.347, 23.423,
16.211, 23.923,
18.322, 23.884,
17.51, 23.265,
16.28, 22.883,
15.569, 22.384,
14.61, 21.957,
13.236, 21.641,
13.795, 21.117,
15.569, 21.084,
16.831, 20.629,
17.07, 20.142,
18.091, 19.667,
19.065, 19.552,
20.961, 19.108,
21.88, 19.175,
23.419, 18.642,
24.932, 18.852,
25.656, 19.304,
26.1, 19.11,
27.79, 19.17,
27.73, 19.4,
29.26, 19.57,
30.28, 19.47,
32.387, 19.786,
34.31, 19.88,
35.08, 20.01,
36.411, 19.847,
37.927, 20.148,
39.014, 20.288,
40.88, 20.529,
42.454, 21.01,
43.496, 21.102,
44.374, 20.685,
45.585, 20.372,
47.071, 20.495,
48.569, 20.055,
50.205, 19.806,
50.892, 20.221,
51.638, 19.987,
51.862, 19.516,
52.553, 19.623,
54.244, 20.519,
55.575, 19.841,
55.71, 20.6,
56.939, 20.436,
57.317, 20.144,
58.528, 20.202,
60.057, 20.622,
62.397, 20.989,
63.774, 21.159,
64.753, 21.094,
66.102, 21.601,
64.695, 22.097,
66.503, 22.312,
69.202, 22.194,
70.054, 22.019,
71.12, 22.618,
72.208, 22.112,
71.187, 21.688,
71.833, 21.346,
73.05, 21.3,
73.85, 21.2,
74.657, 21.439,
75.662, 21.982,
76.779, 21.902,
78.546, 22.353,
80.098, 22.194,
81.557, 22.218,
81.441, 21.596,
82.331, 21.421,
83.88, 21.76,
83.874, 22.706,
84.511, 21.909,
85.315, 21.936,
85.767, 20.931,
84.696, 20.314,
83.529, 19.91,
83.609, 18.805,
84.791, 18.08,
86.11, 18.24,
87.122, 18.681,
88.48, 19.809,
87.593, 20.3
];