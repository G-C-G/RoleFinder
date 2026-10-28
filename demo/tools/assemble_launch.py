import json,subprocess,glob,os,sys,wave,numpy as np
F=__import__('imageio_ffmpeg').get_ffmpeg_exe()
voice=sys.argv[1];out=sys.argv[2]           # voice dir (nl_f / nl_m), output mp4
SR=44100
NL=os.environ.get('NL','nl');TARGET=float(os.environ.get('TARGET','0'));segs=json.load(open(f'{NL}/script.json'));ids=[s['id'] for s in segs];dur={s['id']:s['dur'] for s in segs}
offs=json.load(open(f'{NL}/offsets.json'));sfx=json.load(open(f'{NL}/sfx.json'))
vid=sorted(glob.glob(os.environ.get('VDIR','launch_video')+'/*.webm'),key=os.path.getmtime)[-1]
raw=subprocess.run([F,'-loglevel','error','-i',vid,'-vf','crop=10:10:2:1066,format=gray','-f','rawvideo','-pix_fmt','gray','-r','25','-'],capture_output=True).stdout
fr=np.frombuffer(raw,dtype=np.uint8).reshape(-1,100).mean(axis=1);nfr=len(fr)
b=(fr>27).astype(int);ch=[i for i in range(1,len(b)) if b[i]!=b[i-1]]
print('transitions',len(ch),'frames',nfr)
allids=list(offs.keys())
ch=[c for c in ch if c>=25]
m=[]
for c in ch:
    if not m or c-m[-1]>12:m.append(c)
assert len(m)>=len(allids),(len(m),len(allids))
VA={k:m[i]/25 for i,k in enumerate(allids)};V={k:VA[k] for k in ids};vend=nfr/25-0.05
print('beats',{k:round(v,1) for k,v in VA.items()})
# per-beat: video span, speed, film length
spans=[];film=0;FS={}
gap=(TARGET-0.5-sum(dur.values()))/len(ids) if TARGET else 0
for i,k in enumerate(ids):
    a=V[k];ni=allids.index(k)+1;e=VA[allids[ni]] if ni<len(allids) else min(vend,a+dur[k]+1.4)
    if k=='c12':e=min(vend,a+dur[k]+1.6)
    actual=e-a;iscard=k in('c0','c12')
    target=(dur[k]+gap+(0.9 if k=='c12' else 0)) if TARGET else dur[k]+(1.5 if not iscard else 0.9)
    sp=(float(np.clip(actual/target,1.0,5.0)) if TARGET else (1.0 if iscard else float(np.clip(actual/target,1.0,1.7))))
    L=actual/sp;FS[k]=film;spans.append((k,a,e,sp,L));film+=L
total=TARGET if TARGET else film+0.6
print('gap',round(gap,2),'film',round(film,2));print({k:(round(a,1),round(e-a,1),round(sp,2),round(L,1)) for k,a,e,sp,L in spans},'film',round(total,1))
# video: trim, retime, concat, fade
fc=[];labs=[]
for i,(k,a,e,sp,L) in enumerate(spans):
    fc.append(f"[0:v]trim={a:.3f}:{e:.3f},setpts=(PTS-STARTPTS)/{sp:.4f},fps=25[v{i}]");labs.append(f"[v{i}]")
fc.append(''.join(labs)+f"concat=n={len(spans)}:v=1:a=0,tpad=stop_mode=clone:stop_duration=6,fade=t=in:st=0:d=0.5,fade=t=out:st={total-0.9:.2f}:d=0.8[v]")
open('fc.txt','w').write(';'.join(fc))
subprocess.run([F,'-y','-loglevel','error','-i',vid,'-filter_complex_script','fc.txt','-map','[v]','-t',f'{total:.2f}','-r','25','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','video_only.mp4'],check=True)
# ---- audio ----
N=int(total*SR)
def place(buf,x,t,g=1.0):
    i=int(t*SR)
    if i<0 or i>=len(buf):return
    n=min(len(x),len(buf)-i);buf[i:i+n]+=x[:n]*g
