import json,subprocess,glob,os,sys,wave,numpy as np
F=__import__('imageio_ffmpeg').get_ffmpeg_exe()
voice=sys.argv[1];out=sys.argv[2]           # voice dir (nl_f / nl_m), output mp4
SR=44100
segs=json.load(open('nl/script.json'));ids=[s['id'] for s in segs];dur={s['id']:s['dur'] for s in segs}
offs=json.load(open('nl/offsets.json'));sfx=json.load(open('nl/sfx.json'))
vid=sorted(glob.glob('launch_video/*.webm'),key=os.path.getmtime)[-1]
raw=subprocess.run([F,'-loglevel','error','-i',vid,'-vf','crop=10:10:2:1066,format=gray','-f','rawvideo','-pix_fmt','gray','-r','25','-'],capture_output=True).stdout
fr=np.frombuffer(raw,dtype=np.uint8).reshape(-1,100).mean(axis=1);nfr=len(fr)
b=(fr>27).astype(int);ch=[i for i in range(1,len(b)) if b[i]!=b[i-1]]
print('transitions',len(ch),'frames',nfr)
assert len(ch)>=len(ids)
ch=[c for c in ch if c>=25]
m=[]
for c in ch:
    if not m or c-m[-1]>12:m.append(c)
ch=m[:len(ids)]
print('beats',[round(c/25,1) for c in ch]);V={k:ch[i]/25 for i,k in enumerate(ids)};vend=nfr/25-0.05
# per-beat: video span, speed, film length
spans=[];film=0;FS={}
for i,k in enumerate(ids):
    a=V[k];e=V[ids[i+1]] if i+1<len(ids) else min(vend,a+dur[k]+1.4)
    if k=='c12':e=min(vend,a+dur[k]+1.6)
    actual=e-a;iscard=k in('c0','c12')
    target=dur[k]+(1.1 if not iscard else 0.9)
    sp=1.0 if iscard else float(np.clip(actual/target,1.0,2.6))
    L=actual/sp;FS[k]=film;spans.append((k,a,e,sp,L));film+=L
total=film+0.6
print({k:(round(a,1),round(e-a,1),round(sp,2),round(L,1)) for k,a,e,sp,L in spans},'film',round(total,1))
# video: trim, retime, concat, fade
fc=[];labs=[]
for i,(k,a,e,sp,L) in enumerate(spans):
    fc.append(f"[0:v]trim={a:.3f}:{e:.3f},setpts=(PTS-STARTPTS)/{sp:.4f},fps=25[v{i}]");labs.append(f"[v{i}]")
fc.append(''.join(labs)+f"concat=n={len(spans)}:v=1:a=0,fade=t=in:st=0:d=0.5,fade=t=out:st={total-0.9:.2f}:d=0.8[v]")
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
    for i,k in enumerate(ids):
        a=offs[k]/1000;e=offs[ids[i+1]]/1000 if i+1<len(ids) else a+99
        if t<a or t>=e:continue
        va=V[k];ve=V[ids[i+1]] if i+1<len(ids) else va+99
        vt=va+(t-a)*((ve-va)/(e-a) if i+1<len(ids) else 1.0)
        sp=[s for s in spans if s[0]==k][0][3]
        return FS[k]+(vt-va)/sp
    return None
# synth helpers
def env(n,a,d):
    t=np.arange(n)/SR;return np.minimum(t/a,1)*np.exp(-t/d)
def tone(f,n,a=0.004,d=0.12,h=(1,0.4,0.2)):
    t=np.arange(n)/SR;y=sum(hh*np.sin(2*np.pi*f*(i+1)*t) for i,hh in enumerate(h));return (y*env(n,a,d)).astype(np.float32)
def tapfx():
    n=int(0.09*SR);rng=np.random.default_rng(1);ns=rng.standard_normal(n)
    y=np.convolve(ns,np.ones(6)/6,'same')*env(n,0.001,0.018)*0.5+np.sin(2*np.pi*1200*np.arange(n)/SR)*env(n,0.001,0.02)*0.25
    return y.astype(np.float32)
def chimefx():
    a=tone(1318.5,int(1.1*SR),0.003,0.28,(1,0.3,0.12));b=tone(1760,int(1.1*SR),0.003,0.3,(1,0.25,0.1));o=np.zeros(int(1.3*SR),dtype=np.float32);o[:len(a)]+=a*0.55;p=int(0.13*SR);o[p:p+len(b)]+=b*0.5;return o
