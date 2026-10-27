import json,subprocess,glob,os,sys,numpy as np
F=__import__('imageio_ffmpeg').get_ffmpeg_exe()
narr=sys.argv[1];out=sys.argv[2]
segs=json.load(open(f'{narr}/script.json'));ids=[s['id'] for s in segs]
vid=sorted(glob.glob('one_video/*.webm'),key=os.path.getmtime)[-1]
# read the sync marker (bottom-left 14x14 px) frame by frame
raw=subprocess.run([F,'-loglevel','error','-i',vid,'-vf','crop=10:10:2:1066,format=gray','-f','rawvideo','-pix_fmt','gray','-r','25','-'],capture_output=True).stdout
fr=np.frombuffer(raw,dtype=np.uint8).reshape(-1,100).mean(axis=1)
b=(fr>27).astype(int);ch=[i for i in range(1,len(b)) if b[i]!=b[i-1]]
print('marker transitions',len(ch),[round(c/25,2) for c in ch])
assert len(ch)>=len(ids),'sync marker not found'
ch=ch[-len(ids):];t0=ch[0]/25-0.5
T={k:ch[i]/25-t0 for i,k in enumerate(ids)}          # beat start times in the (trimmed) picture
tail=T['n7']+segs[-1]['dur']+1.3
f=max(1.0,tail/59.5)                                   # global speed-up so the film stays under a minute
cmd=[F,'-y','-loglevel','error','-ss',f'{t0:.3f}','-i',vid]
for s in segs: cmd+=['-i',f"{narr}/{s['id']}.wav"]
fc=[f"[0:v]setpts=(PTS-STARTPTS)/{f:.5f}[v]"];labs=[];starts={}
for i,s in enumerate(segs,1):
    t=T[s['id']]/f+0.15;dd=int(t*1000);starts[s['id']]=round(t,2)
    fc.append(f"[{i}:a]adelay={dd}|{dd}[a{i}]");labs.append(f"[a{i}]")
fc.append(''.join(labs)+f"amix=inputs={len(segs)}:normalize=0:duration=longest[aout]")
end=min(59.8,starts['n7']+segs[-1]['dur']+1.2)
cmd+=['-filter_complex',';'.join(fc),'-map','[v]','-map','[aout]','-t',f'{end:.2f}','-r','25','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',out]
r=subprocess.run(cmd,capture_output=True,text=True)
over=[(k,round(starts[ids[i+1]]-starts[k]-segs[i]['dur'],2)) for i,k in enumerate(ids[:-1])]
print(os.path.basename(out),r.stderr[-200:] or 'built','| speed',round(f,3),'| length',round(end,1),'| slack per beat (s)',over)
