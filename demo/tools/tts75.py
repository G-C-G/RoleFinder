import asyncio,edge_tts,json,subprocess,re,os,ssl
import edge_tts.communicate as _c
_c._SSL_CTX=ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
F=__import__('imageio_ffmpeg').get_ffmpeg_exe()
TEXT={'c0':"Who should do this job?",'n1':"A project lead adds a project or event, from a template.",
 'n2':"Every project has many tasks. Trim the ones you do not need. Add the ones you do.",
 'n3':"The system reads each person's profile and track record, and suggests the best fit for each task, with the reason.",
 'n4':"The project lead has the final say. The computer just makes it quicker, with less room for error.",'n5':"Publish, and the team is told.",
 'n6':"Each person sees their own task, and why it fits them. One tap to take it.",'n7':"One member is full. One tap says so, with the reason.",
 'n8':"The project lead sees why, and offers it to the next best person.",'nu':"Untaken work stays visible, to share out or to hire for.",
 'n10':"Done? Add the proof. It stays with the task.",'n11':"Less time allocating. Less room for error.",'c12':"The right person, for the right task."}
def dur(p):
    d=subprocess.run([F,'-hide_banner','-i',p],capture_output=True,text=True).stderr
    m=re.search(r'Duration: (\d+):(\d+):([\d.]+)',d);return int(m[1])*3600+int(m[2])*60+float(m[3])
async def main():
    os.makedirs('nl75_m',exist_ok=True);res=[]
    for k,t in TEXT.items():
        await edge_tts.Communicate(t,'en-NG-AbeoNeural',rate='-3%').save(f'nl75_m/{k}.mp3')
        subprocess.run([F,'-y','-loglevel','error','-i',f'nl75_m/{k}.mp3','-ar','24000','-ac','1',f'nl75_m/{k}.wav']);res.append({'id':k,'text':t,'dur':round(dur(f'nl75_m/{k}.wav'),2)})
    os.makedirs('nl75',exist_ok=True);json.dump(res,open('nl75/script.json','w'),indent=1);print(round(sum(x['dur'] for x in res),1),[x['dur'] for x in res])
asyncio.run(main())
