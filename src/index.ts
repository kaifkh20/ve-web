import {Elysia} from "elysia"

const app = new Elysia()



var info_streams : any 

var vid_details = {
    "type_enc":undefined,
    ...info_streams,
}

const Mimetypes : any =  {
    'video/ogg': 'opus',
    // 'video/ogg': 'ogv',
    'video/mp4': 'mp4',
    'video/x-matroska': 'mkv',
    'video/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/aac': 'aac',
    'audio/x-caf': 'caf',
    'audio/flac': 'flac',
    'audio/ogg': 'oga',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'application/x-mpegURL': 'm3u8',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'image/webp':'webp'
};



app.post("/upload-video",async(ctx)=>{
    const formData : any= ctx.body
    const video_uploaded : Blob = formData.video
    try{
        // console.log(video_uploaded.type);
        let vid_type : string = video_uploaded.type
        vid_type = Mimetypes[vid_type]
        await Bun.write(`uploaded/video.${vid_type}`,video_uploaded)
        let proc = Bun.spawnSync(["ffprobe","-loglevel","0","-print_format","json","-show_format","-show_streams",`uploaded/video.${vid_type}`])
        const info  = await new Response(proc.stdout).json()
        info_streams = info["streams"][0]

        vid_details.type_enc = vid_type;
        vid_details.info_streams = info_streams
        
        return {"status_msg":"Uploaded Succesfully"}
    }catch(e : any){
        console.error(e)
        return ctx.error("Bad Request")
    }
})

app.get("/info_video",(ctx)=>{
    return {vid_details}
})

app.post("/trim_video",async(ctx)=>{
    const formData : any = ctx.body
    if(formData.end_time>info_streams["tags"]["DURATION"]){
        return ctx.error("Not Acceptable")        
    }

    const proc = Bun.spawnSync(["ffmpeg","-i" ,`uploaded/video.${vid_details.type_enc}` ,"-ss", "00", "-to", `${formData.end_time}`, `uploaded/output.${vid_details.type_enc}`])
    if(!proc.success){
        return ctx.error(500)
    }else{
        const output_file = Bun.file(`uploaded/output.${vid_details.type_enc}`);
        const output_file_buffer = await output_file.arrayBuffer()
        console.log(Bun.file(`uploaded/output.${vid_details}`));
        const blob_file: Blob = new Blob([output_file_buffer])

        return {"status_msg":"Successfully Done","output_vid":blob_file}
    }
})

app.post("/convert",async(ctx)=>{
    const formData : any = ctx.body
    const type_conv : string = formData.type_conv

    const proc = Bun.spawnSync(["ffmpeg","-i",`uploaded/video.${vid_details.type_enc}`,`uploaded/output.${type_conv}`])
    if(!proc.success){
        console.log(proc.stderr.toString());
        
        return ctx.error("Bad Request")
    }else{
        const output_file = Bun.file(`uploaded/output.${vid_details.type_enc}`);
        const output_file_buffer = await output_file.arrayBuffer()
        console.log(Bun.file(`uploaded/output.${vid_details}`));
        const blob_file: Blob = new Blob([output_file_buffer])

        return {"status_msg":"Successfully Done","output_vid":blob_file}
    }
})

app.listen(3000,()=>{
    console.log(`Listening at 3000`);
    
})
