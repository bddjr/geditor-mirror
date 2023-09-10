// 是否开启不压缩模式
const dev_mode = false;

//(async()=>{

console.log(`dev mode ${dev_mode}`);

const fs = require('fs');
const path = require('path');
const UglifyJS = require("uglify-js");

const input_file_name = path.join(__dirname,
    // 输入的har文件名
    'geditor.shiki.online.har'
);
const ouput_file_pathname = path.join(__dirname,
    // 输出文件夹名称
    'ouput'
);

console.log('copy 404.html');
fs.copyFileSync(
    path.join(__dirname, '404.html'),
    path.join(ouput_file_pathname, '404.html')
);

const har_data = JSON.parse( fs.readFileSync(input_file_name).toString() ).log;
const har_page_url = har_data.pages[0].title;

const read_finished_pathnames = [];

for(const i of har_data.entries){
    if(
        !i.request.url.startsWith(har_page_url)
        ||
        i._error
    ) continue;

    const url = new URL(i.request.url);
    if (read_finished_pathnames.includes(url.pathname)) continue;

    const response_content = i.response.content;

    let writetext = response_content.text;
    if (writetext === undefined) continue;

    let writepath = path.join(ouput_file_pathname, url.pathname);
    if (url.pathname == '/') writepath = path.join(writepath, 'index.html'); //首页自动补全文件名
    console.log(writepath);

    if (url.pathname.lastIndexOf('/') != 0){
        // 检测含有多个斜杠，自动补全创建文件夹
        const dirnames = url.pathname.split('/').slice(1,-1);
        let dir = ouput_file_pathname;
        for(let i of dirnames){
            dir = path.join(dir, i);
            try{ fs.mkdirSync(dir) }catch{}
        }
    }
    if (url.pathname.endsWith('.js')){
        // 优化JS文件
        if (response_content.encoding == 'base64'){
            writetext = Buffer.from(writetext, 'base64').toString('utf-8');
        }
        if (url.pathname == '/lib.min.js'){
            // 造型与声音 换源
            writetext = writetext.replace(
                '"https://cdn.assets.scratch.mit.edu/internalapi/asset/".concat(iconMd5, "/get/")',
                '`https://m.ccw.site/user_projects_assets/${iconMd5}`'
            ).replace(
                '"".concat(this.assetHost, "/internalapi/asset/").concat(asset.assetId, ".").concat(asset.dataFormat, "/get/")',
                '`https://m.ccw.site/user_projects_assets/${asset.assetId}.${asset.dataFormat}`'
            )
        }
        fs.writeFileSync(
            writepath,
            dev_mode ? writetext : UglifyJS.minify( writetext ).code
        );
    }else{
        if (response_content.encoding == 'base64'){
            writetext = Buffer.from(writetext, 'base64');
        }
        fs.writeFileSync(writepath, writetext);
    }
    read_finished_pathnames.push(url.pathname);
}

//})();
