import asyncio,edge_tts,json,subprocess,re,os,ssl
import edge_tts.communicate as _c
_c._SSL_CTX=ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
F=__import__('imageio_ffmpeg').get_ffmpeg_exe()
TEXT={'c0':"Who should do this job?",'n1':"Add the job. Every task fills in.",'n2':"Trim it. Add to it.",'n3':"The system suggests, and says why.",'n4':"You decide.",'n5':"Send.",
 'n6':"She sees one clear thing. One tap.",'n7':"He is full. One tap says so.",'n8':"The team lead or HR sees why, and reassigns.",'nu':"Nothing untaken goes unseen. Share it, or hire.",
 'n9':"Stuck? Ask for a hand.",'n10':"Done, with proof.",'n11':"Progress, title, trail. All on record.",'c12':"The right person, for the right task."}
def dur(p):
    d=subprocess.run([F,'-hide_banner','-i',p],capture_output=True,text=True).stderr
    m=re.search(r'Duration: (\d+):(\d+):([\d.]+)',d);return int(m[1])*3600+int(m[2])*60+float(m[3])
async def main():
    os.makedirs('nl60_m',exist_ok=True);res=[]
    for k,t in TEXT.items():
        await edge_tts.Communicate(t,'en-NG-AbeoNeural',rate='-3%').save(f'nl60_m/{k}.mp3')
        subprocess.run([F,'-y','-loglevel','error','-i',f'nl60_m/{k}.mp3','-ar','24000','-ac','1',f'nl60_m/{k}.wav']);res.append({'id':k,'text':t,'dur':round(dur(f'nl60_m/{k}.wav'),2)})
    os.makedirs('nl60',exist_ok=True);json.dump(res,open('nl60/script.json','w'),indent=1);print(round(sum(x['dur'] for x in res),1),[x['dur'] for x in res])
asyncio.run(main())
