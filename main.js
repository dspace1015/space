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
var camD = 6e7;
var long = 0.0;
var lat = 0.0;
var drawOrbits = true;
var drawNames = true;
var tracking = false;
var lightTtime = true;
var camFrame = 0;
var UIscale = 1.0;
var Menu = 0;

var camFOV = 70;
var defaultFOV = 70;
var pressedKeys = {};
var mouse = {x:0,y:0,d:false};
var mouseDrag = {x:0,y:0,d:false};
var mouseOld = {x:0,y:0,d:false};
var selectedBody = -1;
var currentBody = 1;
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
const J2000 = 946728000;
const AU = 149597870700;

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
function dist2display(d,unit,decimals){
    if(unit == "USCustomary"){
        var d1 = d/0.3048;
        if(0<=d1<1){
            return String(Math.round((d1*12)*Math.pow(10,decimals))/Math.pow(10,decimals))+" in";
        }else if(d1<1320){
            return String(Math.round((d1)*Math.pow(10,decimals))/Math.pow(10,decimals))+" ft";
        }else if(d<0.1*AU){
            return String(Math.round((d1/5280)*Math.pow(10,decimals))/Math.pow(10,decimals))+" mi";
        }else if(d<lr){
            return String(Math.round((d/AU)*Math.pow(10,decimals))/Math.pow(10,decimals))+" AU";
        }else{
            return String(Math.round((d/lr)*Math.pow(10,decimals))/Math.pow(10,decimals))+" lr";
        }
    }else{
        if(0<d<1){
            return String(Math.round((d*100)*Math.pow(10,decimals))/Math.pow(10,decimals))+" cm";
        }else if(d<1000){
            return String(Math.round((d)*Math.pow(10,decimals))/Math.pow(10,decimals))+" m";
        }else if(d<0.1*AU){
            return String(Math.round((d/1000)*Math.pow(10,decimals))/Math.pow(10,decimals))+" km";
        }else if(d<lr){
            return String(Math.round((d/AU)*Math.pow(10,decimals))/Math.pow(10,decimals))+" AU";
        }else{
            return String(Math.round((d/lr)*Math.pow(10,decimals))/Math.pow(10,decimals))+" lr";
        }
    }
}
function scalecolor(color,scaler){
    var col = Number("0x"+color.substring(1,7));
    var Red = mod(Math.floor(col/(256*256)),256);
    var Green = mod(Math.floor(col/(256)),256);
    var Blue = mod(Math.floor(col),256);
    if(scaler.length == 3){
        Red = Math.ceil(scaler[0]*Red);
        Green = Math.ceil(scaler[1]*Green);
        Blue = Math.ceil(scaler[2]*Blue);
    }else{
        Red = Math.ceil(scaler*Red);
        Green = Math.ceil(scaler*Green);
        Blue = Math.ceil(scaler*Blue);
    }
    if(Red>255){
        Red = 255;
    }
    if(Red<0){
        Red = 0;
    }
    if(Green>255){
        Green = 255;
    }
    if(Green<0){
        Green = 0;
    }
    if(Blue>255){
        Blue = 255;
    }
    if(Blue<0){
        Blue = 0;
    }
    col = Red*256*256+Green*256+Blue;
    return "#"+col.toString(16);
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
function scalevec(v1,s){
    return [v1[0]*s,v1[1]*s,v1[2]*s];
}
function subvec(v1,v2){
    //subtracts the vectors
    return [v1[0]-v2[0],v1[1]-v2[1],v1[2]-v2[2]];
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
function Minv(M){
    return [M[0],M[3],M[6],M[1],M[4],M[7],M[2],M[5],M[8]];
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
function mag(x){
    return Math.sqrt(Math.pow(x[0],2)+Math.pow(x[1],2)+Math.pow(x[2],2));
}
function normalize(x){
    var v = mag(x)
    return [x[0]/v,x[1]/v,x[2]/v];
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
        if(frame.length == 9){
            v = Mvec(v,frame);
        }else if(frame.length ==2){
            v = Mvec(v,LaplacePlane2frame(frame[0],frame[1]));
        }
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
function LaplacePlane2frame(RA,DE){
    var v3 = [cos(RA)*cos(DE),sin(RA)*cos(DE),sin(DE)];
    var v1 = [0,0,1];
    v1 = cross(v1,v3);
    if(DE == 90 || DE == -90){
        v1 = [1,0,0];
    }
    v1 = normalize(v1);
    var v2 = cross(v3,v1);
    var M = [v1[0],v1[1],v1[2],v2[0],v2[1],v2[2],v3[0],v3[1],v3[2]];
    M = MtimesM(M,RotM("x",-23.43928));
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
    screen.moveTo(x0,y0);
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
    screen.lineWidth = width;
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
    screen.fillStyle = screen.strokeStyle;
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
    screen.setTransform(1,0,0,1,screen.canvas.width/2,screen.canvas.height/2);
    screen.fillStyle = screen.strokeStyle;
    screen.textBaseline = "top";
    screen.textAlign = Align;
    screen.font = font;
    screen.fillText(text,screenpos[0],-screenpos[1]);
    screen.setTransform(1,0,0,-1,screen.canvas.width/2,screen.canvas.height/2);
}
function drawImg(Img,x,y,scale){
    screen.setTransform(scale,0,0,scale,screen.canvas.width/2,screen.canvas.height/2);
    screen.drawImage(Img,x/scale,y/scale);
}
function drawOrbit(a,e,i,L,w,vP,frame,steps,width,col){
    var ang = 0;
    if(0.2<Math.abs(depth3d(vP))/a<3){
        var draw = true;
    }else{
        var draw = false;
    }
    while(ang<360){
        var p1 = orbit2xyz(a,e,i,L,w,ang,vP,frame);
        var p2 = orbit2xyz(a,e,i,L,w,ang+360/steps,vP,frame);
        if(draw){
            appendLine(p1,p2,-width,col,0);
        }else{
            setColor(col);
            drawline3d(p1,p2,-width);
        }
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
    vert.push(p1);
    vert.push(p2);
    vert.push(p3);
    draw.push(["t",vert.length-3,vert.length-2,vert.length-1,col,priority]);
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
function appendSurface(objectid,PlanetDecalid,col,priority){
    vert.push(objectPos[objectid]);
    draw.push(["surf",vert.length-1,objectid,PlanetDecalid,col,priority]);
}
function addRings(body,rmin,rmax,col,priority){
    var i = 0;
    var di = 15;
    var M = bodyAxis[body];
    s = 0.5*rmax/depth3d(objectPos[body])*screen.canvas.height/Math.tan(camFOV*Math.PI/360);
    if(s>2){
    while(i<360){
        var p1 = Mvec([rmin*cos(i),rmin*sin(i),0],M);
        var p2 = Mvec([rmin*cos(i+di),rmin*sin(i+di),0],M);
        var p3 = Mvec([rmax*cos(i),rmax*sin(i),0],M);
        var p4 = Mvec([rmax*cos(i+di),rmax*sin(i+di),0],M);
        p1 = addvec(p1,objectPos[body]);
        p2 = addvec(p2,objectPos[body]);
        p3 = addvec(p3,objectPos[body]);
        p4 = addvec(p4,objectPos[body]);
        appendTri(p1,p2,p3,col,priority);
        appendTri(p3,p2,p4,col,priority);
        i += di;
    }
    }
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
        }else if (type == "surf"){
            d = Math.abs(depth3d(objectPos[draw[i][2]]))-objectRadii[draw[i][2]];
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



function coastline(data,body,res){
    var s = 0.5*objectRadii[body]/depth3d(objectPos[body])*screen.canvas.height/Math.tan(camFOV*Math.PI/360)
    if(s>3){
        var i = 0;
        var x = data[i];
        var y = data[i+1];
        x -= 180;
        y = 90 - y;
        var p = latLong2xyz(body,x,y);
        while (i<data.length){
            pOld = p;
            x = data[i];
            y = data[i+1];
            x -= 180;
            y = 90 - y;
            p = latLong2xyz(body,x,y);
            var v = addvec(p,pOld);
            v = [v[0]/2,v[1]/2,v[2]/2];
            var d = Math.abs(depth3d(objectPos[body]));
            d = Math.sqrt(Math.pow(d,2)-Math.pow(objectRadii[body],2));
            if(depth3d(v)<d){
                drawline3d(p,pOld,-2);
            }
            i += 2*res;
        }
        pOld = p;
        x = data[0];
        y = data[1];
        x -= 180;
        y = 90 - y;
        p = latLong2xyz(body,x,y);
        var v = addvec(p,pOld);
        v = [v[0]/2,v[1]/2,v[2]/2];
        var d = Math.abs(depth3d(objectPos[body]));
        d = Math.sqrt(Math.pow(d,2)-Math.pow(objectRadii[body],2));
        if(depth3d(v)<d){
            drawline3d(p,pOld,-2);
        }
    }
}




function addObject(name,R,color,Mass){
    objectNames.push(name);
    objectRadii.push(R);
    objectColor.push(color);
    objectMass.push(Mass);
}
function updateObjectId(id){
    var orb2 = getOrbitNow(id,T);
    var v = meanAnom2TrueAnom(orb2.e,orb2.M0+360*(T-orb2.t0)/orb2.P);
    var parentpos = objectPos[orb2.Parent];
    objectPos[id] = orbit2xyz(orb2.a,orb2.e,orb2.i,orb2.L,orb2.w,v,parentpos,orb2.frame);
    if(lightTtime){
        var D = Math.abs(depth3d(objectPos[id]));
        orb2 = getOrbitNow(id,T-D/c); 
        v = meanAnom2TrueAnom(orb2.e,orb2.M0+360*(T-D/c-orb2.t0)/orb2.P);
        objectPos[id] = orbit2xyz(orb2.a,orb2.e,orb2.i,orb2.L,orb2.w,v,parentpos,orb2.frame);
    }
}
function getOrbitNow(id,T){
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
        if(d>0 && drawNames){
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
            var orb = getOrbitNow(i,T);
            setColor(objectColor[i]);
            if(orb.Parent == -1){
                var parentpos = [0,0,0];
            }else{
                var parentpos = objectPos[orb.Parent];
                var distance = Math.sqrt(Math.pow(objectPos[i][0]-camV[0],2)+Math.pow(objectPos[i][1]-camV[1],2)+Math.pow(objectPos[i][2]-camV[2],2));
                if(0.1<camD/orb.a && camD/orb.a<50){
                    drawOrbit(orb.a,orb.e,orb.i,orb.L,orb.w,parentpos,orb.frame,60,1,objectColor[i]);
                }
            }
            i += 1;
        }
    }
    //Earth
    appendSurface(1,0,"#ffffff",0);
    //appendSurface(5,1,"#ffdf75",0);
    
    //appendTri(objectPos[7],addvec(objectPos[7],[1e8,0,0]),addvec(objectPos[7],[0,0,1e8]),"#ffffff",0);
    //Jupiter
    appendSurface(6,1,"#ffdf75",0);
    appendSurface(6,2,"#ff0000",0);
    //Saturn
    appendSurface(7,1,"#c0c090",0);
    addRings(7,9.2000e7,1.36000e8,"#ffdf75",0);
}

window.onmousemove = function(e){mouse.x = e.clientX, mouse.y = e.clientY};
window.ontouchmove = function(e){mouse.x = e.touches[0].clientX, mouse.y = e.touches[0].clientY};
window.ontouchstart = function(e){mouse.d = true,mouse.x = e.touches[0].clientX, mouse.y = e.touches[0].clientY};
window.ontouchend = function(e){mouse.d = false};
window.onmouseup = function(e){mouse.d = false};
window.onmousedown = function(e){mouse.d = true};
window.ondrag = function(e){mouse.x = e.clientX, mouse.y = e.clientY};
window.onwheel = function(e){
    if(currentBody != -1){
        camD *= Math.exp(0.25*(e.deltaY/100));
    }else{
        camFOV *= Math.exp(0.25*(e.deltaY/100));
    }
    if(camFOV>120){
        camFOV = 120;
    }
    
};
window.onkeyup = function(e){pressedKeys[e.keyCode] = false;
    if(e.keyCode == 79){
        drawOrbits = 1-drawOrbits;
    }
    if(e.keyCode == 78){
        drawNames = 1-drawNames;
    }
    if(e.keyCode == 67){
        camFrame = mod(camFrame+1,3);
    }
    if(e.keyCode == 89){
        lightTtime = 1-lightTtime;
    }
    if(e.keyCode == 84){
        tracking = 1-tracking;
    }
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
                TimeSpeed = 2.5 * TimeSpeed/Math.abs(TimeSpeed);
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

function UpdateCamera(){
    //update camera
    var x = screen.canvas.width;
    var y = screen.canvas.height;
    if(!(-360*1.5*UIscale-5+x<mouse.x && mouse.x<x && mouse.y<-50*UIscale-5+y && mouse.y>-50*UIscale-5+y - 180*1.5*UIscale && Menu)){

    if(mouseOld.d && !mouse.d && !mouseDrag.d && (x - 50*UIscale < mouseOld.x && mouseOld.x < x) && ( y - 50*UIscale < mouseOld.y && mouseOld.y < y)){
        Menu = 1-Menu;
    }else if(mouseOld.d && mouse.d && !mouseDrag.d && (x - 105*UIscale < mouse.x && mouse.x < x -55*UIscale) && ( y - 50*UIscale<mouse.y<y)){
        if(currentBody != -1){
            camD *= Math.exp(-3*dt);
        }else{
            camFOV *= Math.exp(-3*dt);
        }
    }else if(mouseOld.d && mouse.d && !mouseDrag.d && (x - 160*UIscale < mouse.x && mouse.x < x -105*UIscale) && ( y - 50*UIscale<mouse.y<y)){
        if(currentBody != -1){
            camD *= Math.exp(3*dt);
        }else{
            camFOV *= Math.exp(3*dt);
            if(camFOV>120){
                camFOV = 120;
            }
        }

    }else if(mouseOld.d && !mouse.d && !mouseDrag.d){
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
    if(selectedBody == -1){
        tracking = false;
    }
    if(mouseOld.d && !mouse.d && !mouseDrag.d && (mouse.x<300*UIscale) && (mouse.y>screen.canvas.height-30*UIscale)){
        ans = parseFloat(prompt("input Latitude"));
        if(ans == ans){
            lat = ans;
        }
        ans = parseFloat(prompt("input Longitude"));
        if(ans == ans){
            long = ans;
        }
        mouse.y = 0
        mouse.x = 0
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
        if(currentBody != -1){
        camP += -3*camFOV*(mouse.y-mouseOld.y)/window.innerHeight;
        camY += 3*camFOV*(mouse.x-mouseOld.x)/window.innerHeight;
        }else{
            camP += 3*camFOV*(mouse.y-mouseOld.y)/window.innerHeight;
            camY += -3*camFOV*(mouse.x-mouseOld.x)/window.innerHeight;
        }
    }
    }else{
        if(mouseOld.d){
            lat = ( y - mouse.y -50*UIscale-5)/(1.5*UIscale)-90;
            long = -( x - mouse.x -5)/(1.5*UIscale)+180;
        }
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
    if(currentBody != -1){
        if(camFrame == 0){
         camM = [1,0,0,0,1,0,0,0,1];
        }else if(camFrame ==1){
            camM = Minv(bodyAxis[currentBody]);
        }else if(camFrame ==2){
            var M = RotM("z",rotL0[currentBody] + 360*(T-946728000)/(rotP[currentBody]));
            M = MtimesM(M,bodyAxis[currentBody]);
            camM = Minv(M);
        }
    }
    if(currentBody == -1){
        camFrame = 0;
        camM = latLong2frame(1,long,lat);
        camM = [camM[0],camM[3],camM[6],camM[1],camM[4],camM[7],camM[2],camM[5],camM[8]];
        camV = latLong2xyz(1,long,lat);
    }else{
        camV = objectPos[currentBody];
        camFOV = defaultFOV;
    }
    
    camM = MtimesM(camM,RotM("z",camY));
    camM = MtimesM(camM,RotM("y",camP)); 

    if(currentBody != -1){
        camV = addvec(camV,[-camD*camM[0],-camD*camM[3],-camD*camM[6]]);
    }

    if(tracking){
        camM = MtimesM(camM,RotM("y",-camP)); 
        camM = MtimesM(camM,RotM("z",-camY));
        var v1 = subvec(objectPos[selectedBody],camV);
        v1 = normalize(v1);
        var v3 = [camM[2],camM[5],camM[8]];
        var v2 = cross(v3,v1);
        v3 = cross(v1,v2);
        v3 = normalize(v3);
        v2 = normalize(v2);
        camM = [v1[0],v2[0],v3[0],v1[1],v2[1],v3[1],v1[2],v2[2],v3[2]];
    }
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
        //drawGrid(12,24,M);
    }
    var ind = draw.length -1;
    while (ind>=0){
        var i = drawOrder[ind];
        var type = draw[i][0];
        if (type == "d"){
            setColor(draw[i][4]);
            var d = depth3d(vert[draw[i][1]]);
            if(d/draw[i][2] < 250){
                drawsphere3d(vert[draw[i][1]],draw[i][2],[1,0,0,0,1,0,0,0,1]);
            }else{
                drawdot3d(vert[draw[i][1]],draw[i][2]);
            }
        }else if(type == "l"){
            setColor(draw[i][4]);
            drawline3d(vert[draw[i][1]],vert[draw[i][2]],draw[i][3]);
        }else if(type == "t"){
            setColor(draw[i][4]);
            screen.fillStyle = screen.strokeStyle;
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
        }else if(type == "surf"){
            var j = 0;
            while(j<PlanetDecal[draw[i][3]].length){
                setColor(draw[i][4]);
                coastline(PlanetDecal[draw[i][3]][j],draw[i][2],1);
                j += 1;
            }
        }
        ind-=1;
    }
    RenderUI();
    if(pressedKeys[186]){
        var v = addvec(camV,[5e10*camM[0],5e10*camM[3],5e10*camM[6]]);
        setColor("#0000ff");
        drawline3d(v,addvec(v,[0,0,1e10]),-3);
        setColor("#00ff00");
        drawline3d(v,addvec(v,[0,1e10,0]),-3);
        setColor("#ff0000");
        drawline3d(v,addvec(v,[1e10,0,0]),-3);
        setColor("#ffffff");
        screen.fillStyle = screen.strokeStyle;
        var i = 0
        while(i<vert.length){
            drawdot3d(vert[i],-1);
            i += 1;
        }
    }
    if(pressedKeys[222]){
        var v = addvec(camV,[5e10*camM[0],5e10*camM[3],5e10*camM[6]]);
        var M = bodyAxis[currentBody];
        setColor("#ff0000");
        drawline3d(v,addvec(v,[1e10*M[0],1e10*M[1],1e10*M[2]]),-3);
        setColor("#00ff00");
        drawline3d(v,addvec(v,[1e10*M[3],1e10*M[4],1e10*M[5]]),-3);
        setColor("#0000ff");
        drawline3d(v,addvec(v,[1e10*M[6],1e10*M[7],1e10*M[8]]),-3);
        
    }
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
    drawText(leadingzeros(now.getHours(),2)+":"+leadingzeros(now.getMinutes(),2)+":"+leadingzeros(now.getSeconds(),2)+" "+month+" "+leadingzeros(now.getDate(),2)+" "+now.getFullYear()+" "+timezone,[-screen.canvas.width/2+5,screen.canvas.height/2-5],"left",String(Math.round(24*UIscale))+"px courier")
    drawText(Math.round(TimeSpeed*100)/100+"x",[-screen.canvas.width/2+5,screen.canvas.height/2-5-24*UIscale],"left",String(Math.round(24*UIscale))+"px courier");
    var data = "";
    var val;
    if(currentBody != -1){
        val = Math.abs(depth3d(objectPos[currentBody]))-objectRadii[currentBody];
        val = dist2display(val,"Metric",2);
        data = val
        drawText(objectNames[currentBody],[-screen.canvas.width/2+5,screen.canvas.height/2-80*UIscale],"left",String(Math.round(24*UIscale))+"px courier");
        drawText(data,[-screen.canvas.width/2+5,screen.canvas.height/2-(80+24)*UIscale],"left",String(Math.round(18*UIscale))+"px courier"); 
        if(camFrame == 0){
            data = "Global Cam";
        }else if(camFrame == 1){
            data = "Match Axis Cam";
        }else{
            data = "Co-Rotate Cam";
        }
        drawText("(c)"+data,[-screen.canvas.width/2+5,screen.canvas.height/2-(80+24*2)*UIscale],"left",String(Math.round(18*UIscale))+"px courier");  
    }else{
        val = camFOV;
        data = "vertical FOV:"+String(Math.floor(camFOV))+"° "+String(Math.floor(mod(camFOV*60,60)))+"m "+String(Math.floor(mod(camFOV*3600,60)))+"s"
        drawText("Location:"+String(Math.round(lat*10)/10)+"° ,"+String(Math.round(long*10)/10)+"°",[-screen.canvas.width/2+5,screen.canvas.height/2-80],"left",String(Math.round(24*UIscale))+"px courier");
        drawText(data,[-screen.canvas.width/2+5,screen.canvas.height/2-(80+24)*UIscale],"left",String(Math.round(24*UIscale))+"px courier"); 
        data = "Local Camera"
        drawText(data,[-screen.canvas.width/2+5,screen.canvas.height/2-(80+24*2)*UIscale],"left",String(Math.round(18*UIscale))+"px courier");  
    }
    

    if(selectedBody != -1){
        drawText("Selected:",[-screen.canvas.width/2+5,screen.canvas.height/2-150*UIscale],"left",String(Math.round(24*UIscale))+"px courier");
        drawText(objectNames[selectedBody],[-screen.canvas.width/2+5,screen.canvas.height/2-(150+24)*UIscale],"left",String(Math.round(24*UIscale))+"px courier");
        if(tracking){
        drawText("TRACKING "+objectNames[selectedBody],[-screen.canvas.width/2+5,screen.canvas.height/2-(150+24*2)*UIscale],"left",String(Math.round(18*UIscale))+"px courier");  
    }
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
    drawRect(-screen.canvas.width/2,-screen.canvas.height/2,300*UIscale,30*UIscale);
    setColor("#000000")
    drawText(" View From Location",[-screen.canvas.width/2,-screen.canvas.height/2+26*UIscale],"left",String(Math.round(24*UIscale))+"px courier");
    setColor("#ffffff")
    setColor("#808080");
    var x = screen.canvas.width/2
    var y = -screen.canvas.height/2
    drawRect(x,y,-50*UIscale,50*UIscale);
    drawRect(x-55*UIscale,y,-50*UIscale,50*UIscale);
    drawRect(x-110*UIscale,y,-50*UIscale,50*UIscale);
    setColor("#000000");
    drawCircle(x-25*UIscale,y+25*UIscale,12*UIscale,1*UIscale,0);
    setColor("#000000");
    drawCircle(x-(25+55)*UIscale,y+25*UIscale,12*UIscale,1*UIscale,0);
    setColor("#000000");
    drawCircle(x-(25+110)*UIscale,y+25*UIscale,12*UIscale,1,0);
    drawline(x - 80*UIscale,y + (25 + 8)*UIscale,x - 80*UIscale,y + 25*UIscale - 8*UIscale,1);
    drawline(x - (80 + 8)*UIscale,y + 25*UIscale,x - 80*UIscale + 8*UIscale,y + 25*UIscale,1);
    drawline(x - (135 + 8)*UIscale,y + 25*UIscale,x - 135*UIscale + 8*UIscale,y + 25*UIscale,1);
    if(Menu){
        setColor("#ffffff");
        drawRect(x-3,y+55*UIscale - 2,-3-360*1.5*UIscale,2+180*1.5*UIscale);
        setColor("#202020");
        drawRect(x-5,y+55*UIscale,-360*1.5*UIscale,180*1.5*UIscale);
        var j = 0;
        setColor("#ffffff");
        while(j<PlanetDecal[0].length){
            var i = 0;
            var x = PlanetDecal[0][j][i];
            var y = 90 - PlanetDecal[0][j][i+1];
            var p;
            var pOld;
            x = 1.5*(x-360)*UIscale-5+screen.canvas.width/2;
            y = 1.5*(y+90)*UIscale+55*UIscale-screen.canvas.height/2;
            while (i<PlanetDecal[0][j].length){
                pOld = [x,y];
                x = PlanetDecal[0][j][i];
                y = 90 - PlanetDecal[0][j][i+1];
                x = 1.5*(x-360)*UIscale-5+screen.canvas.width/2;
                y = 1.5*(y+90)*UIscale+55*UIscale-screen.canvas.height/2;
                p = [x,y];
                drawline(p[0],p[1],pOld[0],pOld[1],2);
                i += 2;
            }
            pOld = [x,y];
            x = PlanetDecal[0][j][0];
            y = 90 - PlanetDecal[0][j][0+1];
            x = 1.5*(x-360)*UIscale-5+screen.canvas.width/2;
            y = 1.5*(y+90)*UIscale+55*UIscale-screen.canvas.height/2;
            p = [x,y];
            drawline(p[0],p[1],pOld[0],pOld[1],2);
            j += 1;
        }
        var x = long + 180;
        var y = lat;
        x = 1.5*(x-360)*UIscale-5+screen.canvas.width/2;
        y = 1.5*(y+90)*UIscale+55*UIscale-screen.canvas.height/2;
        setColor("#ff0000");
        drawCircle(x,y,1,0,true);
    }
    if(T>=maxT){
        drawText("MAXIMUM TIME REACHED",[0,-screen.canvas.height/2+100],"center",String(Math.round(50*UIscale))+"px courier");
    }
    if(T<=minT){
        
        drawText("MINIMUM TIME REACHED",[0,-screen.canvas.height/2+100],"center",String(Math.round(50*UIscale))+"px courier");
    }
    setColor("#ffffff");
    drawText("FPS:"+String(Math.round(1/dt)),[-screen.canvas.width/2+5,-screen.canvas.height/2+100],"left",String(Math.round(12*UIscale))+"px courier");
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

fetch("Objects.json").then(response => response.json()).then(data => loadObjects(data)).catch(error => alert("an error occured, please refresh page (bad data)1"));
fetch("MajorMoons.json").then(response => response.json()).then(data => loadObjects(data)).catch(error => alert("an error occured, please refresh page (bad data)2"));
fetch("Craft.json").then(response => response.json()).then(data => loadObjects(data)).catch(error => alert("an error occured, please refresh page (bad data)3"));
fetch("Stars.json").then(response => response.json()).then(data => loadObjects(data)).catch(error => alert("an error occured, please refresh page (bad data)4"));

const EarthTex = new Image();
EarthTex.src = "Textures/EarthTrueColor.png"

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
document.addEventListener("DOMContentLoaded", function () {
  console.log("Loaded");
  requestAnimationFrame(initLoop);
});





//And now for the coastline data:

//Gotten from the wikepidia Image https://en.wikipedia.org/wiki/Equirectangular_projection#/media/File:Plate_Carr%C3%A9e_with_Tissot's_Indicatrices_of_Distortion.svg


const PlanetDecal = [
[
[120.428,170.04,
120.134,170.55,
119.84,171,
117.745,170.863,
115.512,170.922,
114.258,170.589,
114.258,170.55,
113.71,170.256,
115.962,170.295,
118.117,170.393,
118.861,169.981,
119.39,169.629,
],

[20.792,169.497,
18.872,169.634,
17.56,169.281,
16.973,168.929,
16.933,168.87,
16.287,168.596,
16.287,168.596,
16.894,168.223,
18.755,168.38,
19.754,168.694,
20.518,169.046,
],

[134.845,168.047,
136.079,168.478,
136.51,169.086,
136.628,169.517,
136.667,170.026,
135.119,170.34,
133.494,170.594,
131.614,170.829,
129.518,171.025,
127.148,170.967,
125.836,170.634,
126.012,170.222,
128.147,169.948,
129.009,169.615,
129.635,169.183,
130.086,168.811,
130.693,168.459,
131.339,168.047,
131.339,168.047,
131.849,168.047,
133.337,167.831,
],

[58.788,163.501,
60.081,163.658,
61.276,163.481,
60.708,163.834,
59.768,164.089,
58.377,164.01,
57.378,163.658,
57.378,163.658,
57.594,163.325,
],

[54.44,163.481,
55.968,163.873,
55.381,163.834,
54.088,163.736,
52.717,163.462,
52.717,163.462,
53.442,163.246,
],

[81.018,161.933,
82.115,162.071,
83.212,161.953,
83.8,162.521,
83.016,162.443,
81.802,162.482,
80.568,162.443,
79.217,162.502,
78.198,162.306,
77.669,161.894,
77.669,161.894,
78.296,161.718,
79.569,161.855,
],

[111.549,160.956,
111.666,161.406,
111.49,161.798,
111.216,162.171,
110.041,162.308,
108.924,162.504,
107.612,162.484,
108.102,162.092,
106.926,162.229,
105.81,162.367,
105.046,162.073,
104.987,161.661,
106.084,161.269,
106.084,161.269,
106.77,161.152,
107.925,161.191,
108.219,160.681,
108.278,160.309,
108.258,159.506,
108.826,159.035,
109.747,158.879,
110.276,159.251,
110.511,159.623,
110.941,160.074,
111.274,160.505,
],

[121.386,154.152,
120.955,154.368,
120.211,154.211,
119.388,154.309,
118.703,154.544,
117.978,154.799,
117.488,155.093,
117.351,155.485,
117.41,155.857,
117.88,156.19,
117.194,156.426,
116.254,156.504,
115.706,156.837,
115.118,157.15,
114.492,157.582,
114.335,157.954,
114.687,158.365,
115.216,158.679,
116.039,158.914,
116.803,159.228,
117.214,159.619,
117.429,159.992,
117.723,160.384,
118.193,160.717,
118.487,161.089,
118.624,162.01,
118.918,162.382,
118.996,162.774,
119.31,163.166,
119.173,163.695,
118.624,164.107,
118.037,164.44,
116.705,164.577,
116.254,164.93,
115.647,165.263,
114.139,165.635,
112.807,165.792,
111.554,166.007,
110.202,166.223,
109.399,166.634,
107.793,166.674,
106.03,166.634,
104.444,166.713,
103.76,166.713,
102.76,166.713,
103.073,167.105,
104.601,167.281,
105.717,167.555,
106.344,167.908,
105.227,168.222,
103.504,168.124,
102.074,168.378,
102.015,168.79,
101.976,169.182,
103.151,169.515,
103.367,169.887,
104.64,170.26,
106.755,170.416,
108.557,170.691,
109.987,171.004,
111.808,171.318,
114.296,171.474,
116.744,171.749,
118.448,172.043,
120.309,172.376,
121.288,172.846,
121.778,173.218,
122.992,172.866,
124.637,172.572,
126.38,172.258,
128.456,172.004,
130.239,171.729,
132.726,171.71,
135.174,171.847,
137.192,172.082,
137.838,171.651,
139.229,171.357,
141.755,171.337,
143.733,171.122,
145.614,170.906,
147.69,170.769,
149.903,170.593,
151.45,170.338,
150.745,169.985,
150.314,169.633,
150.314,169.26,
148.375,169.299,
146.319,169.456,
145.36,169.456,
144.36,169.456,
144.086,169.084,
144.223,168.339,
144.673,168.124,
146.103,167.889,
147.788,167.653,
149.002,167.36,
150.216,167.066,
151.117,166.674,
152.488,166.497,
153.84,166.36,
154.525,166.282,
156.072,166.243,
157.541,166.105,
158.775,165.909,
159.99,165.674,
161.086,165.439,
162.477,165.126,
163.358,164.793,
164.299,164.499,
164.592,164.107,
163.535,163.872,
163.887,163.46,
164.553,163.147,
165.591,162.951,
166.688,162.715,
167.706,162.402,
168.49,162.01,
168.98,161.54,
169.704,161.265,
170.899,161.324,
171.389,161.657,
172.583,161.697,
172.623,161.324,
173.132,160.932,
174.209,161.03,
174.464,161.403,
175.658,161.461,
176.951,161.285,
178.205,161.167,
179.341,161.226,
179.771,161.638,
180.868,161.305,
181.887,161.128,
183.023,160.991,
184.139,160.854,
185.158,160.619,
186.274,160.462,
187.136,160.247,
187.743,159.894,
188.487,160.149,
189.525,160.011,
190.25,160.482,
190.818,160.834,
191.954,160.638,
192.404,160.247,
193.423,159.972,
194.735,160.031,
195.127,160.403,
195.949,160.031,
197.027,159.913,
198.202,159.874,
199.259,159.894,
200.376,160.011,
201.453,160.07,
201.923,160.403,
202.569,160.697,
203.666,160.521,
204.841,160.482,
204.977,160.482,
205.977,160.482,
207.094,160.462,
208.093,160.325,
209.15,160.207,
210.032,159.933,
210.972,159.757,
211.99,159.659,
212.754,159.384,
213.302,158.836,
213.87,158.503,
214.908,158.659,
215.3,159.012,
216.162,159.247,
217.2,159.169,
217.905,159.521,
218.649,159.776,
219.668,159.541,
220.02,159.11,
220.921,158.934,
221.959,158.601,
222.939,158.463,
224.114,158.267,
224.897,158.052,
225.72,157.817,
226.503,157.601,
227.443,157.719,
228.344,157.366,
228.991,157.092,
229.931,157.111,
230.753,156.876,
230.949,156.523,
231.792,156.249,
232.614,156.053,
233.613,155.896,
234.534,155.818,
235.415,155.877,
236.355,155.975,
237.158,156.249,
237.256,156.68,
238.137,157.013,
238.745,157.288,
239.939,157.405,
240.605,157.68,
241.428,157.954,
242.387,158.013,
243.19,157.817,
244.052,157.405,
244.992,157.621,
245.972,157.738,
246.912,157.856,
247.891,157.934,
248.89,157.934,
249.713,158.973,
249.673,159.228,
249.556,159.678,
248.596,159.933,
247.813,160.305,
247.95,160.697,
249.066,160.678,
248.929,161.069,
248.42,161.442,
247.95,161.853,
248.714,162.167,
249.869,162.265,
251.025,162.088,
251.573,161.697,
251.906,161.324,
252.455,161.011,
253.081,160.717,
253.336,160.364,
253.865,159.874,
254.492,159.776,
255.628,159.737,
256.626,159.619,
257.645,159.463,
258.135,159.071,
258.428,158.698,
259.114,158.326,
260.093,158.072,
260.935,157.876,
261.484,157.542,
262.052,157.366,
262.776,157.209,
263.775,157.307,
264.676,157.209,
265.656,157.092,
266.752,157.15,
267.477,156.876,
267.986,156.21,
268.358,156.484,
268.828,156.955,
269.671,157.15,
270.63,157.229,
271.59,157.111,
272.609,157.19,
273.549,157.209,
274.175,157.111,
275.018,157.17,
275.781,157.386,
276.682,157.249,
276.76,157.249,
277.76,157.249,
278.68,157.111,
279.718,157.249,
280.384,156.915,
280.893,156.582,
281.579,156.308,
282.832,155.563,
283.479,155.7,
284.243,155.975,
284.908,156.328,
286.182,156.935,
287.161,156.955,
288.081,156.955,
289.159,156.837,
290.236,156.7,
291.058,156.426,
291.744,156.132,
292.86,156.092,
293.605,155.877,
294.388,156.073,
294.897,156.386,
295.602,156.7,
296.699,156.661,
297.385,156.915,
298.579,157.17,
299.833,157.268,
300.871,157.19,
301.654,156.876,
302.32,156.563,
303.221,156.484,
304.122,156.621,
305.16,156.719,
306.1,156.563,
307.001,156.563,
307.883,156.661,
308.803,156.759,
309.704,156.582,
310.781,156.426,
311.8,156.386,
311.936,156.386,
312.936,156.386,
313.856,156.288,
314.757,156.21,
315.032,155.72,
315.071,155.309,
315.697,155.583,
315.874,156.034,
316.207,156.445,
316.618,156.778,
317.46,156.955,
318.596,156.896,
319.908,156.876,
320.809,156.817,
321.122,156.817,
322.122,156.817,
323.062,156.798,
324.374,156.837,
325.49,156.915,
326.196,157.229,
326,157.601,
326.646,157.895,
327.723,158.13,
328.84,158.385,
330.132,158.561,
331.484,158.718,
332.502,158.875,
333.638,158.895,
334.285,158.561,
335.166,158.836,
335.93,159.149,
336.811,159.384,
338.026,159.482,
339.181,159.6,
339.671,159.992,
340.807,160.227,
341.57,160.58,
342.687,160.736,
343.842,160.717,
344.92,160.776,
346.114,160.756,
347.309,160.834,
348.426,160.971,
349.464,161.207,
350.502,161.403,
351.207,161.697,
351.089,162.088,
350.56,162.441,
350.11,162.892,
349.757,163.245,
349.287,163.656,
347.975,163.813,
347.387,164.165,
346.095,164.381,
345.644,164.773,
344.959,165.145,
344.234,165.459,
343.823,165.87,
343.568,166.243,
343.47,166.693,
343.49,167.066,
344.058,167.457,
344.273,167.83,
344.743,168.183,
346.604,168.32,
346.996,168.751,
345.194,168.907,
343.666,169.123,
341.766,169.162,
340.924,169.73,
340.748,170.201,
340.317,170.573,
339.788,170.945,
341.12,171.279,
341.629,171.69,
342.491,172.062,
343.705,172.395,
345.096,172.709,
346.604,173.022,
348.896,173.336,
349.405,173.826,
352.284,174.041,
352.477,174.118,
353.224,174.414,
355.986,174.159,
358.277,174.473,
360,174.713,
360,175,
360,176,
360,177,
360,178,
360,179,
360,180,
360,180,
359,180,
358,180,
357,180,
356,180,
355,180,
354,180,
353,180,
352,180,
351,180,
350,180,
349,180,
348,180,
347,180,
346,180,
345,180,
344,180,
343,180,
342,180,
341,180,
340,180,
339,180,
338,180,
337,180,
336,180,
335,180,
334,180,
333,180,
332,180,
331,180,
330,180,
329,180,
328,180,
327,180,
326,180,
325,180,
324,180,
323,180,
322,180,
321,180,
320,180,
319,180,
318,180,
317,180,
316,180,
315,180,
314,180,
313,180,
312,180,
311,180,
310,180,
309,180,
308,180,
307,180,
306,180,
305,180,
304,180,
303,180,
302,180,
301,180,
300,180,
299,180,
298,180,
297,180,
296,180,
295,180,
294,180,
293,180,
292,180,
291,180,
290,180,
289,180,
288,180,
287,180,
286,180,
285,180,
284,180,
283,180,
282,180,
281,180,
280,180,
279,180,
278,180,
277,180,
276,180,
275,180,
274,180,
273,180,
272,180,
271,180,
270,180,
269,180,
268,180,
267,180,
266,180,
265,180,
264,180,
263,180,
262,180,
261,180,
260,180,
259,180,
258,180,
257,180,
256,180,
255,180,
254,180,
253,180,
252,180,
251,180,
250,180,
249,180,
248,180,
247,180,
246,180,
245,180,
244,180,
243,180,
242,180,
241,180,
240,180,
239,180,
238,180,
237,180,
236,180,
235,180,
234,180,
233,180,
232,180,
231,180,
230,180,
229,180,
228,180,
227,180,
226,180,
225,180,
224,180,
223,180,
222,180,
221,180,
220,180,
219,180,
218,180,
217,180,
216,180,
215,180,
214,180,
213,180,
212,180,
211,180,
210,180,
209,180,
208,180,
207,180,
206,180,
205,180,
204,180,
203,180,
202,180,
201,180,
200,180,
199,180,
198,180,
197,180,
196,180,
195,180,
194,180,
193,180,
192,180,
191,180,
190,180,
189,180,
188,180,
187,180,
186,180,
185,180,
184,180,
183,180,
182,180,
181,180,
180,180,
179,180,
178,180,
177,180,
176,180,
175,180,
174,180,
173,180,
172,180,
171,180,
170,180,
169,180,
168,180,
167,180,
166,180,
165,180,
164,180,
163,180,
162,180,
161,180,
160,180,
159,180,
158,180,
157,180,
156,180,
155,180,
154,180,
153,180,
152,180,
151,180,
150,180,
149,180,
148,180,
147,180,
146,180,
145,180,
144,180,
143,180,
142,180,
141,180,
140,180,
139,180,
138,180,
137,180,
136,180,
135,180,
134,180,
133,180,
132,180,
131,180,
130,180,
129,180,
128,180,
127,180,
126,180,
125,180,
124,180,
123,180,
122,180,
121,180,
120,180,
119,180,
118,180,
117,180,
116,180,
115,180,
114,180,
113,180,
112,180,
111,180,
110,180,
109,180,
108,180,
107,180,
106,180,
105,180,
104,180,
103,180,
102,180,
101,180,
100,180,
99,180,
98,180,
97,180,
96,180,
95,180,
94,180,
93,180,
92,180,
91,180,
90,180,
89,180,
88,180,
87,180,
86,180,
85,180,
84,180,
83,180,
82,180,
81,180,
80,180,
79,180,
78,180,
77,180,
76,180,
75,180,
74,180,
73,180,
72,180,
71,180,
70,180,
69,180,
68,180,
67,180,
66,180,
65,180,
64,180,
63,180,
62,180,
61,180,
60,180,
59,180,
58,180,
57,180,
56,180,
55,180,
54,180,
53,180,
52,180,
51,180,
50,180,
49,180,
48,180,
47,180,
46,180,
45,180,
44,180,
43,180,
42,180,
41,180,
40,180,
39,180,
38,180,
37,180,
36,180,
35,180,
34,180,
33,180,
32,180,
31,180,
30,180,
29,180,
28,180,
27,180,
26,180,
25,180,
24,180,
23,180,
22,180,
21,180,
20,180,
19,180,
18,180,
17,180,
16,180,
15,180,
14,180,
13,180,
12,180,
11,180,
10,180,
9,180,
8,180,
7,180,
6,180,
5,180,
4,180,
3,180,
2,180,
1,180,
0,180,
0,179.713,
0,178.713,
0,177.713,
0,176.713,
0,175.713,
0,174.713,
0.058,174.721,
0.941,174.139,
2.743,174.453,
2.859,174.418,
3.138,174.334,
3.476,174.232,
3.77,174.143,
3.915,174.099,
4.066,174.102,
4.17,174.118,
5.617,174.534,
6.883,174.118,
7.111,174.061,
10.049,173.885,
11,174.118,
11.47,174.237,
12.978,174.57,
15.818,174.825,
18.07,175.139,
21.929,175.374,
24.808,175.1,
29.058,175.296,
31.467,175.609,
34.111,175.315,
36.892,175.041,
37.108,174.57,
33.171,174.531,
29.939,174.296,
29.097,173.904,
26.414,173.689,
26.59,173.238,
26.962,172.827,
27.334,172.454,
27.138,172.043,
25.474,171.768,
24.71,171.416,
23.163,171.102,
25.591,171.161,
27.902,171.004,
29.352,171.337,
31.134,171.043,
32.779,170.671,
33.582,170.338,
33.23,169.926,
31.937,169.652,
30.468,169.358,
28.412,169.299,
26.61,169.162,
24.671,169.064,
24.024,168.692,
22.732,168.378,
21.948,168.026,
21.635,166.889,
22.125,166.987,
23.025,167.301,
24.671,167.203,
26.257,167.066,
27.08,167.497,
28.666,167.399,
29.998,167.183,
31.252,166.909,
32.388,166.576,
33.896,166.478,
33.856,166.105,
33.504,165.733,
33.798,165.38,
35.09,165.204,
35.678,165.537,
37.206,165.341,
38.361,165.086,
39.791,165.067,
41.142,164.969,
42.494,164.734,
43.571,164.518,
44.785,164.303,
45.569,164.361,
46.254,164.44,
47.743,164.303,
49.075,164.479,
50.446,164.459,
51.758,164.322,
53.109,164.42,
54.598,164.518,
55.989,164.479,
57.438,164.499,
58.926,164.518,
60.297,164.479,
61.316,164.185,
62.53,164.028,
63.784,164.244,
64.978,164.068,
66.056,163.715,
66.702,164.028,
67.055,164.381,
67.701,164.714,
68.739,164.42,
69.934,164.793,
71.285,164.91,
72.441,165.184,
73.851,165.126,
75.124,164.949,
76.632,164.988,
77.983,165.126,
79.354,165.302,
79.883,164.871,
79.237,164.538,
78.747,164.185,
77.455,164.107,
76.887,163.734,
76.671,163.362,
76.319,162.618,
77.083,162.755,
78.395,162.813,
79.687,162.755,
80.863,162.911,
81.881,163.205,
82.312,163.558,
83.663,163.617,
84.956,163.48,
86.327,163.284,
87.561,163.166,
88.579,163.401,
89.911,163.323,
90.773,162.559,
91.576,163.009,
92.732,163.186,
93.985,163.088,
94.808,163.48,
96.12,163.519,
97.334,163.636,
98.529,163.852,
99.313,163.48,
99.704,163.127,
100.703,163.519,
102.074,163.421,
103.093,163.636,
103.778,163.97,
105.11,163.872,
106.148,163.656,
107.166,163.401,
108.381,163.264,
109.791,163.147,
111.064,163.009,
112.043,162.794,
112.631,162.48,
112.866,162.049,
112.748,161.638,
112.435,161.246,
112.083,160.854,
111.769,160.462,
111.515,160.109,
111.456,159.717,
111.554,159.326,
112.024,158.953,
112.416,158.542,
112.572,158.15,
112.376,157.719,
112.259,157.327,
112.748,156.876,
113.297,156.582,
113.943,156.21,
114.629,155.896,
115.432,155.603,
115.823,155.171,
116.372,154.897,
116.999,154.642,
117.958,154.584,
118.585,154.27,
119.29,154.074,
120.113,153.957,
120.837,153.702,
121.405,153.388,
122.189,153.271,
122.776,153.525,
122.404,153.859,
],

[112.25,143.85,
113.55,144.45,
114.95,144.7,
114.5,145.2,
113.55,145.25,
113.04,144.897,
112.709,145.301,
111.851,145.612,
110.768,145.499,
110.042,145.198,
108.994,145.054,
107.736,144.495,
106.715,143.958,
105.337,142.837,
106.162,143.047,
107.566,143.715,
108.892,144.074,
109.408,143.616,
109.733,142.931,
110.654,142.518,
111.366,142.636,
111.366,142.636,
111.75,143.1,
],

[121.45,141.1,
122.25,141.55,
121.95,141.9,
120.6,142.2,
120.15,141.85,
119.3,142.3,
118.8,141.85,
120,141.25,
120.85,141.5,
],

[250.28,139.71,
248.745,139.775,
248.72,139.242,
248.868,138.83,
248.935,138.625,
249.58,138.94,
250.525,139.065,
250.56,139.255,
],

[325.398,130.793,
326.364,131.138,
326.909,131.001,
327.689,130.808,
328.289,130.875,
328.36,132.062,
328.017,132.407,
327.914,133.212,
327.565,132.938,
326.87,133.635,
326.663,133.581,
326.048,133.55,
325.432,132.694,
325.295,132.034,
324.718,131.163,
324.744,130.704,
],

[353.02,130.919,
353.247,131.332,
353.958,130.927,
354.248,131.349,
354.249,131.77,
353.876,132.233,
353.223,132.97,
352.711,133.372,
353.08,133.853,
352.309,133.866,
351.453,134.243,
351.185,134.897,
350.617,135.909,
349.831,136.356,
349.332,136.641,
348.411,136.62,
347.764,136.29,
346.677,136.22,
346.509,135.853,
347.046,135.111,
348.304,134.124,
348.949,133.936,
349.668,133.555,
350.525,133.032,
351.125,132.513,
351.57,131.767,
351.949,131.514,
352.097,130.956,
352.799,130.494,
],

[354.612,126.156,
355.337,127.209,
355.358,126.526,
355.809,126.799,
355.958,127.555,
356.763,127.881,
357.439,127.961,
358.01,127.58,
358.517,127.695,
358.275,128.583,
357.97,129.166,
357.207,129.146,
356.94,129.45,
357.033,129.88,
356.886,130.066,
356.508,130.605,
356.012,131.29,
355.24,131.688,
355.068,131.426,
354.651,131.282,
355.228,130.459,
354.9,129.909,
353.824,129.509,
353.852,129.147,
354.575,128.798,
354.743,128.028,
354.697,127.381,
354.292,126.711,
354.319,126.535,
353.841,126.122,
353.054,125.237,
352.636,124.529,
353.007,124.451,
353.551,125.006,
354.329,125.265,
],

[347.12,112.16,
346.74,112.4,
346.19,112.13,
345.474,111.68,
344.83,111.15,
344.168,110.445,
344.03,110.106,
344.46,110.12,
345.02,110.46,
345.46,110.8,
345.78,111.08,
346.6,111.7,
],

[358.374,107.34,
358.718,107.628,
358.553,108.151,
357.933,108.288,
357.381,108.164,
357.285,107.725,
357.671,107.381,
358.126,107.505,
],

[359.364,106.801,
358.725,107.012,
358.597,106.639,
359.097,106.434,
359.414,106.379,
360,106.067,
360,106.555,
],

[0.083,106.502,
0,106.555,
0,106.067,
0.207,106.021,
],

[347.845,106.466,
347.515,106.598,
347.18,106.16,
347.217,105.892,
],

[347.108,104.934,
347.27,105.74,
347.001,105.615,
346.793,105.669,
346.65,105.393,
346.629,104.626,
],

[230.057,103.556,
230.217,104.759,
230.477,105.227,
230.377,105.706,
230.2,106,
229.861,105.414,
229.673,105.71,
229.863,106.451,
229.775,106.875,
229.499,107.106,
229.436,107.953,
229.042,109.119,
228.549,110.497,
227.931,112.392,
227.548,113.782,
227.096,114.942,
226.282,115.178,
225.41,115.601,
224.834,115.346,
224.04,114.988,
223.764,114.461,
223.698,113.574,
223.346,112.777,
223.254,112.057,
223.433,111.336,
223.894,111.163,
223.896,110.83,
224.374,110.072,
224.464,109.435,
224.232,108.962,
224.043,108.331,
223.963,107.41,
224.312,106.85,
224.447,106.216,
224.945,106.179,
225.503,105.974,
225.873,105.793,
226.312,105.78,
226.882,105.21,
227.705,104.594,
228.005,104.091,
227.869,103.664,
228.294,103.784,
228.845,103.089,
228.864,102.488,
229.195,102.041,
229.544,102.47,
229.809,102.895,
],

[323.562,103.764,
323.922,104.548,
324.564,104.171,
324.895,104.594,
325.375,104.985,
325.272,105.428,
325.485,106.286,
325.637,106.785,
325.889,106.907,
326.16,107.762,
326.064,108.28,
326.387,108.958,
327.471,109.481,
328.178,109.956,
328.848,110.391,
328.717,110.633,
329.289,111.261,
329.678,112.343,
330.077,112.123,
330.483,112.556,
330.727,112.402,
330.9,113.462,
331.609,114.076,
332.074,114.458,
332.855,115.268,
333.136,116.071,
333.162,116.641,
333.093,117.26,
333.569,118.11,
333.512,118.995,
333.339,119.458,
333.069,120.35,
333.09,120.924,
332.892,121.64,
332.45,122.55,
331.709,123.041,
331.344,123.816,
331.011,124.31,
330.714,125.173,
330.328,125.672,
330.075,126.42,
329.946,127.109,
329.997,127.425,
329.424,127.773,
328.305,127.809,
327.382,128.219,
326.922,128.607,
326.318,129.036,
325.49,128.594,
324.877,128.417,
325.032,127.896,
324.486,128.085,
323.61,128.809,
322.745,128.538,
322.178,128.38,
321.607,128.309,
320.639,128.019,
319.992,127.403,
319.807,126.644,
319.574,126.138,
319.083,125.733,
318.121,125.612,
318.449,125.127,
318.208,124.385,
317.719,125.077,
316.829,125.261,
317.352,124.707,
317.504,124.13,
317.89,123.64,
317.81,122.9,
316.997,123.753,
316.372,124.095,
315.989,124.89,
315.208,124.479,
315.239,123.948,
314.613,123.223,
314.086,122.848,
314.274,122.617,
312.991,122.011,
312.288,121.983,
311.326,121.496,
309.536,121.59,
308.241,121.948,
307.103,122.282,
306.149,122.216,
305.089,122.729,
304.222,122.959,
304.029,123.484,
303.66,123.89,
302.811,123.914,
302.183,124.003,
301.299,123.821,
300.58,123.93,
299.894,123.976,
299.299,124.509,
299.007,124.464,
298.506,124.747,
298.025,125.065,
297.296,125.025,
296.625,125.025,
295.564,124.386,
295.027,124.197,
295.049,123.623,
295.545,123.487,
295.715,123.26,
295.679,122.9,
295.802,122.205,
295.69,121.612,
295.161,120.602,
294.997,120.031,
295.04,119.461,
294.642,118.81,
294.616,118.516,
294.174,118.118,
294.049,117.335,
293.477,116.543,
293.339,116.117,
293.778,116.549,
293.441,115.621,
293.937,115.911,
294.233,116.298,
294.216,115.786,
293.721,114.999,
293.625,114.684,
293.394,114.385,
293.502,113.806,
293.707,113.56,
293.843,113.06,
293.737,112.475,
294.15,111.756,
294.225,112.517,
294.648,111.83,
295.46,111.495,
295.947,111.069,
296.712,110.702,
297.166,110.624,
297.442,110.747,
298.23,110.374,
298.836,110.263,
298.988,110.044,
299.252,109.953,
299.805,109.977,
300.856,109.684,
301.4,109.24,
301.655,108.705,
302.242,108.198,
302.287,107.799,
302.313,107.255,
303.013,106.405,
303.434,107.269,
303.859,107.069,
303.503,106.597,
303.817,106.111,
304.258,106.328,
304.38,105.567,
304.926,105.075,
305.167,104.68,
305.67,104.51,
305.686,104.231,
306.125,104.347,
306.143,104.096,
306.583,103.953,
307.066,103.818,
307.805,104.277,
308.36,104.869,
308.986,104.876,
309.621,104.97,
309.41,104.421,
309.889,103.619,
310.339,103.357,
310.184,103.108,
310.618,102.536,
311.223,102.184,
311.735,102.302,
312.575,102.114,
312.557,101.603,
311.825,101.274,
312.357,101.129,
313.02,101.376,
313.551,101.787,
314.393,102.042,
314.679,101.941,
315.298,102.249,
315.883,101.962,
316.258,102.049,
316.492,101.857,
316.952,102.352,
316.685,102.887,
316.305,103.291,
315.962,103.325,
316.078,103.724,
315.784,104.224,
315.429,104.715,
315.5,104.998,
316.295,105.55,
317.065,105.871,
317.58,106.215,
318.303,106.808,
318.585,106.807,
319.109,107.063,
319.261,107.372,
320.215,107.711,
320.875,107.369,
321.071,106.832,
321.274,106.389,
321.398,105.841,
321.702,105.045,
321.563,104.561,
321.636,104.27,
321.52,103.698,
321.651,102.945,
321.843,102.742,
321.687,102.408,
321.929,101.877,
322.118,101.328,
322.144,101.043,
322.515,100.668,
322.797,101.157,
322.867,101.785,
323.116,101.906,
323.159,102.326,
323.522,102.834,
323.597,103.4,
],

[342.119,100.483,
342.399,100.826,
341.7,100.82,
341.32,100.205,
341.917,100.447,
],

[300.716,100.24,
300.295,100.259,
298.968,99.558,
299.9,99.361,
300.426,99.666,
300.776,99.97,
],

[340.852,99.873,
340.463,99.895,
339.849,99.794,
339.64,99.64,
339.703,99.243,
340.363,99.4,
340.689,99.61,
],

[341.68,99.6,
341.529,99.784,
340.788,98.918,
340.58,98.32,
340.92,98.32,
341.28,99.12,
],

[304.436,100.14,
303.58,100.36,
303.46,100.24,
303.55,99.9,
303.98,99.29,
304.969,98.893,
305.086,98.657,
305.947,98.432,
306.645,98.398,
306.957,98.273,
307.336,98.397,
306.968,98.668,
305.926,99.106,
305.089,99.393,
],

[297.9,98.096,
298.261,98.362,
298.878,98.281,
299.127,98.706,
297.97,98.907,
297.278,99.041,
296.74,99.033,
297.084,98.457,
297.632,98.449,
],

[302.904,98.094,
302.757,98.65,
301.254,98.934,
299.924,98.81,
299.921,98.445,
300.715,98.237,
301.342,98.537,
302.007,98.461,
],

[339.875,98.337,
339.917,98.538,
339.134,98.114,
338.586,97.755,
338.211,97.422,
338.36,97.32,
338.82,97.56,
339.64,98.02,
],

[337.538,97.348,
337.339,97.405,
336.902,97.177,
336.491,96.766,
336.543,96.599,
337.14,97.022,
],

[288.623,96.778,
290.539,96.877,
290.76,96.465,
292.615,96.946,
292.979,97.594,
294.479,97.777,
295.706,98.371,
294.565,98.752,
293.465,98.349,
292.56,98.376,
291.522,98.302,
290.586,98.123,
289.428,97.741,
288.694,97.642,
288.278,97.767,
286.454,97.355,
286.281,96.925,
285.365,96.851,
286.052,95.896,
287.265,95.955,
288.072,96.346,
288.487,96.422,
],

[314.725,96.214,
314.21,96.895,
314.113,96.142,
314.29,95.783,
314.5,95.445,
314.727,95.738,
],

[335.88,96.82,
335.6,96.92,
335.167,96.536,
334.729,95.901,
334.514,95.139,
334.653,95.042,
334.76,95.34,
335.063,95.567,
335.548,96.201,
336.02,96.54,
],

[331.983,95.478,
331.459,95.56,
331.301,95.841,
330.754,96.084,
330.241,96.318,
329.71,96.317,
328.89,96.026,
328.319,95.747,
328.402,95.438,
329.298,95.584,
329.846,95.506,
329.996,95.026,
330.14,95.001,
330.237,95.532,
330.807,95.456,
331.09,95.114,
331.648,94.757,
331.538,94.168,
332.137,94.149,
332.339,94.313,
332.319,94.868,
],

[307.249,93.459,
306.875,93.791,
306.184,93.607,
305.989,93.177,
307.001,93.129,
],

[310.471,93.094,
310.835,93.858,
309.991,93.446,
309.155,93.363,
308.591,93.429,
307.899,93.393,
308.136,92.844,
309.371,92.802,
],

[333.14,94.5,
332.827,94.766,
332.639,94.176,
332.406,93.79,
331.953,93.462,
331.384,93.035,
330.662,92.741,
330.94,92.5,
331.48,92.78,
331.82,93,
332.24,93.24,
332.64,93.66,
333.02,93.98,
],

[314.143,91.152,
314.423,92.769,
315.458,93.368,
316.293,92.307,
317.441,91.704,
318.33,91.703,
319.185,92.051,
319.927,92.409,
321,92.6,
322.735,93.289,
324.584,93.861,
325.273,94.374,
325.83,94.876,
325.982,95.466,
327.648,96.084,
327.891,96.614,
326.971,96.722,
327.192,97.388,
328.085,98.044,
328.734,99.105,
329.307,99.071,
329.267,99.514,
330.039,99.684,
329.739,99.873,
330.802,100.294,
330.691,100.583,
330.028,100.652,
329.782,100.393,
328.923,100.281,
327.913,100.13,
327.135,99.492,
326.568,98.943,
326.048,98.067,
324.744,97.63,
323.897,97.915,
323.286,98.245,
323.414,98.983,
322.628,99.327,
322.068,99.16,
321.034,99.118,
320.143,98.297,
319.128,98.096,
318.881,98.381,
317.614,98.412,
318.039,97.598,
318.669,97.32,
318.408,96.233,
317.928,95.393,
315.989,94.547,
315.165,94.463,
313.663,93.539,
313.368,94.025,
312.984,94.113,
312.757,93.746,
312.754,93.312,
311.99,92.821,
313.067,92.46,
313.78,92.48,
313.696,92.215,
312.232,92.213,
311.836,91.617,
310.943,91.433,
310.52,90.938,
311.868,90.695,
312.38,90.37,
313.986,90.78,
],

[305.241,88.58,
304.437,89.572,
303.686,89.764,
302.723,89.569,
301.057,89.619,
300.183,89.763,
300.041,90.52,
300.936,91.409,
301.476,90.956,
303.341,90.616,
303.258,91.076,
302.823,90.931,
302.389,91.517,
301.508,91.904,
302.455,93.186,
302.272,93.53,
303.171,94.684,
303.162,95.341,
302.629,95.635,
302.236,95.283,
302.72,94.464,
301.738,94.851,
301.489,94.575,
301.619,94.188,
300.898,93.602,
300.972,92.628,
300.305,92.932,
300.39,94.098,
300.431,95.528,
299.797,95.673,
299.367,95.38,
299.654,94.459,
299.499,93.494,
299.078,93.487,
298.768,92.802,
299.181,92.147,
299.323,91.353,
299.826,89.846,
300.036,89.434,
300.886,88.691,
301.667,88.986,
302.928,89.125,
304.078,89.083,
305.066,88.357,
],

[308.688,88.868,
308.636,89.742,
308.12,89.644,
307.968,90.252,
308.38,90.78,
308.1,90.9,
307.696,90.267,
307.399,88.988,
307.601,88.189,
307.932,87.825,
308.004,88.371,
308.595,88.459,
],

[285.818,95.852,
284.71,95.873,
283.868,95.037,
282.584,94.22,
282.156,93.614,
281.399,92.8,
280.903,92.05,
280.142,90.65,
279.264,89.817,
278.97,88.957,
278.601,88.176,
277.7,87.547,
277.177,86.691,
276.424,86.131,
275.381,85.029,
275.293,84.52,
275.937,84.56,
277.485,84.754,
278.369,85.732,
279.143,86.41,
279.694,86.826,
280.641,87.901,
281.658,87.916,
282.498,88.601,
283.077,89.439,
283.838,89.895,
283.438,90.712,
284.011,91.059,
284.37,91.085,
284.539,91.782,
284.888,92.34,
285.622,92.429,
286.109,93.062,
285.857,94.306,
],

[297.876,88.172,
298.997,89.098,
297.812,89.216,
297.478,89.898,
297.522,90.804,
296.56,91.488,
296.534,92.484,
296.148,94.013,
296.001,93.657,
294.865,94.107,
294.469,93.496,
293.756,93.439,
293.257,93.119,
292.068,93.478,
291.703,92.994,
291.048,93.049,
290.224,92.934,
290.071,91.593,
289.572,91.315,
289.092,90.46,
288.953,89.585,
289.069,88.658,
289.663,87.994,
290.396,88.336,
291.169,88.149,
291.37,87.303,
291.797,87.114,
292.996,86.898,
293.713,86.106,
294.204,85.474,
294.6,85.1,
295.451,84.552,
296.221,83.857,
296.725,83.075,
297.13,83.072,
297.643,83.578,
297.689,84.013,
298.348,84.291,
299.182,84.592,
299.111,84.984,
298.44,85.033,
298.618,85.522,
297.882,85.862,
297.313,86.766,
298.048,87.712,
],

[306.377,81.585,
306.479,82.25,
306.537,82.811,
306.197,83.726,
305.831,82.706,
305.364,83.214,
305.683,83.95,
305.397,84.419,
304.22,83.839,
303.939,83.115,
304.244,82.639,
303.61,82.166,
303.296,82.581,
302.826,82.543,
302.085,83.101,
301.92,82.808,
302.312,81.965,
302.942,81.684,
303.488,81.307,
303.841,81.76,
304.601,81.486,
304.765,81.04,
305.471,81.013,
305.412,80.24,
306.223,80.714,
306.307,81.218,
],

[261.218,83.803,
260.348,84.032,
259.872,83.237,
259.695,81.799,
260.148,80.176,
260.839,80.732,
261.304,81.436,
261.788,82.477,
261.637,83.518,
],

[119.065,79.89,
118.23,80,
118.05,79.91,
118.34,79.635,
118.32,79.24,
118.895,79.11,
119.105,79.145,
],

[303.982,79.721,
303.623,80.05,
303.31,80.682,
302.996,80.978,
302.38,80.287,
302.586,80.019,
302.837,79.739,
302.947,79.118,
303.499,79.059,
303.338,79.733,
304.078,78.767,
],

[298.505,80.684,
297.174,81.633,
297.664,80.933,
298.387,80.316,
298.987,79.624,
299.511,78.63,
299.69,79.446,
299.029,79.996,
],

[301.884,78.108,
302.484,78.418,
303.12,78.416,
303.101,78.834,
302.638,79.259,
302.003,79.559,
301.967,79.094,
302.038,78.584,
],

[305.503,77.837,
305.783,78.954,
305.012,78.689,
305.033,79.024,
305.277,79.641,
304.802,79.865,
304.76,79.162,
304.459,79.11,
304.303,78.505,
304.891,78.584,
304.878,78.206,
304.267,77.442,
305.227,77.464,
],

[301.527,76.93,
301.262,77.794,
300.834,77.296,
300.323,76.534,
301.18,76.57,
],

[301.321,71.496,
301.938,71.781,
302.246,71.521,
302.337,71.775,
302.174,72.19,
302.516,72.906,
302.252,73.738,
301.663,74.069,
301.505,74.875,
301.729,75.672,
302.259,75.782,
302.701,75.663,
303.95,76.218,
303.855,76.762,
304.181,77.002,
304.077,77.463,
303.298,76.972,
302.929,76.447,
302.671,76.814,
302.035,76.216,
301.126,76.363,
300.629,76.142,
300.679,75.729,
300.992,75.475,
300.693,75.243,
300.564,75.604,
300.07,75.029,
299.921,74.594,
299.884,73.636,
300.286,73.965,
300.39,72.401,
300.716,71.495,
],

[114.409,71.772,
114.153,72.024,
113.4,72.018,
112.816,72.053,
112.758,71.626,
112.899,71.479,
113.718,71.485,
114.229,71.573,
],

[103.097,72.132,
102.794,72.299,
102.234,72.138,
101.662,71.774,
101.782,71.545,
102.203,71.476,
102.43,71.509,
103.103,71.599,
103.635,71.839,
103.8,72.113,
],

[107.42,70.128,
108.288,70.286,
108.413,70.115,
109.193,70.12,
109.786,70.377,
110.049,70.352,
110.231,70.707,
110.778,70.687,
110.746,70.985,
111.191,71.021,
111.682,71.388,
111.311,71.795,
110.835,71.577,
110.376,71.619,
110.047,71.572,
109.867,71.754,
109.483,71.816,
109.331,71.573,
109,71.717,
108.6,72.401,
108.342,72.242,
108.292,71.955,
107.628,71.785,
107.156,71.854,
106.545,71.782,
106.078,71.969,
105.542,71.657,
105.63,71.335,
106.55,71.474,
107.305,71.554,
107.665,71.332,
107.208,70.898,
107.216,70.516,
106.585,70.36,
106.81,70.084,
],

[290.339,71.322,
289.475,71.802,
288.655,71.492,
288.626,70.632,
289.119,70.179,
290.212,69.899,
290.787,69.922,
291.01,70.304,
290.571,70.744,
],

[24.458,70.917,
24.312,71.084,
24.063,70.941,
24.092,70.661,
23.927,70.297,
23.976,70.186,
24.15,70.023,
24.081,69.826,
24.139,69.733,
24.215,69.751,
24.598,69.92,
24.775,70.007,
24.938,70.141,
25.193,70.491,
25.169,70.547,
24.778,70.76,
],

[23.921,69.356,
23.586,69.428,
23.413,69.217,
23.298,69.136,
23.289,69.073,
23.387,68.988,
23.743,69.083,
24.004,69.236,
],

[23.242,68.823,
23.211,68.931,
22.675,68.902,
22.75,68.78,
],

[22.347,68.678,
22.293,68.736,
22.221,68.723,
21.873,68.688,
21.746,68.461,
21.707,68.421,
21.975,68.283,
22.058,68.347,
],

[20.655,68.018,
20.536,68.117,
20.199,67.935,
20.251,67.862,
20.404,67.764,
20.634,67.785,
],

[100.32,67.235,
100.719,67.601,
101.653,67.488,
102.007,67.723,
102.854,68.342,
103.476,68.793,
103.805,68.779,
104.402,68.983,
104.329,69.265,
105.066,69.306,
105.822,69.715,
105.703,69.95,
105.038,70.077,
104.365,70.126,
103.676,70.047,
102.245,70.145,
102.915,69.587,
102.507,69.327,
101.863,69.26,
101.517,68.971,
101.28,68.402,
100.715,68.441,
99.783,68.173,
99.482,67.963,
98.179,67.808,
97.83,67.613,
98.205,67.363,
97.224,67.312,
96.506,67.831,
96.091,67.845,
95.948,68.089,
95.453,68.199,
95.025,68.104,
95.553,67.795,
95.77,67.434,
96.222,67.212,
96.732,67.017,
97.49,66.921,
97.732,66.811,
98.596,66.883,
99.381,66.894,
],

[102.465,66.24,
102.22,66.29,
101.966,65.714,
101.592,65.424,
101.809,64.79,
102.11,64.83,
102.46,65.66,
],

[301.176,67.209,
300.747,68.029,
300.22,67.185,
300.106,66.444,
300.695,65.462,
301.495,64.705,
301.951,65.002,
301.778,65.606,
],

[102.18,63.42,
101.09,63.58,
101.02,63.21,
101.49,63.13,
102.15,63.16,
],

[103,63.41,
102.827,64.121,
102.644,63.993,
102.66,63.47,
102.212,63.075,
102.21,62.96,
],

[314.638,55.851,
314.766,56.194,
314.203,56.799,
313.793,56.478,
313.28,56.71,
313.015,57.295,
312.363,57.011,
312.371,56.536,
312.924,55.94,
313.493,56.055,
313.904,55.635,
],

[214.576,54.328,
213.901,54.754,
213.974,54.941,
214.005,55.022,
212.98,55.428,
212.49,55.298,
212.257,54.897,
212.732,54.86,
212.802,54.854,
212.947,54.613,
213.667,54.627,
],

[203.7,54.295,
204.247,54.632,
205.025,54.575,
205.769,54.646,
205.745,54.82,
206.29,54.7,
206.165,54.995,
204.725,55.08,
204.735,54.915,
203.515,54.72,
],

[195.52,51.769,
195.16,52.556,
195.31,52.866,
195.1,53.38,
194.335,53.003,
193.827,52.895,
192.431,52.387,
192.571,51.874,
193.741,51.965,
194.761,51.856,
],

[189.21,48.79,
189.81,49.5,
189.67,50.823,
189.215,50.76,
188.807,51.093,
188.428,50.828,
188.388,49.622,
188.16,49.05,
188.71,49.1,
],

[320.976,52.858,
320.6,53.656,
320.774,54.157,
320.253,54.862,
318.976,55.332,
317.218,55.394,
315.793,56.535,
315.121,56.151,
315.079,55.403,
313.34,55.624,
312.157,56.095,
310.986,56.114,
312,56.85,
311.333,58.55,
310.686,58.97,
310.202,58.582,
310.448,57.681,
309.815,57.39,
309.408,56.704,
310.354,56.396,
310.878,55.767,
311.884,55.25,
312.618,54.567,
314.608,54.268,
315.678,54.473,
316.724,52.695,
317.391,53.173,
318.858,52.173,
319.426,51.784,
320.055,50.561,
319.883,49.437,
320.306,48.805,
321.369,48.621,
321.914,50.008,
321.885,50.819,
320.959,51.826,
],

[189.56,47.848,
189.23,48.62,
188.776,48.416,
188.544,47.743,
188.746,47.372,
189.39,46.99,
],

[323.91,45.826,
324.613,46.039,
325.321,45.615,
325.543,46.738,
324.06,47.012,
323.184,48.005,
321.611,47.321,
321.067,48.415,
319.955,48.43,
319.818,47.436,
320.312,46.667,
321.381,46.611,
321.672,45.228,
321.968,44.449,
323.143,45.49,
],

[116.335,43.45,
117.061,43.584,
117.988,43.557,
117.496,43.967,
117.126,44.032,
115.857,43.607,
115.607,43.273,
115.985,42.964,
],

[118.194,40.895,
117.707,40.913,
116.411,40.599,
115.481,40.127,
115.827,40.043,
117.142,40.294,
118.164,40.711,
],

[56.49,41.49,
55.987,41.629,
54.345,41.175,
54.045,40.82,
53.15,40.47,
52.97,40.185,
51.941,40.005,
51.555,39.461,
51.642,39.229,
52.691,39.447,
53.305,39.599,
54.245,39.705,
54.585,40.05,
55.079,40.525,
56.077,40.938,
],

[123.866,39.313,
123.204,40.188,
123.857,39.85,
124.529,40.064,
124.178,40.413,
125.065,40.687,
125.526,40.443,
126.523,40.751,
126.214,41.483,
126.914,41.312,
127.041,41.843,
127.352,42.464,
126.931,43.345,
126.479,43.382,
125.821,43.193,
126.038,42.375,
125.76,42.248,
124.599,43.115,
124.003,43.08,
124.709,42.61,
123.749,42.367,
122.675,42.427,
120.734,42.397,
120.581,42.101,
121.203,41.748,
120.768,41.477,
121.608,40.874,
122.641,39.282,
123.261,38.713,
124.129,38.368,
124.593,38.412,
124.4,38.683,
],

[47.29,35.96,
47.29,35.96,
47.29,35.96,
47.29,35.96,
48.25,35.88,
47.951,37.015,
48.821,37.82,
48.422,37.818,
47.82,37.36,
47.45,36.9,
46.945,36.589,
46.76,36.149,
46.82,35.83,
],

[323.648,39.252,
324.654,41.024,
323.174,40.693,
322.559,42.138,
323.533,43.163,
323.505,43.862,
322.748,43.259,
322.092,44.033,
321.907,43.194,
322.018,42.22,
321.904,41.141,
322.136,40.385,
322.18,39.048,
321.594,38.065,
321.683,36.698,
322.607,36.238,
322.21,35.775,
322.655,35.634,
322.915,36.295,
323.261,37.259,
323.235,38.243,
],

[173.211,37.74,
171.438,38.331,
170.023,38.18,
170.834,37.135,
170.311,36.119,
171.672,35.335,
172.428,34.868,
173.266,34.827,
174.338,35.445,
173.802,36.132,
173.967,36.847,
],

[192.69,34.39,
192.09,35.2,
191.044,34.635,
190.904,34.22,
192.371,33.889,
],

[26.994,32.884,
25.995,33.265,
25.484,33.007,
25.329,32.539,
26.237,32.183,
26.771,32.031,
27.435,32.099,
27.859,32.409,
],

[176.995,31.365,
175.926,32.447,
176.945,32.31,
178.041,32.315,
177.78,33.13,
176.881,34.026,
177.915,34.09,
178.885,35.375,
179.57,35.536,
180.185,36.675,
180.47,37.07,
181.682,37.26,
181.56,37.9,
181.051,38.193,
181.45,38.711,
180.55,39.234,
179.212,39.225,
177.51,39.5,
177.044,39.303,
176.383,39.772,
175.457,39.658,
174.755,40.04,
174.223,39.84,
175.69,38.79,
176.585,38.574,
175.016,38.407,
174.733,38.009,
175.778,37.699,
175.23,37.16,
175.42,36.505,
176.908,36.596,
177.055,36.015,
176.37,35.385,
175.156,35.209,
174.917,34.938,
175.281,34.492,
174.952,34.216,
174.414,34.689,
174.355,33.725,
173.85,33.215,
174.213,32.181,
174.99,31.37,
175.789,31.449,
],

[14.421,30.09,
13.807,30.246,
13.152,30.059,
12.545,29.787,
13.532,29.616,
14.326,29.706,
],

[100.734,27.841,
100.342,28.367,
99.9,28.282,
99.638,27.984,
99.685,27.914,
100.071,27.614,
100.48,27.636,
],

[98.102,27.289,
96.931,27.841,
96.225,27.818,
96.006,27.547,
96.75,27.086,
98.123,27.095,
],

[8.268,26.217,
8.886,26.408,
9.509,26.305,
10.317,26.569,
11.311,26.702,
11.228,26.811,
10.471,27.023,
9.709,26.806,
9.329,26.624,
8.447,26.682,
8.209,26.594,
],

[94.839,24.343,
95.024,24.782,
95.536,24.628,
96.117,24.89,
97.212,25.233,
98.358,25.545,
98.447,26.02,
99.183,25.943,
99.897,26.274,
99.009,26.589,
97.453,26.348,
96.891,25.898,
95.9,26.43,
94.477,26.948,
94.133,26.363,
92.778,26.459,
93.647,25.964,
93.775,25.177,
94.116,24.261,
],

[165.491,23.544,
165.26,24.191,
166.39,24.873,
165.09,25.636,
162.206,26.321,
161.344,26.504,
160.027,26.356,
157.237,26.04,
158.222,25.598,
156.045,25.109,
157.816,24.915,
157.773,24.621,
155.674,24.389,
156.349,23.737,
157.865,23.59,
159.424,24.268,
160.943,23.723,
162.201,24.006,
163.832,23.473,
],

[104.134,22.851,
103.013,22.901,
102.764,22.412,
103.188,21.851,
104.105,21.713,
104.885,21.99,
104.897,22.418,
104.784,22.556,
],

[4.986,23.416,
5.66,23.664,
5.428,22.938,
8.143,23.087,
10.1,24.023,
9.109,24.459,
7.47,24.562,
7.445,25.539,
7.045,25.747,
6.108,25.717,
5.346,25.369,
4.016,25.077,
3.793,24.643,
2.777,24.48,
1.64,24.609,
1.097,24.26,
1.314,23.888,
0.116,24.125,
0.567,24.596,
0,25.02,
0,21.036,
2.45,21.8,
5.072,22.794,
],

[84.352,20.892,
83.73,21.243,
82.383,20.94,
81.568,21.049,
80.203,20.6,
81.083,20.29,
81.782,19.856,
82.843,20.14,
83.443,20.32,
83.743,20.51,
],

[360,19.168,
358.903,19.219,
358.725,18.901,
360,18.484,
],

[1.306,19.107,
0,19.168,
0,18.484,
0.128,18.442,
0.976,18.444,
2.422,18.731,
2.336,18.867,
],

[89.453,20.502,
89.448,21.525,
90.785,20.741,
91.98,21.385,
91.682,22.127,
92.65,22.801,
93.694,22.078,
94.423,21.216,
94.478,20.118,
95.899,20.195,
97.378,20.342,
98.72,20.838,
98.78,21.334,
98.036,21.867,
98.741,22.403,
98.614,22.889,
96.656,23.588,
95.265,23.743,
94.231,23.442,
93.932,23.944,
92.969,24.787,
92.677,25.224,
91.517,25.901,
90.086,25.967,
89.296,26.39,
89.23,27.04,
88.067,27.165,
86.843,27.975,
85.758,29.101,
85.371,29.89,
85.315,31.051,
86.785,31.218,
87.235,32.154,
87.703,32.913,
89.102,32.715,
90.961,33.148,
91.96,33.528,
92.676,34.001,
93.929,34.276,
94.988,34.697,
96.64,34.755,
97.727,34.852,
97.564,35.718,
97.875,36.723,
98.599,37.842,
100.087,38.792,
100.857,38.466,
101.398,37.438,
100.876,35.859,
100.17,35.332,
101.771,34.864,
102.904,34.162,
103.459,33.466,
103.377,32.797,
102.698,31.948,
101.483,31.195,
102.663,30.147,
102.227,29.242,
101.893,27.68,
102.589,27.45,
104.304,27.721,
105.332,27.819,
106.16,27.556,
107.091,27.895,
108.323,28.475,
108.626,28.863,
110.41,28.938,
110.38,29.779,
110.712,31.043,
111.625,31.199,
112.35,31.788,
113.798,31.233,
114.755,30.129,
115.417,29.664,
116.195,30.557,
117.498,31.833,
118.604,33.032,
118.201,33.661,
119.531,34.224,
120.43,34.796,
122.025,35.055,
122.667,35.373,
123.063,36.22,
123.842,36.352,
124.244,36.729,
124.317,37.853,
123.591,38.229,
122.873,38.58,
121.225,38.936,
119.967,39.757,
118.276,39.919,
116.138,39.709,
114.637,39.702,
113.601,39.771,
112.764,40.489,
111.489,40.932,
110.046,42.255,
108.896,43.178,
109.745,43.014,
111.35,41.7,
113.448,40.867,
114.944,40.767,
115.829,41.258,
114.885,41.929,
115.201,43.007,
115.528,43.761,
116.827,44.261,
118.479,44.116,
119.482,42.992,
119.551,43.717,
120.197,44.08,
118.96,44.735,
116.745,45.33,
115.753,45.734,
114.636,46.455,
113.877,46.381,
113.838,45.535,
115.575,44.708,
113.974,44.741,
112.863,44.862,
113.035,45.19,
111.968,45.675,
110.94,46.02,
109.884,46.316,
109.31,46.97,
109.185,47.135,
109.175,47.665,
109.505,48.195,
109.92,48.22,
109.815,47.855,
110.115,48.077,
110.035,48.363,
109.36,48.525,
108.88,48.505,
108.14,48.68,
107.705,48.73,
107.124,48.779,
106.29,49.069,
107.759,48.88,
108.055,49.07,
106.655,49.37,
106.018,49.372,
106.048,49.249,
105.743,49.526,
106.038,49.572,
105.822,50.291,
105.094,51.06,
105.02,50.804,
104.8,50.752,
104.472,50.502,
104.68,51.04,
104.917,51.219,
104.943,51.596,
104.623,51.984,
104.06,52.783,
103.969,52.743,
104.278,52.063,
103.767,51.681,
103.65,50.85,
103.457,51.282,
103.671,51.917,
103.04,51.767,
103.698,52.082,
103.741,53.034,
104.028,53.103,
104.132,53.449,
104.273,54.449,
103.637,55.192,
102.602,55.488,
101.945,56.075,
101.446,56.139,
100.939,56.506,
100.797,56.841,
99.699,57.491,
99.135,57.967,
98.664,58.56,
98.51,59.27,
98.686,59.964,
99.02,60.82,
99.464,61.528,
99.47,61.96,
99.943,63.12,
99.912,63.794,
99.869,64.183,
99.619,64.794,
99.32,64.92,
98.828,64.799,
98.67,64.36,
98.29,64.13,
97.76,63.27,
97.295,62.505,
97.145,62.114,
97.35,61.45,
97.07,60.9,
96.29,60.063,
95.9,59.91,
94.891,60.364,
94.712,60.314,
94.227,59.847,
93.6,59.6,
92.47,59.726,
91.582,59.615,
90.82,59.684,
90.395,59.824,
90.586,60.106,
90.57,60.511,
90.782,60.709,
90.592,60.84,
90.221,60.693,
89.845,60.883,
89.12,60.851,
88.373,60.323,
87.501,60.448,
86.774,60.216,
86.152,60.286,
85.31,60.52,
84.4,61.261,
83.406,61.693,
82.86,62.17,
82.63,62.62,
82.62,63.31,
82.67,63.79,
82.86,64.13,
82.861,64.132,
82.858,64.134,
82.472,65.008,
82.297,65.728,
82.224,67.067,
82.128,67.556,
82.301,68.101,
82.611,68.589,
82.811,69.365,
83.474,70.109,
83.708,70.68,
84.099,71.172,
85.161,71.437,
85.574,71.856,
86.451,71.576,
87.214,71.475,
87.963,71.295,
88.592,71.124,
89.228,70.716,
89.466,70.133,
89.549,69.292,
89.721,69,
90.399,68.738,
91.456,68.506,
92.342,68.541,
92.948,68.456,
93.188,68.669,
93.154,69.15,
92.617,69.745,
92.379,70.354,
92.563,70.528,
92.414,70.96,
92.163,71.74,
91.909,71.483,
91.7,71.5,
91.704,71.647,
91.893,71.651,
91.877,71.923,
91.715,72.356,
91.802,72.51,
91.697,72.868,
91.76,72.964,
91.645,73.469,
91.448,73.734,
91.268,73.766,
91.069,74.113,
91.395,74.294,
91.482,74.144,
91.775,74.272,
91.879,74.311,
92.098,74.135,
92.384,74.121,
92.477,74.203,
92.632,74.153,
93.097,74.243,
93.559,74.217,
93.881,74.107,
93.998,73.995,
94.317,74.046,
94.556,74.114,
94.818,74.091,
95.016,74.004,
95.473,74.143,
95.632,74.165,
95.937,74.352,
96.226,74.576,
96.59,74.729,
96.853,75.004,
96.767,75.1,
96.716,75.323,
96.818,75.689,
96.588,76.03,
96.48,76.432,
96.448,76.873,
96.502,77.131,
96.527,77.581,
96.374,77.679,
96.28,78.107,
96.349,78.371,
96.145,78.627,
96.191,78.897,
96.344,79.061,
96.598,79.604,
96.984,80.007,
97.454,80.434,
97.813,80.792,
97.792,81.004,
98.191,81.049,
98.286,80.968,
98.561,81.214,
99.053,81.141,
99.478,80.889,
100.085,80.687,
100.427,80.388,
100.979,80.447,
100.942,80.545,
101.499,80.58,
101.944,80.752,
102.271,81.053,
102.647,81.33,
103.163,81.361,
103.914,80.663,
104.325,80.557,
104.335,80.226,
104.52,79.381,
105.093,78.917,
105.723,78.898,
105.803,78.69,
106.585,78.773,
107.372,78.268,
107.762,78.044,
108.246,77.563,
108.6,77.624,
108.863,77.887,
108.668,78.224,
108.64,78.46,
108.053,78.577,
108.379,79.031,
108.367,79.554,
107.926,80.134,
108.304,80.928,
108.735,80.863,
108.96,80.14,
108.65,79.788,
108.599,79.031,
109.845,78.625,
109.706,78.153,
110.057,77.838,
110.416,78.54,
111.117,78.557,
111.767,79.114,
111.806,79.445,
112.704,79.454,
113.772,79.351,
114.345,79.799,
115.11,79.923,
115.671,79.61,
115.682,79.359,
116.921,79.298,
118.119,79.284,
117.27,79.58,
117.612,80.052,
118.411,80.127,
119.169,80.619,
119.329,81.42,
119.85,81.397,
120.242,81.633,
120.898,82.001,
121.517,82.652,
121.545,83.167,
121.922,83.191,
122.458,83.679,
122.853,84.027,
124.051,84.227,
124.158,84.047,
124.967,83.975,
126.042,84.243,
126.382,84.354,
127.118,84.59,
128.177,85.434,
128.342,85.844,
128.683,85.797,
128.93,86.349,
129.491,88.099,
130.026,88.263,
130.053,88.954,
129.301,89.777,
129.612,90.078,
131.38,90.235,
131.416,91.238,
132.175,90.582,
133.433,90.941,
135.094,91.552,
135.582,92.138,
135.418,92.691,
136.581,92.383,
138.527,92.912,
140.021,92.873,
141.5,93.701,
142.777,94.821,
143.547,95.109,
144.402,95.149,
144.765,95.465,
145.104,96.738,
145.27,97.343,
144.872,98.996,
144.363,99.649,
142.953,101.041,
142.316,102.171,
141.576,103.038,
141.326,103.058,
141.047,103.793,
141.118,105.667,
140.839,107.208,
140.733,107.868,
140.417,108.262,
140.239,109.599,
139.225,110.904,
139.055,111.937,
138.246,112.371,
138.012,112.97,
136.925,112.968,
135.352,113.352,
134.648,113.797,
133.528,114.089,
132.351,114.885,
131.505,115.877,
131.359,116.624,
131.525,117.176,
131.339,118.186,
131.112,118.674,
130.413,119.224,
129.303,120.984,
128.424,121.778,
127.744,122.245,
127.288,123.197,
126.626,123.768,
126.194,124.397,
125.064,124.953,
124.326,124.753,
123.785,124.86,
122.86,124.43,
122.182,124.463,
121.573,123.909,
121.505,124.432,
122.774,125.288,
122.638,125.977,
123.263,126.413,
123.212,126.901,
122.251,128.184,
120.768,128.72,
118.763,128.928,
117.664,128.828,
117.874,129.424,
117.669,130.173,
117.854,130.677,
117.254,131.029,
116.229,131.167,
115.268,130.803,
114.882,131.064,
115.021,132.058,
115.697,132.359,
116.244,132.044,
116.542,132.563,
115.621,132.873,
114.818,133.495,
114.671,134.501,
114.435,135.037,
113.49,135.04,
112.706,135.552,
112.419,136.302,
113.403,137.034,
114.359,137.236,
114.015,138.133,
112.834,138.697,
112.184,139.87,
111.271,140.264,
110.862,140.732,
111.185,141.771,
111.85,142.35,
111.429,142.299,
110.539,142.292,
110.057,142.538,
109.155,142.899,
108.994,143.833,
108.57,143.856,
107.442,143.531,
106.297,142.835,
105.053,142.263,
104.74,141.629,
105.023,141.043,
104.52,140.378,
104.392,138.674,
104.817,137.712,
105.873,136.939,
104.356,136.648,
105.308,135.764,
105.648,134.103,
106.76,134.455,
107.282,132.383,
106.611,132.117,
106.299,133.366,
105.668,133.225,
105.982,131.795,
106.323,129.942,
106.782,129.259,
106.495,128.283,
106.412,127.156,
106.833,127.124,
107.447,125.509,
108.138,123.909,
108.562,122.419,
108.331,120.921,
108.63,120.096,
108.51,118.861,
109.095,117.64,
109.275,115.706,
109.596,113.629,
109.909,111.393,
109.836,109.756,
109.628,108.348,
108.625,107.774,
108.538,107.363,
106.555,106.359,
104.762,105.266,
103.991,104.649,
103.577,103.823,
103.741,103.535,
102.894,102.223,
101.908,100.378,
100.963,98.387,
100.554,97.931,
100.24,97.194,
99.463,96.542,
98.75,96.137,
99.074,95.69,
98.589,94.737,
98.9,94.036,
99.698,93.405,
100.23,92.657,
100.013,92.221,
99.631,92.685,
99.032,92.247,
99.235,91.965,
99.066,91.057,
99.417,90.907,
99.601,90.284,
99.979,89.64,
99.909,89.232,
100.457,89.017,
101.145,88.619,
101.009,88.309,
101.382,88.234,
101.338,87.733,
101.572,87.37,
102.068,87.303,
102.49,86.675,
102.872,86.15,
102.504,85.912,
102.692,85.332,
102.467,84.417,
102.681,84.155,
102.523,83.309,
102.118,82.776,
101.785,82.488,
101.571,81.948,
101.818,81.681,
101.565,81.612,
101.378,81.282,
100.88,81.004,
100.442,81.068,
100.24,81.416,
99.836,81.667,
99.617,81.701,
99.519,81.91,
99.996,82.453,
99.723,82.58,
99.579,82.729,
99.114,82.779,
98.94,82.182,
98.81,82.352,
98.481,82.293,
98.279,81.891,
97.869,81.825,
97.609,81.708,
97.18,81.709,
97.149,81.926,
97.034,81.775,
96.492,81.553,
96.289,81.343,
96.404,81.169,
96.367,80.948,
96.09,80.709,
95.697,80.513,
95.352,80.385,
95.287,80.092,
95.024,79.913,
95.089,80.204,
94.889,80.443,
94.661,80.166,
94.339,80.067,
94.203,79.865,
94.208,79.561,
94.341,79.246,
94.058,79.105,
94.287,78.911,
93.942,78.596,
93.474,78.193,
93.254,77.856,
92.833,77.542,
92.331,77.09,
92.443,76.935,
92.608,77.086,
92.683,77.015,
92.511,76.703,
92.207,76.615,
92.096,76.851,
91.517,76.836,
91.157,76.74,
90.743,76.541,
90.188,76.479,
89.904,76.265,
89.391,76.09,
88.768,76.072,
88.31,75.874,
87.772,75.461,
86.641,74.385,
86.125,74.06,
85.308,73.799,
84.75,73.872,
83.947,74.248,
83.443,74.346,
82.736,74.083,
81.987,73.893,
81.052,73.434,
80.303,73.294,
79.17,72.829,
78.334,72.351,
78.081,72.084,
77.522,72.024,
76.499,71.708,
76.083,71.251,
75.008,70.684,
74.507,70.053,
74.269,69.566,
74.602,69.468,
74.499,69.183,
74.729,68.924,
74.734,68.578,
74.397,68.129,
74.307,67.731,
73.971,67.226,
73.09,66.232,
72.085,65.451,
71.598,64.828,
70.74,64.419,
70.556,64.175,
70.708,63.557,
70.199,63.324,
69.608,62.838,
69.359,62.14,
68.821,62.059,
68.24,61.532,
67.772,61.045,
67.728,60.733,
67.19,59.979,
66.836,59.213,
66.851,58.829,
66.128,58.432,
65.794,58.476,
65.224,58.2,
65.063,58.607,
65.229,59.086,
65.326,59.837,
65.669,60.25,
66.411,60.938,
66.576,61.174,
66.728,61.245,
66.86,61.589,
67.038,61.575,
67.238,62.22,
67.542,62.474,
67.755,62.828,
68.383,63.337,
68.715,64.267,
69.012,64.705,
69.29,65.174,
69.345,65.701,
69.827,65.734,
70.228,66.189,
70.591,66.635,
70.567,66.814,
70.146,67.182,
69.969,67.177,
69.705,66.569,
69.05,65.999,
68.329,65.516,
67.818,65.261,
67.851,64.53,
67.699,63.988,
67.223,63.678,
66.535,63.232,
66.403,63.36,
66.151,63.1,
65.534,62.858,
64.945,62.277,
65.018,62.202,
65.43,62.258,
65.801,61.885,
65.838,61.434,
65.068,60.721,
64.481,60.444,
64.113,59.819,
63.742,59.164,
63.279,58.364,
62.872,57.465,
62.704,56.954,
62.056,56.379,
61.589,56.259,
61.48,55.972,
60.919,55.922,
60.561,55.651,
59.632,55.553,
59.377,55.391,
59.256,54.843,
58.285,53.838,
57.453,52.448,
57.488,52.216,
57.047,51.886,
56.273,51.048,
56.135,50.233,
55.602,49.687,
55.821,48.858,
55.786,48,
55.467,47.234,
55.858,46.292,
56.101,44.477,
55.92,43.135,
55.604,42.28,
55.313,41.815,
55.434,41.62,
56.88,41.96,
57.413,42.904,
57.66,42.64,
57.5,41.82,
57.16,41,
57.026,40.997,
55.09,40.015,
54.375,39.583,
52.564,39.169,
52.007,38.284,
52.15,37.67,
50.87,37.245,
50.695,36.438,
49.485,35.712,
49.464,35.197,
48.914,34.821,
48.033,34.502,
47.75,33.63,
46.461,32.821,
45.922,31.877,
44.962,31.812,
43.372,31.788,
42.2,31.5,
40.132,30.462,
39.175,30.273,
37.426,29.916,
36.041,30.001,
34.075,29.541,
32.886,29.115,
31.776,29.327,
31.982,30.022,
31.429,30.086,
30.272,30.294,
29.392,30.632,
28.284,30.844,
28.141,30.255,
28.59,29.274,
29.653,28.966,
29.379,28.716,
28.104,29.273,
27.422,29.938,
25.981,30.65,
26.713,31.135,
25.768,31.854,
24.693,32.272,
23.692,32.577,
23.444,33.02,
21.883,33.536,
21.567,34.006,
20.397,34.433,
19.71,34.356,
18.777,34.635,
17.762,34.976,
16.931,35.31,
15.214,35.596,
15.058,35.428,
16.152,34.961,
17.13,34.652,
18.196,34.105,
19.436,33.992,
19.93,33.582,
21.316,32.983,
21.539,32.783,
22.277,32.43,
22.45,31.672,
22.958,31.081,
21.805,31.384,
21.483,31.212,
20.941,31.576,
20.288,31.068,
20.019,31.427,
19.645,30.929,
18.645,31.329,
18.031,31.328,
17.945,30.733,
18.126,30.366,
17.482,30.01,
16.182,30.202,
15.338,29.732,
14.654,29.492,
14.649,28.926,
13.879,28.5,
14.266,27.925,
15.081,27.367,
15.438,26.854,
16.247,26.781,
16.933,26.94,
17.74,26.458,
18.466,26.544,
19.227,26.234,
19.042,25.777,
18.482,25.597,
19.222,25.211,
18.608,25.223,
17.547,25.44,
17.242,25.661,
16.454,25.441,
15.039,25.553,
13.575,25.313,
13.155,24.911,
11.89,24.33,
13.295,23.912,
15.525,23.423,
16.347,23.423,
16.211,23.923,
18.322,23.884,
17.51,23.265,
16.28,22.883,
15.569,22.384,
14.61,21.957,
13.236,21.641,
13.795,21.117,
15.569,21.084,
16.831,20.629,
17.07,20.142,
18.091,19.667,
19.065,19.552,
20.961,19.108,
21.88,19.175,
23.419,18.642,
24.932,18.852,
25.656,19.304,
26.1,19.11,
27.79,19.17,
27.73,19.4,
29.26,19.57,
30.28,19.47,
32.387,19.786,
34.31,19.88,
35.08,20.01,
36.411,19.847,
37.927,20.148,
39.014,20.288,
40.88,20.529,
42.454,21.01,
43.496,21.102,
44.374,20.685,
45.585,20.372,
47.071,20.495,
48.569,20.055,
50.205,19.806,
50.892,20.221,
51.638,19.987,
51.862,19.516,
52.553,19.623,
54.244,20.519,
55.575,19.841,
55.71,20.6,
56.939,20.436,
57.317,20.144,
58.528,20.202,
60.057,20.622,
62.397,20.989,
63.774,21.159,
64.753,21.094,
66.102,21.601,
64.695,22.097,
66.503,22.312,
69.202,22.194,
70.054,22.019,
71.12,22.618,
72.208,22.112,
71.187,21.688,
71.833,21.346,
73.05,21.3,
73.85,21.2,
74.657,21.439,
75.662,21.982,
76.779,21.902,
78.546,22.353,
80.098,22.194,
81.557,22.218,
81.441,21.596,
82.331,21.421,
83.88,21.76,
83.874,22.706,
84.511,21.909,
85.315,21.936,
85.767,20.931,
84.696,20.314,
83.529,19.91,
83.609,18.805,
84.791,18.08,
86.11,18.24,
87.122,18.681,
88.48,19.809,
87.593,20.3,
],

[65.833,16.879,
65.334,17.347,
67.559,17.045,
68.95,17.55,
70.08,17.039,
70.993,17.367,
71.812,18.349,
72.314,17.935,
71.604,16.91,
72.484,16.764,
73.477,16.924,
74.598,17.327,
75.225,18.302,
75.535,19.007,
77.215,19.502,
79.019,19.976,
78.911,20.416,
77.269,20.496,
77.907,20.88,
77.57,21.247,
75.76,21.09,
74.04,20.82,
72.877,20.881,
71,21.22,
68.033,21.396,
66.687,21.464,
66.145,20.993,
64.78,20.72,
63.892,20.832,
62.66,20.04,
63.325,19.933,
64.869,19.763,
66.279,19.808,
67.584,19.634,
65.65,19.4,
63.513,19.48,
62.095,19.459,
61.568,19.091,
63.887,18.691,
62.344,18.705,
60.598,18.441,
61.437,17.692,
62.134,17.294,
64.811,16.685,
],

[75.5,16.58,
74.62,17.24,
73.06,16.54,
73.4,16.4,
74.74,16.36,
],

[103.66,16.897,
103.749,17.174,
102.686,17.144,
101.608,17.123,
100.514,17.258,
100.224,17.197,
99.124,16.667,
99.166,16.307,
99.647,16.24,
101.936,16.348,
],

[93.438,16.843,
94.226,17.466,
95.15,16.66,
97.684,16.249,
99.4,17.283,
99.251,17.938,
101.229,17.648,
102.175,17.25,
104.394,17.756,
105.771,18.233,
105.901,18.669,
107.758,18.443,
108.8,19.08,
111.214,19.475,
112.085,19.878,
113.031,20.814,
111.195,21.28,
113.55,21.933,
115.138,22.152,
116.575,23.072,
118.148,23.138,
117.837,23.84,
116.082,25.001,
114.851,24.574,
113.279,23.612,
111.985,23.737,
111.859,24.31,
112.91,24.892,
114.268,25.352,
114.68,25.617,
115.331,26.607,
114.986,27.326,
113.725,27.055,
111.217,26.254,
112.63,27.116,
113.672,27.72,
113.834,28.069,
111.123,27.67,
108.977,27.089,
107.765,26.602,
108.114,26.32,
106.622,25.806,
105.166,25.321,
105.181,25.611,
102.29,25.77,
101.444,25.427,
102.103,24.691,
103.982,24.673,
106.04,24.545,
105.706,24.188,
106.055,23.689,
107.349,22.715,
107.074,22.273,
106.688,21.931,
105.157,21.445,
103.131,21.105,
103.771,20.852,
102.713,20.23,
101.831,20.174,
101.043,19.833,
100.508,20.128,
98.695,20.257,
95.055,20.033,
92.94,19.74,
91.318,19.589,
90.487,19.238,
91.532,18.782,
90.112,18.777,
89.795,17.765,
90.563,16.871,
91.592,16.462,
94.174,16.196,
],

[79.644,16.156,
80.836,16.367,
82.62,16.24,
82.88,16.53,
81.946,17.009,
83.46,17.44,
83.28,18.34,
81.64,18.727,
80.677,18.644,
79.985,18.262,
77.5,17.49,
77.52,17.17,
79.562,17.294,
78.46,16.64,
],

[323.604,16.788,
322.088,16.795,
320.038,16.683,
319.863,16.63,
320.812,16.235,
322.062,16.142,
323.483,16.525,
],

[86.804,17.228,
85.731,17.975,
84.59,17.938,
83.966,17.06,
83.982,16.563,
84.504,16.138,
85.496,15.865,
87.58,15.9,
89.49,16.143,
87.996,17.034,
],

[59.54,18.6,
56.908,19.098,
56.38,18.66,
54.071,18.131,
54.407,17.805,
55.193,16.977,
56.06,16.32,
55.082,15.707,
58.462,15.551,
59.89,15.759,
62.444,15.814,
63.416,16.104,
64.489,16.525,
63.232,16.777,
60.78,17.48,
59.54,18.18,
],

[330.732,14.916,
329.576,15.311,
327.977,15.222,
326.119,14.827,
326.358,14.503,
328.222,14.654,
],

[86.387,15.02,
85.843,15.408,
84.391,15.333,
83.179,15.072,
83.711,14.622,
85.149,14.353,
86.022,14.704,
],

[325.086,14.437,
324.3,15.18,
320.614,15.152,
318.955,15.389,
316.974,14.738,
317.512,14.051,
318.831,13.863,
321.472,13.907,
],

[81.5,13.28,
82.264,13.743,
82.296,14.257,
81.84,15,
80.191,15.103,
79.116,14.943,
79.137,14.359,
77.498,14.436,
77.434,13.663,
78.51,13.695,
80.017,13.354,
81.423,13.411,
],

[71.789,13.798,
72.181,14.154,
73.071,13.987,
74.119,14.031,
74.295,14.52,
73.687,14.995,
70.3,15.15,
67.777,15.583,
66.256,15.606,
66.129,15.28,
68.206,14.837,
63.688,14.957,
62.29,14.778,
63.654,13.801,
64.595,13.521,
67.409,13.859,
69.186,14.451,
70.933,14.527,
69.503,13.57,
70.419,13.206,
71.451,13.322,
],

[237.536,19.28,
236.945,19.367,
233.677,19.237,
233.412,18.793,
231.602,18.525,
231.456,17.985,
232.478,17.771,
232.444,17.225,
234.428,16.372,
233.508,16.25,
235.902,15.373,
235.632,14.919,
237.869,14.391,
241.17,13.748,
244.498,13.561,
246.211,13.19,
248.157,13.06,
248.852,13.455,
248.181,13.766,
244.637,14.262,
241.584,14.739,
238.477,15.691,
236.987,16.667,
235.419,17.629,
235.623,18.459,
],

[85.316,12.902,
86.426,13.224,
88.395,13.221,
89.258,13.55,
89.03,13.926,
90.178,14.152,
90.813,14.39,
92.162,14.434,
93.621,14.518,
95.21,14.301,
97.247,14.216,
98.871,14.286,
99.942,14.663,
100.166,15.077,
99.542,15.343,
98.051,15.558,
96.771,15.436,
93.903,15.59,
91.85,15.608,
90.235,15.484,
87.578,15.162,
87.232,14.613,
87.11,14.117,
86.106,13.681,
84.038,13.559,
82.879,13.249,
83.255,12.839,
],

[63.801,12.355,
63.664,13.123,
62.894,13.47,
61.96,13.519,
60.101,13.947,
58.5,14.1,
57.145,13.883,
57.145,13.883,
58.842,13.135,
60.896,12.488,
62.43,12.502,
],

[286.97,13.026,
287.24,13.52,
288.154,13.277,
291.077,13.29,
293.331,13.778,
294.134,14.152,
293.885,14.672,
292.779,14.968,
290.151,15.523,
289.4,15.82,
290.64,15.96,
292.119,16.212,
293.019,16.023,
293.53,16.665,
293.969,16.405,
295.568,16.247,
298.776,16.412,
299.02,16.88,
303.201,17.029,
303.258,16.265,
305.38,16.44,
306.977,16.435,
308.591,16.961,
309.052,17.601,
308.46,18.02,
309.716,18.807,
311.289,19.213,
312.253,18.164,
313.858,18.614,
315.562,18.345,
317.498,18.652,
318.234,18.372,
319.87,18.512,
319.148,17.584,
320.468,17.151,
329.5,17.8,
330.351,18.393,
332.969,19.158,
337.007,18.969,
338.998,19.133,
339.83,19.547,
339.709,20.278,
340.941,20.563,
342.279,20.358,
344.052,20.332,
345.94,20.528,
347.836,20.417,
349.578,21.306,
350.817,20.986,
350.008,20.347,
350.453,19.903,
353.644,20.182,
355.724,20.123,
358.6,20.6,
360,21.036,
360,25.02,
359.993,25.026,
358.707,25.465,
357.411,25.392,
358.313,25.924,
358.908,26.748,
359.37,27.017,
359.487,27.431,
359.228,27.696,
357.364,27.478,
354.569,28.231,
353.68,28.347,
352.15,29.05,
350.698,29.664,
350.331,30.118,
348.901,29.427,
346.295,30.211,
345.84,29.84,
344.877,30.268,
343.539,30.131,
343.217,30.789,
342.017,31.757,
342.053,32.161,
343.192,32.385,
343.058,33.841,
342.13,33.878,
341.701,34.714,
342.117,35.145,
340.369,35.656,
340.022,36.797,
338.531,37.041,
338.231,38.057,
336.79,38.989,
336.42,38.3,
335.992,36.841,
335.434,34.619,
335.914,33.232,
336.758,32.635,
336.81,32.168,
338.364,31.944,
340.151,30.685,
341.872,29.657,
343.67,28.859,
344.474,27.449,
343.258,27.534,
342.658,28.357,
340.122,29.456,
339.302,28.226,
336.721,28.565,
334.218,30.242,
335.044,30.855,
332.812,31.116,
331.266,31.219,
331.338,30.496,
329.784,30.344,
328.545,30.836,
325.487,30.664,
322.198,30.96,
318.958,32.912,
315.126,35.27,
316.702,35.396,
317.193,36.023,
318.165,36.245,
318.805,35.745,
319.901,35.81,
321.345,36.91,
321.379,37.761,
320.597,38.76,
320.513,39.955,
320.062,41.553,
318.555,43,
318.22,43.692,
316.862,44.857,
315.515,46.011,
314.87,46.602,
313.537,47.188,
312.906,47.201,
312.278,46.716,
310.936,47.447,
310.78,47.78,
310.4,47.72,
309.966,48.059,
309.667,48.399,
309.705,49.117,
309.188,49.338,
309.01,49.515,
308.633,49.81,
307.968,49.974,
307.534,50.243,
307.502,50.676,
307.385,50.786,
307.783,50.949,
308.35,51.388,
309.213,52.568,
309.461,53.216,
309.468,54.368,
309.091,54.917,
308.186,55.109,
307.386,55.524,
306.486,55.61,
306.374,55.065,
306.559,54.315,
306.117,53.274,
306.86,53.106,
306.175,52.25,
305.689,52.06,
305.568,52.248,
305.275,52.331,
305.24,52.143,
304.981,52.051,
304.712,51.892,
304.986,51.451,
305.222,51.334,
305.133,51.151,
305.387,50.612,
305.321,50.448,
304.737,50.34,
304.266,50.071,
302.868,50.362,
302.132,50.83,
301.055,51.102,
301.586,50.639,
301.377,50.25,
302.169,49.578,
301.641,49.054,
300.769,49.406,
299.64,50.102,
299.023,50.748,
298.043,50.796,
297.533,51.262,
298.06,51.938,
298.878,52.103,
298.912,52.552,
299.703,52.844,
300.823,52.13,
301.711,52.519,
302.358,52.545,
302.52,53.069,
301.104,53.349,
300.637,53.888,
299.665,54.39,
299.151,55.09,
300.227,55.64,
300.62,56.623,
301.229,57.54,
301.908,58.308,
301.892,59.051,
301.264,59.324,
301.503,59.857,
302.092,60.167,
301.938,60.982,
301.685,61.774,
301.126,61.864,
300.396,62.947,
299.586,64.259,
298.657,65.453,
297.282,66.375,
295.891,67.217,
294.764,67.332,
294.153,67.776,
293.807,67.452,
293.241,67.948,
291.844,68.45,
290.786,68.603,
290.444,69.659,
289.89,69.718,
289.628,68.992,
289.865,68.605,
288.523,68.285,
288.05,68.448,
286.715,69.303,
285.882,70.248,
285.662,70.942,
286.427,71.996,
287.362,73.302,
288.269,73.92,
288.877,74.723,
289.335,76.574,
289.2,78.333,
288.366,78.992,
287.221,79.635,
286.405,80.469,
285.158,81.4,
284.795,80.759,
285.076,80.081,
284.334,79.513,
283.497,79.367,
283.091,78.846,
282.585,77.813,
281.687,77.354,
280.832,77.373,
280.979,76.587,
280.098,76.593,
280.019,77.693,
279.479,79.154,
279.154,80.037,
279.222,80.761,
279.874,80.792,
280.28,81.705,
280.459,82.57,
281.017,83.143,
281.623,83.259,
282.141,83.778,
282.371,83.872,
282.962,84.476,
283.381,85.145,
283.439,85.818,
283.332,86.273,
283.43,86.617,
283.503,87.209,
283.855,87.484,
284.248,88.369,
284.229,88.707,
283.52,88.774,
282.574,88.033,
281.391,87.239,
281.274,86.73,
280.695,86.061,
280.557,85.233,
280.197,84.687,
280.306,83.959,
280.086,83.536,
279.691,83.152,
279.52,82.656,
278.988,82.092,
278.504,81.618,
278.34,82.206,
278.15,81.65,
278.259,81.026,
278.554,80.067,
278.457,79.325,
278.765,78.559,
278.428,77.967,
278.51,76.878,
278.104,76.359,
277.778,75.163,
277.597,73.899,
277.165,73.071,
276.506,73.573,
275.369,74.286,
274.808,74.196,
274.189,73.962,
274.534,72.723,
274.325,71.786,
273.541,70.633,
273.663,70.273,
273.078,70.145,
272.369,69.329,
272.083,68.808,
272.025,68.298,
271.835,67.817,
271.417,67.235,
270.496,67.195,
270.587,67.607,
270.273,68.164,
269.847,67.961,
269.702,68.143,
269.419,68.034,
269.032,67.944,
268.889,68.309,
268.208,68.297,
266.976,68.505,
267.033,69.257,
266.499,69.848,
265.06,70.521,
263.941,71.698,
263.189,72.329,
262.193,72.983,
262.191,73.443,
261.693,73.69,
260.792,74.048,
260.325,74.101,
260.025,74.864,
260.233,76.164,
260.286,76.994,
259.862,77.944,
259.858,79.643,
259.341,79.691,
258.885,80.454,
259.19,80.783,
258.278,81.067,
257.941,81.747,
257.54,82.034,
256.593,81.101,
256.13,79.7,
255.747,78.692,
255.396,78.219,
254.865,77.258,
254.617,76.007,
254.444,75.383,
253.534,74.009,
253.12,72.071,
252.821,70.792,
252.825,69.581,
252.631,68.644,
251.175,69.242,
250.471,69.123,
249.164,67.911,
249.645,67.549,
249.35,67.157,
248.177,66.308,
247.444,66.055,
247.146,65.336,
246.373,64.575,
244.531,64.763,
242.906,64.781,
241.497,64.922,
239.616,64.62,
238.526,64.39,
237.397,64.26,
236.971,63.034,
236.492,62.857,
235.724,63.035,
234.715,63.519,
233.493,63.187,
232.484,62.419,
231.521,62.134,
230.853,61.185,
230.115,59.852,
229.577,60.014,
228.941,59.683,
228.568,60.073,
227.974,60.024,
228.183,60.466,
228.094,60.694,
228.416,61.448,
228.808,62.31,
229.3,62.539,
229.471,62.89,
230.153,63.31,
230.213,63.723,
230.113,64.056,
230.24,64.392,
230.528,64.672,
230.661,65,
230.81,65.245,
230.744,64.518,
231.013,63.993,
231.286,63.885,
231.589,64.199,
231.607,64.784,
231.39,65.372,
231.58,65.755,
231.758,65.706,
231.794,65.98,
232.577,65.823,
233.404,65.849,
234.008,65.878,
234.693,65.202,
235.439,64.561,
236.071,63.945,
236.362,63.604,
236.486,63.691,
236.391,64.104,
236.261,64.285,
236.397,65.075,
236.845,65.758,
237.404,66.121,
238.137,66.252,
238.729,66.434,
239.18,67.008,
239.45,67.34,
239.808,67.466,
239.806,67.69,
239.442,68.286,
239.282,68.566,
238.861,68.886,
238.488,69.571,
238.034,69.518,
237.826,69.757,
237.666,70.264,
237.789,70.932,
237.695,71.055,
237.234,71.052,
236.61,71.426,
236.512,71.913,
236.284,72.124,
235.661,72.116,
235.27,72.368,
235.275,72.772,
234.791,73.049,
234.239,72.955,
233.57,73.292,
233.109,73.349,
232.385,73.617,
232.192,74.062,
232.168,74.403,
231.172,74.825,
229.575,75.291,
228.679,75.997,
228.239,76.052,
227.939,75.993,
227.354,76.408,
226.717,76.6,
225.878,76.652,
225.625,76.709,
225.406,76.973,
225.144,77.046,
224.99,77.3,
224.495,77.278,
224.175,77.414,
223.483,77.363,
223.223,76.779,
223.252,76.232,
223.088,75.937,
222.892,75.198,
222.605,74.787,
222.805,74.738,
222.703,74.281,
222.824,74.088,
222.779,73.652,
222.65,73.225,
222.348,72.924,
222.271,72.525,
221.755,72.167,
221.221,71.328,
220.939,70.513,
220.248,69.825,
219.802,69.661,
219.14,68.708,
219.024,68.013,
219.066,67.42,
218.493,66.312,
218.024,65.921,
217.484,65.714,
217.155,65.141,
217.209,64.916,
216.932,64.397,
216.64,64.174,
216.249,63.43,
215.64,62.623,
215.13,61.937,
214.632,61.942,
214.788,61.393,
214.832,61.042,
214.956,60.643,
214.923,60.499,
214.642,60.901,
214.427,61.656,
214.154,62.177,
213.922,62.351,
213.588,62.029,
213.137,61.582,
212.423,60.149,
212.32,60.24,
212.735,61.295,
213.349,62.3,
214.105,63.858,
214.474,64.401,
214.795,64.966,
215.693,66.073,
215.494,66.247,
215.526,66.898,
216.691,67.795,
216.866,68,
217.189,68.981,
216.969,69.162,
217.115,70.192,
217.482,71.386,
217.863,71.632,
218.41,72.002,
218.991,73.159,
219.266,74.077,
219.814,74.564,
221.179,75.509,
221.735,76.079,
222.277,76.656,
222.59,77,
223.081,77.3,
223.318,77.61,
223.286,78.025,
222.716,78.264,
223.145,78.538,
223.471,78.722,
223.667,79.136,
224.118,79.554,
224.614,79.558,
225.557,79.302,
226.646,79.183,
227.526,78.873,
228.022,78.807,
228.379,78.625,
228.948,78.589,
229.268,78.57,
229.729,78.421,
230.259,78.32,
230.732,77.978,
231.111,77.975,
231.134,78.252,
231.042,78.833,
231.045,79.359,
230.834,79.72,
230.552,80.801,
230.071,81.918,
229.453,83.195,
228.594,84.661,
227.741,85.781,
226.565,87.145,
225.564,87.954,
224.068,88.947,
223.136,89.708,
222.042,90.919,
221.811,91.446,
221.585,91.683,
220.885,92.083,
220.638,92.5,
220.263,92.573,
220.121,93.278,
219.8,93.681,
219.605,94.346,
219.202,94.677,
218.74,95.909,
218.8,96.476,
219.44,96.84,
219.47,97.1,
219.195,97.704,
219.252,98.008,
219.187,98.485,
219.536,99.112,
219.95,100.098,
220.317,100.317,
220.479,100.765,
220.437,101.762,
220.561,102.639,
220.6,104.202,
220.776,104.692,
220.477,105.406,
220.089,106.101,
219.453,106.721,
218.538,107.101,
217.411,107.586,
216.281,108.66,
215.896,108.842,
215.198,109.553,
214.786,109.784,
214.702,110.497,
215.176,111.254,
215.373,111.841,
215.386,112.14,
215.563,112.09,
215.534,113.071,
215.372,113.535,
215.607,113.706,
215.459,114.123,
215.041,114.478,
214.216,114.816,
213.013,115.357,
212.575,115.727,
212.66,116.148,
212.916,116.216,
212.83,116.742,
212.58,117.47,
212.462,118.301,
212.203,118.752,
211.521,119.257,
211.326,119.402,
210.902,119.91,
210.623,120.424,
210.056,121.14,
208.925,122.172,
208.22,122.772,
207.465,123.227,
206.419,123.615,
205.91,123.667,
205.781,123.945,
205.173,123.797,
204.678,123.987,
203.594,123.794,
202.988,123.916,
202.574,123.864,
201.543,124.259,
200.689,124.417,
200.071,124.795,
199.617,124.819,
199.193,124.463,
198.855,124.444,
198.425,123.998,
198.378,124.136,
198.245,123.868,
198.25,123.281,
197.925,122.611,
198.248,122.429,
198.222,121.662,
197.567,120.726,
197.065,119.879,
197.063,119.876,
196.345,118.577,
195.602,117.821,
195.211,117.091,
194.99,116.117,
194.743,115.393,
194.408,113.853,
194.386,112.657,
194.258,112.111,
193.869,111.699,
193.352,110.873,
192.827,109.673,
192.609,109.045,
191.795,108.069,
191.734,107.302,
191.64,106.673,
191.779,105.794,
192.124,104.878,
192.176,104.449,
192.5,103.548,
192.739,103.138,
193.313,102.484,
193.634,102.039,
193.739,101.298,
193.687,100.731,
193.387,100.374,
193.121,99.767,
192.875,99.167,
192.929,98.959,
193.237,98.563,
192.933,97.596,
192.728,96.927,
192.227,96.294,
192.323,96.1,
192.182,95.79,
191.915,95.038,
191.094,93.979,
190.066,92.969,
189.405,92.144,
188.798,91.111,
188.83,90.779,
189.049,90.459,
189.291,89.731,
189.493,88.99,
189.306,88.839,
189.649,87.716,
189.795,86.927,
189.404,86.266,
188.948,86.096,
188.745,85.648,
188.489,85.504,
188.5,85.228,
187.462,85.588,
187.083,85.535,
186.698,85.759,
185.898,85.737,
185.363,85.112,
185.034,84.388,
184.326,83.729,
183.574,83.742,
182.692,83.741,
181.865,83.858,
181.06,84.071,
179.492,84.656,
178.936,85,
178.035,85.289,
177.144,85.005,
176.689,85.016,
175.991,84.82,
175.35,84.832,
174.166,85.006,
173.471,85.295,
172.481,85.662,
172.288,85.635,
172.026,85.644,
170.995,85.167,
170.087,84.406,
169.235,83.859,
168.561,83.214,
168.292,83.14,
167.572,82.737,
167.051,82.201,
166.876,81.836,
166.753,81.097,
166.315,80.505,
165.926,80.114,
165.67,79.984,
165.42,79.786,
165.307,79.344,
165.161,79.123,
164.87,78.959,
164.336,78.542,
163.915,78.475,
163.685,78.193,
163.691,78.041,
163.386,77.829,
163.323,77.615,
163.159,76.849,
163.286,76.405,
162.874,75.627,
162.375,75.27,
162.815,75.081,
163.299,74.378,
163.537,73.865,
163.45,73.326,
163.729,72.833,
163.854,71.891,
163.743,70.903,
163.622,70.406,
163.722,69.907,
163.464,69.432,
162.937,69,
162.98,68.578,
163.027,68.114,
163.411,67.842,
163.738,67.321,
163.674,66.982,
164.017,66.276,
164.574,65.641,
164.911,65.48,
165.175,64.896,
165.199,64.364,
165.56,63.745,
166.226,63.381,
166.86,62.36,
167.381,61.962,
168.311,61.851,
169.099,61.168,
169.6,60.901,
170.435,60.066,
170.185,58.822,
170.565,57.962,
170.699,57.435,
171.343,56.76,
172.346,56.303,
173.088,55.89,
173.756,54.854,
174.07,54.24,
174.806,54.245,
175.409,54.669,
176.36,54.6,
177.396,54.821,
177.83,54.831,
178.791,54.285,
179.873,54.111,
180.504,53.699,
181.467,53.394,
183.162,53.216,
184.816,53.135,
185.32,53.284,
186.262,52.889,
187.331,52.881,
187.737,53.114,
188.421,53.054,
189.51,52.65,
190.21,52.77,
190.181,53.276,
191.029,52.908,
191.1,53.1,
190.6,53.59,
190.593,54.052,
190.94,54.301,
190.808,55.167,
190.15,55.669,
190.34,56.214,
190.857,56.231,
191.109,56.707,
191.489,56.863,
192.663,57.207,
193.083,57.121,
193.919,57.288,
195.246,57.735,
195.714,58.624,
196.612,58.818,
198.021,59.237,
199.086,59.734,
199.574,59.474,
200.053,59.014,
199.82,58.248,
200.134,57.762,
200.854,57.293,
201.543,57.157,
202.896,57.362,
203.237,57.808,
203.609,57.813,
203.927,57.983,
204.921,58.101,
205.165,58.431,
206.495,58.414,
207.458,58.679,
208.451,58.974,
208.914,59.13,
209.683,58.813,
210.095,58.526,
210.977,58.444,
211.688,58.57,
211.961,59.066,
212.193,58.74,
212.994,58.976,
213.773,59.032,
214.266,58.781,
214.557,58.451,
214.488,58.394,
214.753,57.927,
214.956,57.172,
215.099,56.919,
215.126,56.909,
215.482,56.094,
215.98,55.39,
215.998,55.355,
215.905,54.59,
216.15,54.179,
215.782,53.725,
216.161,53.349,
215.551,53.435,
214.714,53.205,
214.027,53.78,
212.509,53.893,
211.7,53.356,
210.622,53.322,
210.391,53.737,
209.7,53.856,
208.733,53.323,
207.641,53.341,
207.049,52.346,
206.318,51.792,
206.805,51.014,
206.171,50.536,
207.28,49.58,
208.82,49.54,
209.24,48.78,
211.146,48.912,
212.348,48.264,
213.513,47.981,
215.168,47.96,
216.913,48.664,
218.348,49.051,
219.513,48.897,
220.373,48.986,
221.554,48.464,
221.703,48.037,
221.453,47.355,
220.875,46.986,
220.321,46.871,
219.955,46.565,
218.68,45.72,
217.539,45.343,
216.675,44.755,
217.403,44.596,
218.233,43.759,
217.674,43.363,
219.148,42.955,
219.121,42.737,
218.224,42.898,
217.425,42.978,
216.76,43.301,
215.824,43.354,
214.962,43.727,
215.021,44.349,
215.51,44.59,
216.53,44.53,
216.335,44.887,
215.24,45.06,
213.883,45.638,
213.326,45.435,
213.547,44.965,
212.454,44.672,
212.631,44.481,
213.588,44.148,
213.299,43.919,
211.744,43.667,
211.675,43.294,
210.749,43.417,
210.378,43.968,
209.603,44.707,
209.627,44.964,
209.142,45.18,
208.838,45.086,
208.558,46.292,
208.039,46.707,
207.674,47.422,
207.997,47.992,
208.115,48.377,
208.989,48.7,
208.807,48.945,
207.619,49,
207.193,49.309,
206.358,49.848,
206.043,49.382,
206.057,49.176,
205.448,49.148,
204.926,49.053,
203.715,49.313,
204.408,49.875,
203.9,50.038,
203.343,50.039,
202.814,49.524,
202.626,49.743,
202.85,50.341,
203.35,50.81,
202.973,51.029,
203.53,51.49,
204.025,51.78,
204.04,52.345,
203.115,52.08,
203.41,52.59,
202.775,52.695,
203.154,53.578,
202.49,53.59,
201.67,53.155,
201.295,52.355,
201.12,51.69,
200.73,51.23,
200.218,50.66,
200.15,50.375,
199.98,50.305,
199.96,50.085,
199.406,49.749,
199.319,49.273,
199.404,48.591,
199.54,48.28,
199.372,48.122,
199.162,48.045,
198.882,47.719,
198.45,47.52,
197.51,47.15,
196.93,46.79,
196.016,46.493,
195.174,45.757,
195.376,45.682,
194.92,45.261,
194.902,44.924,
194.259,44.766,
193.952,45.198,
193.657,44.863,
193.68,44.516,
193.715,44.5,
193.938,44.409,
193.142,44.263,
192.329,44.618,
192.384,45.115,
192.261,45.399,
192.589,45.909,
193.527,46.412,
194.03,47.239,
195.143,48.045,
195.926,48.039,
196.17,48.26,
195.889,48.459,
196.785,48.82,
197.519,49.123,
198.377,49.644,
198.48,49.831,
198.294,50.189,
197.739,49.722,
196.87,49.558,
196.449,50.205,
197.172,50.575,
197.053,51.097,
196.635,51.156,
196.101,52.014,
195.684,52.091,
195.688,51.785,
195.892,51.249,
196.109,51.036,
195.719,50.456,
195.414,49.952,
194.998,49.827,
194.703,49.395,
194.061,49.214,
193.628,48.812,
192.888,48.747,
192.107,48.295,
191.192,47.644,
190.512,47.068,
190.2,46.08,
189.703,45.964,
188.889,45.634,
188.429,45.769,
187.851,46.233,
187.435,46.306,
186.529,46.871,
184.557,46.6,
183.101,46.925,
182.986,47.527,
183.039,48.108,
182.092,48.774,
180.81,48.985,
180.721,49.322,
180.107,49.876,
179.721,50.69,
180.111,51.261,
179.533,51.708,
179.317,52.358,
178.562,52.557,
177.854,53.326,
176.584,53.341,
175.631,53.322,
175.005,53.675,
174.623,54.053,
174.134,53.97,
173.763,53.632,
173.48,53.057,
172.546,52.902,
172.144,53.162,
171.617,53.021,
171.101,53.131,
171.254,52.349,
171.16,51.734,
170.713,51.641,
170.474,51.263,
170.553,50.608,
170.952,50.245,
171.023,49.841,
171.231,49.239,
171.209,48.816,
171.009,48.456,
170.965,48.119,
171.016,47.407,
170.607,46.973,
172.022,46.252,
173.245,46.432,
174.588,46.426,
175.652,46.596,
176.482,46.544,
178.099,46.577,
178.616,45.977,
178.806,43.985,
177.774,42.935,
177.037,42.43,
175.508,42.045,
175.408,41.316,
176.704,41.098,
178.383,41.356,
178.067,40.224,
179.011,40.653,
181.339,39.873,
181.639,39.053,
182.513,38.852,
183.315,38.654,
183.83,38.38,
184.706,36.908,
186.074,36.49,
186.905,36.518,
187.101,36.306,
187.936,36.252,
188.122,36.472,
188.801,35.979,
188.572,35.604,
188.526,35.037,
188.12,34.482,
188.09,33.46,
188.257,33.19,
188.544,32.89,
189.424,32.828,
189.776,32.552,
190.58,32.27,
190.546,32.784,
190.25,33.11,
190.37,33.39,
190.912,33.541,
190.668,33.919,
190.37,33.81,
189.65,34.53,
189.922,35.017,
189.94,35.403,
190.95,35.636,
190.94,35.991,
191.956,35.804,
192.518,35.529,
193.648,35.924,
194.12,36.243,
194.803,35.949,
196.364,35.487,
197.623,35.148,
198.621,35.317,
198.696,35.561,
199.661,35.574,
199.888,35.134,
201.268,34.81,
201.056,33.969,
201.091,33.216,
201.582,32.588,
202.524,32.247,
203.318,32.994,
204.121,32.974,
204.313,32.206,
204.429,31.617,
204.061,31.742,
203.427,31.387,
203.34,30.813,
204.604,30.534,
205.864,30.389,
206.949,30.554,
207.981,30.524,
209.118,29.972,
208.07,29.497,
206.255,29.576,
204.497,29.943,
202.87,30.154,
202.291,29.608,
201.322,29.28,
201.545,28.295,
201.059,27.393,
201.536,26.81,
202.443,26.182,
204.731,25.098,
205.398,24.888,
205.294,24.466,
203.904,23.993,
202.183,24.276,
201.214,24.974,
201.37,25.586,
199.779,26.39,
197.848,27.25,
197.12,28.659,
197.831,29.363,
198.788,29.918,
197.869,31.046,
196.829,31.28,
196.448,32.959,
195.88,33.896,
194.667,33.799,
194.101,34.592,
192.943,34.638,
192.625,33.693,
191.788,32.558,
191.027,31.144,
190.357,30.53,
188.382,31.687,
187.049,31.921,
185.666,31.412,
185.308,30.337,
184.992,28.029,
185.913,27.385,
188.554,26.546,
190.528,25.514,
192.358,24.12,
194.761,22.189,
196.436,21.437,
199.184,20.182,
201.378,19.745,
203.024,19.798,
204.547,18.969,
206.37,19.014,
208.166,18.815,
211.294,19.546,
210.005,19.814,
211.101,20.442,
212.133,20.094,
213.776,20.698,
216.514,20.937,
220.292,22.068,
221.06,22.543,
221.126,23.208,
220.016,23.734,
218.383,24,
213.919,23.24,
213.185,23.367,
214.815,24.1,
214.944,25.586,
216.231,25.891,
217.013,26.15,
217.142,25.665,
216.518,25.22,
217.176,24.857,
219.594,25.479,
220.436,25.235,
219.763,24.503,
222.093,23.524,
223.016,23.581,
223.95,23.931,
224.532,23.244,
223.698,22.648,
224.188,22.049,
223.453,21.429,
226.25,21.75,
226.821,22.31,
225.555,22.433,
225.562,22.99,
226.349,23.332,
227.894,23.115,
228.139,22.477,
230.228,22.001,
233.718,21.143,
234.472,21.192,
233.486,21.799,
234.726,21.903,
235.443,21.561,
237.317,21.534,
238.802,21.119,
239.942,21.721,
241.078,21.059,
240.03,20.48,
240.55,20.15,
243.504,20.453,
244.888,20.765,
248.512,21.908,
249.181,21.384,
248.164,20.856,
248.135,20.643,
246.93,20.545,
247.26,20.071,
246.725,19.291,
246.695,18.971,
248.54,18.065,
249.196,17.156,
249.94,16.96,
252.588,17.224,
252.796,17.78,
251.848,18.591,
252.47,18.91,
252.792,19.609,
252.565,20.979,
253.668,21.592,
253.239,22.26,
251.28,23.68,
252.423,23.827,
252.821,23.467,
253.921,23.211,
254.187,22.716,
255.052,22.24,
254.469,21.671,
254.936,21.011,
253.842,20.929,
253.602,20.372,
254.4,19.368,
253.101,18.553,
254.891,17.879,
254.659,17.168,
255.158,17.145,
255.683,17.7,
255.289,18.664,
256.359,18.847,
255.903,18.126,
257.577,17.733,
259.652,17.68,
261.5,18.25,
260.611,17.417,
260.511,16.352,
262.25,16.15,
264.655,16.194,
266.822,16.063,
266.01,15.54,
267.167,14.883,
268.316,14.856,
270.26,14.36,
272.901,14.227,
273.234,13.953,
275.86,13.86,
276.678,14.084,
278.922,13.553,
280.76,13.57,
281.035,13.138,
281.991,12.713,
284.352,12.302,
286.067,12.626,
284.705,12.872
],

[229.11,48.718,
229.619,49.427,
230.085,49.474,
230.393,49.743,
229.569,49.824,
229.395,50.601,
229.223,50.951,
228.857,51.185,
228.883,51.68,
229.2,52.417,
230.148,52.625,
230.842,53.127,
232.264,53.299,
233.826,53.035,
233.922,52.801,
233.735,52.094,
233.881,51.048,
233.101,50.709,
233.358,50.025,
232.694,49.966,
232.915,49.123,
233.858,49.369,
234.737,49.049,
234.008,48.449,
233.722,47.877,
232.917,48.132,
232.815,48.865,
232.503,48.217,
232.446,47.973,
232.692,47.556,
232.502,47.208,
231.343,46.867,
230.891,45.969,
230.339,45.716,
230.306,45.39,
231.279,45.485,
231.317,44.754,
232.167,44.591,
233.041,44.741,
233.221,43.765,
233.043,43.147,
232.042,43.195,
231.192,42.951,
230.034,43.391,
229.101,43.601,
228.646,44.194,
227.676,44.359,
226.682,45.391,
227.591,46.34,
227.492,47.013,
228.584,48.191,
],

[86.16,12.48,
85.704,12.509,
83.83,12.445,
83.564,12.165,
85.577,12.18,
86.279,12.366,
],

[69.813,12.303,
67.949,12.591,
66.466,12.268,
67.275,11.949,
68.736,11.847,
70.146,12.004,
],

[204.724,12.146,
202.49,12.555,
200.726,12.323,
201.416,12.065,
200.812,11.745,
202.884,11.545,
203.281,11.92,
],

[70.337,11.398,
69.119,11.593,
67.458,11.592,
67.474,11.449,
68.5,11.15,
69.036,11.196,
],

[84.17,11.943,
82.69,12.149,
81.876,11.917,
81.447,11.542,
81.368,11.128,
82.663,11.168,
83.246,11.234,
84.441,11.582,
],

[79.94,11.675,
80.329,12.092,
78.696,11.981,
77.05,11.657,
74.824,11.62,
75.79,11.323,
74.58,11.082,
74.508,10.698,
76.471,10.835,
79.175,11.2,
],

[285.075,11.693,
279.438,12.079,
281.265,10.766,
282.086,10.654,
282.838,10.719,
285.372,11.287,
],

[198.252,10.298,
201.544,11.044,
199.027,11.437,
198.472,12.173,
197.594,12.362,
197.118,13.191,
195.913,13.23,
193.763,12.62,
194.67,12.264,
193.171,11.975,
191.222,11.131,
190.445,10.348,
193.171,9.99,
193.719,10.34,
195.143,10.326,
195.523,9.984,
196.991,9.949,
],

[205.448,9.593,
207.408,9.944,
205.925,10.482,
203.024,10.6,
200.075,10.433,
199.897,10.158,
198.462,10.14,
197.368,9.681,
200.456,9.402,
201.908,9.642,
202.919,9.343,
],

[231.136,9.453,
229.794,9.585,
228.894,9.66,
228.755,9.825,
227.586,9.99,
226.503,9.753,
227.072,9.441,
224.847,9.41,
226.799,9.228,
228.318,9.216,
228.523,9.485,
229.097,9.246,
230.04,9.081,
231.523,9.3,
],

[279.94,11.119,
277.758,11.244,
274.973,10.955,
273.313,10.573,
272.545,9.856,
271.181,9.659,
273.778,8.975,
275.941,8.75,
277.884,9.253,
280.187,10.22,
],

[92.98,10.34,
94.186,10.663,
92.812,10.961,
90.965,11.713,
89.196,11.785,
87.123,11.657,
86.049,11.249,
86.064,10.886,
86.855,10.62,
85.026,10.628,
83.924,10.295,
83.29,9.842,
83.984,9.398,
84.677,9.093,
85.702,9.023,
85.265,8.794,
87.59,8.743,
88.867,9.277,
90.55,9.491,
92.19,9.68,
],

[111.5,6.894,
114.173,6.972,
116.32,7.1,
118.15,7.371,
118.106,7.638,
115.666,8.072,
113.247,8.275,
112.342,8.499,
114.52,8.493,
112.16,9.1,
110.53,9.383,
108.82,10.2,
106.757,10.366,
106.12,10.57,
103.092,10.677,
104.471,10.802,
103.78,10.981,
104.607,11.474,
103.656,11.817,
102.111,12.1,
101.637,12.491,
100.24,12.79,
100.38,13.017,
102.089,12.978,
102.111,13.222,
99.439,13.822,
96.826,13.546,
93.888,13.701,
92.4,13.58,
90.509,13.528,
90.384,13.048,
92.233,12.822,
91.74,12.1,
92.35,12.03,
95.024,12.461,
93.66,11.82,
92.038,11.628,
92.848,11.241,
94.621,11.003,
94.905,10.655,
93.493,10.264,
93.068,9.749,
95.802,9.792,
96.591,9.9,
98.152,9.536,
95.9,9.42,
92.401,9.484,
90.633,9.144,
89.8,8.74,
88.632,8.447,
88.413,8.106,
89.9,7.915,
91.068,7.882,
93.03,7.72,
94.5,7.348,
95.74,7.4,
96.82,7.68,
97.58,7.14,
98.9,6.98,
100.693,6.869,
103.75,6.828,
104.281,6.936,
107.168,6.767,
109.334,6.83,
],

[152.9,6.48,
159.155,7.273,
157.308,7.658,
153.482,7.702,
148.1,7.8,
148.604,7.978,
152.143,7.868,
155.156,8.213,
157.097,7.907,
157.928,8.266,
156.83,8.847,
159.376,8.475,
164.232,8.088,
167.23,8.281,
167.791,8.708,
163.715,9.42,
163.15,9.65,
159.954,9.823,
162.27,9.871,
161.1,10.6,
160.295,11.249,
160.326,12.361,
161.527,13.014,
159.965,13.056,
158.321,13.372,
160.166,13.902,
160.401,14.752,
159.332,14.844,
160.627,15.704,
158.406,15.776,
159.565,16.183,
159.238,16.536,
157.828,16.69,
156.434,16.693,
157.687,17.371,
157.7,17.816,
155.722,17.402,
155.207,17.67,
156.557,17.92,
157.867,18.531,
158.246,19.336,
156.464,19.529,
155.693,19.144,
154.457,18.569,
154.799,19.248,
153.637,19.774,
156.273,19.816,
157.651,19.871,
154.971,20.741,
152.253,21.53,
149.326,21.875,
148.223,21.879,
147.189,22.265,
145.798,23.32,
143.647,24.021,
142.956,24.062,
141.625,24.308,
140.188,24.542,
139.331,25.16,
139.317,25.861,
138.811,26.518,
137.181,27.318,
137.583,28.099,
137.134,28.926,
136.622,29.902,
135.213,29.963,
133.736,29.147,
131.737,29.142,
130.767,28.593,
130.1,27.617,
128.367,26.373,
127.86,25.722,
127.723,24.823,
126.338,23.9,
126.698,23.163,
126.031,22.811,
127.02,21.642,
128.525,21.27,
128.92,20.852,
129.129,20.071,
127.986,20.425,
127.442,20.574,
126.544,20.716,
125.317,20.39,
125.25,19.711,
125.641,19.179,
126.569,19.164,
128.61,19.43,
126.891,18.795,
125.996,18.453,
125,18.593,
124.165,18.346,
125.282,17.414,
124.674,17.041,
123.88,16.35,
122.676,15.29,
121.403,14.901,
121.415,14.483,
118.731,13.898,
116.608,13.825,
113.936,13.865,
111.496,13.939,
110.335,13.62,
108.597,12.991,
111.223,12.677,
113.236,12.624,
108.957,12.364,
106.703,11.956,
106.841,11.567,
110.627,11.086,
114.289,10.606,
114.676,10.242,
111.977,9.883,
112.849,9.484,
116.311,8.786,
117.766,8.679,
117.349,8.23,
119.718,7.966,
122.793,7.809,
125.866,7.8,
126.957,8.112,
129.609,7.561,
131.996,7.935,
133.4,8.014,
135.477,8.339,
133.099,7.8,
133.236,7.372,
136.594,6.775,
140.102,6.82,
141.378,6.451,
144.912,6.355,
]
],
[
[
0, 20.0,
10, 20.0,
20, 20.0,
30, 20.0,
40, 20.0,
50, 20.0,
60, 20.0,
70, 20.0,
80, 20.0,
90, 20.0,
100, 20.0,
110, 20.0,
120, 20.0,
130, 20.0,
140, 20.0,
150, 20.0,
160, 20.0,
170, 20.0,
180, 20.0,
190, 20.0,
200, 20.0,
210, 20.0,
220, 20.0,
230, 20.0,
240, 20.0,
250, 20.0,
260, 20.0,
270, 20.0,
280, 20.0,
290, 20.0,
300, 20.0,
310, 20.0,
320, 20.0,
330, 20.0,
340, 20.0,
350, 20.0,
360, 20.0,
],
[
0, 40.0,
10, 40.0,
20, 40.0,
30, 40.0,
40, 40.0,
50, 40.0,
60, 40.0,
70, 40.0,
80, 40.0,
90, 40.0,
100, 40.0,
110, 40.0,
120, 40.0,
130, 40.0,
140, 40.0,
150, 40.0,
160, 40.0,
170, 40.0,
180, 40.0,
190, 40.0,
200, 40.0,
210, 40.0,
220, 40.0,
230, 40.0,
240, 40.0,
250, 40.0,
260, 40.0,
270, 40.0,
280, 40.0,
290, 40.0,
300, 40.0,
310, 40.0,
320, 40.0,
330, 40.0,
340, 40.0,
350, 40.0,
360, 40.0,
],
[
0, 60.0,
10, 60.0,
20, 60.0,
30, 60.0,
40, 60.0,
50, 60.0,
60, 60.0,
70, 60.0,
80, 60.0,
90, 60.0,
100, 60.0,
110, 60.0,
120, 60.0,
130, 60.0,
140, 60.0,
150, 60.0,
160, 60.0,
170, 60.0,
180, 60.0,
190, 60.0,
200, 60.0,
210, 60.0,
220, 60.0,
230, 60.0,
240, 60.0,
250, 60.0,
260, 60.0,
270, 60.0,
280, 60.0,
290, 60.0,
300, 60.0,
310, 60.0,
320, 60.0,
330, 60.0,
340, 60.0,
350, 60.0,
360, 60.0,
],
[
0, 80.0,
10, 80.0,
20, 80.0,
30, 80.0,
40, 80.0,
50, 80.0,
60, 80.0,
70, 80.0,
80, 80.0,
90, 80.0,
100, 80.0,
110, 80.0,
120, 80.0,
130, 80.0,
140, 80.0,
150, 80.0,
160, 80.0,
170, 80.0,
180, 80.0,
190, 80.0,
200, 80.0,
210, 80.0,
220, 80.0,
230, 80.0,
240, 80.0,
250, 80.0,
260, 80.0,
270, 80.0,
280, 80.0,
290, 80.0,
300, 80.0,
310, 80.0,
320, 80.0,
330, 80.0,
340, 80.0,
350, 80.0,
360, 80.0,
],
[
0, 100.0,
10, 100.0,
20, 100.0,
30, 100.0,
40, 100.0,
50, 100.0,
60, 100.0,
70, 100.0,
80, 100.0,
90, 100.0,
100, 100.0,
110, 100.0,
120, 100.0,
130, 100.0,
140, 100.0,
150, 100.0,
160, 100.0,
170, 100.0,
180, 100.0,
190, 100.0,
200, 100.0,
210, 100.0,
220, 100.0,
230, 100.0,
240, 100.0,
250, 100.0,
260, 100.0,
270, 100.0,
280, 100.0,
290, 100.0,
300, 100.0,
310, 100.0,
320, 100.0,
330, 100.0,
340, 100.0,
350, 100.0,
360, 100.0,
],
[
0, 120.0,
10, 120.0,
20, 120.0,
30, 120.0,
40, 120.0,
50, 120.0,
60, 120.0,
70, 120.0,
80, 120.0,
90, 120.0,
100, 120.0,
110, 120.0,
120, 120.0,
130, 120.0,
140, 120.0,
150, 120.0,
160, 120.0,
170, 120.0,
180, 120.0,
190, 120.0,
200, 120.0,
210, 120.0,
220, 120.0,
230, 120.0,
240, 120.0,
250, 120.0,
260, 120.0,
270, 120.0,
280, 120.0,
290, 120.0,
300, 120.0,
310, 120.0,
320, 120.0,
330, 120.0,
340, 120.0,
350, 120.0,
360, 120.0,
],
[
0, 140.0,
10, 140.0,
20, 140.0,
30, 140.0,
40, 140.0,
50, 140.0,
60, 140.0,
70, 140.0,
80, 140.0,
90, 140.0,
100, 140.0,
110, 140.0,
120, 140.0,
130, 140.0,
140, 140.0,
150, 140.0,
160, 140.0,
170, 140.0,
180, 140.0,
190, 140.0,
200, 140.0,
210, 140.0,
220, 140.0,
230, 140.0,
240, 140.0,
250, 140.0,
260, 140.0,
270, 140.0,
280, 140.0,
290, 140.0,
300, 140.0,
310, 140.0,
320, 140.0,
330, 140.0,
340, 140.0,
350, 140.0,
360, 140.0,
],
[
0, 160.0,
10, 160.0,
20, 160.0,
30, 160.0,
40, 160.0,
50, 160.0,
60, 160.0,
70, 160.0,
80, 160.0,
90, 160.0,
100, 160.0,
110, 160.0,
120, 160.0,
130, 160.0,
140, 160.0,
150, 160.0,
160, 160.0,
170, 160.0,
180, 160.0,
190, 160.0,
200, 160.0,
210, 160.0,
220, 160.0,
230, 160.0,
240, 160.0,
250, 160.0,
260, 160.0,
270, 160.0,
280, 160.0,
290, 160.0,
300, 160.0,
310, 160.0,
320, 160.0,
330, 160.0,
340, 160.0,
350, 160.0,
360, 160.0,
]
],
[
[
7,
112,
6.0621778266,
114.5,
3.5,
116.330127019,
0,
117,
356.5,
116.330127019,
353.9378221734,
114.5,
353,
112,
353.9378221734,
109.5,
356.5,
107.669872981,
0,
107,
3.5,
107.669872981,
6.0621778266,
109.5
]
]
];
