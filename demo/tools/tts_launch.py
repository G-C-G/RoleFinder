import asyncio,edge_tts,json,subprocess,re,os,ssl
import edge_tts.communicate as _c
_c._SSL_CTX=ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
F=__import__('imageio_ffmpeg').get_ffmpeg_exe()
TEXT={
 'c0':"Every team asks the same question. Who should do this job? Game Plan helps answer it, with data, not guesswork.",
 'n1':"It starts with the project lead. They add a project or an event, and choose a template.",
 'n2':"Every project or event is made of tasks. The template fills them in. Take out what this one does not need, and add anything extra.",
 'n3':"Then the system suggests who fits each task. It reads each person's profile, what they are good at, and the work they have already done here, and it tells you why.",
 'n4':"The computer only suggests. The project lead has the final say. Accept what looks right, or change it. It just makes the choice quicker, with less room for human error.",
 'n5':"When you are happy, publish it. The whole team is told at once.",
 'n6':"Now the team receives it. Each person sees their own task, and why it fits them. One tap, and it is theirs.",
 'n7':"Another team member sees a different task. But he is already full. He says so in one tap, and gives the reason.",
 'n8':"The project lead sees the reason straight away, and offers the task to the next best person.",
 'nu':"Work that nobody takes stays visible. The project lead can share it out, or see where a new hire may be needed.",
 'n9':"If someone is stuck, they can ask a colleague for a hand.",
 'n10':"When it is done, they add a link or a file. It is saved with the task, as proof.",
 'nr':"The project lead checks the proof, and signs it off.",
 'n11':"Every task builds a record: progress, title and trail. Her work is never lost, and it counts the next time work is suggested.",
 'c12':"Game Plan. The right person, for the right task."}
def dur(p):
    d=subprocess.run([F,'-hide_banner','-i',p],capture_output=True,text=True).stderr
    m=re.search(r'Duration: (\d+):(\d+):([\d.]+)',d);return int(m[1])*3600+int(m[2])*60+float(m[3])
async def synth(voice,outdir,rate):
    os.makedirs(outdir,exist_ok=True);res={}
    for k,t in TEXT.items():
        await edge_tts.Communicate(t,voice,rate=rate).save(f'{outdir}/{k}.mp3')
        subprocess.run([F,'-y','-loglevel','error','-i',f'{outdir}/{k}.mp3','-ar','24000','-ac','1',f'{outdir}/{k}.wav']);res[k]=round(dur(f'{outdir}/{k}.wav'),2)
    json.dump([{'id':k,'text':TEXT[k],'dur':res[k]} for k in TEXT],open(f'{outdir}/script.json','w'),indent=1);return res
async def main():
    f=await synth('en-NG-EzinneNeural','nl_f','+0%');m=await synth('en-NG-AbeoNeural','nl_m','-3%')
    final=[{'id':k,'text':TEXT[k],'dur':round(m[k],2)} for k in TEXT]
    os.makedirs('nl',exist_ok=True);json.dump(final,open('nl/script.json','w'),indent=1)
    print({x['id']:x['dur'] for x in final},'sum',round(sum(x['dur'] for x in final),1))
asyncio.run(main())
