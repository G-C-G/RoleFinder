import asyncio,edge_tts,json,subprocess,re,os,ssl
import edge_tts.communicate as _c
_c._SSL_CTX=ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
F=__import__('imageio_ffmpeg').get_ffmpeg_exe()
TEXT={
 'c0':"Who should do this job?",
 'n1':"Add the job. The template fills in every task.",
 'n2':"Trim what you do not need. Add what you do.",
 'n3':"The system suggests the best person for each task, with the reason.",
 'n4':"You decide. Accept, or change.",
 'n5':"Send, and everyone is told.",
 'n6':"She sees one thing, and why it fits her. One tap.",
 'n7':"He is already full. He says so, in one tap.",
 'n8':"HR sees why, and offers it to the next best person.",
 'n9':"Stuck? Ask a colleague for a hand.",
 'n10':"Done, with proof. Everything is on record.",
 'n11':"Her progress, her title, her trail. Her work is never lost.",
 'c12':"The right person, for the right task."}
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
    f=await synth('en-NG-EzinneNeural','nl_f','+0%');m=await synth('en-NG-AbeoNeural','nl_m','+0%')
    final=[{'id':k,'text':TEXT[k],'dur':round(max(f[k],m[k]),2)} for k in TEXT]
    os.makedirs('nl',exist_ok=True);json.dump(final,open('nl/script.json','w'),indent=1)
    print({x['id']:x['dur'] for x in final},'sum',round(sum(x['dur'] for x in final),1))
asyncio.run(main())