def rd(p):
    w=wave.open(p);d=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768;sr=w.getframerate()
    if sr!=SR:d=np.interp(np.arange(0,len(d)/sr,1/SR),np.arange(len(d))/sr,d).astype(np.float32)
    return d
vo=np.zeros(N,dtype=np.float32)
for k in ids:
    p=f'{voice}/{k}.wav';wv=rd(p);place(vo,wv/ max(0.2,np.abs(wv).max())*0.9,FS[k]+(0.35 if k not in('c0','c12') else 0.3))
# map a recorder time (ms) to film time
def rec2film(ms):
    t=ms/1000.0
    for i,k in enumerate(allids):
        a=offs[k]/1000;last=i+1>=len(allids);e=offs[allids[i+1]]/1000 if not last else a+99
        if t<a or t>=e:continue
        if k not in ids:return None
        va=VA[k];ve=VA[allids[i+1]] if not last else va+99
        vt=va+(t-a)*((ve-va)/(e-a) if not last else 1.0)
        sp=[s for s in spans if s[0]==k][0][3]
        return FS[k]+(vt-va)/sp
    return None
# ---- sound design ----
from scipy import signal
def lp(x,fc,order=2):
    b,a=signal.butter(order,fc/(SR/2),'low');return signal.lfilter(b,a,x).astype(np.float32)
def hp(x,fc):
    b,a=signal.butter(2,fc/(SR/2),'high');return signal.lfilter(b,a,x).astype(np.float32)
def env(n,a,d):
    t=np.arange(n)/SR;return np.minimum(t/a,1)*np.exp(-t/d)
def tone(f,n,a=0.004,d=0.12,h=(1,0.4,0.2)):
    t=np.arange(n)/SR;y=sum(hh*np.sin(2*np.pi*f*(i+1)*t) for i,hh in enumerate(h));return (y*env(n,a,d)).astype(np.float32)
def keyfx():   # soft, low, short confirmation
    n=int(0.14*SR);t=np.arange(n)/SR;y=np.sin(2*np.pi*(520+120*np.exp(-t*40))*t)*np.exp(-t*34)*0.5+lp(np.random.default_rng(2).standard_normal(n).astype(np.float32),2500)*np.exp(-t*90)*0.12
    return y.astype(np.float32)
def chimefx():   # notification: two soft notes
    o=np.zeros(int(1.4*SR),dtype=np.float32)
    for f,p,g in ((1046.5,0,0.5),(1568,0.14,0.38)):
        x=tone(f,int(1.1*SR),0.006,0.3,(1,0.18,0.05));i=int(p*SR);o[i:i+len(x)]+=x*g
    return lp(o,5000)
def successfx():
    o=np.zeros(int(2.2*SR),dtype=np.float32)
    for i,f in enumerate([523.3,659.3,784.0]):
        x=tone(f,int(1.6*SR),0.01,0.5,(1,0.2,0.06));p=int(i*0.11*SR);o[p:p+len(x)]+=x*0.5
    return lp(o,4500)
def swell(L=2.2,up=True):
    n=int(L*SR);ns=np.random.default_rng(5).standard_normal(n).astype(np.float32);y=lp(hp(ns,300),3200)
    e=(np.linspace(0,1,n)**2 if up else np.linspace(1,0,n)**2);return y*e*0.4
fx=np.zeros(N,dtype=np.float32);KEY=keyfx();CH=chimefx();SU=successfx()
for ms,kind in sfx:
    t=rec2film(ms)
    if t is None:continue
    if kind=='key':place(fx,KEY,t,0.45)
    elif kind=='chime':place(fx,CH,t,0.5)
