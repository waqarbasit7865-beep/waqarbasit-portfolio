"""
Perspective-correct one phone screen out of a published mockup image (used for the X Money banner).

  python3 scripts/rectify-screen.py <source image> <output.webp> x1,y1,x2,y2,x3,y3,x4,y4 <width> <height>

The 8 numbers are the screen corners in the source (top-left, top-right, bottom-right, bottom-left).
The screen is a flat plane, so a homography straightens it exactly — nothing is redrawn.
X Money corners used:
  splash    1bb312239651625...webp  (inset of 587,183 864,166 785,835 511,818)
  sign-up   198877239651625...webp  557,171,839,168,839,791,557,791
  dashboard 70938e239651625...webp  643.5,264.5,864,261.5,931,803.5,714,823
"""
import sys, numpy as np
from PIL import Image
src, out, quad = sys.argv[1], sys.argv[2], [float(v) for v in sys.argv[3].split(',')]
W,H=int(sys.argv[4]),int(sys.argv[5])
im=Image.open(src).convert('RGB')
# PIL PERSPECTIVE maps output->input; solve coefficients
dst=[(0,0),(W,0),(W,H),(0,H)]; s=[(quad[i],quad[i+1]) for i in range(0,8,2)]
A=[];B=[]
for (x,y),(u,v) in zip(dst,s):
    A.append([x,y,1,0,0,0,-u*x,-u*y]);B.append(u)
    A.append([0,0,0,x,y,1,-v*x,-v*y]);B.append(v)
c=np.linalg.solve(np.array(A,float),np.array(B,float))
# supersample
k=3
big=im.resize((im.width*k,im.height*k),Image.LANCZOS)
cc=list(c); cc[0]*=1;  # scale coefficients for supersampled source
cs=[c[0]*k,c[1]*k,c[2]*k,c[3]*k,c[4]*k,c[5]*k,c[6],c[7]]
r=big.transform((W,H),Image.PERSPECTIVE,cs,Image.BICUBIC)
r.save(out,quality=90)