def whoosh(L=0.7):
    n=int(L*SR);rng=np.random.default_rng(3);ns=rng.standard_normal(n);y=np.zeros(n)
    # band sweep via moving-average cutoff change
    k=np.linspace(40,4,n).astype(int);cs=np.cumsum(np.concatenate([[0],ns]))
    for i in range(0,n,64):
        w=max(2,int(k[i]));j=min(n,i+64);y[i:j]=[(cs[m+1]-cs[max(0,m+1-w)])/w for m in range(i,j)]
    e=np.sin(np.pi*np.arange(n)/n)**2;return (y*e*1.4).astype(np.float32)
def successfx():
    o=np.zeros(int(2.0*SR),dtype=np.float32)
    for i,f in enumerate([659.3,830.6,987.8,1318.5]):
        x=tone(f,int(1.2*SR),0.004,0.35,(1,0.35,0.15));p=int(i*0.09*SR);o[p:p+len(x)]+=x*0.45
    return o
fx=np.zeros(N,dtype=np.float32);TAP=tapfx();CH=chimefx();WH=whoosh();WH2=whoosh(0.5);SU=successfx()
for ms,kind in sfx:
    t=rec2film(ms)
    if t is None:continue
    if kind=='tap':place(fx,TAP,t,0.55)
    elif kind=='chime':place(fx,CH,t,0.6)
    elif kind=='whoosh':place(fx,WH,t-0.1,0.45)
for k in ids:
    if k not in('c0',):place(fx,WH2,FS[k]-0.15,0.28)
# success when Efua saves as done: end of n10
place(fx,SU,FS['n10']+(spans[ids.index('n10')][4])-1.9,0.5)
# music bed: A minor, 88 bpm, pad + pluck + soft pulse
mu=np.zeros(N,dtype=np.float32);bpm=88;beat=60/bpm;bar=4*beat
chords=[(220.0,[220.0,261.6,329.6]),(174.6,[174.6,220.0,261.6]),(261.6,[261.6,329.6,392.0]),(196.0,[196.0,246.9,293.7])]
t=np.arange(N)/SR
nb=int(total/bar)+2
for bi in range(nb):
    root,notes=chords[bi%4];s=int(bi*bar*SR);L=int(bar*SR*1.08)
    if s>=N:break
    pad=np.zeros(L,dtype=np.float32);tt=np.arange(L)/SR
    for f in notes:
        pad+=(np.sin(2*np.pi*f*tt)+0.5*np.sin(2*np.pi*f*2.003*tt)+0.25*np.sin(2*np.pi*f*0.5*tt))*0.05
    pad*=np.minimum(tt/0.9,1)*np.minimum((L/SR-tt)/0.9,1)
    bass=np.sin(2*np.pi*root*0.5*tt)*0.12*np.minimum(tt/0.3,1)*np.exp(-tt/2.6)
    n=min(L,N-s);mu[s:s+n]+=(pad+bass)[:n]
    # pluck arpeggio on 8ths
    arp=[notes[0],notes[1],notes[2],notes[1]*2,notes[2],notes[1],notes[0]*2,notes[1]]
    for j,f in enumerate(arp):
        p=int((bi*bar+j*beat/2)*SR);x=tone(f*2,int(0.9*SR),0.003,0.22,(1,0.28,0.1))*0.10
        if p<N:place(mu,x,p/SR)
    # soft kick on 1 and 3 after bar 2
    if bi>=2:
        for j in (0,2):
            p=int((bi*bar+j*beat)*SR);n=int(0.28*SR);tk=np.arange(n)/SR;k=np.sin(2*np.pi*(52+60*np.exp(-tk*28))*tk)*np.exp(-tk*11)*0.22
            if p<N:place(mu,k.astype(np.float32),p/SR)
mu*=np.minimum(t/2.0,1)*np.minimum((total-t)/2.2,1)
# duck music under the voice
ve=np.abs(vo);w=int(0.12*SR);ve=np.convolve(ve,np.ones(w)/w,'same');ve=np.minimum(1,ve*7)
sm=np.zeros_like(ve);a=0
for i in range(0,N,SR//100):
    j=min(N,i+SR//100);m=ve[i:j].max();a=max(m,a*0.985);sm[i:j]=a
mu*=(1-0.62*sm)
mix=vo*1.0+fx*0.9+mu*1.0
pk=np.abs(mix).max();mix=mix/pk*0.89
st=np.stack([mix,mix*0.985],1)
pcm=(np.clip(st,-1,1)*32767).astype(np.int16)
w=wave.open('mix.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes());w.close()
subprocess.run([F,'-y','-loglevel','error','-i','video_only.mp4','-i','mix.wav','-af','loudnorm=I=-16:TP=-1.5:LRA=9','-c:v','copy','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',out],check=True)
print('built',out,'length',round(total,1))
