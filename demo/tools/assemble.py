import json,subprocess,glob,numpy as np,sys
F=__import__('imageio_ffmpeg').get_ffmpeg_exe()
offs=json.load(open('narr/offsets.json'));segs=json.load(open('narr/script.json'))
vid=sorted(glob.glob('one_video/*.webm'),key=lambda p:__import__('os').path.getmtime(p))[-1]
trim=offs['n0']/1000-0.5
# 1) measure when each beat's headline really changes on screen
W,H=240,270
raw=subprocess.run([F,'-loglevel','error','-ss',f'{trim:.3f}','-i',vid,'-vf',f'crop=960:700:60:130,scale={W}:{H},format=gray','-f','rawvideo','-pix_fmt','gray','-r','25','-'],capture_output=True).stdout
n=len(raw)//(W*H);fr=np.frombuffer(raw[:n*W*H],dtype=np.uint8).reshape(n,H,W).astype(float)
d=np.abs(np.diff(fr,axis=0)).mean(axis=(1,2))
xs=[];ys=[]
for k,v in offs.items():
    if k=='n7': continue
    exp=v/1000-trim;lo=max(0,int((exp-1)*25));hi=min(len(d),int((exp+4)*25))
    idx=[i for i,x in enumerate(d[lo:hi]) if x>1.2]
    if idx: xs.append(exp);ys.append((lo+idx[0])/25)
a,b=np.polyfit(xs,ys,1);print('mapping slope',round(a,4),'offset',round(b,3),'points',len(xs))
cmd=[F,'-y','-loglevel','error','-ss',f'{trim:.3f}','-i',vid]
for s in segs: cmd+=['-i',f"narr/{s['id']}.wav"]
fc=[];labs=[];starts={}
for i,s in enumerate(segs,1):
    real=offs[s['id']]/1000-trim;t=a*real+b+0.12;dd=int(t*1000);starts[s['id']]=round(t,2)
    fc.append(f"[{i}:a]adelay={dd}|{dd}[a{i}]");labs.append(f"[a{i}]")
fc.append(''.join(labs)+f"amix=inputs={len(segs)}:normalize=0:duration=longest[aout]")
end=min(59.0,starts['n7']+segs[-1]['dur']+1.6)
cmd+=['-filter_complex',';'.join(fc),'-map','0:v','-map','[aout]','-t',f'{end:.2f}','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart','/home/user/RoleFinder/demo/GCG-Game-Plan-one-minute-demo.mp4']
r=subprocess.run(cmd,capture_output=True,text=True);print(r.stderr[-300:] or 'built','| audio starts',starts,'| length',round(end,1))
