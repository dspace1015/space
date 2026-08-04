const mainCanvas = document.getElementById("MainCanvas");
const screen = mainCanvas.getContext("2d");
mainCanvas.border = 0.0;
screen.setTransform(1,0,0,-1,screen.canvas.width/2,screen.canvas.height/2);

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
function fillScreen(color){
    //fills screen with color specified
    screen.setTransform(1,0,0,1,0,0);
    setColor(color);
    screen.beginPath;
    screen.rect(0,0,screen.canvas.width,screen.canvas.height);
    screen.fill();
    screen.setTransform(1,0,0,-1,screen.canvas.width/2,screen.canvas.height/2);
};
function setColor(color){
    //sets stroke color
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
    v1 = Mvec([M1[0],M1[1],M1[2]],M2);
    v2 = Mvec([M1[3],M1[4],M1[5]],M2);
    v3 = Mvec([M1[6],M1[7],M1[8]],M2);
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
function drawOrbit(a,e,i,L,w,vP,frame,steps,width){
    var ang = 0;
    while(ang<360){
        p1 = orbit2xyz(a,e,i,L,w,ang,vP,frame);
        p2 = orbit2xyz(a,e,i,L,w,ang+360/steps,vP,frame);
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
function addObject(name,R,color,Mass){
    objectNames.push(name);
    objectRadii.push(R);
    objectColor.push(color);
    objectMass.push(Mass);
}
function updateObjectId(id){
    orb2 = getOrbitNow(id);
    var v = meanAnom2TrueAnom(orb2.e,orb2.M0+360*(T-orb2.t0)/orb2.P);
    var parentpos = objectPos[orb2.Parent];
    objectPos[id] = orbit2xyz(orb2.a,orb2.e,orb2.i,orb2.L,orb2.w,v,parentpos,orb2.frame);
}
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
camM = MtimesM(camM,RotM("z",-105));
camM = MtimesM(camM,RotM("y",25));
camV = [-2*camM[0],-2*camM[3],-2*camM[6]];
var camFOV = 70;
var pressedKeys = {};
var mouse = {x:0,y:0,d:false};
var mouseDrag = {x:0,y:0,d:false};
var mouseOld = {x:0,y:0,d:false};
var selectedBody = -1;
var currentBody = 0;
window.onkeyup = function(e){pressedKeys[e.keyCode] = false;if(e.keyCode == 79){drawOrbits = 1-drawOrbits;}}
window.onkeydown = function(e) {pressedKeys[e.keyCode] = true;if(e.keyCode == 191){TimeSpeed *= -1}}
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
function UpdateCamera(){
    //update camera
    if(mouseOld.d && !mouse.d && !mouseDrag.d){
        var m = [mouse.x-screen.canvas.width/2,screen.canvas.height/2 - mouse.y];
        var i = 0
        var hit = 0;
        while(i<objectNames.length){
            var p = proj3d(objectPos[i]);
            var Dist2d = Math.sqrt(Math.pow(p[0]-m[0],2)+Math.pow(p[1]-m[1],2));
            if(Dist2d < 20 && depth3d(objectPos[i])>0){
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
        camP += -3*camFOV*(mouse.y-mouseOld.y)/screen.canvas.height;
        camY += 3*camFOV*(mouse.x-mouseOld.x)/screen.canvas.height;
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
    resizeWindow();
    fillScreen("#ffffff");
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
    var i = objectNames.length - 1;
    while(i>=0){
        setColor(objectColor[i]);
        if((Math.abs(depth3d(objectPos[i])/objectRadii[i])) < 50){
            drawsphere3d(objectPos[i],objectRadii[i],bodyAxis[i]);
        }else{
            drawdot3d(objectPos[i],objectRadii[i]);
        }
        drawdot3d(objectPos[i],-1);
        var p = proj3d(objectPos[i]);
        p[1] -= 0.5*objectRadii[i]/depth3d(objectPos[i])*screen.canvas.height/Math.tan(camFOV*Math.PI/360) + 5;
        var scale = depth3d(objectPos[i])/orbitalParams[i].a;
        if(orbitalParams[i].Parent == -1){
            scale = 0;
        }
        if(depth3d(objectPos[i])>0 && scale<50 && depth3d(objectPos[i])/camD<20){
            drawText(objectNames[i],p,"center","12px arial")
        }
        i -= 1;
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
                    drawOrbit(orb.a,orb.e,orb.i,orb.L,orb.w,parentpos,orb.frame,120,3);
                }
            }
            i += 1;
        }
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
    UpdateBodies();
    UpdateCamera();
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
fetch("Stars.json").then(response => response.json()).then(data => loadObjects(data)).catch(error => alert("an error occured, please refresh page (bad data)"));
fetch("Craft.json").then(response => response.json()).then(data => loadObjects(data)).catch(error => alert("an error occured, please refresh page (bad data)"));

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
requestAnimationFrame(initLoop);