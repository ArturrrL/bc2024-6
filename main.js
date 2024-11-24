const { program } = require('commander')
const { exit } = require('process')
const express = require('express')
const path = require('path')
const fs = require('fs')

const bodyParser = require('body-parser')
const multer = require('multer')

program
    .option('-h, --host <char>', 'server address')
    .option('-p, --port <int>', 'server port')
    .option('-c, --cache <char>', 'path to directory, where cache files will be stored');

program.parse();

const options = program.opts();

if(!options.host) {
    console.error("Please enter host");
    exit();
}
if(!options.port) {
    console.error("Please enter port");
    exit();
}
if(!options.cache) {
    console.error("Enter path to cache directory");
    exit();
}


const app = express()
app.use(bodyParser.text());
app.use(multer().none());


app.get('/', function (req, res) {
    res.send('Hello World')
})



app.get('/notes/:name', (req, res) => {
    const noteName = req.params.name;
    const notePath = path.join(options.cache, `${noteName}.txt`);

    fs.readFile(notePath, 'utf8', (err, data) => {
        if(err) 
            res.status(404).send('Нотатка не знайдена');
        res.status(200).send(data)
    })
})

app.put('/notes/:name', (req, res) => {
    const noteName = req.params.name;
    const notePath = path.join(options.cache, `${noteName}.txt`);
    const noteContent = req.body;

    if(!fs.existsSync(notePath)) return res.status(404).send('Нотатка не знайдена');
    
    fs.writeFile(notePath, noteContent, 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ message: 'Помилка сервера', error: err });
        }

        res.status(201).send('Нотатка успішно Оновлена');
    });
})

app.delete('/notes/:name', (req, res) => {
    const noteName = req.params.name;
    const notePath = path.join(options.cache, `${noteName}.txt`);

    fs.unlink(notePath, (err) => {
        if(err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404).end('Нотатку не знайдено');
            }
             else {
                res.status(500).json({ message: 'Помилка сервера', error })
            }
        }
        else {
            res.writeHead(200).end('Нотатку успішно видалено');
        }
    })
})

app.get('/notes', (req, res) => {
    const notesInCache = fs.readdirSync(options.cache)
    console.log(notesInCache);
    
    const notes = notesInCache.map((note) => {
        const noteName = path.basename(note, '.txt');
        const notePath = path.join(options.cache, note);
        const noteText = fs.readFileSync(notePath, 'utf8');
        return { 
            name: noteName, 
            text: noteText 
        };
    });
    res.status(200).json(notes)
})


app.post('/write', (req, res) => {
    const noteName = req.body.note_name;
    const noteContent = req.body.note;

    if (!noteContent) {
        return res.status(400).send('Вміст нотатки не може бути порожнім');
    }

    const notePath = path.join(options.cache, `${noteName}.txt`);

    if (fs.existsSync(notePath)) {
        return res.status(400).send('Нотатка з такою назвою уже існує');
    }
     else {
        fs.writeFile(notePath, noteContent, 'utf-8', (err) => {
            if (err) {
                return res.status(500).json({ message: 'Помилка сервера', error: err });
            }
            res.status(201).send('Нотатка успішно створена');
        });
    }  
});

app.get('/UploadForm.html', (req, res) => {
    try {
    const htmlPage = fs.readFileSync('./UploadForm.html')
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(htmlPage);
} catch (err) {
    res.status(500).send('Failed to load HTML form');
  }
})

app.listen(options.port, options.host, (req, res) => {
    console.log(`Server is working on http://${options.host}:${options.port}`)
})