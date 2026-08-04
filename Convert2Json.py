import math
file = open("Henry Draper(HD) catalogue.txt","r+",encoding="utf-8")
output = open("Starsoutput.txt","w+")

data = file.readlines()
i = 0
RA = []
DE = []
R = []
Mag = []
name = []
#Ignore my sloppy code this is just to convert the database to json
while(i<len(data)):
    j = 0
    text = data[i]
    val = ""
    while(j<len(text) and text[j]!= "\t" and text[j]!= "\n"):
        val += text[j]
        j += 1
    j += 1
    name += [val]
    val = ""
    while(j<len(text) and text[j]!= "\t" and text[j]!= "\n"):
        val += text[j]
        j += 1
    j += 1
    val = ""
    while(j<len(text) and text[j]!= "\t" and text[j]!= "\n"):
        val += text[j]
        j += 1
    j += 1
    Mag += [float(val)]
    val = ""
    while(j<len(text) and text[j]!= "\t" and text[j]!= "\n"):
        val += text[j]
        j += 1
    j += 1
    try:
        R += [float(val)*3.0857e+19]
    except:
        R += [1e19*100000]
    val = ""
    while(j<len(text) and text[j]!= "\t" and text[j]!= "\n"):
        val += text[j]
        j += 1
    j += 1
    val = ""
    while(j<len(text) and text[j]!= "\t" and text[j]!= "\n"):
        val += text[j]
        j += 1
    j += 1
    r = float(val[0:2])*360/24+float(val[3:5])*(360/(24*60))+float(val[6:8])*(360/(24*3600))
    try:
        RA += [r]
    except:
        RA += [0]
    val = ""
    while(j<len(text) and text[j]!= "\t" and text[j]!= "\n"):
        val += text[j]
        j += 1
    j += 1
    r = float(val[1:3])+float(val[4:6])/60+float(val[7:9])/3600
    if(val[0] == "−"):
        r *= -1
    try:
        DE += [r]
    except:
        DE += [0]
    
    i += 1

i = 0
outtext = "{"
while(i<len(data)):
    outtext += "\""+name[i]+"\":{\n\t"
    outtext += "\"Pos\":{\n\t\t"
    outtext += "\"RA\": " + str(RA[i]) + ",\n\t\t"
    outtext += "\"DE\": " + str(DE[i]) + ",\n\t\t"
    outtext += "\"R\": " + str(R[i]) + "\n\t},\n\t"
    outtext += "\"PosRate\":{\"dRA\": 0.0,\"dDE\": 0.0,\"dR\": 0.0},\n\t"
    color = ((1-0.15)/(-5.7-1.4))*(Mag[i]+1.4)+1
    if(color>1.0):
        color = 1.0
    if(color<0.0):
        color = 0.0
    color = int(color*255)
    color = hex(color*256**2 + color*256 + color)
    color = "#"+ str(color)[2:]
    outtext += "\"Params\":{\"Radius\": 696e6,\"Color\": \"" + color + "\",\"Mass\": 1.32712440018e20}\n\t"
    outtext += "\n\t},\n"
    i += 1
outtext += "}"
output.write(outtext)
output.close()
