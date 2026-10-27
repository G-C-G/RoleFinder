import asyncio,edge_tts,json,subprocess,re,os,ssl
import edge_tts.communicate as _c
_c._SSL_CTX=ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
F=__import__('imageio_ffmpeg').get_ffmpeg_exe()
TEXT={
 'n0':"Who should do this job? The system suggests. You decide.",
 'n1':"HR adds a project or an event. A name, a date, and every task fills in.",
 'n2':"The system reads every profile in the company, and suggests the best person for each task, with the reason.",
 'n3':"HR stays in charge. Accept the suggestion, or change it with one tap.",
 'n4':"Send, and everyone is notified.",
 'n5':"Efua gets one clear thing to do, and why it fits her. One tap, and it is hers.",
 'n6':"Her progress, her title, her record. Every task is documented, so her work is never taken for granted.",
 'n7':"The right person, for the right task."}
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
    f=await synth('en-NG-EzinneNeural','narr_ng_f','+6%');m=await synth('en-NG-AbeoNeural','narr_ng_m','+6%')
    # Piper voice for the same shortened lines
    p={}
    os.makedirs('narr_us',exist_ok=True)
    for k,t in TEXT.items():
        subprocess.run(['python3','-m','piper','--model','voices/en_US-lessac-high.onnx','--output_file',f'narr_us/{k}.wav','--length_scale','1.0'],input=t,text=True,capture_output=True);p[k]=round(dur(f'narr_us/{k}.wav'),2)
    json.dump([{'id':k,'text':TEXT[k],'dur':p[k]} for k in TEXT],open('narr_us/script.json','w'),indent=1)
    final=[{'id':k,'text':TEXT[k],'dur':round(max(f[k],m[k],p[k]),2)} for k in TEXT]
    json.dump(final,open('narr/script.json','w'),indent=1)
    print('F',f);print('M',m);print('US',p);print('MAX',{x['id']:x['dur'] for x in final},'sum',round(sum(x['dur'] for x in final),1))
asyncio.run(main())