place(fx,swell(2.0,True),FS['c0']-0.1,0.5);place(fx,swell(1.6,True),FS['c12']-1.5,0.5)
place(fx,SU,FS['n10']+(spans[ids.index('n10')][4])-2.3,0.55)
t=np.arange(N)/SR
# ---- music: the supplied track, mastered to sit under the voice ----
def peq(x,f0,Q,db):
    A=10**(db/40);w0=2*np.pi*f0/SR;al=np.sin(w0)/(2*Q);c=np.cos(w0)
    bb=np.array([1+al*A,-2*c,1-al*A]);aa=np.array([1+al/A,-2*c,1-al/A]);return signal.lfilter(bb/aa[0],aa/aa[0],x,axis=0).astype(np.float32)
tw=wave.open('mus/track.wav');tr=np.frombuffer(tw.readframes(tw.getnframes()),dtype=np.int16).reshape(-1,2).astype(np.float32)/32768
MS=int(float(os.environ.get('MUS_START','0'))*SR);seg=tr[MS:MS+N]
if len(seg)<N:seg=np.concatenate([seg,tr[:N-len(seg)]])
mu=seg.copy()
# carve out the speech band so the words stay clear, keep the sparkle and the low end
for f0,Q,db in ((250,0.9,-2.5),(1200,0.8,-4),(2600,0.8,-7),(4200,1.0,-4)):mu=peq(mu,f0,Q,db)
b_,a_=signal.butter(2,45/(SR/2),'high');mu=signal.lfilter(b_,a_,mu,axis=0).astype(np.float32)
mu*=0.42
# voice: clean-up, presence, gentle compression
vo=hp(vo,90);vo=peq(vo,220,1.0,-2.0);vo=peq(vo,3000,1.0,3.5);vo=peq(vo,6500,1.2,1.5)
ev=np.sqrt(np.convolve(vo**2,np.ones(int(0.02*SR))/int(0.02*SR),'same')+1e-9);thr=10**(-24/20);gr=np.where(ev>thr,(thr/ev)**(1-1/3.0),1.0)
sg=np.zeros_like(gr);cur=1.0
for i in range(0,N,SR//200):
    j=min(N,i+SR//200);g=gr[i:j].min();cur=g if g<cur else cur+(g-cur)*0.08;sg[i:j]=cur
vo=vo*sg;vo=vo/max(0.2,np.abs(vo).max())*0.8
# duck the music while anyone speaks (fast attack, slow release, a little look-ahead)
ve=np.abs(vo);w=int(0.06*SR);ve=np.convolve(ve,np.ones(w)/w,'same');ve=np.minimum(1,ve*9)
sm=np.zeros_like(ve);a=0.0
for i in range(0,N,SR//100):
    j=min(N,i+SR//100);m_=ve[i:j].max();a=max(m_,a*0.975);sm[i:j]=a
sm=np.roll(sm,-int(0.08*SR))
duck=(1-0.78*sm).astype(np.float32)
mu*=duck[:,None]
mu*=(np.minimum(t/1.2,1)*np.minimum((total-t)/3.0,1)).astype(np.float32)[:,None]
sp_=vo!=0
vr=np.sqrt((vo[np.abs(vo)>0.02]**2).mean());mr=np.sqrt((mu[np.abs(vo)>0.02]**2).mean())
print('speech vs music during words: +%.1f dB'%(20*np.log10(vr/mr)))
L=vo+fx*0.8+mu[:,0];R=vo+fx*0.8+mu[:,1]
pk=max(np.abs(L).max(),np.abs(R).max());st=np.stack([L,R],1)/pk*0.89
pcm=(np.clip(st,-1,1)*32767).astype(np.int16)
w=wave.open('mix.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes());w.close()
subprocess.run([F,'-y','-loglevel','error','-i','video_only.mp4','-i','mix.wav','-af','loudnorm=I=-16:TP=-1.5:LRA=9','-c:v','copy','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',out],check=True)
print('built',out,'length',round(total,1))
