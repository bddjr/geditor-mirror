// node har-to-files.js

const fs = require('fs');
const path = require('path');

const input_file_name = path.join(__dirname,
    'geditor.shiki.online.har'
);
const ouput_file_pathname = path.join(__dirname,
    'ouput'
);

//try{ fs.rmdirSync(ouput_file_pathname); }catch{}
try{ fs.mkdirSync(ouput_file_pathname); }catch{}

const har_data = JSON.parse( fs.readFileSync(input_file_name).toString() ).log;
const har_page_url = har_data.pages[0].title;
const har_entries = har_data.entries;

const read_finished_pathnames = [];

for(let i of har_entries){
    if(
        !i.request.url.startsWith(har_page_url)
        ||
        i._error
        //||
        //i.response.status == 304
    ) continue;
    const url = new URL(i.request.url);
    if (read_finished_pathnames.includes(url.pathname)) continue;
    const response_content = i.response.content;
    let writepath = path.join(ouput_file_pathname, url.pathname);
    if (url.pathname == '/') writepath = path.join(writepath, 'index.html');
    console.log(writepath);
    if (url.pathname.lastIndexOf('/') != 0){
        let dirnames = url.pathname.split('/').slice(1,-1);
        let dir = ouput_file_pathname;
        for(let i of dirnames){
            dir = path.join(dir, i);
            try{ fs.mkdirSync(dir) }catch{}
        }
    }
    let writetext = response_content.text;
    if (response_content.encoding == 'base64'){
        //writetext = Buffer.from(writetext, 'base64').toString('utf-8');
        fs.writeFileSync(
            writepath,
            (Buffer.from(writetext, 'base64')),
            { encoding: null, flag: 'w' }
        );
    }else{
        fs.writeFileSync(writepath, writetext);
    }
    read_finished_pathnames.push(url.pathname);
}
